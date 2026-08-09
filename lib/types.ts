// ---------------------------------------------------------------------------
// Core data model for Diamond Legends
// ---------------------------------------------------------------------------

export type PlayerId = 'carl' | 'austin';

export interface Player {
  id: PlayerId;
  name: string;
  nickname: string;
  number: number;
  age: number;
  division: string; // "9U" / "10U"
  /** Tailwind gradient stops used for that player's accent color. */
  accent: {
    from: string;
    to: string;
    text: string;
    border: string;
    ring: string;
  };
}

// --- Session sub-records --------------------------------------------------

export interface PitchingEntry {
  totalPitches: number;
  strikes: number;
  avgSpeed: number; // mph — average of every pitch that got gunned
  topSpeed: number; // mph — fastest pitch of the session
}

export interface FieldingEntry {
  popFlies: number;
  frontGrounders: number;
  backhand: number;
  gloveSide: number;
  gloveSideTurns: number;
  backhandTurns: number;
  cleanReps: number; // how many of the total reps were fielded cleanly
}

/**
 * Blast Motion session averages. Field names match the labels shown in the
 * Blast Baseball app so numbers can be copied straight across.
 */
export interface HittingEntry {
  swings: number;
  batSpeed: number; // mph
  peakHandSpeed: number; // mph
  rotationalAcceleration: number; // g
  onPlaneEfficiency: number; // % (Blast's "On Plane Efficiency" / plane score)
  attackAngle: number; // degrees
  verticalBatAngle: number; // degrees (normally negative)
  earlyConnection: number; // degrees
  connectionAtImpact: number; // degrees
  timeToContact: number; // seconds
  power: number; // kW
  blastFactor: number; // 0-100 composite
}

export interface Session {
  id: string;
  playerId: PlayerId;
  date: string; // YYYY-MM-DD
  pitching?: PitchingEntry;
  fielding?: FieldingEntry;
  hitting?: HittingEntry;
  notes?: string;
  /** XP awarded when the session was saved. */
  xpEarned: number;
}

// --- Goals ----------------------------------------------------------------

export type MetricId =
  | 'strikePct'
  | 'avgSpeed'
  | 'topSpeed'
  | 'batSpeed'
  | 'onPlaneEfficiency'
  | 'cleanPct'
  | 'workoutsPerWeek';

export interface Goal {
  id: string;
  playerId: PlayerId;
  metric: MetricId;
  target: number;
  /** What the rolling average was when this goal was set. */
  startValue: number;
  createdAt: string; // ISO timestamp
  achievedAt?: string | null; // ISO timestamp, null while active
  achievedValue?: number | null;
}

// --- Derived / computed ---------------------------------------------------

export type Tier = 'Rookie' | 'Pro' | 'All-Star' | 'Hall of Famer';

export interface CareerTotals {
  sessions: number;
  pitches: number;
  strikes: number;
  strikePct: number;
  bestAvgSpeed: number;
  bestTopSpeed: number;
  fieldingReps: number;
  cleanReps: number;
  cleanPct: number;
  swings: number;
  bestBatSpeed: number;
  bestOnPlane: number;
  bestBlastFactor: number;
  bestHandSpeed: number;
}

export interface LevelInfo {
  level: number;
  tier: Tier;
  totalXP: number;
  currentXP: number; // XP into the current level
  xpToNextLevel: number; // XP needed to finish the current level
}

export interface AwardDef {
  id: string;
  label: string;
  icon: string;
  description: string;
  /** Returns 0..1 progress toward the award. */
  progress: (t: CareerTotals, sessions: Session[]) => number;
}

/** A stat that beat every previous session for that player. */
export interface PersonalBest {
  metric: string;
  label: string;
  value: number;
  previous: number;
  unit: string;
}
