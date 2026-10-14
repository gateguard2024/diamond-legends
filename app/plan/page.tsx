'use client';
import { useMemo, useState } from 'react';
import { Button, Card, Eyebrow, Icon, Sheet } from '@/components/ui';
import { SlotRec, phaseFor, slotsFrom, weekWarnings } from '@/lib/calc';
import { DAY_NAMES, addDays, short, today, weekStart } from '@/lib/dates';
import { fillWeek } from '@/lib/plan';
import { PLAYERS, RUNNER_STYLE, SLOT_KINDS, SlotType, playerById, FLEX_RULES } from '@/lib/program';
import { addRecord, removeRecord, updateRecord } from '@/lib/store';
import { useRecords } from '@/lib/useData';

export default function PlanPage() {
  const { recs } = useRecords();
  const [ws, setWs] = useState(weekStart(today()));
  const [sel, setSel] = useState<SlotRec | null>(null);
  const [addDay, setAddDay] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const end = days[6];
  const slots = useMemo(() => slotsFrom(recs).filter((s) => s.date >= ws && s.date <= end), [recs, ws, end]);
  const phase = phaseFor(ws);
  const warnings = PLAYERS.map((p) => ({ p, w: weekWarnings(recs, p.id, ws) })).filter((x) => x.w.length);
  const t = today();

  const move = (id: string, date: string) => updateRecord(id, { date });

  function chip(s: SlotRec) {
    const k = SLOT_KINDS[s.type];
    const st = RUNNER_STYLE[k.runner];
    const who = s.playerId ? playerById(s.playerId) : null;
    return (
      <button
        key={s.id}
        draggable
        onDragStart={(e) => {
          setDragId(s.id);
          e.dataTransfer.setData('text/plain', s.id);
        }}
        onDragEnd={() => setDragId(null)}
        onClick={() => setSel(s)}
        className={`flex min-h-[48px] w-full cursor-grab items-center gap-2 rounded-xl px-3 py-2 text-left ${dragId === s.id ? 'opacity-40' : ''}`}
        style={{ background: st.bg === 'transparent' ? 'transparent' : st.bg, color: st.fg, border: st.bg === 'transparent' ? '1px dashed #2A3F5E' : undefined }}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold leading-tight">{k.label}</span>
          <span className="block text-[11px] opacity-75">
            {who ? who.name : 'Both'}
            {k.minutes ? ` · ${k.minutes}m` : ''}
            {s.note ? ` · ${s.note}` : ''}
          </span>
        </span>
        {who && <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: who.color, boxShadow: '0 0 0 2px #0E1A2B' }} />}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => setWs(addDays(ws, -7))} className="grid h-11 w-11 place-items-center rounded-full border border-line text-muted" aria-label="Previous week">
          <Icon name="chevL" />
        </button>
        <div className="text-center">
          <div className="font-display text-2xl font-semibold uppercase tracking-wide">Week of {short(ws)}</div>
          <div className="text-[13px] text-muted">{phase.name}</div>
        </div>
        <button onClick={() => setWs(addDays(ws, 7))} className="grid h-11 w-11 place-items-center rounded-full border border-line text-muted" aria-label="Next week">
          <Icon name="chevR" />
        </button>
      </div>

      {slots.length === 0 && (
        <Card className="space-y-3 text-center">
          <p className="text-muted">No plan for this week yet. Start from the {phase.name.toLowerCase()} template, then move things around.</p>
          <Button onClick={() => fillWeek(ws)} className="w-full sm:w-auto">
            Load template week
          </Button>
        </Card>
      )}

      {warnings.length > 0 && (
        <Card className="border-warn/50">
          <Eyebrow className="mb-1 text-warn">Flex-rule check</Eyebrow>
          <ul className="space-y-1 text-sm">
            {warnings.map(({ p, w }) =>
              w.map((x, k) => (
                <li key={p.id + k}>
                  <strong style={{ color: p.color }}>{p.name}:</strong> {x}
                </li>
              )),
            )}
          </ul>
        </Card>
      )}

      <p className="text-sm text-muted">
        <span className="md:hidden">Tap a slot to move it, assign it to one player, or delete it.</span>
        <span className="hidden md:inline">Drag slots between days, or click one to edit it.</span>
      </p>

      <div className="grid gap-3 md:grid-cols-7 md:gap-2">
        {days.map((d, i) => {
          const ds = slots.filter((s) => s.date === d);
          return (
            <div
              key={d}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain') || dragId;
                if (id) move(id, d);
                setDragId(null);
              }}
              className={`rounded-2xl border p-3 md:min-h-[260px] ${d === t ? 'border-amber bg-raised' : 'border-line bg-panel'}`}
            >
              <div className="mb-2 flex items-baseline justify-between">
                <span className="font-display text-lg font-semibold uppercase">{DAY_NAMES[i]}</span>
                <span className="text-xs text-muted">{short(d)}</span>
              </div>
              <div className="space-y-2">
                {ds.length ? ds.map(chip) : <div className="rounded-xl border border-dashed border-line px-3 py-3 text-center text-xs text-muted">Free day</div>}
                <button onClick={() => setAddDay(d)} className="min-h-[44px] w-full rounded-xl text-sm text-muted hover:text-amber" aria-label={`Add a slot on ${DAY_NAMES[i]}`}>
                  + Add
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Card>
        <Eyebrow className="mb-2">Flex rules</Eyebrow>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted">
          {FLEX_RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      </Card>

      <Sheet open={Boolean(sel)} onClose={() => setSel(null)} title={sel ? SLOT_KINDS[sel.type].label : ''}>
        {sel && (
          <div className="space-y-5">
            <div>
              <Eyebrow className="mb-2">Move to</Eyebrow>
              <div className="grid grid-cols-7 gap-1.5">
                {days.map((d, i) => (
                  <button
                    key={d}
                    onClick={async () => {
                      await move(sel.id, d);
                      setSel({ ...sel, date: d });
                    }}
                    className={`min-h-[52px] rounded-xl border text-sm ${sel.date === d ? 'border-amber bg-amber font-semibold text-ink' : 'border-line'}`}
                  >
                    {DAY_NAMES[i].slice(0, 2)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Eyebrow className="mb-2">Who</Eyebrow>
              <div className="grid grid-cols-3 gap-2">
                {[{ id: null as string | null, name: 'Both' }, ...PLAYERS.map((p) => ({ id: p.id as string | null, name: p.name }))].map((o) => (
                  <button
                    key={o.name}
                    onClick={async () => {
                      await updateRecord(sel.id, { playerId: o.id });
                      setSel({ ...sel, playerId: o.id });
                    }}
                    className={`min-h-[48px] rounded-xl border ${sel.playerId === o.id ? 'border-amber bg-amber font-semibold text-ink' : 'border-line'}`}
                  >
                    {o.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Eyebrow className="mb-2">Change to</Eyebrow>
              <select
                value={sel.type}
                onChange={async (e) => {
                  const type = e.target.value as SlotType;
                  const rec = recs.find((r) => r.id === sel.id);
                  await updateRecord(sel.id, { data: { ...(rec?.data ?? {}), type } });
                  setSel({ ...sel, type });
                }}
                className="h-12 w-full rounded-xl border border-line bg-ink px-3 text-chalk"
              >
                {(Object.keys(SLOT_KINDS) as SlotType[]).map((k) => (
                  <option key={k} value={k}>
                    {SLOT_KINDS[k].label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              kind="danger"
              className="w-full"
              onClick={async () => {
                await removeRecord(sel.id);
                setSel(null);
              }}
            >
              Delete slot
            </Button>
          </div>
        )}
      </Sheet>

      <Sheet open={Boolean(addDay)} onClose={() => setAddDay(null)} title={addDay ? `Add on ${short(addDay)}` : ''}>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(SLOT_KINDS) as SlotType[]).map((k) => (
            <button
              key={k}
              onClick={async () => {
                if (addDay) await addRecord('slot', null, addDay, { type: k, order: 99, note: '' });
                setAddDay(null);
              }}
              className="min-h-[56px] rounded-xl border border-line bg-ink px-3 text-left hover:border-amber"
            >
              <span className="block text-[15px] font-semibold">{SLOT_KINDS[k].label}</span>
              <span className="block text-xs text-muted">
                {SLOT_KINDS[k].runner} · {SLOT_KINDS[k].minutes} min
              </span>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
