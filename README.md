# Diamond Legends ⚾ — Elite Baseball Trainer

Training plan, combine tracking and gamified progress for **Austin (#3)** and **Carl (#7)**, built
around a 10U AA development program that runs from the October 2026 baseline combine to July 2027
tryouts.

Built phone-first: the boys run their training from the **Today** tab on a phone, and parents plan
the week and watch the numbers on **Plan** and **Stats** (which also work on a laptop).

## What's in it

| Tab | What it does |
| --- | --- |
| **Today** | The training screen. Each planned slot opens to a big-tap checklist of drills with dose and coaching cue. Finishing it awards XP. Also logs pitches, sleep, and coach cues, and shows streak, level and the closest badge. |
| **Plan** | The week. Load the phase's template week, then move slots — tap → pick a day on a phone, drag-and-drop on a laptop. Assign a slot to one boy or both. Flags flex-rule problems (game-day stacking, back-to-back strength, too few rest days, throwing in a no-throw block, pitching inside Pitch Smart rest). |
| **Test** | The combine, one test at a time with the protocol on screen. Shows baseline, best, July goal and the tier for a 10-year-old; celebrates new PRs. |
| **Stats** | Measurables with progress to goal and a trend line, season roadmap, Pitch Smart status for both boys, family XP bar, recent PRs and coach cues. Tap a card to set a custom goal. |
| **More** | Season roadmap, Pitch Smart rules, equipment checklist, Coach's Pick award, tryout date, backup/restore. Drills and Badges live here on phones. |

All program numbers — tiers, goals, phases, weekly templates, drills, XP, badges, equipment — live in
`lib/program.ts`. Change them there.

## How the numbers work

- **Goals:** baseline + the middle of a realistic 9-month gain, rounded up to the next tier line when
  it's close. Override any goal on the Stats tab.
- **XP:** slot done +10 (lesson +15, bands +5, rest honored +5), sleep 9+ hrs +3, new PR +50,
  combine/re-test day (5+ tests) +100.
- **Levels:** Rookie 0 → Prospect 500 → Starter 1,250 → All-Star 2,500 → MVP 4,000 → Hall of Fame 6,000.
- **Pitch Smart (ages 9–10):** 75/day max; 21–35 → 1 day rest, 36–50 → 2, 51–65 → 3, 66+ → 4; no three
  days in a row; 80 innings per 12 months. Every logged pitch (game, bullpen, lesson) counts.
- **No-throw blocks:** Nov 23 – Jan 17 and about 6 weeks after tryouts.

## Run it

```bash
npm install
cp .env.local.example .env.local   # optional — see Supabase below
npm run dev
```

Open http://localhost:3000. Without Supabase keys it runs in **local-only mode** (data stays in
that browser).

### Put it on the boys' phones

Deploy to Vercel, open the site in Safari, tap **Share → Add to Home Screen**. It opens full-screen
like an app.

## Supabase (so every phone sees the same data)

1. In your Supabase project: **SQL Editor → New query**, paste `supabase/schema.sql`, **Run**.
   It creates one new table, `ebt_records`, and leaves the v1 tables (`sessions`, `goals`,
   `player_profiles`) untouched.
2. **Project Settings → API**: copy the Project URL and the `anon` `public` key into `.env.local`
   as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Add the same two variables in **Vercel → Settings → Environment Variables**, then **Redeploy**.

If you're already using the v1 Supabase project, the keys you have work as-is — just run the new
schema file.

> **Security:** there's no login, and the anon key can read and write the table. That's fine for a
> private family app, but keep the URL and key private.

## Moving data between devices before Supabase is set up

**More → Back up (JSON)** on one device, **More → Restore** on another.
