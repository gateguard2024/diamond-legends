'use client';

import { useCallback, useEffect, useState } from 'react';
import { PlayerId, Session } from './types';
import { bestsBefore, xpForSession } from './gamification';

const STORAGE_KEY = 'diamond-legends:sessions:v1';

function load(): Session[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Session[]) : [];
  } catch {
    return [];
  }
}

function save(sessions: Session[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load after mount so server and client render the same initial HTML.
  useEffect(() => {
    setSessions(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) save(sessions);
  }, [sessions, hydrated]);

  const addSession = useCallback(
    (draft: Omit<Session, 'id' | 'xpEarned'>): Session => {
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // PR bonuses are scored against everything that player has done so far.
      const priorBests = bestsBefore(sessions.filter((s) => s.playerId === draft.playerId));
      const session: Session = { ...draft, id, xpEarned: 0 };
      session.xpEarned = xpForSession(session, priorBests);

      setSessions((prev) => [...prev, session].sort((a, b) => (a.date < b.date ? 1 : -1)));
      return session;
    },
    [sessions],
  );

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearPlayer = useCallback((playerId: PlayerId) => {
    setSessions((prev) => prev.filter((s) => s.playerId !== playerId));
  }, []);

  const importSessions = useCallback((incoming: Session[]) => {
    setSessions((prev) => {
      const byId = new Map(prev.map((s) => [s.id, s]));
      for (const s of incoming) byId.set(s.id, s);
      return Array.from(byId.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
    });
  }, []);

  const forPlayer = useCallback(
    (playerId: PlayerId) => sessions.filter((s) => s.playerId === playerId),
    [sessions],
  );

  return {
    sessions,
    hydrated,
    addSession,
    deleteSession,
    clearPlayer,
    importSessions,
    forPlayer,
  };
}
