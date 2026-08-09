import { HittingEntry, Swing, SwingMetric } from './types';

// ---------------------------------------------------------------------------
// SWING AGGREGATION
//
// Swings are logged one line at a time. Everything the rest of the app reads —
// session averages, goals, charts, PRs — is derived from that list here, so
// the averages can never drift away from the underlying swings.
// ---------------------------------------------------------------------------

export const SWING_METRICS: SwingMetric[] = [
  'batSpeed',
  'peakHandSpeed',
  'rotationalAcceleration',
  'onPlaneEfficiency',
  'attackAngle',
  'verticalBatAngle',
  'earlyConnection',
  'connectionAtImpact',
  'timeToContact',
  'power',
  'blastFactor',
];

export interface SwingColumn {
  key: SwingMetric;
  label: string;
  short: string;
  unit: string;
  step: string;
  decimals: number;
  /** Shown in the compact "Core" view. */
  core: boolean;
  /** Negative values are normal (vertical bat angle). */
  signed?: boolean;
}

export const SWING_COLUMNS: SwingColumn[] = [
  { key: 'batSpeed', label: 'Bat Speed', short: 'BAT SPD', unit: 'mph', step: '0.1', decimals: 1, core: true },
  { key: 'peakHandSpeed', label: 'Peak Hand Speed', short: 'HAND SPD', unit: 'mph', step: '0.1', decimals: 1, core: true },
  { key: 'onPlaneEfficiency', label: 'On Plane Efficiency', short: 'ON PLANE', unit: '%', step: '1', decimals: 0, core: true },
  { key: 'attackAngle', label: 'Attack Angle', short: 'ATK ANG', unit: '°', step: '0.1', decimals: 1, core: true, signed: true },
  { key: 'verticalBatAngle', label: 'Vertical Bat Angle', short: 'VERT ANG', unit: '°', step: '0.1', decimals: 1, core: true, signed: true },
  { key: 'rotationalAcceleration', label: 'Rotational Acceleration', short: 'ROT ACC', unit: 'g', step: '0.1', decimals: 1, core: false },
  { key: 'earlyConnection', label: 'Early Connection', short: 'EARLY CON', unit: '°', step: '0.1', decimals: 1, core: false },
  { key: 'connectionAtImpact', label: 'Connection at Impact', short: 'CON IMP', unit: '°', step: '0.1', decimals: 1, core: false },
  { key: 'timeToContact', label: 'Time to Contact', short: 'TIME', unit: 's', step: '0.01', decimals: 2, core: false },
  { key: 'power', label: 'Power', short: 'POWER', unit: 'kW', step: '0.1', decimals: 1, core: false },
  { key: 'blastFactor', label: 'Blast Factor', short: 'BLAST', unit: '', step: '1', decimals: 0, core: false },
];

export function emptySwing(id: string): Swing {
  return {
    id,
    batSpeed: 0,
    peakHandSpeed: 0,
    rotationalAcceleration: 0,
    onPlaneEfficiency: 0,
    attackAngle: 0,
    verticalBatAngle: 0,
    earlyConnection: 0,
    connectionAtImpact: 0,
    timeToContact: 0,
    power: 0,
    blastFactor: 0,
  };
}

const roundTo = (n: number, decimals: number) => {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
};

/**
 * Average one metric across swings, skipping blanks.
 *
 * A swing where the metric is 0 is treated as "not recorded" rather than a
 * real zero — nobody swings at 0 mph, and counting blanks would drag every
 * average down. Vertical bat angle and attack angle are signed, so only exact
 * 0 is skipped there too.
 */
export function averageMetric(swings: Swing[], key: SwingMetric): number {
  const values = swings.map((s) => Number(s[key]) || 0).filter((v) => v !== 0);
  if (!values.length) return 0;
  const col = SWING_COLUMNS.find((c) => c.key === key);
  return roundTo(values.reduce((a, b) => a + b, 0) / values.length, col?.decimals ?? 1);
}

/** How many swings actually carry a value for this metric. */
export function metricCount(swings: Swing[], key: SwingMetric): number {
  return swings.filter((s) => (Number(s[key]) || 0) !== 0).length;
}

/** Best (highest) single-swing value for a metric. */
export function bestMetric(swings: Swing[], key: SwingMetric): number {
  const values = swings.map((s) => Number(s[key]) || 0).filter((v) => v !== 0);
  return values.length ? Math.max(...values) : 0;
}

/** A swing counts if any metric on it was filled in. */
export function isSwingFilled(s: Swing): boolean {
  return SWING_METRICS.some((k) => (Number(s[k]) || 0) !== 0);
}

/** Roll a swing log up into the session-level HittingEntry. */
export function hittingFromSwings(swingLog: Swing[]): HittingEntry {
  const swings = swingLog.filter(isSwingFilled);

  return {
    swings: swings.length,
    batSpeed: averageMetric(swings, 'batSpeed'),
    peakHandSpeed: averageMetric(swings, 'peakHandSpeed'),
    rotationalAcceleration: averageMetric(swings, 'rotationalAcceleration'),
    onPlaneEfficiency: averageMetric(swings, 'onPlaneEfficiency'),
    attackAngle: averageMetric(swings, 'attackAngle'),
    verticalBatAngle: averageMetric(swings, 'verticalBatAngle'),
    earlyConnection: averageMetric(swings, 'earlyConnection'),
    connectionAtImpact: averageMetric(swings, 'connectionAtImpact'),
    timeToContact: averageMetric(swings, 'timeToContact'),
    power: averageMetric(swings, 'power'),
    blastFactor: averageMetric(swings, 'blastFactor'),
    bestSwingBatSpeed: bestMetric(swings, 'batSpeed'),
    swingLog: swings,
  };
}
