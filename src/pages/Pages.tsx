import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Shell, Card, Btn, Input, Label, ErrorMsg, PageTitle, PageSub, SessionCode } from "../components/UI";
import { HeroStraws, ClosedStraw, OpenStraw } from "../components/Straw";
import { useSession, useNetworkStatus } from "../hooks/useSession";
import { createSession, joinSession, sanitizeName } from "../utils/sessionService";
import { ensureAuth } from "../config/firebase";
import { QRCodeSVG } from "qrcode.react";

// ─── HOME ──────────────────────────────────────────────────────────────────
export function HomePage() {
  const navigate = useNavigate();
  return (
    <Shell>
<div style={{ textAlign: "center", marginBottom: 36, display: "flex", flexDirection: "column", alignItems: "center" }}>
  <HeroStraws />
        <h1 style={{
          fontSize: 42, fontWeight: 900, letterSpacing: ".02em",
          background: "linear-gradient(135deg, var(--gold-light), var(--gold))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: 10,
        }}>
          Straw
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 16 }}>Qui tirera la courte paille ?</p>
      </div>
      <Card>
        <Btn onClick={() => navigate("/create")}>✨ Créer une session</Btn>
        <Btn onClick={() => navigate("/join")} variant="secondary">🔗 Rejoindre une session</Btn>
      </Card>

<div style={{ marginTop: 24, fontSize: 12, color: "var(--muted)" }}>
  <span
    onClick={() => navigate("/legal")}
    style={{ cursor: "pointer", textDecoration: "underline" }}
  >
    Mentions légales & Politique de confidentialité
  </span>
</div>
    </Shell>
  );
}

// ─── CREATE ────────────────────────────────────────────────────────────────
export function CreatePage() {
  const navigate     = useNavigate();
  const { isOnline } = useNetworkStatus();
  const [name,    setName]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleCreate() {
    const clean = sanitizeName(name);
    if (!clean)    { setError("Entre ton prénom."); return; }
    if (!isOnline) { setError("Pas de connexion internet."); return; }
    setLoading(true); setError(null);
    try {
      const s = await createSession(clean);
      navigate(`/lobby/${s.code}`);
    } catch {
      setError("Erreur de connexion. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <PageTitle>Nouvelle session</PageTitle>
      <PageSub>Tu seras l'hôte de la partie</PageSub>
      <Card>
        <Label>Ton prénom</Label>
        <Input value={name} onChange={setName} placeholder="Ex : Sophie" maxLength={20} />
        <ErrorMsg msg={error} />
        <Btn onClick={handleCreate} loading={loading} disabled={!isOnline}>Créer →</Btn>
        <Btn onClick={() => navigate("/")} variant="ghost">Retour</Btn>
      </Card>
    </Shell>
  );
}

// ─── JOIN ──────────────────────────────────────────────────────────────────
const JOIN_ERRORS: Record<string, string> = {
  NOT_FOUND:       "Session introuvable. Vérifie le code.",
  EXPIRED:         "Cette session a expiré.",
  ALREADY_STARTED: "Cette session a déjà commencé.",
  FULL:            "La session est complète (12 joueurs maximum).",
};

export function JoinPage() {
  const navigate     = useNavigate();
  const { isOnline } = useNetworkStatus();
  const [name,    setName]    = useState("");
  const { code: codeParam } = useParams<{ code?: string }>();
  const [code, setCode] = useState(codeParam ?? "");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleJoin() {
    const clean = sanitizeName(name);
    if (!clean)            { setError("Entre ton prénom."); return; }
    if (code.length < 5)   { setError("Le code fait 5 caractères."); return; }
    if (!isOnline)         { setError("Pas de connexion internet."); return; }
    setLoading(true); setError(null);
    try {
      const res = await joinSession(code.toUpperCase(), clean);
      if (!res.ok) { setError(JOIN_ERRORS[res.error] ?? "Erreur inconnue."); return; }
      navigate(`/lobby/${code.toUpperCase()}`);
    } catch {
      setError("Erreur de connexion. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <PageTitle>Rejoindre</PageTitle>
      <PageSub>Entre le code partagé par l'hôte</PageSub>
      <Card>
        <Label>Ton prénom</Label>
        <Input value={name} onChange={setName} placeholder="Ex : Thomas" maxLength={20} />
        <Label>Code de session</Label>
        <Input
          value={code}
          onChange={v => setCode(v.toUpperCase())}
          placeholder="XXXXX"
          maxLength={5}
          large centered
        />
        <ErrorMsg msg={error} />
        <Btn onClick={handleJoin} loading={loading} disabled={!isOnline}>Rejoindre →</Btn>
        <Btn onClick={() => navigate("/")} variant="ghost">Retour</Btn>
      </Card>
    </Shell>
  );
}

// ─── LOBBY ─────────────────────────────────────────────────────────────────
export function LobbyPage() {
  const { code }     = useParams<{ code: string }>();
  const navigate     = useNavigate();
  const { isOnline } = useNetworkStatus();
  const [myId, setMyId] = useState("");
  const { session, error, start, leave } = useSession(code ?? null);

  useEffect(() => { ensureAuth().then(setMyId); }, []);
  useEffect(() => {
    if (session?.status === "drawing") navigate(`/draw/${code}`);
  }, [session?.status]);

  const isHost  = session?.host === myId;
  const players = session ? Object.values(session.players) : [];

  async function handleLeave() { await leave(); navigate("/"); }

  return (
    <Shell>
      <SessionCode code={code ?? "---"} />
      <div style={{
  background: "white",
  borderRadius: 16,
  padding: 16,
  marginBottom: 20,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 10,
}}>
  <QRCodeSVG
    value={`https://straw-draw.vercel.app/join/${code}`}
    size={180}
    bgColor="#ffffff"
    fgColor="#0D0B12"
    level="M"
  />
  <div style={{ fontSize: 12, color: "var(--muted)" }}>
    Scanner pour rejoindre directement
  </div>
</div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
          Joueurs ({players.length}/12)
        </div>
        {players.map((p, i) => (
          <div key={p.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", background: "var(--surface)",
            borderRadius: 10, marginBottom: 8,
            border: "1px solid var(--border)",
            animation: `bounceIn .3s ease ${i * .07}s both`,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent), #9B7FE0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 14, color: "#fff", flexShrink: 0,
            }}>
              {p.name[0].toUpperCase()}
            </div>
            <span style={{
              fontWeight: p.id === myId ? 700 : 400,
              color: p.id === myId ? "var(--gold-light)" : "var(--text)",
            }}>
              {p.name}
              {p.id === myId        ? " (toi)" : ""}
              {p.id === session?.host ? "  👑"   : ""}
            </span>
          </div>
        ))}
        {players.length < 2 && (
          <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, marginTop: 8, animation: "pulse 1.5s ease infinite" }}>
            En attente d'autres joueurs…
          </div>
        )}
      </Card>
      <Card>
        <ErrorMsg msg={error} />
        {isHost ? (
          <Btn onClick={start} disabled={players.length < 2 || !isOnline}>
            🎋 Lancer le tirage !
          </Btn>
        ) : (
          <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 14, marginBottom: 10, animation: "pulse 1.5s ease infinite" }}>
            En attente de l'hôte…
          </div>
        )}
        <Btn onClick={handleLeave} variant="ghost">Quitter</Btn>
      </Card>
    </Shell>
  );
}

// ─── DRAW ──────────────────────────────────────────────────────────────────
export function DrawPage() {
  const { code }     = useParams<{ code: string }>();
  const navigate     = useNavigate();
  const { isOnline } = useNetworkStatus();
  const [myId,   setMyId]   = useState("");
  const [myName, setMyName] = useState("");
  const { session, error, setError, pick } = useSession(code ?? null);

  useEffect(() => { ensureAuth().then(setMyId); }, []);
  useEffect(() => {
    if (session && myId && session.players[myId]) setMyName(session.players[myId].name);
  }, [session, myId]);
  useEffect(() => {
    if (session?.status === "revealed") navigate(`/result/${code}`);
  }, [session?.status]);

  const straws      = session?.straws ? Object.values(session.straws) : [];
  const picks       = session?.picks  ?? {};
  const myPick      = picks[myId];
  const totalPicked = Object.keys(picks).length;
  const total       = session ? Object.keys(session.players).length : 0;

  return (
    <Shell>
      <PageTitle>Tire ta paille !</PageTitle>
      <PageSub>
        {myPick !== undefined
          ? `${totalPicked}/${total} joueurs ont choisi…`
          : "Clique sur une paille pour la tirer"}
      </PageSub>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ textAlign: "center", fontSize: 44, marginBottom: 8 }}>✊</div>
        <div style={{
          display: "flex", justifyContent: "center",
          flexWrap: "wrap", gap: 18, paddingTop: 8, minHeight: 120,
        }}>
          {straws.map((straw, i) => {
            const pickedByOther = Object.entries(picks).some(([pid, idx]) => idx === i && pid !== myId);
            return (
              <ClosedStraw
                key={i}
                index={i}
                onPick={() => pick(i)}
                picked={pickedByOther}
                isMyPick={myPick === i}
                myName={myName}
                disabled={myPick !== undefined || !isOnline}
              />
            );
          })}
        </div>
      </Card>

      <ErrorMsg msg={error} />
      {myPick !== undefined && totalPicked < total && (
        <div style={{ color: "var(--muted)", fontSize: 14, animation: "pulse 1.5s ease infinite" }}>
          En attente des autres joueurs…
        </div>
      )}
    </Shell>
  );
}

// ─── RESULT ────────────────────────────────────────────────────────────────
export function ResultPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [myId, setMyId] = useState("");
  const { session, restart, leave } = useSession(code ?? null);

  useEffect(() => { ensureAuth().then(setMyId); }, []);
  useEffect(() => {
    if (session?.status === "lobby") navigate(`/lobby/${code}`);
  }, [session?.status]);

  if (!session?.straws || !session?.picks) return null;

  const straws  = Object.values(session.straws);
  const players = session.players;
  const isHost  = session.host === myId;

  const loserStraw  = straws.find(s => s.isShort);
  const loserPlayer = loserStraw ? players[loserStraw.playerId] : null;
  const iLose       = loserStraw?.playerId === myId;

  const strawsWithPlayers = straws.map((s, i) => ({ ...s, player: players[s.playerId], index: i }));

  async function handleLeave() { await leave(); navigate("/"); }

  // Confetti
  const confetti = iLose ? [] : [...Array(20)].map((_, i) => ({
    left:  `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.5}s`,
    dur:   `${2 + Math.random() * 2}s`,
    color: ["var(--gold)","var(--accent)","var(--success)","var(--straw-short-l)"][i % 4],
    size:  `${6 + Math.random() * 6}px`,
    round: Math.random() > 0.5,
  }));

  return (
    <Shell>
      {/* Confetti */}
      {confetti.map((c, i) => (
        <div key={i} style={{
          position: "fixed", top: -20, left: c.left, pointerEvents: "none",
          width: c.size, height: c.size, background: c.color,
          borderRadius: c.round ? "50%" : 0, zIndex: 10,
          animation: `confettiFall ${c.dur} ease ${c.delay} forwards`,
        }} />
      ))}

      {/* Hero */}
      <div style={{
        textAlign: "center", marginBottom: 28,
        animation: "bounceIn .6s ease",
      }}>
        <div style={{ fontSize: 64 }}>{iLose ? "😬" : "🎉"}</div>
        <h2 style={{
          fontSize: 24, fontWeight: 900, marginTop: 10,
          color: iLose ? "var(--danger)" : "var(--success)",
        }}>
          {iLose ? "Tu as tiré la courte paille !" : `${loserPlayer?.name ?? "?"} a perdu !`}
        </h2>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>
          {iLose ? "Malchance… c'est toi !" : "Tu t'en es sorti·e !"}
        </p>
      </div>

      {/* Straws */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", marginBottom: 16 }}>
          Résultat du tirage
        </div>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
          {strawsWithPlayers.map((s, i) => (
            <OpenStraw key={i} isShort={s.isShort} playerName={s.player?.name} delay={i * .12} />
          ))}
        </div>
        <div style={{
          padding: "12px 16px", borderRadius: 10, textAlign: "center",
          background: iLose ? "#E0525222" : "#52C98A22",
          border: `1px solid ${iLose ? "#E0525255" : "#52C98A55"}`,
          color: iLose ? "var(--danger)" : "var(--success)",
          fontWeight: 600, fontSize: 14,
        }}>
          {iLose ? "☠️ C'est ta paille la plus courte !" : `✅ ${loserPlayer?.name ?? "?"} a la courte paille`}
        </div>
      </Card>

      {isHost && <Btn onClick={restart}>🔄 Rejouer</Btn>}
      <Btn onClick={handleLeave} variant="ghost">Quitter</Btn>
    </Shell>
  );
}

// ─── MENTIONS LÉGALES & POLITIQUE DE CONFIDENTIALITÉ ──────────────────────
export function LegalPage() {
  const navigate = useNavigate();
  return (
    <Shell>
      <div style={{ width: "100%", maxWidth: 680, padding: "0 20px" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none", border: "none", color: "var(--gold)",
            cursor: "pointer", fontSize: 14, marginBottom: 24, padding: 0,
          }}
        >
          ← Retour
        </button>

        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--gold)", marginBottom: 8 }}>
          Mentions légales
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 32 }}>
          Dernière mise à jour : 18 juin 2026
        </p>

        <Section titre="Éditeur du site">
          <p>Raison sociale : <strong>[TBD]</strong></p>
          <p>Forme juridique : <strong>[TBD]</strong></p>
          <p>SIRET : <strong>[TBD]</strong></p>
          <p>Adresse : <strong>[TBD]</strong></p>
          <p>Email : <strong>[TBD]</strong></p>
        </Section>

        <Section titre="Hébergement">
          <p>Le site est hébergé par <strong>Vercel Inc.</strong></p>
          <p>340 Pine Street, Suite 900, San Francisco, CA 94104, États-Unis</p>
          <p>Site : <a href="https://vercel.com" style={{ color: "var(--gold)" }}>vercel.com</a></p>
        </Section>

        <Section titre="Base de données">
          <p>Les données de session sont hébergées par <strong>Google Firebase</strong> (Google LLC)</p>
          <p>1600 Amphitheatre Parkway, Mountain View, CA 94043, États-Unis</p>
          <p>Serveurs localisés en <strong>Europe de l'Ouest (Belgique)</strong></p>
        </Section>

        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "40px 0" }} />

        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--gold)", marginBottom: 8 }}>
          Politique de confidentialité
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 32 }}>
          Conforme au Règlement Général sur la Protection des Données (RGPD)
        </p>

        <Section titre="Données collectées">
          <p>Lors de l'utilisation de Straw, les données suivantes sont collectées :</p>
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li>Le <strong>prénom ou pseudo</strong> saisi volontairement par le joueur</li>
            <li>Un <strong>identifiant anonyme temporaire</strong> généré automatiquement par Firebase (aucun lien avec votre identité réelle)</li>
            <li>L'<strong>adresse IP</strong> collectée automatiquement par Vercel et Firebase à des fins techniques</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            Aucune adresse email, aucun mot de passe, aucune donnée de paiement ne sont collectés.
          </p>
        </Section>

        <Section titre="Finalité du traitement">
          <p>Les données collectées sont utilisées uniquement pour :</p>
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li>Faire fonctionner les sessions de jeu en temps réel</li>
            <li>Afficher le prénom des participants dans la session</li>
            <li>Assurer la sécurité et la stabilité du service</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            Aucune donnée n'est utilisée à des fins publicitaires ou commerciales.
          </p>
        </Section>

        <Section titre="Durée de conservation">
          <p>
            Les sessions et toutes les données associées (prénoms, identifiants) sont
            <strong> automatiquement supprimées après 15 minutes</strong> d'inactivité.
            Aucune donnée n'est conservée au-delà de cette durée.
          </p>
        </Section>

        <Section titre="Cookies">
          <p>
            Le site utilise uniquement des <strong>cookies techniques strictement nécessaires</strong>
            au fonctionnement du service (authentification anonyme Firebase).
            Ces cookies ne permettent pas de vous identifier personnellement et ne
            nécessitent pas de consentement selon la réglementation en vigueur.
          </p>
          <p style={{ marginTop: 12 }}>
            Aucun cookie publicitaire ou de tracking n'est utilisé.
          </p>
        </Section>

        <Section titre="Partage des données">
          <p>Les données transitent par les services tiers suivants :</p>
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li><strong>Google Firebase</strong> — base de données temps réel (serveurs en Belgique)</li>
            <li><strong>Vercel</strong> — hébergement du site (serveurs en Europe)</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            Ces prestataires sont soumis à leurs propres politiques de confidentialité
            et sont conformes au RGPD.
          </p>
        </Section>

        <Section titre="Vos droits">
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li><strong>Droit d'accès</strong> — connaître les données vous concernant</li>
            <li><strong>Droit de suppression</strong> — vos données sont supprimées automatiquement après 15 minutes</li>
            <li><strong>Droit d'opposition</strong> — ne pas utiliser le service</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            Pour toute question, contactez-nous à : <strong>[TBD]</strong>
          </p>
        </Section>

        <Section titre="Responsable du traitement">
          <p><strong>[TBD]</strong></p>
          <p>[TBD]</p>
         <p>Email : <strong>[TBD]</strong></p>
        </Section>
      </div>
    </Shell>
  );
}

// Composant helper pour les sections
function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--gold-light)", marginBottom: 12 }}>
        {titre}
      </h2>
      <div style={{ color: "var(--text)", fontSize: 15, lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}