import { DrillId, FieldingEntry, FieldingRep } from './types';

// ---------------------------------------------------------------------------
// FIELDING AGGREGATION
//
// Fielding is logged one drill line at a time: how many balls were sent at
// him, how many he handled cleanly, how many throws he made and how many were
// on target. Catch % and throw accuracy fall out of that.
// ---------------------------------------------------------------------------

export const DRILLS: { id: DrillId; label: string; short: string }[] = [
  { id: 'frontGrounders', label: 'Front Grounders', short: 'FRONT GB' },
  { id: 'popFlies', label: 'Pop Flies', short: 'POP FLY' },
  { id: 'gloveSide', label: 'Glove Side', short: 'GLOVE SIDE' },
  { id: 'backhand', label: 'Backhand', short: 'BACKHAND' },
  { id: 'gloveSideTurns', label: 'Glove Side Turns', short: 'GS TURNS' },
  { id: 'backhandTurns', label: 'Backhand Turns', short: 'BH TURNS' },
];

export const DRILL_LABEL: Record<DrillId, string> = DRILLS.reduce(
  (acc, d) => ({ ...acc, [d.id]: d.label }),
  {} as Record<DrillId, string>,
);

export function emptyRep(id: string, drill: DrillId = 'frontGrounders'): FieldingRep {
  return { id, drill, thrown: 0, caught: 0, throwsMade: 0, throwsAccurate: 0 };
}

/** A line counts once any ball has been sent at him. */
export function isRepFilled(r: FieldingRep): boolean {
  return (Number(r.thrown) || 0) > 0;
}

const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0);

export function repCatchPct(r: FieldingRep): number {
  return pct(r.caught, r.thrown);
}

export function repThrowPct(r: FieldingRep): number {
  return pct(r.throwsAccurate, r.throwsMade);
}

/** Roll drill lines up into the session-level FieldingEntry. */
export function fieldingFromReps(repLog: FieldingRep[]): FieldingEntry {
  const reps = repLog.filter(isRepFilled);

  const byDrill = (drill: DrillId) =>
    reps.filter((r) => r.drill === drill).reduce((sum, r) => sum + r.thrown, 0);

  const chances = reps.reduce((sum, r) => sum + r.thrown, 0);
  const caught = reps.reduce((sum, r) => sum + Math.min(r.caught, r.thrown), 0);
  const throwsMade = reps.reduce((sum, r) => sum + r.throwsMade, 0);
  const throwsAccurate = reps.reduce((sum, r) => sum + Math.min(r.throwsAccurate, r.throwsMade), 0);

  return {
    popFlies: byDrill('popFlies'),
    frontGrounders: byDrill('frontGrounders'),
    backhand: byDrill('backhand'),
    gloveSide: byDrill('gloveSide'),
    gloveSideTurns: byDrill('gloveSideTurns'),
    backhandTurns: byDrill('backhandTurns'),
    cleanReps: caught,
    chances,
    throwsMade,
    throwsAccurate,
    repLog: reps,
  };
}

/** Per-drill catch % for a session — shows which drill is leaking reps. */
export function catchPctByDrill(
  entry: FieldingEntry,
): { drill: DrillId; label: string; thrown: number; caught: number; pct: number }[] {
  const log = entry.repLog ?? [];
  return DRILLS.map(({ id, label }) => {
    const set = log.filter((r) => r.drill === id);
    const thrown = set.reduce((s, r) => s + r.thrown, 0);
    const caught = set.reduce((s, r) => s + r.caught, 0);
    return { drill: id, label, thrown, caught, pct: pct(caught, thrown) };
  }).filter((r) => r.thrown > 0);
}

/**
 * Total balls sent at him. Older sessions predate the `chances` field, so fall
 * back to summing the per-drill counts.
 */
export function chancesFor(entry: FieldingEntry): number {
  if (entry.chances) return entry.chances;
  return (
    entry.popFlies +
    entry.frontGrounders +
    entry.backhand +
    entry.gloveSide +
    entry.gloveSideTurns +
    entry.backhandTurns
  );
}
