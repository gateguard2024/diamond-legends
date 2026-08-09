import { CareerTotals, MetricId, Phase, Session } from './types';
import { BENCHMARK_BY_METRIC, Benchmark, gapToAAA, levelFor } from './benchmarks';
import { catchPctByDrill, chancesFor } from './fielding';
import { longestStrikeRun, strikePctByType } from './pitches';

// ---------------------------------------------------------------------------
// COACHING ENGINE
//
// Reads the last session against the rolling trend and the AAA benchmark, and
// prescribes what to work on next. Every rule carries a priority; the top few
// become "the plan" for the next workout.
//
// The logic is deliberately explicit rather than a black box — you're the
// coach, and you should be able to read exactly why it said what it said.
// ---------------------------------------------------------------------------

export type SuggestionTag = 'AAA GAP' | 'SLIPPING' | 'VOLUME' | 'SAFETY' | 'SHARPEN';

export interface Suggestion {
  id: string;
  phase: Phase;
  priority: number; // 0-100, higher is more urgent
  tag: SuggestionTag;
  headline: string;
  /** What in the data triggered this. */
  why: string;
  drill: string;
  prescription: string;
  /** One short thing to say to the kid mid-rep. */
  cue: string;
}

export interface CoachingInput {
  lastSession?: Session;
  current: Partial<Record<MetricId, number | null>>;
  previous: Partial<Record<MetricId, number | null>>;
  totals: CareerTotals;
  sessions: Session[];
}

const val = (input: CoachingInput, m: MetricId) => input.current[m] ?? null;
const delta = (input: CoachingInput, m: MetricId) => {
  const c = input.current[m];
  const p = input.previous[m];
  return c !== null && c !== undefined && p !== null && p !== undefined ? c - p : null;
};

const bm = (m: MetricId): Benchmark | undefined => BENCHMARK_BY_METRIC[m];

/** Scale a gap into a 0-40 priority bump — bigger gap, louder suggestion. */
function gapPriority(b: Benchmark, value: number | null): number {
  const gap = gapToAAA(b, value);
  if (gap <= 0) return 0;
  const span = Math.max(b.aaa - b.rec, 0.001);
  return Math.min(40, Math.round((gap / span) * 40));
}

// ---------------------------------------------------------------------------
// BATTING
// ---------------------------------------------------------------------------

function battingSuggestions(input: CoachingInput): Suggestion[] {
  const out: Suggestion[] = [];
  const h = input.lastSession?.hitting;

  const onPlane = val(input, 'onPlaneEfficiency');
  const batSpeed = val(input, 'batSpeed');
  const onPlaneB = bm('onPlaneEfficiency')!;
  const batSpeedB = bm('batSpeed')!;

  // --- On plane efficiency ---
  if (onPlane !== null && onPlane < onPlaneB.aaa) {
    out.push({
      id: 'bat-on-plane',
      phase: 'batting',
      priority: 55 + gapPriority(onPlaneB, onPlane),
      tag: 'AAA GAP',
      headline: 'Get the barrel on plane earlier',
      why: `On Plane is ${onPlane.toFixed(0)}% — AAA sits around ${onPlaneB.aaa}%. That's ${gapToAAA(onPlaneB, onPlane).toFixed(0)} points of hard contact left on the table.`,
      drill: 'High Tee / Low Tee Ladder',
      prescription: '3 rounds × 8 swings — alternate a tee at the top of the zone and at the knees',
      cue: '"Turn the barrel behind the ball, not down at it."',
    });
  }

  const onPlaneDrop = delta(input, 'onPlaneEfficiency');
  if (onPlaneDrop !== null && onPlaneDrop <= -4) {
    out.push({
      id: 'bat-on-plane-slip',
      phase: 'batting',
      priority: 62,
      tag: 'SLIPPING',
      headline: 'On Plane slipped since last block',
      why: `Down ${Math.abs(onPlaneDrop).toFixed(0)} points versus the previous 5-session window. Usually the front side flying open.`,
      drill: 'Walk-Through Tee',
      prescription: '2 rounds × 10 slow-motion swings, then 1 round × 8 at full speed',
      cue: '"Keep the back shoulder under the front shoulder."',
    });
  }

  // --- Bat speed ---
  if (batSpeed !== null && batSpeed < batSpeedB.aaa) {
    out.push({
      id: 'bat-speed',
      phase: 'batting',
      priority: 45 + gapPriority(batSpeedB, batSpeed),
      tag: 'AAA GAP',
      headline: 'Build bat speed with contrast swings',
      why: `Bat speed is ${batSpeed.toFixed(1)} mph, AAA is around ${batSpeedB.aaa}. Speed comes from the ground up, not the arms.`,
      drill: 'Overload / Underload Contrast',
      prescription: '3 × (5 heavy bat → 5 light bat → 5 game bat), full rest between rounds',
      cue: '"Push the ground away, then let the barrel go."',
    });
  }

  // --- Attack angle band ---
  if (h && h.attackAngle !== 0) {
    if (h.attackAngle < 4) {
      out.push({
        id: 'bat-attack-low',
        phase: 'batting',
        priority: 50,
        tag: 'SHARPEN',
        headline: 'Attack angle is too flat',
        why: `Last session averaged ${h.attackAngle.toFixed(1)}°. The productive band for this age is about +5° to +15°.`,
        drill: 'Back-Knee Tee (tee raised one ball height)',
        prescription: '3 rounds × 8 — driving line drives over an imaginary shortstop',
        cue: '"Swing slightly up through the ball."',
      });
    } else if (h.attackAngle > 17) {
      out.push({
        id: 'bat-attack-high',
        phase: 'batting',
        priority: 50,
        tag: 'SHARPEN',
        headline: 'Attack angle is getting uppercut-y',
        why: `Last session averaged ${h.attackAngle.toFixed(1)}°, above the +5° to +15° band. Leads to swings under the ball.`,
        drill: 'Line-Drive Net Window',
        prescription: '3 rounds × 8 — every ball must hit a chest-high window on the net',
        cue: '"Hit the top half of the baseball."',
      });
    }
  }

  // --- Time to contact ---
  if (h && h.timeToContact > 0.19) {
    out.push({
      id: 'bat-ttc',
      phase: 'batting',
      priority: 48,
      tag: 'SHARPEN',
      headline: 'Quicken the load-to-contact time',
      why: `Time to Contact was ${h.timeToContact.toFixed(2)}s. Under ~0.17s is where AAA arms stop beating you.`,
      drill: 'Short-Box Front Toss',
      prescription: '4 rounds × 6 from 12 feet, no stride — pure hands and turn',
      cue: '"Be on time early, not fast late."',
    });
  }

  // --- Volume ---
  const swings = h?.swings ?? 0;
  if (swings > 0 && swings < 30) {
    out.push({
      id: 'bat-volume',
      phase: 'batting',
      priority: 30,
      tag: 'VOLUME',
      headline: 'Add swing volume',
      why: `Only ${swings} tracked swings last session. Quality reps compound — 40 to 60 is the sweet spot at this age.`,
      drill: 'Structured BP Blocks',
      prescription: '4 blocks × 12 swings with 60 seconds rest between',
      cue: '"Every swing has a target."',
    });
  }

  if (!out.length) {
    out.push({
      id: 'bat-maintain',
      phase: 'batting',
      priority: 20,
      tag: 'SHARPEN',
      headline: 'Everything is at or above AAA — make it game-speed',
      why: 'Bat speed and on-plane numbers are clearing the AAA line. The next gain is doing it against real velocity.',
      drill: 'Random-Sequence Machine Work',
      prescription: '5 rounds × 6 — mix speeds and locations, no two pitches the same',
      cue: '"Same swing, different pitch."',
    });
  }

  return out;
}

// ---------------------------------------------------------------------------
// PITCHING
// ---------------------------------------------------------------------------

function pitchingSuggestions(input: CoachingInput): Suggestion[] {
  const out: Suggestion[] = [];
  const p = input.lastSession?.pitching;

  const strike = val(input, 'strikePct');
  const avgSpeed = val(input, 'avgSpeed');
  const strikeB = bm('strikePct')!;
  const speedB = bm('avgSpeed')!;

  // --- Safety first: pitch count guidance for 9-10 year olds ---
  if (p && p.totalPitches > 75) {
    out.push({
      id: 'pitch-count',
      phase: 'pitching',
      priority: 100,
      tag: 'SAFETY',
      headline: 'That was a high pitch count for this age',
      why: `${p.totalPitches} pitches in one outing. MLB Pitch Smart caps ages 9-10 at 75 per day, with 3-4 full rest days after 50+.`,
      drill: 'Rest, then flat-ground command work',
      prescription: 'No throwing off a mound for 3 days. Follow your league rules and Pitch Smart.',
      cue: '"Arms are on a budget. Spend them wisely."',
    });
  }

  // --- Strike percentage ---
  if (strike !== null && strike < strikeB.aaa) {
    out.push({
      id: 'pitch-strikes',
      phase: 'pitching',
      priority: 70 + gapPriority(strikeB, strike),
      tag: 'AAA GAP',
      headline: 'Strike percentage is the fastest path to AAA',
      why: `Sitting at ${strike.toFixed(0)}%, AAA is about ${strikeB.aaa}%. Coaches pick the kid who throws strikes over the kid who throws hard.`,
      drill: '3-Pitch Ladder to a Target',
      prescription: '5 sets — must throw 3 straight strikes to a folded towel before the set counts',
      cue: '"Finish over the front knee, chest to the glove."',
    });
  }

  const strikeDrop = delta(input, 'strikePct');
  if (strikeDrop !== null && strikeDrop <= -5) {
    out.push({
      id: 'pitch-strikes-slip',
      phase: 'pitching',
      priority: 65,
      tag: 'SLIPPING',
      headline: 'Command slipped — go back to flat ground',
      why: `Strike rate is down ${Math.abs(strikeDrop).toFixed(0)} points versus the previous window. Almost always a repeatability problem, not an arm problem.`,
      drill: 'Flat-Ground Towel Drill',
      prescription: '3 sets × 10 dry reps, then 15 flat-ground throws at 70% effort',
      cue: '"Same finish every single time."',
    });
  }

  // --- Repeatability, from the pitch log ---
  if (p?.pitchLog && p.pitchLog.length >= 15) {
    const run = longestStrikeRun(p.pitchLog);
    if (run < 4) {
      out.push({
        id: 'pitch-repeat',
        phase: 'pitching',
        priority: 55,
        tag: 'SHARPEN',
        headline: 'Strikes are coming in ones and twos',
        why: `Longest run of consecutive strikes was ${run}. Stringing 4+ together is what lets him work ahead in counts.`,
        drill: 'Consecutive-Strike Game',
        prescription: 'Throw until he hits 5 strikes in a row. Miss = back to zero. Cap at 30 pitches.',
        cue: '"Repeat it. Don\'t re-invent it."',
      });
    }

    // Per-pitch-type command
    for (const t of strikePctByType(p.pitchLog)) {
      if (t.thrown >= 8 && t.strikePct < 45 && t.type !== 'FB') {
        out.push({
          id: `pitch-type-${t.type}`,
          phase: 'pitching',
          priority: 45,
          tag: 'SHARPEN',
          headline: `The ${t.type} isn't a strike yet`,
          why: `Only ${t.strikePct}% strikes on ${t.thrown} of them. An off-speed pitch he can't land is a free ball for the hitter.`,
          drill: 'Same-Arm-Speed Catch Play',
          prescription: '20 throws at 45 feet — every one thrown with fastball arm speed',
          cue: '"Same arm, softer grip."',
        });
      }
    }
  }

  // --- Velocity ---
  if (avgSpeed !== null && avgSpeed < speedB.aaa) {
    out.push({
      id: 'pitch-velo',
      phase: 'pitching',
      priority: 40 + gapPriority(speedB, avgSpeed),
      tag: 'AAA GAP',
      headline: 'Build velo through long toss, not max-effort mound work',
      why: `Average velo is ${avgSpeed.toFixed(1)} mph versus an AAA line near ${speedB.aaa}. At 9-10 the gains come from arm health and mechanics.`,
      drill: 'Long Toss Progression',
      prescription: '2× per week — stretch out to comfortable max distance, then 10 pull-downs coming in',
      cue: '"Throw through the target, not at it."',
    });
  }

  if (!out.length) {
    out.push({
      id: 'pitch-maintain',
      phase: 'pitching',
      priority: 20,
      tag: 'SHARPEN',
      headline: 'Command and velo are AAA-ready — pitch to spots',
      why: 'Both numbers clear the AAA line. The next level is locating on purpose instead of just filling the zone.',
      drill: 'Quadrant Bullpen',
      prescription: '4 corners × 5 pitches — call the spot out loud before each pitch',
      cue: '"Name it, then throw it."',
    });
  }

  return out;
}

// ---------------------------------------------------------------------------
// FIELDING
// ---------------------------------------------------------------------------

function fieldingSuggestions(input: CoachingInput): Suggestion[] {
  const out: Suggestion[] = [];
  const f = input.lastSession?.fielding;

  const catchPct = val(input, 'cleanPct');
  const throwAcc = val(input, 'throwAccuracy');
  const catchB = bm('cleanPct')!;
  const throwB = bm('throwAccuracy')!;

  // --- Catch rate ---
  if (catchPct !== null && catchPct < catchB.aaa) {
    out.push({
      id: 'field-catch',
      phase: 'fielding',
      priority: 60 + gapPriority(catchB, catchPct),
      tag: 'AAA GAP',
      headline: 'Clean up the catch rate before adding difficulty',
      why: `Catching ${catchPct.toFixed(0)}% of chances, AAA is around ${catchB.aaa}%. At AAA the ball gets to you faster, so the floor has to be higher.`,
      drill: 'Short-Hop Glove Work (no throw)',
      prescription: '4 rounds × 15 short hops from 15 feet — glove only, work the funnel',
      cue: '"Give with the ball, don\'t stab at it."',
    });
  }

  // --- Weakest drill, straight from the rep log ---
  if (f?.repLog?.length) {
    const byDrill = catchPctByDrill(f).filter((d) => d.thrown >= 5);
    const worst = [...byDrill].sort((a, b) => a.pct - b.pct)[0];
    if (worst && worst.pct < 80) {
      out.push({
        id: `field-drill-${worst.drill}`,
        phase: 'fielding',
        priority: 58,
        tag: 'SHARPEN',
        headline: `${worst.label} is the leak`,
        why: `${worst.caught} of ${worst.thrown} clean (${worst.pct}%) — the lowest of any drill last session.`,
        drill: `Isolated ${worst.label}`,
        prescription: '3 rounds × 10 at half speed, then 2 rounds × 10 at game speed',
        cue: '"Slow feet make fast hands look bad. Get there early."',
      });
    }
  }

  // --- Throwing accuracy ---
  if (throwAcc !== null && throwAcc < throwB.aaa) {
    out.push({
      id: 'field-throw',
      phase: 'fielding',
      priority: 62 + gapPriority(throwB, throwAcc),
      tag: 'AAA GAP',
      headline: 'Throwing accuracy is the difference-maker at AAA',
      why: `${throwAcc.toFixed(0)}% on target versus an AAA line near ${throwB.aaa}%. A clean pick and a bad throw is still an error.`,
      drill: 'Field-and-Throw to a Target Net',
      prescription: '4 rounds × 10 — chest-high target, must hit it to count the rep',
      cue: '"Feet to the target before the hands."',
    });
  }

  const throwDrop = delta(input, 'throwAccuracy');
  if (throwDrop !== null && throwDrop <= -6) {
    out.push({
      id: 'field-throw-slip',
      phase: 'fielding',
      priority: 56,
      tag: 'SLIPPING',
      headline: 'Throws are getting wild',
      why: `Accuracy down ${Math.abs(throwDrop).toFixed(0)} points versus the previous window — usually rushing the feet.`,
      drill: 'Walking Throws',
      prescription: '20 throws at 60 feet, shuffle-step every time, no jump throws',
      cue: '"Late hands, early feet."',
    });
  }

  // --- Throw volume ---
  if (f && chancesFor(f) > 0 && (f.throwsMade ?? 0) < chancesFor(f) * 0.5) {
    out.push({
      id: 'field-throw-volume',
      phase: 'fielding',
      priority: 35,
      tag: 'VOLUME',
      headline: 'Finish more reps with a throw',
      why: `${f.throwsMade ?? 0} throws on ${chancesFor(f)} chances. Fielding a ball and not throwing it trains half the play.`,
      drill: 'Full-Play Reps',
      prescription: 'Every ground ball finishes with a throw to a base for the rest of the session',
      cue: '"The play isn\'t over until it\'s caught at the bag."',
    });
  }

  if (!out.length) {
    out.push({
      id: 'field-maintain',
      phase: 'fielding',
      priority: 20,
      tag: 'SHARPEN',
      headline: 'Glove and arm are AAA-ready — add chaos',
      why: 'Catch rate and throw accuracy both clear the AAA line in controlled reps. Now make the reps uncomfortable.',
      drill: 'Reaction Randoms',
      prescription: '5 rounds × 8 — no idea which direction, called live off the bat',
      cue: '"First step wins the play."',
    });
  }

  return out;
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

const BUILDERS: Record<Phase, (i: CoachingInput) => Suggestion[]> = {
  batting: battingSuggestions,
  pitching: pitchingSuggestions,
  fielding: fieldingSuggestions,
};

/** Top suggestions for a phase, most urgent first. */
export function coachFor(phase: Phase, input: CoachingInput, limit = 3): Suggestion[] {
  if (!input.sessions.length) return [];
  return BUILDERS[phase](input)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

/** Has this player logged anything in this phase yet? */
export function hasPhaseData(phase: Phase, sessions: Session[]): boolean {
  return sessions.some((s) =>
    phase === 'batting' ? s.hitting : phase === 'pitching' ? s.pitching : s.fielding,
  );
}

export function levelBadgeFor(metric: MetricId, value: number | null) {
  const b = bm(metric);
  if (!b) return null;
  return { benchmark: b, level: levelFor(b, value) };
}
