'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Button, Card, Eyebrow, H1, Icon } from '@/components/ui';
import { phaseFor } from '@/lib/calc';
import { short, today } from '@/lib/dates';
import { GEAR, PHASES, PITCH_SMART, PLAYERS, RETESTS } from '@/lib/program';
import { addRecord, exportJson, importJson, isSynced } from '@/lib/store';
import { useRecords, useTryoutDate } from '@/lib/useData';

export default function MorePage() {
  const { recs } = useRecords();
  const tryout = useTryoutDate();
  const [tryoutVal, setTryoutVal] = useState('');
  const [msg, setMsg] = useState('');
  const [awardFor, setAwardFor] = useState<string>(PLAYERS[0].id);
  const [awardWhy, setAwardWhy] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const now = phaseFor(today());

  const owned = (id: string, def?: boolean) => {
    const r = [...recs].reverse().find((x) => x.kind === 'gear' && x.data.gearId === id);
    return r ? Boolean(r.data.owned) : Boolean(def);
  };

  function download() {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `diamond-legends-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <H1>Program</H1>

      <nav className="grid grid-cols-2 gap-2 md:hidden" aria-label="More pages">
        <Link href="/drills" className="flex min-h-[56px] items-center gap-2 rounded-2xl border border-line bg-panel px-4 font-semibold">
          <Icon name="book" /> Drill library
        </Link>
        <Link href="/badges" className="flex min-h-[56px] items-center gap-2 rounded-2xl border border-line bg-panel px-4 font-semibold">
          <Icon name="star" /> Badges
        </Link>
      </nav>

      <Card>
        <Eyebrow className="mb-3">Season roadmap</Eyebrow>
        <ol className="relative space-y-3 border-l-2 border-line pl-5">
          {PHASES.map((p, i) => {
            const on = p.id === now.id;
            return (
              <li key={p.id} className="relative">
                <span className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full ${on ? 'bg-amber' : 'bg-line'}`} />
                <div className={`rounded-xl px-3 py-2.5 ${on ? 'border border-amber bg-raised' : p.throwing ? '' : 'bg-ink'}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="font-display text-lg font-semibold uppercase">
                      {i + 1} · {p.name}
                    </span>
                    <span className="text-xs text-muted">
                      {short(p.start)} – {short(p.end)}
                    </span>
                  </div>
                  <div className="text-sm text-muted">{p.focus}</div>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="mt-3 text-sm">
          <strong>Re-tests:</strong> {RETESTS.map((r) => `${r.label} ${short(r.date)}`).join(' · ')}
        </div>
      </Card>

      <Card>
        <Eyebrow className="mb-2">Pitch Smart · ages 9–10</Eyebrow>
        <div className="grid grid-cols-5 gap-1.5 text-center text-sm">
          {PITCH_SMART.rest.map(([max, days], i) => (
            <div key={max} className="rounded-lg bg-ink px-1 py-2">
              <div className="font-mono">
                {i === 0 ? 1 : PITCH_SMART.rest[i - 1][0] + 1}–{max}
              </div>
              <div className="text-xs text-muted">{days} day{days === 1 ? '' : 's'} rest</div>
            </div>
          ))}
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>75 pitches max per day. No pitching three days in a row or in two games the same day.</li>
          <li>At least 4 months a year with no throwing, 2–3 of them in a row (Nov 23 – Jan 17 plus about 6 weeks after tryouts).</li>
          <li>No more than 80 innings in any 12 months. Fastballs and changeups only.</li>
          <li>Avoid catching on days he isn&apos;t pitching. Arm pain = stop and get it checked.</li>
        </ul>
      </Card>

      <Card>
        <div className="mb-2 flex items-baseline justify-between">
          <Eyebrow>Equipment</Eyebrow>
          <span className="text-xs text-muted">Tap to mark owned</span>
        </div>
        <ul className="space-y-2">
          {GEAR.map((g) => {
            const on = owned(g.id, g.ownedByDefault);
            return (
              <li key={g.id}>
                <button
                  onClick={() => addRecord('gear', null, today(), { gearId: g.id, owned: !on })}
                  aria-pressed={on}
                  className={`flex min-h-[56px] w-full items-center gap-3 rounded-xl border px-3 py-2 text-left ${on ? 'border-teal bg-teal/10' : 'border-line bg-ink'}`}
                >
                  <span className={`grid h-7 w-7 flex-none place-items-center rounded-lg border-2 ${on ? 'border-teal bg-teal text-ink' : 'border-line'}`}>{on && <Icon name="check" size={18} />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-snug">{g.name}</span>
                    <span className="block text-xs text-muted">
                      {g.priority} · {g.use}
                    </span>
                  </span>
                  <span className="text-right text-xs text-muted">{on ? 'Owned' : g.cost}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-muted">Prices are approximate retail ranges.</p>
      </Card>

      <Card className="space-y-3">
        <Eyebrow>Coach&apos;s Pick badge</Eyebrow>
        <div className="grid grid-cols-2 gap-2">
          {PLAYERS.map((p) => (
            <button key={p.id} onClick={() => setAwardFor(p.id)} className={`min-h-[48px] rounded-xl border ${awardFor === p.id ? 'border-amber bg-amber font-semibold text-ink' : 'border-line'}`}>
              {p.name}
            </button>
          ))}
        </div>
        <input value={awardWhy} onChange={(e) => setAwardWhy(e.target.value)} placeholder="What it's for (effort, attitude…)" className="h-12 w-full rounded-xl border border-line bg-ink px-3 text-chalk" />
        <Button
          kind="ghost"
          className="w-full"
          onClick={async () => {
            await addRecord('award', awardFor, today(), { reason: awardWhy.trim() });
            setAwardWhy('');
            setMsg('Coach’s Pick awarded');
          }}
        >
          Award Coach&apos;s Pick
        </Button>
      </Card>

      <Card className="space-y-3">
        <Eyebrow>Settings</Eyebrow>
        <label className="block text-sm text-muted">
          Tryout date (now {short(tryout)})
          <div className="mt-1 flex gap-2">
            <input type="date" value={tryoutVal} onChange={(e) => setTryoutVal(e.target.value)} className="h-12 flex-1 rounded-xl border border-line bg-ink px-3 text-chalk" />
            <Button
              onClick={async () => {
                if (tryoutVal) await addRecord('settings', null, today(), { tryoutDate: tryoutVal });
                setMsg('Tryout date saved');
              }}
            >
              Save
            </Button>
          </div>
        </label>
        <div className="text-sm text-muted">Storage: {isSynced ? 'Supabase (synced across devices)' : 'This device only'} · {recs.length} records</div>
        <div className="grid grid-cols-2 gap-2">
          <Button kind="quiet" onClick={download}>
            Back up (JSON)
          </Button>
          <Button kind="quiet" onClick={() => fileRef.current?.click()}>
            Restore
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              const n = await importJson(await f.text());
              setMsg(`Restored ${n} records`);
            } catch {
              setMsg('That file is not a Diamond Legends backup');
            }
            e.target.value = '';
          }}
        />
        {msg && <p className="text-sm text-teal" role="status">{msg}</p>}
      </Card>
    </div>
  );
}
