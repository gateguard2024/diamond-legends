import { Pitch, PitchType, PitchingEntry } from './types';

// ---------------------------------------------------------------------------
// PITCH AGGREGATION
//
// Pitches are logged one line at a time, exactly like swings. Session totals —
// count, strikes, average velo, top velo — are all derived from that list.
// ---------------------------------------------------------------------------

export const PITCH_TYPES: { id: PitchType; label: string; short: string }[] = [
  { id: 'FB', label: 'Fastball', short: 'FB' },
  { id: 'CH', label: 'Changeup', short: 'CH' },
  { id: 'CB', label: 'Curve / Breaking', short: 'CB' },
  { id: 'OTHER', label: 'Other', short: '—' },
];

export function emptyPitch(id: string, type: PitchType = 'FB'): Pitch {
  return { id, speed: 0, strike: false, type };
}

const roundTo = (n: number, decimals: number) => {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
};

/** Average velo across pitches that actually got gunned. */
export function averageSpeed(pitches: Pitch[]): number {
  const speeds = pitches.map((p) => Number(p.speed) || 0).filter((s) => s > 0);
  if (!speeds.length) return 0;
  return roundTo(speeds.reduce((a, b) => a + b, 0) / speeds.length, 1);
}

export function topSpeed(pitches: Pitch[]): number {
  const speeds = pitches.map((p) => Number(p.speed) || 0).filter((s) => s > 0);
  return speeds.length ? Math.max(...speeds) : 0;
}

export function strikeCount(pitches: Pitch[]): number {
  return pitches.filter((p) => p.strike).length;
}

export function strikePct(pitches: Pitch[]): number {
  return pitches.length ? Math.round((strikeCount(pitches) / pitches.length) * 100) : 0;
}

/** Strike rate broken out by pitch type — shows if the changeup is a ball machine. */
export function strikePctByType(pitches: Pitch[]): { type: PitchType; thrown: number; strikePct: number }[] {
  return PITCH_TYPES.map(({ id }) => {
    const set = pitches.filter((p) => p.type === id);
    return {
      type: id,
      thrown: set.length,
      strikePct: set.length ? Math.round((strikeCount(set) / set.length) * 100) : 0,
    };
  }).filter((r) => r.thrown > 0);
}

/**
 * Longest run of consecutive strikes — a nice proxy for "can he repeat his
 * delivery" that kids immediately understand.
 */
export function longestStrikeRun(pitches: Pitch[]): number {
  let best = 0;
  let run = 0;
  for (const p of pitches) {
    run = p.strike ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}

/** Roll a pitch log up into the session-level PitchingEntry. */
export function pitchingFromLog(pitchLog: Pitch[]): PitchingEntry {
  return {
    totalPitches: pitchLog.length,
    strikes: strikeCount(pitchLog),
    avgSpeed: averageSpeed(pitchLog),
    topSpeed: topSpeed(pitchLog),
    pitchLog,
  };
}
