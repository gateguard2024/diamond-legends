'use client';
import { useMemo, useState } from 'react';
import PlayerSwitch from '@/components/PlayerSwitch';
import { Button, Card, Eyebrow, Icon, Pill, Toast } from '@/components/ui';
import { TIER_COLOR, fmt, isBetter, parseInput, summarize, tierOf } from '@/lib/calc';
import { short, today } from '@/lib/dates';
import { METRICS, RETESTS, playerById } from '@/lib/program';
import { addRecord, removeRecord } from '@/lib/store';
import { usePlayer, useRecords } from '@/lib/useData';

export default function TestPage() {
  const { recs } = useRecords();
  const [pid, setPid] = usePlayer();
  const [date, setDate] = useState(today());
  const [i, setI] = useState(0);
  const [val, setVal] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const m = METRICS[i];
  const s = useMemo(() => summarize(recs, pid, m.id), [recs, pid, m.id]);
  const loggedToday = recs.filter((r) => r.kind === 'test' && r.playerId === pid && r.date === date);
  const loggedIds = new Set(loggedToday.map((r) => String(r.data.metric)));
  const player = playerById(pid);
  const parsed = parseInput(m, val);
  const nextRetest = RETESTS.find((r) => r.date >= today());

  async function save() {
    if (parsed === null) return;
    const wasBest = s?.best ?? null;
    await addRecord('test', pid, date, { metric: m.id, value: parsed });
    if (wasBest !== null && isBetter(m, parsed, wasBest)) setToast(`NEW PR! ${m.short} ${fmt(m, parsed)} · +50 XP`);
    else setToast(`${m.short} saved`);
    setVal('');
    if (i < METRICS.length - 1) setI(i + 1);
  }

  const liveTier = tierOf(m, parsed);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PlayerSwitch value={pid} onChange={setPid} />

      <div className="flex items-end justify-between gap-3">
        <div>
          <Eyebrow>Combine · {player.name}</Eyebrow>
          <div className="text-sm text-muted">{nextRetest ? `Next scheduled: ${nextRetest.label}, ${short(nextRetest.date)}` : ''}</div>
        </div>
        <label className="text-right text-xs text-muted">
          Test date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value || today())} className="mt-1 block h-11 rounded-xl border border-line bg-panel px-2 text-chalk" />
        </label>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Tests">
        {METRICS.map((x, k) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={k === i}
            onClick={() => {
              setI(k);
              setVal('');
            }}
            className={`flex min-h-[40px] flex-none items-center gap-1.5 rounded-full border px-3 text-[13px] ${
              k === i ? 'border-amber bg-amber text-ink font-semibold' : loggedIds.has(x.id) ? 'border-teal text-teal' : 'border-line text-muted'
            }`}
          >
            {loggedIds.has(x.id) && k !== i && <Icon name="check" size={14} />}
            {x.short}
          </button>
        ))}
      </div>

      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-muted">
              {i + 1} of {METRICS.length} · {m.group}
            </div>
            <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">{m.label}</h1>
          </div>
          {s?.tier && <Pill color={TIER_COLOR[s.tier]}>{s.tier}</Pill>}
        </div>
        <p className="text-[15px] leading-relaxed text-muted">{m.protocol}</p>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-ink py-2">
            <div className="text-[11px] text-muted">Baseline</div>
            <div className="font-mono text-lg">{s ? fmt(m, s.baseline) : '—'}</div>
          </div>
          <div className="rounded-xl bg-ink py-2">
            <div className="text-[11px] text-muted">Best</div>
            <div className="font-mono text-lg">{s ? fmt(m, s.best) : '—'}</div>
          </div>
          <div className="rounded-xl bg-ink py-2">
            <div className="text-[11px] text-muted">July goal</div>
            <div className="font-mono text-lg text-amber">{s ? fmt(m, s.goal) : '—'}</div>
          </div>
        </div>

        <label className="block">
          <span className="sr-only">{m.label} result</span>
          <div className="relative">
            <input
              inputMode={m.clock ? 'text' : 'decimal'}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              placeholder={m.clock ? 'm:ss or seconds' : '0'}
              className="h-20 w-full rounded-2xl border-2 border-line bg-ink px-4 pr-20 text-center font-mono text-4xl text-chalk focus:border-amber"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">{m.clock ? '' : m.unit}</span>
          </div>
        </label>
        {liveTier && (
          <div className="text-center text-sm">
            That&apos;s <span style={{ color: TIER_COLOR[liveTier] }}>{liveTier}</span>
            {s?.best !== null && s?.best !== undefined && parsed !== null && isBetter(m, parsed, s.best) ? <strong className="text-amber"> · new PR!</strong> : null}
          </div>
        )}

        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
          <Button kind="quiet" onClick={() => { setI(Math.max(0, i - 1)); setVal(''); }} disabled={i === 0} className="w-14">
            <Icon name="chevL" className="mx-auto" />
          </Button>
          <Button onClick={save} disabled={parsed === null} className="font-display text-lg uppercase tracking-wide">
            Save {i < METRICS.length - 1 ? '& next' : ''}
          </Button>
          <Button kind="quiet" onClick={() => { setI(Math.min(METRICS.length - 1, i + 1)); setVal(''); }} disabled={i === METRICS.length - 1} className="w-14">
            <Icon name="chevR" className="mx-auto" />
          </Button>
        </div>
      </Card>

      {m.tiers && (
        <Card>
          <Eyebrow className="mb-2">Tiers for a 10-year-old · {m.label}</Eyebrow>
          <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
            {(['Developing', 'Solid AA', 'AAA-ready', 'Elite 10U'] as const).map((t, k) => {
              const [aa, aaa, el] = m.tiers!;
              const lb = m.lowerIsBetter;
              const f = (v: number) => fmt(m, v);
              const range = lb
                ? [`> ${f(aa)}`, `${f(aaa + 0.01)}–${f(aa)}`, `${f(el + 0.01)}–${f(aaa)}`, `≤ ${f(el)}`][k]
                : [`< ${f(aa)}`, `${f(aa)}–${f(aaa - 1)}`, `${f(aaa)}–${f(el - 1)}`, `${f(el)}+`][k];
              return (
                <div key={t} className="rounded-lg border border-line px-1 py-2">
                  <div className="font-semibold" style={{ color: TIER_COLOR[t] }}>
                    {t}
                  </div>
                  <div className="mt-0.5 font-mono text-muted">{range}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {s && s.rows.length > 0 && (
        <Card>
          <Eyebrow className="mb-2">{player.name}&apos;s history</Eyebrow>
          <ul className="divide-y divide-line">
            {[...s.rows].reverse().map((r) => (
              <li key={r.id} className="flex min-h-[48px] items-center justify-between gap-3">
                <span className="text-sm text-muted">{short(r.date)}</span>
                <span className="font-mono">
                  {fmt(m, r.value)} {m.clock ? '' : m.unit}
                </span>
                <button
                  onClick={() => confirm('Delete this result?') && removeRecord(r.id)}
                  className="grid h-10 w-10 place-items-center rounded-full text-muted hover:text-warn"
                  aria-label={`Delete ${short(r.date)} result`}
                >
                  <Icon name="trash" size={18} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Toast text={toast} onDone={() => setToast(null)} />
    </div>
  );
}
