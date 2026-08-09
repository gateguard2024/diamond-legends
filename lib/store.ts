import { Goal, MetricId, PlayerId, PlayerProfile, Session } from './types';
import { getSupabase, isSupabaseConfigured } from './supabase';

// ---------------------------------------------------------------------------
// Storage layer.
//
// Two interchangeable backends behind one API:
//   • Supabase  — used when NEXT_PUBLIC_SUPABASE_* env vars exist. Shared
//                 across every device.
//   • localStorage — automatic fallback so the app still works before
//                 Supabase is configured (and offline).
// ---------------------------------------------------------------------------

const SESSION_KEY = 'diamond-legends:sessions:v1';
const GOAL_KEY = 'diamond-legends:goals:v1';
const PROFILE_KEY = 'diamond-legends:profiles:v1';

export const backendName = () => (isSupabaseConfigured ? 'Supabase' : 'this device');

function readLocal<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeLocal<T>(key: string, rows: T[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(rows));
}

function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

const byDateDesc = (a: Session, b: Session) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

// --- row <-> object mapping -------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
const sessionFromRow = (r: any): Session => ({
  id: r.id,
  playerId: r.player_id,
  date: typeof r.date === 'string' ? r.date.slice(0, 10) : r.date,
  pitching: r.pitching ?? undefined,
  fielding: r.fielding ?? undefined,
  hitting: r.hitting ?? undefined,
  notes: r.notes ?? undefined,
  xpEarned: r.xp_earned ?? 0,
});

const sessionToRow = (s: Session) => ({
  id: s.id,
  player_id: s.playerId,
  date: s.date,
  pitching: s.pitching ?? null,
  fielding: s.fielding ?? null,
  hitting: s.hitting ?? null,
  notes: s.notes ?? null,
  xp_earned: s.xpEarned,
});

const goalFromRow = (r: any): Goal => ({
  id: r.id,
  playerId: r.player_id,
  metric: r.metric,
  target: Number(r.target),
  startValue: Number(r.start_value ?? 0),
  createdAt: r.created_at,
  achievedAt: r.achieved_at ?? null,
  achievedValue: r.achieved_value === null || r.achieved_value === undefined ? null : Number(r.achieved_value),
});

const goalToRow = (g: Goal) => ({
  id: g.id,
  player_id: g.playerId,
  metric: g.metric,
  target: g.target,
  start_value: g.startValue,
  created_at: g.createdAt,
  achieved_at: g.achievedAt ?? null,
  achieved_value: g.achievedValue ?? null,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// SESSIONS
// ---------------------------------------------------------------------------

export async function fetchSessions(): Promise<Session[]> {
  const sb = getSupabase();
  if (!sb) return readLocal<Session>(SESSION_KEY).sort(byDateDesc);

  const { data, error } = await sb
    .from('sessions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(sessionFromRow);
}

export async function createSession(session: Session): Promise<Session> {
  const sb = getSupabase();
  if (!sb) {
    const rows = readLocal<Session>(SESSION_KEY);
    const next = [...rows, session].sort(byDateDesc);
    writeLocal(SESSION_KEY, next);
    return session;
  }

  const { data, error } = await sb.from('sessions').insert(sessionToRow(session)).select().single();
  if (error) throw new Error(error.message);
  return sessionFromRow(data);
}

export async function removeSession(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    writeLocal(
      SESSION_KEY,
      readLocal<Session>(SESSION_KEY).filter((s) => s.id !== id),
    );
    return;
  }
  const { error } = await sb.from('sessions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function upsertSessions(sessions: Session[]): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    const byId = new Map(readLocal<Session>(SESSION_KEY).map((s) => [s.id, s]));
    for (const s of sessions) byId.set(s.id, s);
    writeLocal(SESSION_KEY, Array.from(byId.values()).sort(byDateDesc));
    return;
  }
  const { error } = await sb.from('sessions').upsert(sessions.map(sessionToRow));
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// GOALS
// ---------------------------------------------------------------------------

export async function fetchGoals(): Promise<Goal[]> {
  const sb = getSupabase();
  if (!sb) return readLocal<Goal>(GOAL_KEY);

  const { data, error } = await sb
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(goalFromRow);
}

export async function createGoal(input: {
  playerId: PlayerId;
  metric: MetricId;
  target: number;
  startValue: number;
}): Promise<Goal> {
  const goal: Goal = {
    id: newId(),
    playerId: input.playerId,
    metric: input.metric,
    target: input.target,
    startValue: input.startValue,
    createdAt: new Date().toISOString(),
    achievedAt: null,
    achievedValue: null,
  };

  const sb = getSupabase();
  if (!sb) {
    writeLocal(GOAL_KEY, [...readLocal<Goal>(GOAL_KEY), goal]);
    return goal;
  }

  const { data, error } = await sb.from('goals').insert(goalToRow(goal)).select().single();
  if (error) throw new Error(error.message);
  return goalFromRow(data);
}

export async function updateGoal(id: string, patch: Partial<Goal>): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    writeLocal(
      GOAL_KEY,
      readLocal<Goal>(GOAL_KEY).map((g) => (g.id === id ? { ...g, ...patch } : g)),
    );
    return;
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const row: any = {};
  if (patch.target !== undefined) row.target = patch.target;
  if (patch.startValue !== undefined) row.start_value = patch.startValue;
  if (patch.achievedAt !== undefined) row.achieved_at = patch.achievedAt;
  if (patch.achievedValue !== undefined) row.achieved_value = patch.achievedValue;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const { error } = await sb.from('goals').update(row).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function removeGoal(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    writeLocal(
      GOAL_KEY,
      readLocal<Goal>(GOAL_KEY).filter((g) => g.id !== id),
    );
    return;
  }
  const { error } = await sb.from('goals').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// PLAYER PROFILES (jersey number + slogan)
// ---------------------------------------------------------------------------

export async function fetchProfiles(): Promise<PlayerProfile[]> {
  const sb = getSupabase();
  if (!sb) return readLocal<PlayerProfile>(PROFILE_KEY);

  const { data, error } = await sb.from('player_profiles').select('*');
  if (error) throw new Error(error.message);
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => ({
    playerId: r.player_id,
    number: Number(r.number ?? 0),
    slogan: r.slogan ?? '',
  }));
}

export async function saveProfile(profile: PlayerProfile): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    const rows = readLocal<PlayerProfile>(PROFILE_KEY).filter(
      (p) => p.playerId !== profile.playerId,
    );
    writeLocal(PROFILE_KEY, [...rows, profile]);
    return;
  }

  const { error } = await sb.from('player_profiles').upsert(
    {
      player_id: profile.playerId,
      number: profile.number,
      slogan: profile.slogan,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'player_id' },
  );
  if (error) throw new Error(error.message);
}

export { newId };
