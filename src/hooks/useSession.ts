import { useState, useEffect, useRef, useCallback } from "react";
import { ref, onValue, off } from "firebase/database";
import { db } from "../config/firebase";
import { Session } from "../utils/types";
import {
  subscribeToSession, startDraw, pickStraw,
  restartSession, leaveSession,
} from "../utils/sessionService";

export function useSession(code: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!code) { setSession(null); return; }
    setLoading(true);
    const unsub = subscribeToSession(code, s => { setSession(s); setLoading(false); });
    unsubRef.current = unsub;
    return () => { unsub(); unsubRef.current = null; };
  }, [code]);

  const pick = useCallback(async (idx: number) => {
    if (!code) return;
    setError(null);
    const res = await pickStraw(code, idx);
    if (!res.ok) setError(res.error === "STRAW_TAKEN" ? "Cette paille vient d'être prise !" : "Erreur, réessaie.");
  }, [code]);

  const start   = useCallback(async () => { if (code) { setError(null); const r = await startDraw(code); if (!r.ok) setError("Impossible de lancer."); } }, [code]);
  const restart = useCallback(async () => { if (code) await restartSession(code); }, [code]);
  const leave   = useCallback(async () => { unsubRef.current?.(); if (code) await leaveSession(code); setSession(null); }, [code]);

  return { session, loading, error, setError, pick, start, restart, leave };
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off_ = () => setIsOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off_);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off_); };
  }, []);
  return { isOnline };
}
