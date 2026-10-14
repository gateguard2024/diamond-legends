'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Icon } from './ui';
import { DRILLS, RUNNER_STYLE, SLOT_KINDS, drillById, PITCH_SMART } from '@/lib/program';
import type { SlotRec, ArmStatus } from '@/lib/calc';
import { addRecord, updateRecord, Rec } from '@/lib/store';

interface Props {
  slot: SlotRec;
  playerId: string;
  date: string;
  done: Rec | undefined;
  arm: ArmStatus;
  onXp: (text: string) => void;
  startOpen?: boolean;
}

export default function SlotCard({ slot, playerId, date, done, arm, onXp, startOpen = false }: Props) {
  const kind = SLOT_KINDS[slot.type];
  const style = RUNNER_STYLE[kind.runner];
  const checked = new Set<string>((done?.data.drills as string[]) ?? []);
  const complete = Boolean(done?.data.complete);
  const [open, setOpen] = useState(startOpen && !complete);
  const [pitches, setPitches] = useState('');
  const [innings, setInnings] = useState('');
  const [cue, setCue] = useState('');
  const [extra, setExtra] = useState<string[]>([]);

  const drills = [...kind.drills, ...extra];
  const throwBlocked = kind.throws && (arm.phaseNoThrow || !arm.canThrowHard) && slot.type !== 'game';

  async function save(drillIds: string[], isComplete: boolean) {
    const data = { slotId: slot.id, type: slot.type, drills: drillIds, complete: isComplete, xp: kind.xp };
    if (done) await updateRecord(done.id, { data });
    else await addRecord('done', playerId, date, data);
  }

  function toggleDrill(id: string) {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const all = drills.length > 0 && drills.every((d) => next.has(d));
    save(Array.from(next), all || complete);
    if (all && !complete) {
      onXp(`+${kind.xp} XP · ${kind.label} done`);
      setOpen(false);
    }
  }

  async function finish() {
    const n = Number(pitches);
    if (slot.type === 'game' && n > 0) {
      await addRecord('pitches', playerId, date, { count: n, innings: Number(innings) || 0, context: 'game' });
    }
    if (cue.trim()) {
      await addRecord('cue', playerId, date, { coach: kind.label, text: cue.trim() });
      setCue('');
    }
    await save(Array.from(checked), true);
    onXp(`+${kind.xp} XP · ${kind.label}`);
    setOpen(false);
  }

  async function undo() {
    await save(Array.from(checked), false);
    setOpen(true);
  }

  return (
    <article className={`overflow-hidden rounded-2xl border ${complete ? 'border-teal/60 bg-raised' : 'border-line bg-panel'}`}>
      <button onClick={() => setOpen(!open)} className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left" aria-expanded={open}>
        <span
          className="grid h-10 w-10 flex-none place-items-center rounded-xl"
          style={{ background: complete ? '#4FC3B8' : style.bg === 'transparent' ? '#0E1A2B' : style.bg, color: style.fg, border: style.bg === 'transparent' ? '1px dashed #2A3F5E' : undefined }}
        >
          {complete ? <Icon name="check" /> : <span className="font-display text-sm font-semibold">{kind.runner[0]}</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-semibold uppercase leading-tight tracking-wide">{kind.label}</span>
          <span className="block text-[13px] text-muted">
            {kind.runner}
            {kind.minutes ? ` · ${kind.minutes} min` : ''}
            {drills.length ? ` · ${checked.size}/${drills.length} drills` : ''}
            {slot.note ? ` · ${slot.note}` : ''}
          </span>
        </span>
        <span className="font-mono text-sm text-amber">+{kind.xp}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-line px-4 pb-4 pt-3">
          {throwBlocked && (
            <p className="rounded-xl bg-warn/15 px-3 py-2 text-sm text-warn">
              {arm.phaseNoThrow ? 'No-throw block — do bands and the non-throwing drills only.' : `${arm.message}. Bands + light catch only.`}
            </p>
          )}

          {drills.length > 0 && (
            <ul className="space-y-2">
              {drills.map((id) => {
                const d = drillById(id);
                if (!d) return null;
                const on = checked.has(id);
                const blocked = throwBlocked && d.throws;
                return (
                  <li key={id}>
                    <button
                      onClick={() => toggleDrill(id)}
                      aria-pressed={on}
                      className={`flex min-h-[60px] w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        on ? 'border-teal bg-teal/10' : 'border-line bg-ink'
                      } ${blocked ? 'opacity-50' : ''}`}
                    >
                      <span className={`grid h-7 w-7 flex-none place-items-center rounded-lg border-2 ${on ? 'border-teal bg-teal text-ink' : 'border-line'}`}>
                        {on && <Icon name="check" size={18} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold leading-snug">{d.name}</span>
                        <span className="block text-[13px] text-amber">{d.dose}</span>
                        <span className="block text-[13px] leading-snug text-muted">{d.cue}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {slot.type !== 'rest' && slot.type !== 'game' && slot.type !== 'combine' && (
            <details className="text-sm">
              <summary className="min-h-[44px] cursor-pointer py-2 text-muted">+ Add a drill</summary>
              <div className="mt-2 flex flex-wrap gap-2">
                {DRILLS.filter((d) => !drills.includes(d.id)).map((d) => (
                  <button key={d.id} onClick={() => setExtra([...extra, d.id])} className="min-h-[40px] rounded-full border border-line px-3 text-[13px] hover:border-amber">
                    {d.name}
                  </button>
                ))}
              </div>
            </details>
          )}

          {slot.type === 'game' && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-muted">
                Pitches thrown
                <input inputMode="numeric" value={pitches} onChange={(e) => setPitches(e.target.value.replace(/\D/g, ''))} placeholder="0" className="mt-1 h-12 w-full rounded-xl border border-line bg-ink px-3 font-mono text-chalk" />
              </label>
              <label className="block text-sm text-muted">
                Innings pitched
                <input inputMode="decimal" value={innings} onChange={(e) => setInnings(e.target.value)} placeholder="0" className="mt-1 h-12 w-full rounded-xl border border-line bg-ink px-3 font-mono text-chalk" />
              </label>
              {Number(pitches) > PITCH_SMART.dailyMax && <p className="col-span-2 text-sm text-warn">Over the 75-pitch daily max for 9–10 year olds.</p>}
            </div>
          )}

          {(slot.type === 'lessonHit' || slot.type === 'lessonPitch') && (
            <label className="block text-sm text-muted">
              Coach&apos;s cue to repeat this week
              <input value={cue} onChange={(e) => setCue(e.target.value)} placeholder="e.g. Knob to the ball, then turn" className="mt-1 h-12 w-full rounded-xl border border-line bg-ink px-3 text-chalk" />
            </label>
          )}

          {slot.type === 'combine' ? (
            <Link href="/test" className="flex min-h-[52px] items-center justify-center rounded-xl bg-amber font-display text-lg font-semibold uppercase tracking-wide text-ink">
              Open the combine
            </Link>
          ) : complete ? (
            <button onClick={undo} className="min-h-[44px] w-full rounded-xl border border-line text-sm text-muted">
              Mark not done
            </button>
          ) : (
            <button onClick={finish} className="min-h-[56px] w-full rounded-xl bg-amber font-display text-lg font-semibold uppercase tracking-wide text-ink">
              {slot.type === 'rest' ? 'Rest day honored' : 'Done'} · +{kind.xp} XP
            </button>
          )}
        </div>
      )}
    </article>
  );
}
