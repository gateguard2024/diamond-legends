'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Goal, MetricId, PersonalBest, Player, PlayerId, PlayerProfile, Session } from './types';
import { bestsBefore, detectPersonalBests, xpForSession } from './gamification';
import {
  METRICS,
  activeGoal,
  currentValue,
  initialTarget,
  suggestNextTarget,
} from './goals';
import {
  createGoal,
  createSession,
  fetchGoals,
  fetchProfiles,
  fetchSessions,
  newId,
  removeGoal,
  removeSession,
  saveProfile,
  updateGoal,
  upsertSessions,
} from './store';
import { PLAYERS, PLAYER_ORDER, applyProfiles } from './players';

export interface SaveResult {
  session: Session;
  personalBests: PersonalBest[];
  clearedGoals: { goal: Goal; value: number; suggested: number }[];
}

export function useAppData() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [s, g, p] = await Promise.all([fetchSessions(), fetchGoals(), fetchProfiles()]);
      setSessions(s);
      setGoals(g);
      setProfiles(p);
      setError(null);
      return { sessions: s, goals: g };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load data.');
      return { sessions: [] as Session[], goals: [] as Goal[] };
    }
  }, []);

  useEffect(() => {
    (async () => {
      const loaded = await reload();
      await seedMissingGoals(loaded.sessions, loaded.goals, setGoals);
      setLoading(false);
    })();
  }, [reload]);

  const forPlayer = useCallback(
    (playerId: PlayerId) => sessions.filter((s) => s.playerId === playerId),
    [sessions],
  );

  const goalsFor = useCallback(
    (playerId: PlayerId) => goals.filter((g) => g.playerId === playerId),
    [goals],
  );

  // -------------------------------------------------------------------------
  // Sessions
  // -------------------------------------------------------------------------

  const addSession = useCallback(
    async (draft: Omit<Session, 'id' | 'xpEarned'>): Promise<SaveResult> => {
      const playerSessions = sessions.filter((s) => s.playerId === draft.playerId);

      const session: Session = { ...draft, id: newId(), xpEarned: 0 };
      session.xpEarned = xpForSession(session, bestsBefore(playerSessions));

      const personalBests = detectPersonalBests(session, playerSessions);

      const saved = await createSession(session);
      const nextSessions = [...sessions, saved].sort((a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
      );
      setSessions(nextSessions);

      // Any active goal the new session pushed over the line?
      const playerAfter = nextSessions.filter((s) => s.playerId === draft.playerId);
      const cleared: SaveResult['clearedGoals'] = [];

      for (const def of METRICS) {
        const goal = activeGoal(goals, draft.playerId, def.id);
        if (!goal) continue;
        const value = currentValue(def, playerAfter);
        if (value === null || value < goal.target) continue;

        const achievedAt = new Date().toISOString();
        await updateGoal(goal.id, { achievedAt, achievedValue: value });
        setGoals((prev) =>
          prev.map((g) => (g.id === goal.id ? { ...g, achievedAt, achievedValue: value } : g)),
        );
        cleared.push({
          goal: { ...goal, achievedAt, achievedValue: value },
          value,
          suggested: suggestNextTarget(def, playerAfter, goal.target),
        });
      }

      return { session: saved, personalBests, clearedGoals: cleared };
    },
    [sessions, goals],
  );

  const deleteSession = useCallback(async (id: string) => {
    await removeSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const importSessions = useCallback(async (incoming: Session[]) => {
    await upsertSessions(incoming);
    setSessions((prev) => {
      const byId = new Map(prev.map((s) => [s.id, s]));
      for (const s of incoming) byId.set(s.id, s);
      return Array.from(byId.values()).sort((a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
      );
    });
  }, []);

  // -------------------------------------------------------------------------
  // Goals
  // -------------------------------------------------------------------------

  /** Replaces any active goal for that metric with a new target. */
  const setGoal = useCallback(
    async (playerId: PlayerId, metric: MetricId, target: number) => {
      const existing = goals.find(
        (g) => g.playerId === playerId && g.metric === metric && !g.achievedAt,
      );
      if (existing) {
        await removeGoal(existing.id);
        setGoals((prev) => prev.filter((g) => g.id !== existing.id));
      }

      const def = METRICS.find((m) => m.id === metric)!;
      const start = currentValue(def, sessions.filter((s) => s.playerId === playerId)) ?? 0;
      const goal = await createGoal({ playerId, metric, target, startValue: start });
      setGoals((prev) => [...prev.filter((g) => g.id !== goal.id), goal]);
      return goal;
    },
    [goals, sessions],
  );

  const clearGoal = useCallback(async (id: string) => {
    await removeGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  // -------------------------------------------------------------------------
  // Player identity (jersey number + slogan)
  // -------------------------------------------------------------------------

  const players: Record<PlayerId, Player> = useMemo(() => applyProfiles(profiles), [profiles]);

  const saveIdentity = useCallback(
    async (playerId: PlayerId, patch: { number: number; slogan: string }) => {
      const profile: PlayerProfile = {
        playerId,
        number: patch.number,
        slogan: patch.slogan || PLAYERS[playerId].slogan,
      };
      setProfiles((prev) => [...prev.filter((p) => p.playerId !== playerId), profile]);
      await saveProfile(profile);
    },
    [],
  );

  const stats = useMemo(
    () => ({ sessionCount: sessions.length, goalCount: goals.filter((g) => !g.achievedAt).length }),
    [sessions, goals],
  );

  return {
    sessions,
    goals,
    players,
    loading,
    error,
    stats,
    forPlayer,
    goalsFor,
    addSession,
    deleteSession,
    importSessions,
    setGoal,
    clearGoal,
    saveIdentity,
    reload,
  };
}

/**
 * A player who has logged at least one session but has no goals yet gets a
 * starting ladder built from their own numbers. Runs once, on load.
 */
async function seedMissingGoals(
  sessions: Session[],
  goals: Goal[],
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>,
) {
  const created: Goal[] = [];

  for (const playerId of PLAYER_ORDER) {
    const playerSessions = sessions.filter((s) => s.playerId === playerId);
    if (!playerSessions.length) continue;

    const hasAny = goals.some((g) => g.playerId === playerId);
    if (hasAny) continue;

    for (const def of METRICS) {
      try {
        const goal = await createGoal({
          playerId,
          metric: def.id,
          target: initialTarget(def, playerSessions),
          startValue: currentValue(def, playerSessions) ?? 0,
        });
        created.push(goal);
      } catch {
        // Unique index rejects a duplicate active goal — another device won.
      }
    }
  }

  if (created.length) setGoals((prev) => [...prev, ...created]);
}
