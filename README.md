# Diamond Legends ⚾

Workout tracker and gamified player cards for **Carl (9U, #7)** and **Austin (10U, #3)**.

Log pitching, fielding, and Blast Motion hitting sessions. The app tracks **Current Avg → Goal**
for seven metrics, charts progress over time, celebrates new personal bests, and auto-suggests the
next goal the moment one gets cleared.

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

### The seven tracked metrics

| Metric | Phase | How it's measured |
|---|---|---|
| Strike % | Pitching | strikes ÷ pitches, averaged |
| Avg Velo | Pitching | session average speed, averaged |
| Top Velo | Pitching | **best** in the window, not averaged |
| Bat Speed | Hitting | Blast session average, averaged |
| On Plane Efficiency | Hitting | Blast session average, averaged |
| Clean Fielding % | Fielding | clean reps ÷ total reps, averaged |
| Workouts/Week | Habit | distinct days trained per week |

### Current Avg

A rolling average of the **last 5 sessions** that contain that metric. Responsive enough that a
good week visibly moves the number, stable enough that one rough day doesn't tank it. The card
shows `3 of 5` etc. until there's a full window, plus a green/red delta arrow versus the previous
window.

### The goal ladder

1. After a player's first session, a starting goal is created for all seven metrics — their
   current average plus one increment (or a sensible 9U/10U default if there's no data yet).
2. The progress bar fills from **the value when the goal was set** to the target, so the bar
   measures actual improvement rather than absolute level.
3. When Current Avg reaches the target, the goal is banked and a **celebration modal** fires
   showing what they hit and proposing the next target. You can accept the suggestion or type your
   own, then **LOCK IT IN**.
4. Cleared goals stay on the card as a trophy strip.

Increments and ceilings per metric:

| Metric | Increment | Ceiling |
|---|---|---|
| Strike % | +5 | 85% |
| Avg Velo | +2 mph | 75 |
| Top Velo | +2 mph | 80 |
| Bat Speed | +2 mph | 75 |
| On Plane Efficiency | +5 | 90% |
| Clean Fielding % | +5 | 98% |
| Workouts/Week | +1 | 6 |

You can override any goal at any time — tap the target number on the card.

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
| Each fielding rep | +2 |
| Each clean fielding rep | +1 |
| 50+ fielding reps in a session | +25 |
| Each Blast-tracked swing | +1 |
| 70%+ On Plane Efficiency | +25 |
| New bat speed PR | +50 |
| All three phases in one session | +50 |

**Levels:** level *n* costs `100 + (n-1) × 40` XP.
**Tiers:** Rookie (1–9) → Pro (10–24) → All-Star (25–39) → Hall of Famer (40+).

**Badges:** 🎯 Strike Zone Sniper · ⚡ Bat Speed Demon · 📐 On-Plane Machine · 🧤 The Vacuum ·
🔥 Flamethrower · 🚀 Pure Heat · 🏗️ Iron Worker

**Milestones:** First Workout · 250 Pitches · 250 Strikes · 500 Rep Club · 1,000 Swings ·
Blast Factor 75

Locked awards show a live progress bar so the boys can see how close they are.

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

41 checks covering rolling averages, goal progress, next-target suggestions, PR detection, XP math,
the level curve, swing averaging (including blanks and negative angles), and player profile
overrides.

---

## Customizing

| What | Where |
|---|---|
| Default names, numbers, slogans, colors | `lib/players.ts` |
| Swing columns shown in Core vs All | `SWING_COLUMNS` in `lib/swings.ts` |
| Goal metrics, increments, ceilings, defaults | `METRICS` in `lib/goals.ts` |
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
  store.ts              Supabase ⇄ localStorage storage layer
  supabase.ts           client
  useAppData.ts         React hook tying it together
  __selftest.ts         logic tests
supabase/
  schema.sql            run this in the Supabase SQL editor
```
