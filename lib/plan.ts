'use client';
import { addDays } from './dates';
import { RETESTS, WEEK_TEMPLATES, SlotType } from './program';
import { phaseFor } from './calc';
import { addMany, Rec } from './store';

/** Fill a week (Monday ws) with the phase template for both players. */
export async function fillWeek(ws: string) {
  const phase = phaseFor(ws);
  const tpl = WEEK_TEMPLATES[phase.id];
  const rows: Omit<Rec, 'id' | 'createdAt'>[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(ws, i);
    const retest = RETESTS.find((r) => r.date === date);
    const types: SlotType[] = retest ? ['combine'] : tpl[i];
    types.forEach((type, order) => rows.push({ kind: 'slot', playerId: null, date, data: { type, order, note: retest ? retest.label : '' } }));
  }
  await addMany(rows);
}

export const hasSlotsInWeek = (recs: Rec[], ws: string) => {
  const end = addDays(ws, 6);
  return recs.some((r) => r.kind === 'slot' && r.date >= ws && r.date <= end);
};
