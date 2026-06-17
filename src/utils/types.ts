export const SESSION_TTL_MS = 15 * 60 * 1000;
export const MAX_PLAYERS    = 12;

export type SessionStatus = "lobby" | "drawing" | "revealed";

export interface Player {
  id: string;
  name: string;
  joinedAt: number;
}

export interface Straw {
  playerId: string;
  isShort: boolean;
}

export interface Session {
  code: string;
  host: string;
  status: SessionStatus;
  players: Record<string, Player>;
  straws:  Record<string, Straw> | null;
  picks:   Record<string, number> | null;
  createdAt: number;
  expiresAt: number;
}
