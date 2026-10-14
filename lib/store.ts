'use client';
// ---------------------------------------------------------------------------
// One generic record table, two interchangeable backends:
//   • Supabase (when NEXT_PUBLIC_SUPABASE_* env vars exist) — shared by every device
//   • localStorage — automatic fallback so the app works before Supabase is set up
// ---------------------------------------------------------------------------
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type RecordKind =
  | 'test' // a combine/test result: { metric, value }
  | 'slot' // a planned training slot: { weekStart, day, type, players, note? }
  | 'done' // a completed slot/drill check: { slotId?, type, drills?, xp }
  | 'pitches' // pitches thrown: { count, innings?, context }
  | 'goal' // goal override: { metric, value }
  | 'cue' // coach cue: { coach, text }
  | 'award' // coach's pick badge: { reason }
  | 'sleep' // 9+ hours: {}
  | 'gear' // equipment owned: { gearId, owned }
  | 'settings'; // { tryoutDate }

export interface Rec<T = Record<string, unknown>> {
  id: string;
  kind: RecordKind;
  playerId: string | null;
  date: string; // YYYY-MM-DD
  data: T;
  createdAt: string;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const isSynced = Boolean(url && key);
const TABLE = 'ebt_records';
const LOCAL_KEY = 'ebt:records:v1';

let client: SupabaseClient | null = null;
function sb() {
  if (!isSynced) return null;
  if (!client) client = createClient(url as string, key as string, { auth: { persistSession: false } });
  return client;
}

export const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

function readLocal(): Rec[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const rows = raw ? JSON.parse(raw) : [];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function writeLocal(rows: Rec[]) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
  } catch {
    /* storage full or blocked — data stays in memory for this visit */
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const fromRow = (r: any): Rec => ({
  id: r.id,
  kind: r.kind,
  playerId: r.player_id,
  date: String(r.date).slice(0, 10),
  data: r.data ?? {},
  createdAt: r.created_at,
});
const toRow = (r: Rec) => ({ id: r.id, kind: r.kind, player_id: r.playerId, date: r.date, data: r.data, created_at: r.createdAt });

// --- in-memory cache + subscribers -------------------------------------------------

let cache: Rec[] = [];
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
let lastError: string | null = null;

const emit = () => listeners.forEach((fn) => fn());

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const getRecords = () => cache;
export const isLoaded = () => loaded;
export const getError = () => lastError;

export async function load(force = false) {
  if (loading && !force) return loading;
  loading = (async () => {
    const c = sb();
    if (c) {
      const { data, error } = await c.from(TABLE).select('*').order('date', { ascending: true }).limit(10000);
      if (error) {
        lastError = error.message;
        cache = readLocal();
      } else {
        lastError = null;
        cache = (data ?? []).map(fromRow);
      }
    } else {
      cache = readLocal();
    }
    loaded = true;
    emit();
  })();
  return loading;
}

export async function addRecord<T extends Record<string, unknown>>(kind: RecordKind, playerId: string | null, date: string, data: T) {
  const rec: Rec = { id: newId(), kind, playerId, date, data, createdAt: new Date().toISOString() };
  cache = [...cache, rec];
  emit();
  const c = sb();
  if (c) {
    const { error } = await c.from(TABLE).insert(toRow(rec));
    if (error) lastError = error.message;
  } else writeLocal(cache);
  return rec;
}

export async function updateRecord(id: string, patch: Partial<Pick<Rec, 'date' | 'data' | 'playerId'>>) {
  cache = cache.map((r) => (r.id === id ? { ...r, ...patch, data: patch.data ?? r.data } : r));
  emit();
  const c = sb();
  const rec = cache.find((r) => r.id === id);
  if (!rec) return;
  if (c) {
    const { error } = await c.from(TABLE).update({ date: rec.date, data: rec.data, player_id: rec.playerId }).eq('id', id);
    if (error) lastError = error.message;
  } else writeLocal(cache);
}

export async function removeRecord(id: string) {
  cache = cache.filter((r) => r.id !== id);
  emit();
  const c = sb();
  if (c) {
    const { error } = await c.from(TABLE).delete().eq('id', id);
    if (error) lastError = error.message;
  } else writeLocal(cache);
}

export async function addMany(recs: Omit<Rec, 'id' | 'createdAt'>[]) {
  const full = recs.map((r) => ({ ...r, id: newId(), createdAt: new Date().toISOString() }));
  cache = [...cache, ...full];
  emit();
  const c = sb();
  if (c) {
    const { error } = await c.from(TABLE).insert(full.map(toRow));
    if (error) lastError = error.message;
  } else writeLocal(cache);
}

export function exportJson() {
  return JSON.stringify({ app: 'diamond-legends', version: 2, exportedAt: new Date().toISOString(), records: cache }, null, 2);
}

export async function importJson(text: string) {
  const parsed = JSON.parse(text);
  const rows: Rec[] = Array.isArray(parsed?.records) ? parsed.records : [];
  const known = new Set(cache.map((r) => r.id));
  const fresh = rows.filter((r) => r && r.id && r.kind && !known.has(r.id));
  cache = [...cache, ...fresh];
  emit();
  const c = sb();
  if (c && fresh.length) {
    const { error } = await c.from(TABLE).insert(fresh.map(toRow));
    if (error) lastError = error.message;
  } else writeLocal(cache);
  return fresh.length;
}
