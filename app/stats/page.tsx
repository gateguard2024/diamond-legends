'use client';
import Link from 'next/link';
import { useState } from 'react';
import PlayerSwitch from '@/components/PlayerSwitch';
import { Bar, Button, Card, Eyebrow, Pill, Sheet, Sparkline } from '@/components/ui';
import { MetricSummary, TIER_COLOR, armStatus, familyXp, fmt, phaseFor, prsFor, summarize, xpFor, levelFor, defaultGoal } from '@/lib/calc';
import { short, today } from '@/lib/dates';
import { FAMILY_REWARDS, HEADLINE_METRICS, METRICS, PHASES, PLAYERS, playerById } from '@/lib/program';
import { addRecord } from '@/lib/store';
import { usePlayer, useRecords } from '@/lib/useData';

export default function StatsPage() {
  const { recs } = useRecords();
  const [pid, setPid] = usePlayer();
  const [edit, setEdit] = useState<MetricSummary | null>(null);
  const [goalVal, setGoalVal] = useState('');
  const player = playerById(pid);
  const now = phaseFor(today());
  const sums = METRICS.map((m) => summarize(recs, pid, m.id)!).filter(Boolean);
  const headline = HEADLINE_METRICS.map((id) => sums.find((s) => s.metric.id === id)!);
  const others = sums.filter((s) => !HEADLINE_METRICS.includes(s.metric.id) && s.rows.length);
  const prs = prsFor(recs, pid).slice(0, 6);
  const fam = familyXp(recs, PLAYERS.map((p) => p.id));
  const nextReward = FAMILY_REWARDS.find((r) => r.xp > fam) ?? FAMILY_REWARDS[FAMILY_REWARDS.length - 1];
  const prevReward = [...FAMILY_REWARDS].reverse().find((r) => r.xp <= fam);
  const cues = recs.filter((r) => r.kind === 'cue').slice(-4).reverse();

  function card(s: MetricSummary) {
    const m = s.metric;
    const unit = m.clock ? '' : m.unit;
    return (
      <button key={m.id} onClick={() => { setEdit(s); setGoalVal(s.goal !== null ? fmt(m, s.goal) : ''); }} className="rounded-2xl border border-line bg-panel p-4 text-left hover:border-amber">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-medium text-muted">{m.label}</span>
          {s.tier && <Pill color={TIER_COLOR[s.tier]}>{s.tier}</Pill>}
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-mono text-[34px] font-semibold leading-none">{fmt(m, s.best)}</span>
          <span className="text-[13px] text-muted">{unit}</span>
          {s.gained !== null && s.rows.length > 1 && (
            <span className="ml-auto text-[13px] font-semibold text-teal">
              {s.gained === 0 ? '±0' : (m.lowerIsBetter ? '−' : '+') + fmt(m, Math.abs(s.gained))}
            </span>
          )}
        </div>
        <div className="mt-3">
          <Bar pct={s.progress} />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
          <span>Base {fmt(m, s.baseline)}</span>
          <Sparkline values={s.rows.map((r) => r.value)} lowerIsBetter={m.lowerIsBetter} color={player.color} />
          <span>
            Goal <strong className="text-amber">{fmt(m, s.goal)}</strong>
            {s.customGoal ? '*' : ''}
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-5">
      <div className="mx-auto max-w-xl md:max-w-none">
        <PlayerSwitch value={pid} onChange={setPid} />
      </div>

      <Card>
        <div className="mb-2 flex items-baseline justify-between">
          <Eyebrow>Season roadmap</Eyebrow>
          <Link href="/more" className="text-xs text-amber">
            Details
          </Link>
        </div>
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
          {PHASES.map((p) => {
            const on = p.id === now.id;
            return (
              <div
                key={p.id}
                className={`min-w-[120px] flex-1 rounded-lg px-2.5 py-2 ${on ? 'bg-amber text-ink' : p.throwing ? 'bg-raised' : 'border border-dashed border-line text-muted'}`}
              >
                <div className="truncate text-xs font-semibold">{p.name}</div>
                <div className="text-[11px] opacity-80">
                  {short(p.start)} – {short(p.end)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-wrap items-start gap-5">
        <section className="min-w-0 flex-[999_1_560px] space-y-3">
          <div className="flex items-baseline justify-between">
            <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">{player.name} · measurables</h1>
            <Link href="/test" className="text-sm text-amber">
              + Log test
            </Link>
          </div>
          {sums.every((s) => !s.rows.length) && (
            <Card>
              <p className="text-muted">No results yet. Run Combine #1 on the Test tab to set {player.name}&apos;s baseline and July goals.</p>
            </Card>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{headline.map(card)}</div>
          {others.length > 0 && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{others.map(card)}</div>}
          <p className="text-xs text-muted">Tap a card to set a custom goal. * = custom goal.</p>
        </section>

        <aside className="min-w-0 flex-[1_1_300px] space-y-3">
          <Card>
            <Eyebrow className="mb-2">Arm care · Pitch Smart</Eyebrow>
            {PLAYERS.map((p) => {
              const a = armStatus(recs, p.id);
              return (
                <div key={p.id} className="flex items-center gap-3 py-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: a.canThrowHard ? '#4FC3B8' : '#F07B3F' }} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-muted">
                      {a.lastDate ? `Last: ${a.lastCount} pitches ${short(a.lastDate)}` : 'No pitches logged'} · {a.innings12mo} IP / 80 (12 mo)
                    </div>
                  </div>
                  <div className="text-right text-xs">{a.message}</div>
                </div>
              );
            })}
          </Card>

          <Card>
            <div className="flex items-baseline justify-between">
              <Eyebrow>Team Feldman</Eyebrow>
              <span className="font-mono text-sm">
                {fam.toLocaleString()} / {nextReward.xp.toLocaleString()} XP
              </span>
            </div>
            <div className="mt-2">
              <Bar pct={(fam - (prevReward?.xp ?? 0)) / (nextReward.xp - (prevReward?.xp ?? 0))} h={10} />
            </div>
            <div className="mt-2 text-sm">
              Next family reward: <strong>{nextReward.reward}</strong>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {PLAYERS.map((p) => {
                const x = xpFor(recs, p.id);
                return (
                  <div key={p.id} className="rounded-xl bg-ink px-3 py-2">
                    <div className="font-semibold" style={{ color: p.color }}>
                      {p.name}
                    </div>
                    <div className="text-xs text-muted">
                      {levelFor(x).level.name} · {x.toLocaleString()} XP
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <Eyebrow className="mb-2">Recent PRs · {player.name}</Eyebrow>
            {prs.length ? (
              <ul className="space-y-1.5 text-sm">
                {prs.map((p) => (
                  <li key={p.metric.id + p.date} className="flex justify-between gap-2">
                    <span>{p.metric.label}</span>
                    <span className="font-mono">
                      {fmt(p.metric, p.previous)} → <strong className="text-amber">{fmt(p.metric, p.value)}</strong>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">PRs show up after the second test of anything.</p>
            )}
          </Card>

          <Card>
            <Eyebrow className="mb-2">Coach cues</Eyebrow>
            {cues.length ? (
              <ul className="space-y-2 text-sm">
                {cues.map((c) => (
                  <li key={c.id} className="border-t border-line pt-2 first:border-0 first:pt-0">
                    <div className="text-xs font-semibold text-amber">
                      {String(c.data.coach)} · {c.playerId ? playerById(c.playerId).name : 'Both'} · {short(c.date)}
                    </div>
                    <div>&ldquo;{String(c.data.text)}&rdquo;</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Log a cue when you finish a lesson on the Today tab.</p>
            )}
          </Card>
        </aside>
      </div>

      <Sheet open={Boolean(edit)} onClose={() => setEdit(null)} title={edit ? `${player.name} · ${edit.metric.label}` : ''}>
        {edit && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Default goal is baseline + the realistic 9-month gain, rounded to the next tier line when close
              {defaultGoal(edit.metric, edit.baseline) !== null ? ` (${fmt(edit.metric, defaultGoal(edit.metric, edit.baseline))})` : ''}.
            </p>
            <input
              inputMode="decimal"
              value={goalVal}
              onChange={(e) => setGoalVal(e.target.value)}
              className="h-16 w-full rounded-2xl border border-line bg-ink px-4 text-center font-mono text-3xl text-chalk"
              aria-label="Goal"
            />
            <Button
              className="w-full"
              onClick={async () => {
                const v = Number(goalVal.includes(':') ? Number(goalVal.split(':')[0]) * 60 + Number(goalVal.split(':')[1]) : goalVal);
                if (Number.isFinite(v)) await addRecord('goal', pid, today(), { metric: edit.metric.id, value: v });
                setEdit(null);
              }}
            >
              Save goal
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
