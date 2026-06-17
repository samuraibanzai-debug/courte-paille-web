import { ref, set, get, update, onValue, runTransaction, off } from "firebase/database";
import { db, ensureAuth } from "../config/firebase";
import { Session, Straw, SESSION_TTL_MS, MAX_PLAYERS } from "./types";

export function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => chars[b % chars.length]).join("");
}

export function sanitizeName(raw: string): string {
  return raw.trim().replace(/<[^>]*>/g, "").replace(/[<>"'&]/g, "").substring(0, 20);
}

function sessionRef(code: string) { return ref(db, `sessions/${code}`); }
function playerRef(code: string, uid: string) { return ref(db, `sessions/${code}/players/${uid}`); }
function isExpired(s: Session) { return Date.now() > s.expiresAt; }

export async function createSession(hostName: string): Promise<Session> {
  const uid  = await ensureAuth();
  const code = generateCode();
  const now  = Date.now();
  const session: Session = {
    code, host: uid, status: "lobby",
    players: { [uid]: { id: uid, name: sanitizeName(hostName), joinedAt: now } },
    straws: null, picks: null,
    createdAt: now, expiresAt: now + SESSION_TTL_MS,
  };
  await set(sessionRef(code), session);
  return session;
}

export type JoinError = "NOT_FOUND" | "EXPIRED" | "ALREADY_STARTED" | "FULL";

export async function joinSession(
  code: string, playerName: string
): Promise<{ ok: true; session: Session } | { ok: false; error: JoinError }> {
  const uid = await ensureAuth();
  const cleanName = sanitizeName(playerName);

  // Lecture directe de la session
  const snap = await get(sessionRef(code));
  if (!snap.exists()) return { ok: false, error: "NOT_FOUND" };

  const current: Session = snap.val();
  if (isExpired(current))         return { ok: false, error: "EXPIRED" };
  if (current.status !== "lobby") return { ok: false, error: "ALREADY_STARTED" };
  if (current.players?.[uid])     {
    // Déjà dans la session
    return { ok: true, session: current };
  }
  if (Object.keys(current.players ?? {}).length >= MAX_PLAYERS)
                                  return { ok: false, error: "FULL" };

  // Ajout direct du joueur dans Firebase avec update()
  // update() écrit uniquement le nœud du joueur sans écraser le reste
  await set(playerRef(code, uid), {
    id: uid,
    name: cleanName,
    joinedAt: Date.now(),
  });

  const updatedSnap = await get(sessionRef(code));
  return { ok: true, session: updatedSnap.val() };
}

export async function startDraw(code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const uid = await ensureAuth();
  let result: { ok: true } | { ok: false; error: string };

  await runTransaction(sessionRef(code), (current: Session | null) => {
    if (!current)                   { result = { ok: false, error: "NOT_FOUND" };       return; }
    if (isExpired(current))         { result = { ok: false, error: "EXPIRED" };         return; }
    if (current.host !== uid)       { result = { ok: false, error: "NOT_HOST" };        return; }
    if (current.status !== "lobby") { result = { ok: false, error: "ALREADY_STARTED" }; return; }
    const playerIds = Object.keys(current.players ?? {});
    if (playerIds.length < 2)       { result = { ok: false, error: "NOT_ENOUGH" };      return; }

    const shortIdx = Math.floor(Math.random() * playerIds.length);
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    const straws: Record<string, Straw> = {};
    shuffled.forEach((pid, i) => { straws[String(i)] = { playerId: pid, isShort: i === shortIdx }; });
    result = { ok: true };
    return { ...current, status: "drawing", straws, picks: {} };
  });
  return result!;
}

export async function pickStraw(
  code: string, strawIndex: number
): Promise<{ ok: true; revealed: boolean } | { ok: false; error: string }> {
  const uid = await ensureAuth();
  let result: { ok: true; revealed: boolean } | { ok: false; error: string };

  await runTransaction(sessionRef(code), (current: Session | null) => {
    if (!current)                     { result = { ok: false, error: "NOT_FOUND" };      return; }
    if (current.status !== "drawing") { result = { ok: false, error: "WRONG_STATUS" };   return; }
    const picks = current.picks ?? {};
    if (picks[uid] !== undefined)     { result = { ok: false, error: "ALREADY_PICKED" }; return; }
    if (Object.entries(picks).some(([pid, idx]) => idx === strawIndex && pid !== uid))
                                      { result = { ok: false, error: "STRAW_TAKEN" };    return; }
    const newPicks     = { ...picks, [uid]: strawIndex };
    const totalPlayers = Object.keys(current.players ?? {}).length;
    const allPicked    = Object.keys(newPicks).length === totalPlayers;
    result = { ok: true, revealed: allPicked };
    return { ...current, picks: newPicks, status: allPicked ? "revealed" : "drawing" };
  });
  return result!;
}

export async function restartSession(code: string): Promise<void> {
  const uid = await ensureAuth();
  await runTransaction(sessionRef(code), (current: Session | null) => {
    if (!current || current.host !== uid) return;
    return { ...current, status: "lobby", straws: null, picks: null, expiresAt: Date.now() + SESSION_TTL_MS };
  });
}

export async function leaveSession(code: string): Promise<void> {
  const uid = await ensureAuth();
  await runTransaction(sessionRef(code), (current: Session | null) => {
    if (!current || !current.players?.[uid]) return current;
    const { [uid]: _, ...rest } = current.players;
    if (Object.keys(rest).length === 0) return null;
    const newHost = current.host === uid
      ? Object.values(rest).sort((a, b) => a.joinedAt - b.joinedAt)[0].id
      : current.host;
    return { ...current, host: newHost, players: rest };
  });
}

export function subscribeToSession(
  code: string, onUpdate: (s: Session | null) => void
): () => void {
  const r = sessionRef(code);
  onValue(r, snap => {
    if (!snap.exists()) { onUpdate(null); return; }
    const s: Session = snap.val();
    if (isExpired(s))   { onUpdate(null); return; }
    onUpdate(s);
  });
  return () => off(r);
}
