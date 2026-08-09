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
  /** Optional image dropped into /public. Falls back to initials if missing. */
  photo?: string;
}

// --- Session sub-records --------------------------------------------------

export interface PitchingEntry {
  totalPitches: number;
  strikes: number;
  topSpeed: number; // mph (radar gun)
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
  onPlaneEfficiency: number; // % (Blast calls this "On Plane Efficiency"/Plane Score)
  attackAngle: number; // degrees
  verticalBatAngle: number; // degrees (negative)
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
  /** XP awarded at the time the session was saved. */
  xpEarned: number;
}

// --- Derived / computed ---------------------------------------------------

export type Tier = 'Rookie' | 'Pro' | 'All-Star' | 'Hall of Famer';

export interface CareerTotals {
  sessions: number;
  pitches: number;
  strikes: number;
  strikePct: number;
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
  xpToNextLevel: number; // XP needed to finish current level
}

export interface AwardDef {
  id: string;
  label: string;
  icon: string;
  description: string;
  /** Returns 0..1 progress toward the award. */
  progress: (t: CareerTotals, sessions: Session[]) => number;
}
