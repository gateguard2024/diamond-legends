// ---------------------------------------------------------------------------
// Core data model for Diamond Legends
// ---------------------------------------------------------------------------

export type PlayerId = 'carl' | 'austin';

export interface Player {
  id: PlayerId;
  name: string;
  /** Editable nickname, e.g. "The Slugger". */
  slogan: string;
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

/** User-editable bits of a player, stored in the database. */
export interface PlayerProfile {
  playerId: PlayerId;
  number: number;
  slogan: string; // e.g. "The Slugger"
}

// --- Session sub-records --------------------------------------------------

export type PitchType = 'FB' | 'CH' | 'CB' | 'OTHER';

/** One pitch, logged line by line. */
export interface Pitch {
  id: string;
  speed: number; // mph — 0 if not gunned
  strike: boolean;
  type: PitchType;
}

export interface PitchingEntry {
  totalPitches: number;
  strikes: number;
  avgSpeed: number; // mph — average of every pitch that got gunned
  topSpeed: number; // mph — fastest pitch of the session
  /** Every pitch thrown in the session. */
  pitchLog?: Pitch[];
}

export type DrillId =
  | 'popFlies'
  | 'frontGrounders'
  | 'backhand'
  | 'gloveSide'
  | 'gloveSideTurns'
  | 'backhandTurns';

/**
 * One line of fielding work: a drill, how many balls were sent at him, how
 * many he caught/fielded cleanly, and how his throws to the bag went.
 */
export interface FieldingRep {
  id: string;
  drill: DrillId;
  thrown: number; // balls hit or thrown to him
  caught: number; // fielded cleanly
  throwsMade: number; // throws attempted after the field
  throwsAccurate: number; // throws on target / catchable at the bag
}

export interface FieldingEntry {
  popFlies: number;
  frontGrounders: number;
  backhand: number;
  gloveSide: number;
  gloveSideTurns: number;
  backhandTurns: number;
  cleanReps: number; // total caught cleanly
  chances: number; // total balls sent at him
  throwsMade: number;
  throwsAccurate: number;
  /** Every drill line logged in the session. */
  repLog?: FieldingRep[];
}

/**
 * One swing as reported by Blast Motion. Field names match the labels in the
 * Blast Baseball app so numbers can be copied straight across.
 * Any metric left blank is stored as 0 and ignored when averaging.
 */
export interface Swing {
  id: string;
  batSpeed: number; // mph
  peakHandSpeed: number; // mph
  rotationalAcceleration: number; // g
  onPlaneEfficiency: number; // %
  attackAngle: number; // degrees
  verticalBatAngle: number; // degrees (normally negative)
  earlyConnection: number; // degrees
  connectionAtImpact: number; // degrees
  timeToContact: number; // seconds
  power: number; // kW
  blastFactor: number; // 0-100 composite
}

export type SwingMetric = Exclude<keyof Swing, 'id'>;

/**
 * Session-level hitting numbers. When `swingLog` is present every average
 * here is derived from it, so the two never drift apart.
 */
export interface HittingEntry {
  swings: number; // = swingLog.length when swings were logged individually
  batSpeed: number; // mph
  peakHandSpeed: number; // mph
  rotationalAcceleration: number; // g
  onPlaneEfficiency: number; // %
  attackAngle: number; // degrees
  verticalBatAngle: number; // degrees
  earlyConnection: number; // degrees
  connectionAtImpact: number; // degrees
  timeToContact: number; // seconds
  power: number; // kW
  blastFactor: number; // 0-100 composite
  /** Every swing taken in the session. */
  swingLog?: Swing[];
  /** Fastest single swing of the session. */
  bestSwingBatSpeed?: number;
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
  | 'catchPct'
  | 'throwAccuracy'
  | 'workoutsPerWeek';

/** Which part of the game a metric or drill belongs to. */
export type Phase = 'batting' | 'pitching' | 'fielding';

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
  chances: number;
  catchPct: number;
  throwsMade: number;
  throwsAccurate: number;
  throwAccuracy: number;
  swings: number;
  bestBatSpeed: number; // best session average
  bestSwing: number; // best single swing

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
