'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import PlayerSwitch from '@/components/PlayerSwitch';
import SlotCard from '@/components/SlotCard';
import { Bar, Button, Card, Eyebrow, Icon, Sheet, Toast } from '@/components/ui';
import { armStatus, closestBadge, levelFor, phaseFor, slotsForPlayerOn, slotsFrom, streakFor, xpFor } from '@/lib/calc';
import { addDays, long, today, weekStart } from '@/lib/dates';
import { fillWeek, hasSlotsInWeek } from '@/lib/plan';
import { PITCH_SMART, SLOT_KINDS, SlotType, playerById } from '@/lib/program';
import { addRecord, removeRecord } from '@/lib/store';
import { usePlayer, useRecords } from '@/lib/useData';

export default function TodayPage() {
  const { recs, ready } = useRecords();
  const [pid, setPid] = usePlayer();
  const [date, setDate] = useState(today());
  const [toast, setToast] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pitchOpen, setPitchOpen] = useState(false);
  const [pitchCount, setPitchCount] = useState('');
  const player = playerById(pid);

  const slots = useMemo(() => slotsForPlayerOn(slotsFrom(recs), pid, date), [recs, pid, date]);
  const doneFor = (slotId: string) => recs.find((r) => r.kind === 'done' && r.playerId === pid && r.data.slotId === slotId);
  const xp = xpFor(recs, pid);
  const lvl = levelFor(xp);
  const streak = streakFor(recs, pid);
  const arm = armStatus(recs, pid, date);
  const badge = closestBadge(recs, pid);
  const phase = phaseFor(date);
  const ws = weekStart(date);
  const weekPlanned = hasSlotsInWeek(recs, ws);
  const sleptRec = recs.find((r) => r.kind === 'sleep' && r.playerId === pid && r.date === date);
  const doneCount = slots.filter((s) => doneFor(s.id)?.data.complete).length;
  const isToday = date === today();

  async function addSlot(type: SlotType) {
    await addRecord('slot', pid, date, { type, order: slots.length, note: '' });
    setAdding(false);
  }

  async function logPitches() {
    const n = Number(pitchCount);
    if (n > 0) {
      await addRecord('pitches', pid, date, { count: n, innings: 0, context: 'bullpen' });
      setToast(`${n} pitches logged`);
    }
    setPitchCount('');
    setPitchOpen(false);
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PlayerSwitch value={pid} onChange={setPid} />

      <div className="flex items-center justify-between gap-2">
        <button onClick={() => setDate(addDays(date, -1))} className="grid h-11 w-11 place-items-center rounded-full border border-line text-muted" aria-label="Previous day">
          <Icon name="chevL" />
        </button>
        <div className="text-center">
          <div className="font-display text-2xl font-semibold uppercase tracking-wide">{isToday ? `Let's go, ${player.name}` : long(date)}</div>
          <div className="text-[13px] text-muted">
            {isToday ? long(date) + ' · ' : ''}
            {phase.name}
          </div>
        </div>
        <button onClick={() => setDate(addDays(date, 1))} className="grid h-11 w-11 place-items-center rounded-full border border-line text-muted" aria-label="Next day">
          <Icon name="chevR" />
        </button>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Card className="!p-3.5">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-lg font-semibold uppercase tracking-wide">{lvl.level.name}</span>
            <span className="font-mono text-sm">
              <strong>{xp.toLocaleString()}</strong>
              {lvl.next ? ` / ${lvl.next.xp.toLocaleString()}` : ''} XP
            </span>
          </div>
          <div className="mt-2">
            <Bar pct={lvl.pct} color={player.color} h={10} />
          </div>
          <div className="mt-1.5 text-xs text-muted">{lvl.next ? `Next: ${lvl.next.name}` : 'Max level!'}</div>
        </Card>
        <Card className="!p-3.5 text-center">
          <span className="text-amber">
            <Icon name="flame" size={24} className="mx-auto" />
          </span>
          <div className="font-mono text-xl font-semibold leading-none">{streak}</div>
          <div className="text-[11px] text-muted">day streak</div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold uppercase tracking-wide">{isToday ? 'Today' : 'This day'}</h2>
        <span className="text-sm text-muted">{slots.length ? `${doneCount} of ${slots.length} done` : ''}</span>
      </div>

      {!ready ? (
        <Card>
          <p className="text-muted">Loading…</p>
        </Card>
      ) : slots.length === 0 ? (
        <Card className="space-y-3 text-center">
          {weekPlanned ? (
            <p className="text-muted">Nothing planned for {player.name} on this day.</p>
          ) : (
            <>
              <p className="text-muted">This week isn&apos;t planned yet.</p>
              <Button onClick={() => fillWeek(ws)} className="w-full">
                Load the {phase.name.toLowerCase()} week
              </Button>
            </>
          )}
          <Button kind="quiet" onClick={() => setAdding(true)} className="w-full">
            + Add a training slot
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {slots.map((s) => (
            <SlotCard
              key={`${s.id}-${pid}`}
              slot={s}
              playerId={pid}
              date={date}
              done={doneFor(s.id)}
              arm={arm}
              onXp={setToast}
              startOpen={s.id === slots.find((x) => !doneFor(x.id)?.data.complete)?.id}
            />
          ))}
          <Button kind="quiet" onClick={() => setAdding(true)} className="w-full">
            + Add a slot (unplanned work)
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={async () => {
            if (sleptRec) await removeRecord(sleptRec.id);
            else {
              await addRecord('sleep', pid, date, {});
              setToast('+3 XP · good sleep');
            }
          }}
          aria-pressed={Boolean(sleptRec)}
          className={`min-h-[64px] rounded-2xl border px-3 text-left ${sleptRec ? 'border-teal bg-teal/10' : 'border-line bg-panel'}`}
        >
          <span className="block text-[15px] font-semibold">{sleptRec ? 'Slept 9+ hrs ✓' : 'Slept 9+ hrs?'}</span>
          <span className="block text-xs text-muted">Tap for +3 XP</span>
        </button>
        <button onClick={() => setPitchOpen(true)} className="min-h-[64px] rounded-2xl border border-line bg-panel px-3 text-left">
          <span className="block text-[15px] font-semibold">Log pitches</span>
          <span className="block text-xs" style={{ color: arm.canThrowHard ? '#4FC3B8' : '#F07B3F' }}>
            {arm.message}
          </span>
        </button>
      </div>

      {badge && (
        <Card accent className="flex items-center gap-4">
          <span className="text-amber">
            <Icon name="star" size={40} />
          </span>
          <div className="min-w-0 flex-1">
            <Eyebrow>Closest badge</Eyebrow>
            <div className="font-display text-lg font-semibold uppercase">{badge.name}</div>
            <div className="text-sm">
              {badge.now} · <strong className="text-amber">{badge.toGo}</strong>
            </div>
            <div className="mt-2">
              <Bar pct={badge.pct} h={6} />
            </div>
          </div>
        </Card>
      )}

      <Link href="/test" className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-amber font-display text-lg font-semibold uppercase tracking-wide text-ink">
        <Icon name="stopwatch" /> Log a test / new PR · +50 XP
      </Link>

      <Sheet open={adding} onClose={() => setAdding(false)} title={`Add for ${player.name}`}>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(SLOT_KINDS) as SlotType[]).map((t) => (
            <button key={t} onClick={() => addSlot(t)} className="min-h-[56px] rounded-xl border border-line bg-ink px-3 text-left hover:border-amber">
              <span className="block text-[15px] font-semibold">{SLOT_KINDS[t].label}</span>
              <span className="block text-xs text-muted">
                {SLOT_KINDS[t].runner} · +{SLOT_KINDS[t].xp} XP
              </span>
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={pitchOpen} onClose={() => setPitchOpen(false)} title="Log pitches">
        <p className="mb-3 text-sm text-muted">Bullpens, lessons and rec games all count toward Pitch Smart rest. Daily max: {PITCH_SMART.dailyMax}.</p>
        <input
          inputMode="numeric"
          autoFocus
          value={pitchCount}
          onChange={(e) => setPitchCount(e.target.value.replace(/\D/g, ''))}
          placeholder="Pitches"
          className="h-16 w-full rounded-2xl border border-line bg-ink px-4 text-center font-mono text-3xl text-chalk"
        />
        <Button onClick={logPitches} className="mt-3 w-full">
          Save
        </Button>
      </Sheet>

      <Toast text={toast} onDone={() => setToast(null)} />
    </div>
  );
}
