// ---------------------------------------------------------------------------
// The Elite Baseball Trainer program — every number the app uses lives here.
// Edit this file to tune tiers, goals, drills, XP or the season calendar.
// ---------------------------------------------------------------------------

export type PlayerId = 'austin' | 'carl';

export interface Player {
  id: PlayerId;
  name: string;
  number: number;
  /** Tailwind-safe hex accent for this player's UI. */
  color: string;
}

export const PLAYERS: Player[] = [
  { id: 'austin', name: 'Austin', number: 3, color: '#4FC3B8' },
  { id: 'carl', name: 'Carl', number: 7, color: '#F4B23E' },
];

export const playerById = (id: string) => PLAYERS.find((p) => p.id === id) ?? PLAYERS[0];

/** Default tryout date; changeable in Settings. */
export const DEFAULT_TRYOUT_DATE = '2027-07-10';

// --- Measurables -------------------------------------------------------------

export type TierName = 'Developing' | 'Solid AA' | 'AAA-ready' | 'Elite 10U';
export const TIER_ORDER: TierName[] = ['Developing', 'Solid AA', 'AAA-ready', 'Elite 10U'];

export interface Metric {
  id: string;
  label: string;
  short: string;
  unit: string;
  /** Sprint times etc. — smaller is better. */
  lowerIsBetter?: boolean;
  /** Decimal places to show. */
  dp: number;
  /** Tier entry points [Solid AA, AAA-ready, Elite]. Higher-better: minimums. Lower-better: maximums. */
  tiers?: [number, number, number];
  /** Middle of the realistic 9-month gain (signed in the "better" direction as a magnitude). */
  gain?: number;
  /** Round the goal up to the next tier line when it lands within this distance of it. */
  snap?: number;
  /** Shown on the combine form. */
  protocol: string;
  group: 'Speed' | 'Hitting' | 'Throwing' | 'Fielding' | 'Strength';
  /** Store seconds but show m:ss. */
  clock?: boolean;
}

export const METRICS: Metric[] = [
  { id: 'sprint30', label: '30-yard sprint', short: '30 yd', unit: 's', lowerIsBetter: true, dp: 2, tiers: [5.6, 5.29, 4.99], gain: 0.3, snap: 0.1, group: 'Speed', protocol: '2-point start, timer on first move. 3 trials, 2 min rest. Best time.' },
  { id: 'homeFirst', label: 'Home to first', short: 'H→1B', unit: 's', lowerIsBetter: true, dp: 2, tiers: [4.2, 3.89, 3.59], gain: 0.25, snap: 0.1, group: 'Speed', protocol: 'From the box after a dry swing, through the bag. 2 trials. Assumes 65 ft bases.' },
  { id: 'proAgility', label: 'Pro-agility 5-10-5', short: '5-10-5', unit: 's', lowerIsBetter: true, dp: 2, group: 'Speed', protocol: 'Standard shuttle, 2 trials, best time.' },
  { id: 'broadJump', label: 'Broad jump', short: 'Broad', unit: 'in', dp: 0, tiers: [54, 62, 70], gain: 6, snap: 2, group: 'Speed', protocol: 'Two feet, stick the landing, measure to the heel. 3 trials.' },
  { id: 'teeEV', label: 'Tee exit velo', short: 'Exit velo', unit: 'mph', dp: 0, tiers: [46, 52, 58], gain: 6, snap: 2, group: 'Hitting', protocol: 'Gamer bat, belt-high tee. 10 max-intent swings, radar behind the tee. Log the max.' },
  { id: 'batSpeed', label: 'Bat speed (Blast)', short: 'Bat speed', unit: 'mph', dp: 0, tiers: [41, 46, 51], gain: 4.5, snap: 2, group: 'Hitting', protocol: 'Blast Motion on the gamer bat, 10 max-intent tee swings. Log the max.' },
  { id: 'contact', label: 'Contact quality', short: 'Contact', unit: '/20', dp: 0, tiers: [8, 12, 15], gain: 4, snap: 1, group: 'Hitting', protocol: '20 front-toss swings. Count hard line drives + hard grounders.' },
  { id: 'pitchVelo', label: 'Pitching velo', short: 'Pitch velo', unit: 'mph', dp: 0, tiers: [43, 48, 54], gain: 4.5, snap: 2, group: 'Throwing', protocol: 'From the mound after a bullpen warm-up. 10 fastballs, log the max.' },
  { id: 'throwVelo', label: 'Position throw (crow hop)', short: 'Throw velo', unit: 'mph', dp: 0, tiers: [46, 51, 57], gain: 4.5, snap: 2, group: 'Throwing', protocol: 'After full catch warm-up: 5 crow-hop throws. Log the max.' },
  { id: 'strikes', label: 'Strikes of 20', short: 'Strikes', unit: '/20', dp: 0, tiers: [10, 12, 14], gain: 2, snap: 1, group: 'Throwing', protocol: '20 fastballs to a catcher or strike target.' },
  { id: 'fielding', label: 'Clean grounders of 10', short: 'Fielding', unit: '/10', dp: 0, tiers: [6, 8, 9], gain: 2, snap: 1, group: 'Fielding', protocol: '10 routine grounders at SS, field and throw to 1B.' },
  { id: 'medBall', label: 'Med ball rotational throw', short: 'Med ball', unit: 'ft', dp: 0, group: 'Strength', protocol: '4 lb ball, side-on, best throw (log the better side).' },
  { id: 'pushups', label: 'Push-ups in 1 min', short: 'Push-ups', unit: 'reps', dp: 0, tiers: [12, 20, 28], gain: 10, snap: 3, group: 'Strength', protocol: 'Chest to a fist, straight body, full lockout. Bad reps do not count.' },
  { id: 'wallSit', label: 'Wall sit', short: 'Wall sit', unit: 's', dp: 0, clock: true, tiers: [45, 90, 150], gain: 67, snap: 15, group: 'Strength', protocol: 'Thighs parallel, back flat, hands off legs. Stop when form breaks.' },
  { id: 'plank', label: 'Plank', short: 'Plank', unit: 's', dp: 0, clock: true, tiers: [40, 75, 120], gain: 45, snap: 15, group: 'Strength', protocol: 'Forearms, straight line, stop at the first sag.' },
  { id: 'deadHang', label: 'Dead hang', short: 'Hang', unit: 's', dp: 0, clock: true, group: 'Strength', protocol: 'Overhand grip on a bar, time to drop.' },
];

export const metricById = (id: string) => METRICS.find((m) => m.id === id);

/** The six cards shown on the dashboard. */
export const HEADLINE_METRICS = ['teeEV', 'batSpeed', 'pitchVelo', 'sprint30', 'pushups', 'wallSit'];

// --- Season ------------------------------------------------------------------

export type PhaseId = 'evaluate' | 'armRest' | 'rampUp' | 'power' | 'season' | 'peak' | 'recharge';

export interface Phase {
  id: PhaseId;
  name: string;
  start: string; // inclusive ISO date
  end: string; // inclusive ISO date
  focus: string;
  throwing: boolean;
}

export const PHASES: Phase[] = [
  { id: 'evaluate', name: 'Evaluate & foundation', start: '2026-10-12', end: '2026-11-22', focus: 'Combine #1 the week of Oct 19 · fall ball wraps · swing and throwing mechanics · strength basics', throwing: true },
  { id: 'armRest', name: 'Arm rest & build', start: '2026-11-23', end: '2027-01-17', focus: 'No throwing for 8 weeks · hitting 4x a week · strength and speed 2x a week · other sports welcome', throwing: false },
  { id: 'rampUp', name: 'Throwing ramp-up', start: '2027-01-18', end: '2027-02-28', focus: 'Catch play → long toss → bullpens of 15–35 pitches · overload/underload bats begin', throwing: true },
  { id: 'power', name: 'Pre-season power', start: '2027-03-01', end: '2027-04-11', focus: 'Max-intent velocity days · live at-bats against speed · strike % focus · deload every 4th week', throwing: true },
  { id: 'season', name: 'Spring season', start: '2027-04-12', end: '2027-06-13', focus: 'Games carry the load · 1 strength day, 1–2 hitting slots · Pitch Smart rest enforced', throwing: true },
  { id: 'peak', name: 'Tryout peak', start: '2027-06-14', end: '2027-07-31', focus: 'Mock tryout every Saturday · sharpen fielding and baserunning · taper the final week', throwing: true },
  { id: 'recharge', name: 'Recharge', start: '2027-08-01', end: '2027-09-12', focus: 'About 6 weeks with no throwing · completes the 4 months off per year · play other sports', throwing: false },
];

export const RETESTS = [
  { label: 'Combine #1 (baseline)', date: '2026-10-20' },
  { label: 'Re-test 2', date: '2027-01-16' },
  { label: 'Re-test 3', date: '2027-04-10' },
  { label: 'Final test (week before tryouts)', date: '2027-07-03' },
];

// --- Training slots ------------------------------------------------------------

export type SlotType = 'lessonHit' | 'lessonPitch' | 'hitParent' | 'hitSolo' | 'throw' | 'strength' | 'bands' | 'game' | 'rest' | 'combine';
export type Runner = 'Coach' | 'Parent' | 'Solo' | 'Game' | 'Rest';

export interface SlotKind {
  type: SlotType;
  label: string;
  runner: Runner;
  minutes: number;
  xp: number;
  throws?: boolean;
  /** Default drill ids for this slot's checklist. */
  drills: string[];
}

export const SLOT_KINDS: Record<SlotType, SlotKind> = {
  lessonHit: { type: 'lessonHit', label: 'Hitting lesson', runner: 'Coach', minutes: 45, xp: 15, drills: [] },
  lessonPitch: { type: 'lessonPitch', label: 'Pitching lesson', runner: 'Coach', minutes: 30, xp: 15, throws: true, drills: ['jband'] },
  hitParent: { type: 'hitParent', label: 'Front toss', runner: 'Parent', minutes: 25, xp: 10, drills: ['frontToss', 'softToss', 'twoStrike'] },
  hitSolo: { type: 'hitSolo', label: 'Tee + bat speed', runner: 'Solo', minutes: 20, xp: 10, drills: ['teeLD', 'maxTee', 'overUnder', 'highLow'] },
  throw: { type: 'throw', label: 'Catch + fielding', runner: 'Parent', minutes: 25, xp: 10, throws: true, drills: ['jband', 'catchPlay', 'fungo', 'shortHops'] },
  strength: { type: 'strength', label: 'Strength + speed', runner: 'Parent', minutes: 35, xp: 10, drills: ['skips', 'starts10', 'gobletSquat', 'pushupsSet', 'invRow', 'medRot', 'plankSet'] },
  bands: { type: 'bands', label: 'Bands + mobility', runner: 'Solo', minutes: 10, xp: 5, drills: ['jband', 'mobility'] },
  game: { type: 'game', label: 'Game / pick-up', runner: 'Game', minutes: 90, xp: 10, throws: true, drills: [] },
  rest: { type: 'rest', label: 'Rest day', runner: 'Rest', minutes: 0, xp: 5, drills: [] },
  combine: { type: 'combine', label: 'Combine test', runner: 'Parent', minutes: 75, xp: 100, throws: true, drills: [] },
};

export const RUNNER_STYLE: Record<Runner, { bg: string; fg: string }> = {
  Coach: { bg: '#F4B23E', fg: '#0E1A2B' },
  Parent: { bg: '#4FC3B8', fg: '#0E1A2B' },
  Solo: { bg: '#8DA2FF', fg: '#0E1A2B' },
  Game: { bg: '#EEF2F7', fg: '#0E1A2B' },
  Rest: { bg: 'transparent', fg: '#9FB0C7' },
};

/** Weekly templates by phase: index 0 = Monday. */
export const WEEK_TEMPLATES: Record<PhaseId, SlotType[][]> = {
  evaluate: [['rest'], ['strength', 'hitSolo'], ['lessonHit', 'bands', 'throw'], ['hitParent', 'bands'], ['game'], ['game', 'strength'], ['rest']],
  armRest: [['rest'], ['strength', 'hitSolo'], ['lessonHit'], ['hitParent', 'bands'], ['hitSolo'], ['strength', 'hitParent'], ['rest']],
  rampUp: [['rest'], ['strength', 'hitSolo'], ['lessonHit', 'bands', 'throw'], ['hitParent', 'bands', 'throw'], ['rest'], ['lessonPitch', 'strength'], ['hitSolo', 'bands', 'throw']],
  power: [['rest'], ['strength', 'hitSolo'], ['lessonHit', 'bands', 'throw'], ['hitParent', 'bands', 'throw'], ['rest'], ['lessonPitch', 'strength'], ['hitSolo', 'bands', 'throw']],
  season: [['rest'], ['strength', 'hitSolo'], ['game'], ['hitParent', 'bands', 'throw'], ['rest'], ['game'], ['game']],
  peak: [['rest'], ['strength', 'hitSolo'], ['lessonHit', 'bands', 'throw'], ['hitParent', 'bands', 'throw'], ['rest'], ['combine'], ['hitSolo', 'bands']],
  recharge: [['rest'], ['strength'], ['hitSolo'], ['rest'], ['game'], ['strength'], ['rest']],
};

// --- Drills -----------------------------------------------------------------------

export type DrillCat = 'Hitting' | 'Throwing' | 'Fielding' | 'Strength' | 'Speed' | 'Mobility';

export interface Drill {
  id: string;
  name: string;
  cat: DrillCat;
  dose: string;
  who: 'Solo' | 'Parent' | 'Coach' | 'Brother';
  cue: string;
  throws?: boolean;
}

export const DRILLS: Drill[] = [
  { id: 'teeLD', name: 'Tee line drives', cat: 'Hitting', dose: '3 × 8', who: 'Solo', cue: 'Hit the back of the net at chest height. Hold the finish.' },
  { id: 'maxTee', name: 'Max-intent tee swings (Blast)', cat: 'Hitting', dose: '3 × 5, full rest', who: 'Solo', cue: 'Every swing 100%. Log the best bat speed.' },
  { id: 'overUnder', name: 'Overload / underload bats', cat: 'Hitting', dose: '5 heavy · 5 light · 5 gamer', who: 'Solo', cue: 'Heavy bat still swung fast. Light bat = fastest swing of the day.' },
  { id: 'highLow', name: 'High tee / low tee', cat: 'Hitting', dose: '2 × 8 each', who: 'Solo', cue: 'Cover the whole zone. Barrel stays above the hands.' },
  { id: 'frontToss', name: 'Front toss — middle, away, in', cat: 'Hitting', dose: '3 × 10', who: 'Parent', cue: 'Middle: back up the middle. Away: oppo. In: pull it.' },
  { id: 'softToss', name: 'Soft toss from the side', cat: 'Hitting', dose: '3 × 8', who: 'Parent', cue: 'Short to the ball, long through it.' },
  { id: 'velo30', name: 'Short-distance velocity', cat: 'Hitting', dose: '3 × 10', who: 'Parent', cue: 'Overhand from 30 ft or machine. Get the foot down early.' },
  { id: 'twoStrike', name: 'Two-strike approach', cat: 'Hitting', dose: '1 × 10', who: 'Parent', cue: 'Choke up, widen stance, fight off tough pitches.' },
  { id: 'bunt', name: 'Bunting', cat: 'Hitting', dose: '1 × 10', who: 'Parent', cue: 'Catch the ball with the bat. Bend the knees, not the back.' },
  { id: 'jband', name: 'J-Band arm care', cat: 'Throwing', dose: '1 round, 10 each', who: 'Solo', cue: 'Before every throw. Slow and controlled.', throws: false },
  { id: 'catchPlay', name: 'Progressive catch play', cat: 'Throwing', dose: '15–25 throws, 30 → 60 ft', who: 'Brother', cue: 'Hit the partner’s chest. Step to the target.', throws: true },
  { id: 'longToss', name: 'Long toss (arc)', cat: 'Throwing', dose: 'Build to 90–120 ft', who: 'Parent', cue: 'Arc, not max line. Stop at any fatigue.', throws: true },
  { id: 'rocker', name: 'Rocker / step-behind', cat: 'Throwing', dose: '2 × 10 into net', who: 'Solo', cue: 'Glove side stays firm. Finish over the front leg.', throws: true },
  { id: 'bullpen', name: 'Bullpen', cat: 'Throwing', dose: '15 → 35 pitches over 6 weeks', who: 'Coach', cue: 'Fastball command first. Changeup only at 10+.', throws: true },
  { id: 'target', name: 'Target challenge', cat: 'Throwing', dose: '20 pitches', who: 'Solo', cue: 'Count strikes. Beat your last score.', throws: true },
  { id: 'fungo', name: 'Fungo grounders', cat: 'Fielding', dose: '3 × 10', who: 'Parent', cue: 'Forehand, backhand, charge. Glove out front, butt down.', throws: true },
  { id: 'shortHops', name: 'Short-hop picks', cat: 'Fielding', dose: '3 × 10', who: 'Brother', cue: 'Soft hands, glove meets the ball.' },
  { id: 'popFly', name: 'Pop-ups and fly balls', cat: 'Fielding', dose: '2 × 10', who: 'Parent', cue: 'Drop step, run, call it loud.', throws: true },
  { id: 'gobletSquat', name: 'Goblet squat', cat: 'Strength', dose: '3 × 8', who: 'Parent', cue: 'Chest up, full depth.' },
  { id: 'pushupsSet', name: 'Push-ups', cat: 'Strength', dose: '3 × (max − 2)', who: 'Solo', cue: 'Leave two in the tank. Straight body.' },
  { id: 'lunge', name: 'Reverse lunge', cat: 'Strength', dose: '2 × 6 each', who: 'Solo', cue: 'Slow down, balanced up.' },
  { id: 'bridge', name: 'Single-leg glute bridge', cat: 'Strength', dose: '2 × 8 each', who: 'Solo', cue: 'Squeeze at the top for 1 second.' },
  { id: 'invRow', name: 'Inverted row', cat: 'Strength', dose: '3 × 6–8', who: 'Solo', cue: 'Chest to the bar, body straight.' },
  { id: 'hang', name: 'Dead hang', cat: 'Strength', dose: '2 × max', who: 'Solo', cue: 'Grip strength = bat control.' },
  { id: 'plankSet', name: 'Plank + side plank', cat: 'Strength', dose: '2 × 30–45 s', who: 'Solo', cue: 'Straight line. Breathe.' },
  { id: 'medRot', name: 'Med ball rotational throw', cat: 'Strength', dose: '3 × 5 each side', who: 'Solo', cue: 'Max intent — hips before shoulders.' },
  { id: 'medSlam', name: 'Med ball scoop / slam', cat: 'Strength', dose: '2 × 5', who: 'Solo', cue: 'Explode through it.' },
  { id: 'wallSitSet', name: 'Wall sit', cat: 'Strength', dose: '2 × max', who: 'Solo', cue: 'Thighs parallel. Beat the clock.' },
  { id: 'skips', name: 'A-skips, B-skips, high knees', cat: 'Speed', dose: '2 × 15 yd each', who: 'Solo', cue: 'Tall posture, quick feet.' },
  { id: 'starts10', name: '10-yard starts', cat: 'Speed', dose: '4–6, full rest', who: 'Parent', cue: 'Push the ground away. First 3 steps low.' },
  { id: 'sprint30', name: '30-yard max sprint', cat: 'Speed', dose: '3–4, 2 min rest', who: 'Parent', cue: 'Time it every other week.' },
  { id: 'shuffle', name: 'Lateral shuffle to sprint', cat: 'Speed', dose: '4 each side', who: 'Solo', cue: 'Stay low, cross over, go.' },
  { id: 'shuttle', name: '5-10-5 shuttle', cat: 'Speed', dose: '3 reps', who: 'Parent', cue: 'Plant low, touch the line.' },
  { id: 'ladder', name: 'Agility ladder', cat: 'Speed', dose: '4 patterns × 2', who: 'Solo', cue: 'Light feet. Eyes up.' },
  { id: 'jumps', name: 'Broad + tuck jumps', cat: 'Speed', dose: '3 × 3', who: 'Solo', cue: 'Land soft like a cat.' },
  { id: 'bases', name: 'Home to first / first to third', cat: 'Speed', dose: '3–4 reps', who: 'Parent', cue: 'Run through first. Turn the bag hard.' },
  { id: 'mobility', name: 'Mobility flow', cat: 'Mobility', dose: '8–10 min', who: 'Solo', cue: '90/90 hips, world’s greatest stretch, open books, foam roll.' },
];

export const drillById = (id: string) => DRILLS.find((d) => d.id === id);

// --- Gamification -------------------------------------------------------------------

export const XP = { pr: 50, retestDay: 100, sleep: 3 } as const;

export const LEVELS = [
  { name: 'Rookie', xp: 0 },
  { name: 'Prospect', xp: 500 },
  { name: 'Starter', xp: 1250 },
  { name: 'All-Star', xp: 2500 },
  { name: 'MVP', xp: 4000 },
  { name: 'Hall of Fame', xp: 6000 },
];

export interface BadgeDef {
  id: string;
  name: string;
  req: string;
  metric?: string;
  /** Threshold for a metric badge (compare with lowerIsBetter in mind). */
  value?: number;
  streak?: number;
  special?: 'prHunter' | 'coachPick';
}

export const BADGES: BadgeDef[] = [
  { id: 'ev50', name: '50 Club', req: 'Exit velo 50+', metric: 'teeEV', value: 50 },
  { id: 'ev55', name: '55 Club', req: 'Exit velo 55+', metric: 'teeEV', value: 55 },
  { id: 'bat45', name: 'Lightning Bat', req: 'Bat speed 45+', metric: 'batSpeed', value: 45 },
  { id: 'heat50', name: 'Heat Check', req: 'Pitch velo 50+', metric: 'pitchVelo', value: 50 },
  { id: 'strike14', name: 'Strike Machine', req: '14 of 20 strikes', metric: 'strikes', value: 14 },
  { id: 'jet', name: 'Jet', req: '30 yd under 5.30', metric: 'sprint30', value: 5.29 },
  { id: 'iron', name: 'Iron Legs', req: '2:00 wall sit', metric: 'wallSit', value: 120 },
  { id: 'push25', name: 'Push-Up Pro', req: '25 push-ups', metric: 'pushups', value: 25 },
  { id: 'vacuum', name: 'Vacuum', req: '10 of 10 grounders', metric: 'fielding', value: 10 },
  { id: 'streak7', name: 'Streak 7', req: '7 days in a row', streak: 7 },
  { id: 'streak30', name: 'Streak 30', req: '30 days in a row', streak: 30 },
  { id: 'streak60', name: 'Streak 60', req: '60 days in a row', streak: 60 },
  { id: 'prHunter', name: 'PR Hunter', req: '5 PRs in one test day', special: 'prHunter' },
  { id: 'coachPick', name: "Coach's Pick", req: 'Awarded by a coach', special: 'coachPick' },
];

export const FAMILY_REWARDS = [
  { xp: 1500, reward: 'Batting cage night' },
  { xp: 3000, reward: 'New batting gloves' },
  { xp: 5000, reward: 'Pro ballgame' },
  { xp: 8000, reward: 'Pick a new bat' },
  { xp: 11000, reward: 'Tryout-week celebration dinner' },
];

// --- Pitch Smart (ages 9–10) -------------------------------------------------------

export const PITCH_SMART = {
  dailyMax: 75,
  maxInnings12mo: 80,
  /** [maxPitches, restDays] */
  rest: [
    [20, 0],
    [35, 1],
    [50, 2],
    [65, 3],
    [75, 4],
  ] as [number, number][],
};

export function restDaysFor(pitches: number): number {
  for (const [max, days] of PITCH_SMART.rest) if (pitches <= max) return days;
  return 4;
}

// --- Equipment ----------------------------------------------------------------------------

export interface Gear {
  id: string;
  name: string;
  priority: 'Must' | 'Should' | 'Nice';
  cost: string;
  use: string;
  ownedByDefault?: boolean;
}

export const GEAR: Gear[] = [
  { id: 'blast', name: 'Blast Motion bat sensor', priority: 'Must', cost: 'Owned', use: 'Bat speed', ownedByDefault: true },
  { id: 'radar', name: 'Radar gun (Pocket Radar Smart Coach or similar)', priority: 'Must', cost: '$300–$400', use: 'Exit velo, pitching and throwing velo' },
  { id: 'tee', name: 'Heavy-duty batting tee', priority: 'Must', cost: '$40–$100', use: 'Daily tee work' },
  { id: 'net', name: 'Hitting net, 7×7 ft', priority: 'Must', cost: '$100–$200', use: 'Backyard hitting and throwing' },
  { id: 'balls', name: 'Baseballs, 3–4 dozen + bucket', priority: 'Must', cost: '$60–$100', use: 'Every drill' },
  { id: 'jbands', name: 'Arm-care bands (J-Bands youth), ×2', priority: 'Must', cost: '$30–$45 each', use: 'Daily arm care' },
  { id: 'loops', name: 'Mini loop + long resistance bands', priority: 'Must', cost: '$20–$40', use: 'Warm-ups and strength' },
  { id: 'medballs', name: 'Soft medicine balls, 4 lb and 6 lb', priority: 'Must', cost: '$30–$60 each', use: 'Rotational power' },
  { id: 'cones', name: 'Cones, 100-ft tape, stopwatch', priority: 'Must', cost: '$30–$50', use: 'Sprints and agility' },
  { id: 'target', name: 'Strike target / pitching net with zone', priority: 'Must', cost: '$50–$120', use: 'Strike %' },
  { id: 'overunder', name: 'Overload / underload trainer bats', priority: 'Should', cost: '$60–$150', use: 'Bat-speed training' },
  { id: 'ladder', name: 'Agility ladder', priority: 'Should', cost: '$15–$30', use: 'Footwork' },
  { id: 'pullup', name: 'Doorway pull-up bar', priority: 'Should', cost: '$25–$40', use: 'Hangs and rows' },
  { id: 'roller', name: 'Foam roller + mat', priority: 'Should', cost: '$25–$50', use: 'Recovery' },
  { id: 'rebounder', name: 'Pitchback / rebounder', priority: 'Should', cost: '$60–$150', use: 'Solo fielding and throwing' },
  { id: 'fungo', name: 'Fungo bat', priority: 'Should', cost: '$40–$80', use: 'Grounders and fly balls' },
  { id: 'wiffle', name: 'Wiffle / foam / sock balls', priority: 'Nice', cost: '$15–$30', use: 'Indoor and rainy days' },
  { id: 'mound', name: 'Portable pitching mound', priority: 'Nice', cost: '$150–$400', use: 'Home bullpens' },
  { id: 'machine', name: 'Pitching machine', priority: 'Nice', cost: '$300+', use: 'Velocity training' },
  { id: 'mount', name: 'Phone/tablet tripod mount', priority: 'Nice', cost: '$20–$30', use: 'Swing video' },
];

export const FLEX_RULES = [
  'A game or pick-up game replaces that day’s hitting and throwing slots — don’t add drills on top.',
  'Swap, don’t stack: a missed slot moves to another day this week, or it’s dropped.',
  'Never two strength + speed days back to back, and never the day before a re-test.',
  'Follow Pitch Smart rest. After 36+ pitches the next slot is bands + light catch only.',
  'Arm pain (not normal tiredness) = no throwing that day. Two days in a row = see a doctor.',
  'Dragging or not having fun? Turn the slot into a game or rest. Effort comes from fun.',
  'Keep organized baseball + training under about 10 hours a week, and keep another sport or free play in the mix.',
];
