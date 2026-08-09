# Diamond Legends ⚾

Workout leaderboard and gamified player cards for **Carl (9U, #7)** and **Austin (10U, #3)**.
Log pitching, fielding, and Blast Motion hitting sessions — the app calculates XP, levels, tiers,
streaks, badges, and milestones automatically.

---

## Run it locally

```bash
cd diamond-legends
npm install
npm run dev
```

Open http://localhost:3000

> If a `node_modules` folder is already sitting in this directory, delete it first and re-run
> `npm install` so you get a clean install for your machine.

---

## Deploy: GitHub → Vercel

### 1. Create the repo

```bash
cd diamond-legends
git init
git add .
git commit -m "Diamond Legends: initial dashboard"
```

Create an empty repo on GitHub (no README, no .gitignore — this project has one), then:

```bash
git remote add origin https://github.com/<your-username>/diamond-legends.git
git branch -M main
git push -u origin main
```

### 2. Connect Vercel

1. Go to https://vercel.com/new
2. **Import Git Repository** → pick `diamond-legends`
3. Vercel auto-detects Next.js. Leave every setting at its default:
   - Framework Preset: **Next.js**
   - Build Command: `next build`
   - Output Directory: (leave blank)
   - Install Command: `npm install`
4. No environment variables are needed.
5. Click **Deploy**.

You'll get a URL like `diamond-legends.vercel.app`. Every `git push` to `main` redeploys
automatically; pushes to other branches get preview URLs.

### 3. Put it on the boys' phones

Open the Vercel URL on the phone/tablet → Share → **Add to Home Screen**. It runs full-screen
like an app and the layout is already mobile-friendly.

---

## ⚠️ One thing to know about the data

Sessions are stored in **browser localStorage** — meaning the data lives on whatever device
logged it. Your iPhone and Austin's iPad will each have their own copy.

Two ways to handle it:

- **Simple:** log everything from one device (yours). Use the **Backup** button to download a
  JSON file, and **Restore** to load it onto another device.
- **Proper:** add a database so all devices share one source of truth. On Vercel that's about
  30 minutes of work — Vercel Postgres (or Supabase) + two API routes (`GET /api/sessions`,
  `POST /api/sessions`), then swap the guts of `lib/useSessions.ts` to call them. Everything
  else in the app stays exactly the same, because all reads go through that one hook.

---

## How the XP works

`lib/gamification.ts` is the single place to tune everything.

| Action | XP |
|---|---|
| Logging any session | +20 |
| Each pitch thrown | +1 |
| Each strike | +2 |
| 60%+ strikes on 20+ pitches | +25 |
| New top velo (PR) | +50 |
| Each fielding rep | +2 |
| Each clean fielding rep | +1 |
| 50+ fielding reps in a session | +25 |
| Each Blast-tracked swing | +1 |
| 70%+ On Plane Efficiency | +25 |
| New best bat speed (PR) | +50 |
| Pitching + fielding + hitting in one session | +50 |

**Levels:** level *n* costs `100 + (n-1) × 40` XP.
**Tiers:** Rookie (1–9) → Pro (10–24) → All-Star (25–39) → Hall of Famer (40+).

### Badges (skill-based)

🎯 Strike Zone Sniper · ⚡ Bat Speed Demon · 📐 On-Plane Machine · 🧤 The Vacuum ·
🔥 Flamethrower · 🏗️ Iron Worker

### Milestones (volume-based)

First Workout · 250 Pitches · 250 Strikes · 500 Rep Club · 1,000 Swings · Blast Factor 75

Locked awards show a live progress bar, so the boys can always see how close they are.

---

## Blast Motion fields

Hitting inputs mirror the session-average labels in the Blast Baseball app so you can copy
numbers straight across:

Swings · Bat Speed · Peak Hand Speed · Rotational Acceleration · On Plane Efficiency ·
Attack Angle · Vertical Bat Angle · Early Connection · Connection at Impact · Time to Contact ·
Power · Blast Factor

---

## Customizing

| What | Where |
|---|---|
| Names, numbers, nicknames, colors, division | `lib/players.ts` |
| XP values, level curve, tiers | `lib/gamification.ts` |
| Badge & milestone definitions | `BADGES` / `MILESTONES` in `lib/gamification.ts` |
| Log form fields | `components/LogSessionModal.tsx` |
| Card layout & stat tiles | `components/PlayerCard.tsx` |

To add a third player: add an entry to `PLAYERS`, add the id to `PLAYER_ORDER`, and add it to the
`PlayerId` union in `lib/types.ts`. The grid and head-to-head bars handle the rest.

---

## Structure

```
app/
  layout.tsx          root layout + metadata
  page.tsx            dashboard: header, cards, head-to-head, session log, backup/restore
  globals.css         Tailwind
components/
  PlayerCard.tsx      HUD, pitching/fielding/hitting blocks, achievements
  LogSessionModal.tsx session entry form
  SessionHistory.tsx  table of all logged sessions
  ui.tsx              StatTile, SectionCard, BarTrend, ProgressRing
lib/
  types.ts            data model
  players.ts          Carl & Austin
  gamification.ts     XP, levels, totals, streaks, awards
  useSessions.ts      localStorage persistence hook
```
