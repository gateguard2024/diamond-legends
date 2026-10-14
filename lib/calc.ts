import { addDays, diffDays, short, today, weekStart } from './dates';
import {
  BADGES,
  LEVELS,
  METRICS,
  Metric,
  PHASES,
  PITCH_SMART,
  SLOT_KINDS,
  SlotType,
  TierName,
  XP,
  metricById,
  restDaysFor,
} from './program';
import type { Rec } from './store';

// --- tests, PRs, tiers, goals -----------------------------------------------------

export interface TestRow {
  date: string;
  value: number;
  id: string;
}

export function testsFor(recs: Rec[], playerId: string, metric: string): TestRow[] {
  return recs
    .filter((r) => r.kind === 'test' && r.playerId === playerId && r.data.metric === metric)
    .map((r) => ({ date: r.date, value: Number(r.data.value), id: r.id }))
    .filter((t) => Number.isFinite(t.value))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export const isBetter = (m: Metric, a: number, b: number) => (m.lowerIsBetter ? a < b : a > b);

export function best(m: Metric, rows: TestRow[]) {
  let out: number | null = null;
  for (const r of rows) if (out === null || isBetter(m, r.value, out)) out = r.value;
  return out;
}

export function tierOf(m: Metric, v: number | null): TierName | null {
  if (v === null || !m.tiers) return null;
  const [aa, aaa, elite] = m.tiers;
  if (m.lowerIsBetter) {
    if (v <= elite) return 'Elite 10U';
    if (v <= aaa) return 'AAA-ready';
    if (v <= aa) return 'Solid AA';
    return 'Developing';
  }
  if (v >= elite) return 'Elite 10U';
  if (v >= aaa) return 'AAA-ready';
  if (v >= aa) return 'Solid AA';
  return 'Developing';
}

export const TIER_COLOR: Record<TierName, string> = {
  Developing: '#9FB0C7',
  'Solid AA': '#4FC3B8',
  'AAA-ready': '#F4B23E',
  'Elite 10U': '#FF8FA3',
};

/** Baseline + the middle of the realistic gain, snapped up to the next tier line when close. */
export function defaultGoal(m: Metric, baseline: number | null): number | null {
  if (baseline === null || m.gain === undefined) return null;
  const dir = m.lowerIsBetter ? -1 : 1;
  let g = baseline + dir * m.gain;
  if (m.tiers && m.snap !== undefined) {
    for (const line of m.tiers) {
      const beyond = m.lowerIsBetter ? line < g : line > g;
      if (beyond && Math.abs(line - g) <= m.snap) {
        g = line;
        break;
      }
    }
  }
  const f = 10 ** m.dp;
  return m.lowerIsBetter ? Math.floor(g * f) / f : Math.ceil(g * f) / f;
}

export function goalFor(recs: Rec[], playerId: string, m: Metric, baseline: number | null): { value: number | null; custom: boolean } {
  const o = [...recs].reverse().find((r) => r.kind === 'goal' && r.playerId === playerId && r.data.metric === m.id);
  if (o && Number.isFinite(Number(o.data.value))) return { value: Number(o.data.value), custom: true };
  return { value: defaultGoal(m, baseline), custom: false };
}

export interface MetricSummary {
  metric: Metric;
  rows: TestRow[];
  baseline: number | null;
  latest: number | null;
  best: number | null;
  goal: number | null;
  customGoal: boolean;
  tier: TierName | null;
  /** 0–1 progress from baseline to goal, using best. */
  progress: number;
  gained: number | null;
}

export function summarize(recs: Rec[], playerId: string, metricId: string): MetricSummary | null {
  const m = metricById(metricId);
  if (!m) return null;
  const rows = testsFor(recs, playerId, m.id);
  const baseline = rows.length ? rows[0].value : null;
  const latest = rows.length ? rows[rows.length - 1].value : null;
  const b = best(m, rows);
  const g = goalFor(recs, playerId, m, baseline);
  let progress = 0;
  if (baseline !== null && b !== null && g.value !== null && g.value !== baseline) {
    progress = Math.max(0, Math.min(1, (b - baseline) / (g.value - baseline)));
  }
  const gained = baseline !== null && b !== null ? (m.lowerIsBetter ? baseline - b : b - baseline) : null;
  return { metric: m, rows, baseline, latest, best: b, goal: g.value, customGoal: g.custom, tier: tierOf(m, b), progress, gained };
}

export function fmt(m: Metric, v: number | null | undefined) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  if (m.clock) {
    const s = Math.round(v);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
  return v.toFixed(m.dp);
}

/** Parse "1:30" or "90" for clock metrics, plain numbers otherwise. */
export function parseInput(m: Metric, s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  if (m.clock && t.includes(':')) {
    const [mm, ss] = t.split(':').map(Number);
    if (!Number.isFinite(mm) || !Number.isFinite(ss)) return null;
    return mm * 60 + ss;
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

// --- PRs ----------------------------------------------------------------------------

export interface PR {
  metric: Metric;
  date: string;
  value: number;
  previous: number;
}

export function prsFor(recs: Rec[], playerId: string): PR[] {
  const out: PR[] = [];
  for (const m of METRICS) {
    const rows = testsFor(recs, playerId, m.id);
    let top: number | null = null;
    for (const r of rows) {
      if (top !== null && isBetter(m, r.value, top)) out.push({ metric: m, date: r.date, value: r.value, previous: top });
      if (top === null || isBetter(m, r.value, top)) top = r.value;
    }
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Dates where a player logged 5+ different tests (a combine/re-test day). */
export function testDays(recs: Rec[], playerId: string) {
  const byDate = new Map<string, Set<string>>();
  for (const r of recs) {
    if (r.kind !== 'test' || r.playerId !== playerId) continue;
    if (!byDate.has(r.date)) byDate.set(r.date, new Set());
    byDate.get(r.date)!.add(String(r.data.metric));
  }
  return Array.from(byDate.entries())
    .filter(([, s]) => s.size >= 5)
    .map(([d]) => d)
    .sort();
}

// --- XP, levels, streaks ------------------------------------------------------------------

export function xpFor(recs: Rec[], playerId: string) {
  let xp = 0;
  for (const r of recs) {
    if (r.playerId !== playerId) continue;
    if (r.kind === 'done' && r.data.complete) xp += Number(r.data.xp) || 0;
    if (r.kind === 'sleep') xp += XP.sleep;
  }
  xp += prsFor(recs, playerId).length * XP.pr;
  xp += testDays(recs, playerId).length * XP.retestDay;
  return xp;
}

export function levelFor(xp: number) {
  let i = 0;
  for (let k = 0; k < LEVELS.length; k++) if (xp >= LEVELS[k].xp) i = k;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1] ?? null;
  const pct = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
  return { level: cur, next, pct, index: i };
}

export function activeDates(recs: Rec[], playerId: string) {
  const s = new Set<string>();
  for (const r of recs) if (r.playerId === playerId && r.kind === 'done' && r.data.complete) s.add(r.date);
  return s;
}

export function streakFor(recs: Rec[], playerId: string, on = today()) {
  const s = activeDates(recs, playerId);
  let d = s.has(on) ? on : addDays(on, -1);
  let n = 0;
  while (s.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function bestStreak(recs: Rec[], playerId: string) {
  const dates = Array.from(activeDates(recs, playerId)).sort();
  let bestN = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of dates) {
    run = prev && diffDays(d, prev) === 1 ? run + 1 : 1;
    bestN = Math.max(bestN, run);
    prev = d;
  }
  return bestN;
}

// --- badges ------------------------------------------------------------------------------

export function badgesFor(recs: Rec[], playerId: string) {
  const earned = new Set<string>();
  const streak = bestStreak(recs, playerId);
  const prs = prsFor(recs, playerId);
  const prByDate = new Map<string, number>();
  prs.forEach((p) => prByDate.set(p.date, (prByDate.get(p.date) ?? 0) + 1));
  for (const b of BADGES) {
    if (b.metric && b.value !== undefined) {
      const m = metricById(b.metric)!;
      const v = best(m, testsFor(recs, playerId, m.id));
      if (v !== null && (m.lowerIsBetter ? v <= b.value : v >= b.value)) earned.add(b.id);
    }
    if (b.streak && streak >= b.streak) earned.add(b.id);
    if (b.special === 'prHunter' && Array.from(prByDate.values()).some((n) => n >= 5)) earned.add(b.id);
    if (b.special === 'coachPick' && recs.some((r) => r.kind === 'award' && r.playerId === playerId)) earned.add(b.id);
  }
  return earned;
}

/** The unearned metric badge closest to being earned, as a fraction of the way from baseline. */
export function closestBadge(recs: Rec[], playerId: string) {
  const earned = badgesFor(recs, playerId);
  let pick: { name: string; req: string; now: string; toGo: string; pct: number } | null = null;
  for (const b of BADGES) {
    if (earned.has(b.id) || !b.metric || b.value === undefined) continue;
    const s = summarize(recs, playerId, b.metric);
    if (!s || s.best === null || s.baseline === null) continue;
    const m = s.metric;
    const gap = m.lowerIsBetter ? s.best - b.value : b.value - s.best;
    const span = Math.abs(b.value - s.baseline) || 1;
    const pct = 1 - gap / span;
    if (!pick || pct > pick.pct) pick = { name: b.name, req: b.req, now: `${fmt(m, s.best)} ${m.clock ? '' : m.unit}`.trim(), toGo: `${fmt(m, Math.abs(gap))}${m.clock ? '' : ' ' + m.unit} to go`, pct };
  }
  if (!pick) {
    const st = streakFor(recs, playerId);
    const target = [7, 30, 60].find((n) => n > st);
    if (target) pick = { name: `Streak ${target}`, req: `${target} days in a row`, now: `${st} days`, toGo: `${target - st} days to go`, pct: st / target };
  }
  return pick;
}

// --- Pitch Smart ---------------------------------------------------------------------------

export interface ArmStatus {
  canThrowHard: boolean;
  nextDate: string;
  message: string;
  lastCount: number | null;
  lastDate: string | null;
  innings12mo: number;
  phaseNoThrow: boolean;
}

export function armStatus(recs: Rec[], playerId: string, on = today()): ArmStatus {
  const logs = recs
    .filter((r) => r.kind === 'pitches' && r.playerId === playerId)
    .map((r) => ({ date: r.date, count: Number(r.data.count) || 0, innings: Number(r.data.innings) || 0 }));
  const byDate = new Map<string, number>();
  logs.forEach((l) => byDate.set(l.date, (byDate.get(l.date) ?? 0) + l.count));
  let next = on;
  let lastDate: string | null = null;
  let lastCount: number | null = null;
  for (const [d, c] of Array.from(byDate.entries()).sort()) {
    if (c <= 0) continue;
    lastDate = d;
    lastCount = c;
    const eligible = addDays(d, restDaysFor(c) + 1);
    if (eligible > next) next = eligible;
  }
  // No pitching three days in a row.
  const y1 = addDays(on, -1);
  const y2 = addDays(on, -2);
  if ((byDate.get(y1) ?? 0) > 0 && (byDate.get(y2) ?? 0) > 0 && next <= on) next = addDays(on, 1);
  const yearAgo = addDays(on, -365);
  const innings12mo = logs.filter((l) => l.date > yearAgo).reduce((a, l) => a + l.innings, 0);
  const phase = phaseFor(on);
  const phaseNoThrow = !phase.throwing;
  const pitchedToday = byDate.get(on) ?? 0;
  let message: string;
  if (phaseNoThrow) message = `${phase.name}: no throwing until ${short(addDays(phase.end, 1))}`;
  else if (pitchedToday > 0) message = `${pitchedToday} pitches today · ${Math.max(0, PITCH_SMART.dailyMax - pitchedToday)} left · ${restDaysFor(pitchedToday)} days rest`;
  else if (next > on) message = `Rest — can pitch again ${short(next)}`;
  else message = 'Ready to pitch';
  return { canThrowHard: !phaseNoThrow && next <= on, nextDate: next, message, lastCount, lastDate, innings12mo, phaseNoThrow };
}

// --- season + planner ---------------------------------------------------------------------

export function phaseFor(d: string) {
  return PHASES.find((p) => d >= p.start && d <= p.end) ?? (d < PHASES[0].start ? PHASES[0] : PHASES[PHASES.length - 1]);
}

export interface SlotRec {
  id: string;
  date: string;
  type: SlotType;
  playerId: string | null;
  note?: string;
  order: number;
}

export function slotsFrom(recs: Rec[]): SlotRec[] {
  return recs
    .filter((r) => r.kind === 'slot')
    .map((r) => ({ id: r.id, date: r.date, type: r.data.type as SlotType, playerId: r.playerId, note: (r.data.note as string) || undefined, order: Number(r.data.order) || 0 }))
    .filter((s) => SLOT_KINDS[s.type])
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.order - b.order));
}

export const slotsForPlayerOn = (slots: SlotRec[], playerId: string, d: string) =>
  slots.filter((s) => s.date === d && (s.playerId === null || s.playerId === playerId));

/** Flex-rule warnings for one player's week. */
export function weekWarnings(recs: Rec[], playerId: string, ws: string) {
  const slots = slotsFrom(recs);
  const out: string[] = [];
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const types = days.map((d) => slotsForPlayerOn(slots, playerId, d).map((s) => s.type));
  for (let i = 0; i < 7; i++) {
    const t = types[i];
    if (t.includes('game') && t.some((x) => x === 'hitParent' || x === 'hitSolo' || x === 'throw'))
      out.push(`${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}: game day — drop the hitting/throwing slot.`);
    if (i > 0 && t.includes('strength') && types[i - 1].includes('strength'))
      out.push(`${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}: strength two days in a row.`);
  }
  const rests = types.filter((t) => t.length === 0 || t.every((x) => x === 'rest')).length;
  if (rests < 2) out.push('Fewer than 2 rest days this week.');
  const phase = phaseFor(ws);
  if (!phase.throwing && types.flat().some((x) => SLOT_KINDS[x].throws && x !== 'game'))
    out.push(`${phase.name}: throwing slots planned during the no-throw block.`);
  const arm = armStatus(recs, playerId, ws);
  if (arm.nextDate > ws) {
    const idx = days.findIndex((d) => d >= arm.nextDate);
    const blocked = days.slice(0, idx === -1 ? 7 : idx);
    if (blocked.some((d) => slotsForPlayerOn(slots, playerId, d).some((s) => s.type === 'lessonPitch')))
      out.push(`Pitching lesson falls inside Pitch Smart rest (ready ${short(arm.nextDate)}).`);
  }
  const minutes = types.flat().reduce((a, x) => a + SLOT_KINDS[x].minutes, 0);
  if (minutes > 600) out.push(`About ${Math.round(minutes / 60)} hours planned — keep it under 10.`);
  return out;
}

export const currentWeek = () => weekStart(today());

export function daysToTryouts(tryout: string) {
  return Math.max(0, diffDays(tryout, today()));
}

/** Combined family XP and each player's total. */
export function familyXp(recs: Rec[], ids: string[]) {
  return ids.reduce((a, id) => a + xpFor(recs, id), 0);
}
