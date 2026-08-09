# Diamond Legends ⚾

Workout tracker and gamified player cards for **Carl (9U, #7)** and **Austin (10U, #3)**.

Log batting, pitching, and fielding **line by line** — every swing, every pitch, every drill. The
app derives the averages, tracks **Current Avg → Goal**, scores both boys against **AAA
benchmarks**, and generates a prioritized **Coach's Plan** for the next workout.

---

## Quick start

```bash
npm install
cp .env.local.example .env.local   # optional — see Supabase below
npm run dev
```

Open http://localhost:3000. Without Supabase env vars the app runs in **local-only mode**
(browser storage), so you can try it immediately.

---

## Supabase setup (10 minutes)

Do this once so Carl's iPad, Austin's phone, and your laptop all see the same data.

### 1. Create the project

1. Go to https://supabase.com and sign in with GitHub.
2. **New project**. Name it `diamond-legends`, pick a region near you, and let it generate a
   database password (save it in your password manager — you won't need it for this app).
3. Wait ~2 minutes for provisioning.

### 2. Create the tables

1. In the left sidebar: **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this repo, copy the whole file, paste it in.
3. Click **Run**. You should see "Success. No rows returned."
4. Check **Table Editor** — you should now have `sessions`, `goals`, and `player_profiles`.

> **Already ran an earlier version of this file?** Just run the whole thing again. Every statement
> is `create table if not exists` / `drop policy if exists`, so re-running is safe and adds the
> `player_profiles` table without touching your data.

### 3. Grab your keys

**Project Settings** (gear icon) → **API**. Copy two values:

| Supabase label | Goes in |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| Project API keys → `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

Put them in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Restart `npm run dev`. The header badge under the title should flip from **LOCAL ONLY** to
**SYNCED**.

### 4. Add the same two variables to Vercel

Vercel project → **Settings** → **Environment Variables** → add both, checked for
Production, Preview, and Development → **Save** → **Deployments** → **Redeploy**.

Environment variables are *not* picked up by existing deployments; you have to redeploy.

### 5. Move any local data up to Supabase

If you already logged sessions in local-only mode: open the app **before** adding the env vars,
click **Backup** to download the JSON, then add the env vars, redeploy, and click **Restore** and
pick that file. It uploads into Supabase.

> **Security note.** There's no login — the anon key can read and write both tables. That's the
> right trade-off for a private family app, but don't post the key publicly. To lock it down later,
> turn on Supabase Auth and change the RLS policies in `schema.sql` from `true` to
> `auth.uid() is not null`.

---

## Deploy to Vercel

```bash
git add .
git commit -m "Goals, progress tracking, Supabase"
git push
```

First time only: vercel.com/new → **Import Git Repository** → pick the repo → accept the Next.js
defaults → add the two env vars from step 4 → **Deploy**.

After that every push to `main` redeploys automatically. On the boys' devices, open the
`.vercel.app` URL → Share → **Add to Home Screen**.

---

## How goals work

### The eight tracked metrics

| Metric | Phase | How it's measured |
|---|---|---|
| Strike % | Pitching | strikes ÷ pitches, averaged |
| Avg Velo | Pitching | session average speed, averaged |
| Top Velo | Pitching | **best** in the window, not averaged |
| Bat Speed | Hitting | Blast session average, averaged |
| On Plane Efficiency | Hitting | Blast session average, averaged |
| Catch % | Fielding | balls handled cleanly ÷ chances, averaged |
| Throw Accuracy | Fielding | on-target throws ÷ throws made, averaged |
| Workouts/Week | Habit | distinct days trained per week |

### Current Avg

A rolling average of the **last 5 sessions** that contain that metric. Responsive enough that a
good week visibly moves the number, stable enough that one rough day doesn't tank it. The card
shows `3 of 5` etc. until there's a full window, plus a green/red delta arrow versus the previous
window.

### The goal ladder

Goals maintain themselves — you never have to seed them.

1. **Auto-created from real data.** On every load, any metric that has data but no active goal gets
   one, set at **10% above the current rolling average**. Log a first pitching session and the
   pitching goals appear already scaled to what he's actually throwing. Metrics with no data yet
   are skipped, so nobody stares at a bat speed goal before taking a swing.
2. **Progress is measured as improvement.** The bar fills from the average *when the goal was set*
   to the target — not from zero — so it shows how much better they've gotten.
3. **Clearing a goal raises the bar.** When Current Avg reaches the target, the goal is banked and
   the celebration modal proposes the next one at **+10%** over whichever is higher: the average
   they just posted, or the target they just beat. Accept it or type your own, then **LOCK IT IN**.
   Skip it and the next load recreates it automatically.
4. **Cleared goals stay** on the card as a trophy strip.

Each metric has a ceiling so suggestions stay age-appropriate:

| Metric | Ceiling | Starting target with no data |
|---|---|---|
| Strike % | 85% | 55% |
| Avg Velo | 75 mph | 40 mph |
| Top Velo | 80 mph | 45 mph |
| Bat Speed | 75 mph | 45 mph |
| On Plane Efficiency | 90% | 65% |
| Catch % | 98% | 80% |
| Throw Accuracy | 98% | 75% |
| Workouts/Week | 6 | 3 |

Change the 10% in one place — `GOAL_GAIN_PCT` in `lib/goals.ts`.

You can override any goal at any time — tap the target number on the card.

### Bests and milestones — pulled automatically

Nothing here is entered by hand. Every number is derived from the session log:

- **BEST EVER** on each goal card is that metric's best single session, all-time.
- **Badges** are skill achievements (🎯 Strike Zone Sniper, ⚡ Bat Speed Demon, 🚀 Pure Heat…) and
  live at the bottom of the player card under **BADGES & MILESTONES**. They're defined in `BADGES`
  in `lib/gamification.ts`.
- **Milestones** are career-volume achievements (250 Pitches, 500 Rep Club, 1,000 Swings…) in the
  same section, defined in `MILESTONES` in `lib/gamification.ts`.
- Locked awards show a live progress bar, and the section header calls out **Next up** — whichever
  locked award is closest to unlocking.

### Personal bests

Every save is compared against that player's full history. Beating a previous best in avg velo,
top velo, bat speed, hand speed, On Plane Efficiency, or Blast Factor fires a **NEW BEST** row in
the celebration modal (old value struck through, new value highlighted) and pays a **+50 XP**
bonus.

---

## XP and levels

| Action | XP |
|---|---|
| Logging any session | +20 |
| Each pitch thrown | +1 |
| Each strike | +2 |
| 60%+ strikes on 20+ pitches | +25 |
| New top velo PR | +50 |
| New average velo PR | +50 |
| Each fielding chance | +2 |
| Each ball fielded cleanly | +1 |
| Each throw on target | +2 |
| 50+ chances in a session | +25 |
| 90%+ catch rate on 20+ chances | +25 |
| 85%+ throw accuracy on 20+ throws | +25 |
| Each Blast-tracked swing | +1 |
| 70%+ On Plane Efficiency | +25 |
| New bat speed PR | +50 |
| All three phases in one session | +50 |

**Levels:** level *n* costs `100 + (n-1) × 40` XP.
**Tiers:** Rookie (1–9) → Pro (10–24) → All-Star (25–39) → Hall of Famer (40+).

**Badges:** 🎯 Strike Zone Sniper · ⚡ Bat Speed Demon · 📐 On-Plane Machine · 🧤 The Vacuum ·
🔥 Flamethrower · 🚀 Pure Heat · 🥇 Gold Glove · 💪 The Cannon · 🏗️ Iron Worker

**Milestones:** First Workout · 250 Pitches · 250 Strikes · 500 Rep Club · 1,000 Swings ·
500 Throws · Blast Factor 75

There's a **How Points Work** button in the header that opens a kid-friendly breakdown of every
rule above, the level curve, and a fully worked example. Built to hand to Carl and Austin.

Locked awards show a live progress bar so the boys can see how close they are.

---

## The AAA path

Both boys are chasing AAA, so the app scores every metric against a level ladder —
**Rec → AA → AAA → Elite** — and shows a single **AAA Readiness** percentage on each card plus a
per-metric breakdown, furthest-from-AAA first.

| Metric | Rec | AA | **AAA** | Elite |
|---|---|---|---|---|
| Average Velo | 38 | 42 | **46** | 50 mph |
| Top Velo | 42 | 46 | **50** | 54 mph |
| Strike % | 45 | 52 | **60** | 67% |
| Bat Speed | 38 | 43 | **48** | 53 mph |
| On Plane Efficiency | 55 | 63 | **72** | 80% |
| Catch % | 70 | 80 | **88** | 94% |
| Throw Accuracy | 65 | 75 | **85** | 92% |
| Workouts / Week | 1 | 2 | **3** | 4.5 |

> **Read this before you quote these numbers to anyone.** No governing body publishes "AAA requires
> X mph." These are coaching rules of thumb for 9-10 year olds on a 46-foot mound, assembled from
> travel-ball tryout norms and Blast Motion's published youth ranges. They exist to give the boys a
> concrete number to chase. If your league's AAA runs hotter or cooler, edit the `aaa` column in
> `lib/benchmarks.ts` and the entire app re-scores itself.

---

## Coach's Plan

Each tab opens with **COACH'S PLAN** — up to three prioritized things to work on next, generated
from the last session read against the rolling trend and the AAA line. Every suggestion carries:

- **Why** — the actual numbers that triggered it
- **Drill** — a named drill
- **Do** — sets and reps
- **Say** — one short cue for mid-rep

Suggestions are tagged so you can see at a glance what kind of problem it is:

| Tag | Means |
|---|---|
| **SAFETY** | Always ranks first. Pitch counts over the Pitch Smart limit for ages 9-10. |
| **AAA GAP** | Below the AAA line — the bigger the gap, the higher it ranks. |
| **SLIPPING** | Dropped meaningfully versus the previous 5-session window. |
| **SHARPEN** | Mechanical detail — attack angle out of band, off-speed not landing, weakest drill. |
| **VOLUME** | Enough quality, not enough reps. |

The logic is a readable rules engine in `lib/coaching.ts`, not a black box — you're the coach, and
you should be able to see exactly why it said what it said. No API key, no network call, works at
the field with no signal.

**On pitch counts:** if a session exceeds 75 pitches, the plan leads with a rest warning. That
number comes from MLB Pitch Smart's guidance for ages 9-10. Follow your league's rules and your own
judgment — the app is a tracker, not a trainer or a medical opinion.

---

## Logging swings

Hitting is logged **one swing at a time**, and every session average is calculated from those
swings — so the averages can never drift away from the underlying data.

In the log form, the Hitting section gives you:

- **ADD SWING** — appends a new numbered line
- **REPEAT LAST** — copies the previous swing's numbers into a new line, for when only one metric
  changed
- **SHOW CORE 5 / SHOW ALL 11** — start with Bat Speed, Hand Speed, On Plane, Attack Angle, and
  Vertical Bat Angle; expand when you want the full Blast set
- A live **AVG** row under the table that recalculates as you type, plus swings logged, average
  bat speed, and hardest swing

Leave a box blank if Blast didn't report it. Blanks are **skipped**, not counted as zero — if
On Plane came through on 8 of 12 swings, the average is over those 8, and the app shows `8 of 12`
under the value.

Two separate bests are tracked: **best session average** (what goals measure against) and
**hardest swing** (the fastest single swing ever). Both fire their own NEW BEST celebration.

Fields match the Blast Baseball app labels: Bat Speed · Peak Hand Speed · On Plane Efficiency ·
Attack Angle · Vertical Bat Angle · Rotational Acceleration · Early Connection ·
Connection at Impact · Time to Contact · Power · Blast Factor.

---

## Logging pitches

Same line-by-line pattern as swings. **ADD PITCH** appends a numbered row with speed, pitch type
(FB / CH / CB / Other), and a STRIKE / BALL toggle. **REPEAT LAST** copies the previous pitch.

Totals build themselves: pitch count, strike %, average velo, top velo, and longest consecutive
strike run. Leave speed blank for pitches you didn't gun — they still count toward strike %.

Because each pitch carries its type, the coach can tell you the changeup is only landing 30% of the
time while the fastball sits at 65%.

---

## Logging fielding

One line per drill, tracking four numbers:

| Column | Means |
|---|---|
| **Thrown at him** | Every ball sent his way |
| **Caught** | Handled cleanly |
| **Throws made** | Throws attempted after the field |
| **On target** | Catchable at the bag |

Catch % and throw accuracy calculate per line as you type and roll up to the session. Colors flip
green above the AAA line, amber near it, grey below. Miscounts are safe — caught can never exceed
chances, and on-target can never exceed throws made.

Drills available: Front Grounders, Pop Flies, Glove Side, Backhand, Glove Side Turns, Backhand
Turns. The coach uses the per-drill split to name your weakest one.

---

## Editing a player card

Tap the pencil next to a player's name to change their **jersey number** and **slogan**
("The Slugger"). Saves to Supabase, so it updates on every device. First name, division, and card
colors live in `lib/players.ts`.

---

## Dates on charts

Every chart is date-stamped:

- **Pitching / Fielding / Hitting blocks** each carry a bar chart labeled *BY DATE*, with the
  session date under each bar and the most recent one in white
- **Progress Over Time** shows a date axis under the line, thinned to at most 7 labels so they
  never overlap, plus a hover tooltip on each point
- Each stat block header shows **Last: M/D**, and the Session Log table lists full dates

---

## Tests

```bash
npm run selftest
```

88 checks covering rolling averages, goal progress, next-target suggestions, PR detection, XP math,
the level curve, swing/pitch/fielding aggregation, AAA benchmark scoring, coaching rule priority,
and player profile overrides.

---

## Customizing

| What | Where |
|---|---|
| Default names, numbers, slogans, colors | `lib/players.ts` |
| Swing columns shown in Core vs All | `SWING_COLUMNS` in `lib/swings.ts` |
| AAA / AA / Elite thresholds | `BENCHMARKS` in `lib/benchmarks.ts` |
| Coaching rules, drills, cues | `lib/coaching.ts` |
| Fielding drill list | `DRILLS` in `lib/fielding.ts` |
| Pitch types | `PITCH_TYPES` in `lib/pitches.ts` |
| Goal metrics, ceilings, starting targets | `METRICS` in `lib/goals.ts` |
| Goal gain percentage (default 10%) | `GOAL_GAIN_PCT` in `lib/goals.ts` |
| Badges and milestones | `BADGES` / `MILESTONES` in `lib/gamification.ts` |
| Rolling window size (default 5) | `ROLLING_WINDOW` in `lib/goals.ts` |
| XP values, level curve, tiers | `lib/gamification.ts` |
| Badges & milestones | `BADGES` / `MILESTONES` in `lib/gamification.ts` |
| Log form fields | `components/LogSessionModal.tsx` |
| Database schema | `supabase/schema.sql` |

To add a third player: add an entry to `PLAYERS`, add the id to `PLAYER_ORDER`, and extend the
`PlayerId` union in `lib/types.ts`.

---

## Structure

```
app/
  page.tsx              dashboard shell, modals, backup/restore
components/
  PlayerCard.tsx        HUD, goals, charts, stat blocks, achievements
  GoalsPanel.tsx        Current Avg → Goal cards with inline editing
  SwingLogger.tsx       swing-by-swing entry table with live averages
  PitchLogger.tsx       pitch-by-pitch entry with strike/ball toggle
  FieldingLogger.tsx    drill lines with catch % and throw accuracy
  CoachingPanel.tsx     the prioritized plan for the next workout
  AAAReadiness.tsx      level ladder and gap-to-AAA per metric
  PointsExplainer.tsx   how XP works, written for the kids
  PlayerIdentityEditor.tsx  inline number + slogan editing
  ProgressOverTime.tsx  metric picker + line chart with goal line
  CelebrationModal.tsx  PRs, cleared goals, next-target picker
  LogSessionModal.tsx   session entry form
  SessionHistory.tsx    table of all sessions
  ui.tsx                StatTile, SectionCard, BarTrend, LineChart
lib/
  types.ts              data model
  players.ts            Carl & Austin
  gamification.ts       XP, levels, totals, streaks, awards, PR detection
  goals.ts              metric defs, rolling averages, goal progress, suggestions
  swings.ts             swing columns, averaging, session rollup
  pitches.ts            pitch types, velo averaging, strike runs
  fielding.ts           drills, catch %, throw accuracy
  benchmarks.ts         Rec/AA/AAA/Elite thresholds and readiness scoring
  coaching.ts           the rules engine behind Coach's Plan
  store.ts              Supabase ⇄ localStorage storage layer
  supabase.ts           client
  useAppData.ts         React hook tying it together
  __selftest.ts         logic tests
supabase/
  schema.sql            run this in the Supabase SQL editor
```
