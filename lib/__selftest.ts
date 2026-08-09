/**
 * Quick sanity checks for the XP, rolling-average, and goal logic.
 * Not part of the app bundle — run with:
 *   npx tsc lib/__selftest.ts --outDir /tmp/dltest --module commonjs \
 *     --target es2020 --esModuleInterop --skipLibCheck && node /tmp/dltest/lib/__selftest.js
 */
import { Session, Swing } from './types';
import { averageMetric, bestMetric, emptySwing, hittingFromSwings, isSwingFilled } from './swings';
import { applyProfiles, displayName } from './players';
import { computeTotals, detectPersonalBests, levelFromXP, xpForSession } from './gamification';
import {
  METRIC_BY_ID,
  currentValue,
  goalProgress,
  initialTarget,
  suggestNextTarget,
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

// Suggestions ladder upward and respect the cap
check('next target = current + increment', suggestNextTarget(avgSpeed, hist, 42), 45);
check('next target uses cleared target when higher', suggestNextTarget(avgSpeed, hist, 60), 62);
check('next target respects cap', suggestNextTarget(avgSpeed, hist, 999), avgSpeed.cap);
check('initial target with no data', initialTarget(avgSpeed, []), avgSpeed.defaultTarget);

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

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
if (failures > 0 && typeof process !== 'undefined') process.exitCode = 1;
