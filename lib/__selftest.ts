/**
 * Quick sanity checks for the XP, rolling-average, and goal logic.
 * Not part of the app bundle — run with:
 *   npx tsc lib/__selftest.ts --outDir /tmp/dltest --module commonjs \
 *     --target es2020 --esModuleInterop --skipLibCheck && node /tmp/dltest/lib/__selftest.js
 */
import { FieldingRep, Pitch, PitchType, Session, Swing } from './types';
import {
  averageSpeed,
  longestStrikeRun,
  pitchingFromLog,
  strikePct as pitchStrikePct,
  strikePctByType,
  topSpeed as pitchTopSpeed,
} from './pitches';
import { chancesFor, fieldingFromReps } from './fielding';
import { aaaProgress, aaaReadiness, gapToAAA, levelFor, BENCHMARK_BY_METRIC } from './benchmarks';
import { coachFor } from './coaching';
import { averageMetric, bestMetric, emptySwing, hittingFromSwings, isSwingFilled } from './swings';
import { applyProfiles, displayName } from './players';
import {
  computeTotals,
  detectPersonalBests,
  emptyTotals,
  levelFromXP,
  xpForSession,
} from './gamification';
import {
  METRIC_BY_ID,
  currentValue,
  goalProgress,
  initialTarget,
  suggestNextTarget,
  targetFromBase,
} from './goals';

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  got ${JSON.stringify(actual)} want ${JSON.stringify(expected)}`}`);
}

const mk = (date: string, strikes: number, pitches: number, avg: number, top: number): Session => ({
  id: date,
  playerId: 'carl',
  date,
  pitching: { totalPitches: pitches, strikes, avgSpeed: avg, topSpeed: top },
  xpEarned: 0,
});

const pitch = (id: string, speed: number, strike: boolean, type: PitchType = 'FB'): Pitch => ({
  id,
  speed,
  strike,
  type,
});

// Six sessions, strike% = 50,60,70,80,90,40
const hist: Session[] = [
  mk('2026-08-01', 50, 100, 40, 44),
  mk('2026-08-02', 60, 100, 41, 45),
  mk('2026-08-03', 70, 100, 42, 46),
  mk('2026-08-04', 80, 100, 43, 47),
  mk('2026-08-05', 90, 100, 44, 48),
  mk('2026-08-06', 40, 100, 45, 49),
];

const strike = METRIC_BY_ID.strikePct;
const avgSpeed = METRIC_BY_ID.avgSpeed;
const topSpeed = METRIC_BY_ID.topSpeed;

// Rolling window is the LAST 5: 60,70,80,90,40 -> 68
check('rolling strike% uses last 5', currentValue(strike, hist), 68);
// avg velo last 5: 41,42,43,44,45 -> 43
check('rolling avg velo', currentValue(avgSpeed, hist), 43);
// top velo aggregates as max over the window
check('top velo takes max of window', currentValue(topSpeed, hist), 49);
// single session
check('single session average', currentValue(avgSpeed, [hist[0]]), 40);
// no data
check('no data returns null', currentValue(strike, []), null);

// Career totals
const totals = computeTotals(hist);
check('career pitches', totals.pitches, 600);
check('career strike %', totals.strikePct, 65);
check('best avg velo', totals.bestAvgSpeed, 45);
check('best top velo', totals.bestTopSpeed, 49);

// Goal progress: start 40, target 50, current 43 -> 30%
const goal = {
  id: 'g1',
  playerId: 'carl' as const,
  metric: 'avgSpeed' as const,
  target: 50,
  startValue: 40,
  createdAt: '',
  achievedAt: null,
};
const gp = goalProgress(avgSpeed, goal, hist);
check('goal progress fraction', Math.round(gp.progress * 100), 30);
check('goal not yet achieved', gp.achieved, false);
check('remaining to goal', gp.remaining, 7);

// Achieved when current >= target
const hit = goalProgress(avgSpeed, { ...goal, target: 42 }, hist);
check('goal achieved when current >= target', hit.achieved, true);

// Goals are a 10% gain on the current rolling average
check('initial target is +10% of current avg', initialTarget(avgSpeed, hist), 47.3); // 43 * 1.1
check('strike% target rounds to whole', initialTarget(strike, hist), 75); // 68 * 1.1 = 74.8
check('next target uses cleared target when higher', suggestNextTarget(avgSpeed, hist, 60), 66);
check('next target uses current avg when higher', suggestNextTarget(avgSpeed, hist, 10), 47.3);
check('next target respects cap', suggestNextTarget(avgSpeed, hist, 999), avgSpeed.cap);
check('initial target with no data', initialTarget(avgSpeed, []), avgSpeed.defaultTarget);
// A tiny base must still produce a strictly harder goal after rounding
check('rounding never produces a flat goal', targetFromBase(strike, 1) > 1, true);
check('cap is never exceeded', targetFromBase(strike, 84), strike.cap);

// Personal bests
const better = mk('2026-08-07', 70, 100, 50, 55);
const pbs = detectPersonalBests(better, hist);
check('detects both velo PRs', pbs.map((p) => p.metric).sort(), ['avgSpeed', 'topSpeed']);
check('no PRs on very first session', detectPersonalBests(better, []).length, 0);
const worse = mk('2026-08-07', 70, 100, 30, 35);
check('no PR when slower', detectPersonalBests(worse, hist).length, 0);

// XP: 20 base + 100 pitches + 2*70 strikes + 25 command + 50 top PR + 50 avg PR = 385
check('xp for a PR session', xpForSession(better, computeTotals(hist)), 385);

// Levels: L1 costs 100, L2 costs 140, L3 costs 180
check('level 1 at 0 xp', levelFromXP(0).level, 1);
check('level 2 at 100 xp', levelFromXP(100).level, 2);
check('level 3 at 240 xp', levelFromXP(240).level, 3);
check('xp remainder', levelFromXP(250).currentXP, 10);

// ---------------------------------------------------------------------------
// Swing-by-swing logging
// ---------------------------------------------------------------------------

const swing = (batSpeed: number, onPlane = 0, vba = 0): Swing => ({
  ...emptySwing(`sw${batSpeed}-${onPlane}-${vba}`),
  batSpeed,
  onPlaneEfficiency: onPlane,
  verticalBatAngle: vba,
});

const log: Swing[] = [swing(40, 70), swing(44, 0), swing(48, 80), emptySwing('blank')];

check('blank swings are not counted', log.filter(isSwingFilled).length, 3);
check('averages skip the blank swing', averageMetric(log.filter(isSwingFilled), 'batSpeed'), 44);
// on-plane recorded on only 2 of 3 swings -> average of those 2, not divided by 3
check('metric average ignores unrecorded values', averageMetric(log.filter(isSwingFilled), 'onPlaneEfficiency'), 75);
check('best single swing', bestMetric(log.filter(isSwingFilled), 'batSpeed'), 48);

const derived = hittingFromSwings(log);
check('swing count from log', derived.swings, 3);
check('session bat speed average', derived.batSpeed, 44);
check('hardest swing recorded', derived.bestSwingBatSpeed, 48);
check('unrecorded metric averages to 0', derived.power, 0);
check('swing log is stored without blanks', derived.swingLog?.length, 3);

// Negative values (vertical bat angle) survive averaging
const vbaLog = [swing(40, 0, -30), swing(42, 0, -34)];
check('negative angles average correctly', averageMetric(vbaLog, 'verticalBatAngle'), -32);

// Hardest swing is a PR independent of the session average
const swingSession: Session = {
  id: 'sw1',
  playerId: 'carl',
  date: '2026-08-08',
  hitting: hittingFromSwings([swing(30), swing(60)]),
  xpEarned: 0,
};
const priorHit: Session = {
  id: 'sw0',
  playerId: 'carl',
  date: '2026-08-07',
  hitting: hittingFromSwings([swing(50), swing(50)]),
  xpEarned: 0,
};
const swingPBs = detectPersonalBests(swingSession, [priorHit]).map((p) => p.metric);
check('hardest swing is its own PR', swingPBs.includes('bestSwing'), true);
check('session average is not a PR when it dropped', swingPBs.includes('batSpeed'), false);

// ---------------------------------------------------------------------------
// Player identity
// ---------------------------------------------------------------------------

const edited = applyProfiles([{ playerId: 'austin', number: 22, slogan: 'The Hammer' }]);
check('profile overrides number', edited.austin.number, 22);
check('profile overrides slogan', edited.austin.slogan, 'The Hammer');
check('display name uses slogan', displayName(edited.austin), "AUSTIN 'THE HAMMER'");
check('untouched player keeps defaults', edited.carl.number, 7);
check('empty slogan falls back to plain name', displayName({ ...edited.carl, slogan: '' }), 'CARL');

// ---------------------------------------------------------------------------
// Pitch-by-pitch logging
// ---------------------------------------------------------------------------

const pitchLog: Pitch[] = [
  pitch('p1', 42, true),
  pitch('p2', 44, true),
  pitch('p3', 0, false), // not gunned, still counts as a ball
  pitch('p4', 46, true),
  pitch('p5', 40, false, 'CH'),
  pitch('p6', 0, false, 'CH'),
];

check('pitch count includes ungunned pitches', pitchingFromLog(pitchLog).totalPitches, 6);
check('strike count', pitchingFromLog(pitchLog).strikes, 3);
check('strike pct', pitchStrikePct(pitchLog), 50);
check('avg velo skips ungunned pitches', averageSpeed(pitchLog), 43); // (42+44+46+40)/4
check('top velo', pitchTopSpeed(pitchLog), 46);
check('longest strike run', longestStrikeRun(pitchLog), 2);
check('longest run with no strikes', longestStrikeRun([pitch('x', 40, false)]), 0);

const byType = strikePctByType(pitchLog);
check('splits by pitch type', byType.length, 2);
check('changeup strike rate', byType.find((t) => t.type === 'CH')?.strikePct, 0);

// ---------------------------------------------------------------------------
// Fielding rep logging
// ---------------------------------------------------------------------------

const repLog: FieldingRep[] = [
  { id: 'r1', drill: 'frontGrounders', thrown: 20, caught: 18, throwsMade: 18, throwsAccurate: 15 },
  { id: 'r2', drill: 'backhand', thrown: 10, caught: 6, throwsMade: 6, throwsAccurate: 4 },
  { id: 'r3', drill: 'popFlies', thrown: 0, caught: 0, throwsMade: 0, throwsAccurate: 0 }, // blank
];

const fielding = fieldingFromReps(repLog);
check('blank drill lines are dropped', fielding.repLog?.length, 2);
check('total chances', fielding.chances, 30);
check('total caught', fielding.cleanReps, 24);
check('per-drill counts roll up', fielding.frontGrounders, 20);
check('throws made', fielding.throwsMade, 24);
check('throws accurate', fielding.throwsAccurate, 19);
check('chancesFor reads the new field', chancesFor(fielding), 30);

// Caught can never exceed chances even if mis-entered
const overCaught = fieldingFromReps([
  { id: 'r4', drill: 'gloveSide', thrown: 5, caught: 99, throwsMade: 5, throwsAccurate: 99 },
]);
check('caught is capped at chances', overCaught.cleanReps, 5);
check('accurate throws capped at throws made', overCaught.throwsAccurate, 5);

// Legacy sessions without `chances` still resolve
check(
  'legacy fielding falls back to drill totals',
  chancesFor({
    popFlies: 5,
    frontGrounders: 10,
    backhand: 0,
    gloveSide: 0,
    gloveSideTurns: 0,
    backhandTurns: 0,
    cleanReps: 12,
    chances: 0,
    throwsMade: 0,
    throwsAccurate: 0,
  }),
  15,
);

// Career totals pick up the new fielding fields
const fieldSession: Session = {
  id: 'f1',
  playerId: 'carl',
  date: '2026-08-09',
  fielding,
  xpEarned: 0,
};
const fieldTotals = computeTotals([fieldSession]);
check('career catch %', fieldTotals.catchPct, 80); // 24/30
check('career throw accuracy', fieldTotals.throwAccuracy, 79); // 19/24

// ---------------------------------------------------------------------------
// AAA benchmarks
// ---------------------------------------------------------------------------

const catchB = BENCHMARK_BY_METRIC.cleanPct!;
check('level below rec is null', levelFor(catchB, 50), null);
check('level at rec', levelFor(catchB, 72), 'rec');
check('level at aa', levelFor(catchB, 82), 'aa');
check('level at aaa', levelFor(catchB, 89), 'aaa');
check('level at elite', levelFor(catchB, 95), 'elite');
check('gap to aaa', gapToAAA(catchB, 80), 8);
check('gap is zero once cleared', gapToAAA(catchB, 90), 0);
check('progress caps at 1', aaaProgress(catchB, 95), 1);
check('progress is zero at the floor', aaaProgress(catchB, 10), 0);

const readiness = aaaReadiness({ cleanPct: 88, throwAccuracy: 85, batSpeed: null });
check('readiness ignores metrics with no data', readiness.tracked, 2);
check('readiness at aaa scores 100', readiness.score, 100);
check('readiness counts cleared metrics', readiness.atOrAboveAAA, 2);
check('empty readiness is zero', aaaReadiness({}).score, 0);

// ---------------------------------------------------------------------------
// Coaching engine
// ---------------------------------------------------------------------------

const coachInput = {
  lastSession: fieldSession,
  current: { cleanPct: 80, throwAccuracy: 79 },
  previous: { cleanPct: 84, throwAccuracy: 79 },
  totals: fieldTotals,
  sessions: [fieldSession],
};

const fieldingTips = coachFor('fielding', coachInput);
check('coaching returns suggestions', fieldingTips.length > 0, true);
check('suggestions are sorted by priority', fieldingTips[0].priority >= fieldingTips[fieldingTips.length - 1].priority, true);
check('flags the below-AAA catch rate', fieldingTips.some((t) => t.id === 'field-catch'), true);
check('flags the weakest drill', fieldingTips.some((t) => t.id.startsWith('field-drill-')), true);
check('no coaching without sessions', coachFor('fielding', { ...coachInput, sessions: [] }).length, 0);

// A high pitch count outranks everything else
const highCount: Session = {
  id: 'hp',
  playerId: 'carl',
  date: '2026-08-09',
  pitching: pitchingFromLog(Array.from({ length: 90 }, (_, i) => pitch(`h${i}`, 42, i % 2 === 0))),
  xpEarned: 0,
};
const pitchTips = coachFor('pitching', {
  lastSession: highCount,
  current: { strikePct: 50, avgSpeed: 42 },
  previous: {},
  totals: computeTotals([highCount]),
  sessions: [highCount],
});
check('pitch-count safety warning is top priority', pitchTips[0].id, 'pitch-count');
check('safety suggestion is tagged SAFETY', pitchTips[0].tag, 'SAFETY');

// Everything at elite level should produce maintenance advice, not alarms
const eliteTips = coachFor('batting', {
  lastSession: undefined,
  current: { batSpeed: 55, onPlaneEfficiency: 85 },
  previous: { batSpeed: 55, onPlaneEfficiency: 85 },
  totals: emptyTotals(),
  sessions: [fieldSession],
});
check('elite numbers get maintenance advice', eliteTips[0].id, 'bat-maintain');

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
if (failures > 0 && typeof process !== 'undefined') process.exitCode = 1;
