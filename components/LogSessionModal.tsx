'use client';

import React, { useState } from 'react';
import { Loader2, Shield, Target, X, Zap } from 'lucide-react';
import { Player, Session } from '@/lib/types';

type Draft = Omit<Session, 'id' | 'xpEarned'>;

const num = (v: string) => (v === '' ? 0 : Number(v));

function Field({
  label,
  value,
  onChange,
  step = '1',
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold text-sky-500 tracking-wider block mb-1 leading-tight">
        {label}
      </span>
      <input
        type="number"
        step={step}
        inputMode="decimal"
        value={value}
        placeholder="0"
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-950 border border-sky-800 rounded-lg px-3 py-2 text-white font-bold text-base focus:outline-none focus:border-sky-400"
      />
      {hint && <span className="text-[9px] text-sky-700 block mt-0.5">{hint}</span>}
    </label>
  );
}

function Toggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-xs font-black tracking-wider transition ${
        active
          ? 'bg-sky-900/70 border-sky-500 text-white'
          : 'bg-slate-950 border-slate-800 text-slate-500'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function LogSessionModal({
  player,
  saving = false,
  onClose,
  onSave,
}: {
  player: Player;
  saving?: boolean;
  onClose: () => void;
  onSave: (draft: Draft) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [usePitching, setUsePitching] = useState(true);
  const [useFielding, setUseFielding] = useState(true);
  const [useHitting, setUseHitting] = useState(true);

  const [p, setP] = useState({ totalPitches: '', strikes: '', avgSpeed: '', topSpeed: '' });
  const [f, setF] = useState({
    popFlies: '',
    frontGrounders: '',
    backhand: '',
    gloveSide: '',
    gloveSideTurns: '',
    backhandTurns: '',
    cleanReps: '',
  });
  const [h, setH] = useState({
    swings: '',
    batSpeed: '',
    peakHandSpeed: '',
    rotationalAcceleration: '',
    onPlaneEfficiency: '',
    attackAngle: '',
    verticalBatAngle: '',
    earlyConnection: '',
    connectionAtImpact: '',
    timeToContact: '',
    power: '',
    blastFactor: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const draft: Draft = { playerId: player.id, date, notes: notes.trim() || undefined };

    if (usePitching) {
      draft.pitching = {
        totalPitches: num(p.totalPitches),
        strikes: Math.min(num(p.strikes), num(p.totalPitches) || num(p.strikes)),
        avgSpeed: num(p.avgSpeed),
        topSpeed: num(p.topSpeed),
      };
    }
    if (useFielding) {
      draft.fielding = {
        popFlies: num(f.popFlies),
        frontGrounders: num(f.frontGrounders),
        backhand: num(f.backhand),
        gloveSide: num(f.gloveSide),
        gloveSideTurns: num(f.gloveSideTurns),
        backhandTurns: num(f.backhandTurns),
        cleanReps: num(f.cleanReps),
      };
    }
    if (useHitting) {
      draft.hitting = {
        swings: num(h.swings),
        batSpeed: num(h.batSpeed),
        peakHandSpeed: num(h.peakHandSpeed),
        rotationalAcceleration: num(h.rotationalAcceleration),
        onPlaneEfficiency: num(h.onPlaneEfficiency),
        attackAngle: num(h.attackAngle),
        verticalBatAngle: num(h.verticalBatAngle),
        earlyConnection: num(h.earlyConnection),
        connectionAtImpact: num(h.connectionAtImpact),
        timeToContact: num(h.timeToContact),
        power: num(h.power),
        blastFactor: num(h.blastFactor),
      };
    }

    onSave(draft);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 overflow-y-auto">
      <form
        onSubmit={submit}
        className="bg-slate-900 border border-sky-800 rounded-3xl w-full max-w-3xl my-4 animate-slideUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-sky-900 sticky top-0 bg-slate-900 rounded-t-3xl z-10">
          <div>
            <h2 className="text-xl font-black text-white">LOG WORKOUT</h2>
            <p className="text-xs text-sky-400 font-medium">{player.nickname}</p>
          </div>
          <button type="button" onClick={onClose} className="text-sky-500 hover:text-white p-1">
            <X />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Date */}
          <label className="block">
            <span className="text-[10px] font-bold text-sky-500 tracking-wider block mb-1">
              SESSION DATE
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full sm:w-56 bg-slate-950 border border-sky-800 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-sky-400"
            />
          </label>

          {/* Which phases */}
          <div className="flex gap-2">
            <Toggle
              active={usePitching}
              onClick={() => setUsePitching((v) => !v)}
              icon={<Target className="w-4 h-4" />}
              label="PITCHING"
            />
            <Toggle
              active={useFielding}
              onClick={() => setUseFielding((v) => !v)}
              icon={<Shield className="w-4 h-4" />}
              label="FIELDING"
            />
            <Toggle
              active={useHitting}
              onClick={() => setUseHitting((v) => !v)}
              icon={<Zap className="w-4 h-4" />}
              label="HITTING"
            />
          </div>

          {/* Pitching */}
          {usePitching && (
            <fieldset className="bg-sky-950/40 border border-sky-900 rounded-2xl p-4">
              <legend className="text-xs font-black text-orange-300 tracking-wider px-2">
                PITCHING
              </legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Field
                  label="TOTAL PITCHES"
                  value={p.totalPitches}
                  onChange={(v) => setP({ ...p, totalPitches: v })}
                />
                <Field label="STRIKES" value={p.strikes} onChange={(v) => setP({ ...p, strikes: v })} />
                <Field
                  label="AVG SPEED (MPH)"
                  value={p.avgSpeed}
                  onChange={(v) => setP({ ...p, avgSpeed: v })}
                  step="0.1"
                  hint="Average of the session"
                />
                <Field
                  label="TOP SPEED (MPH)"
                  value={p.topSpeed}
                  onChange={(v) => setP({ ...p, topSpeed: v })}
                  step="0.1"
                  hint="Fastest pitch"
                />
              </div>
            </fieldset>
          )}

          {/* Fielding */}
          {useFielding && (
            <fieldset className="bg-sky-950/40 border border-sky-900 rounded-2xl p-4">
              <legend className="text-xs font-black text-sky-300 tracking-wider px-2">
                FIELDING REPS
              </legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Field label="POP FLIES" value={f.popFlies} onChange={(v) => setF({ ...f, popFlies: v })} />
                <Field
                  label="FRONT GROUNDERS"
                  value={f.frontGrounders}
                  onChange={(v) => setF({ ...f, frontGrounders: v })}
                />
                <Field label="BACKHAND" value={f.backhand} onChange={(v) => setF({ ...f, backhand: v })} />
                <Field
                  label="GLOVE SIDE"
                  value={f.gloveSide}
                  onChange={(v) => setF({ ...f, gloveSide: v })}
                />
                <Field
                  label="GLOVE SIDE TURNS"
                  value={f.gloveSideTurns}
                  onChange={(v) => setF({ ...f, gloveSideTurns: v })}
                />
                <Field
                  label="BACKHAND TURNS"
                  value={f.backhandTurns}
                  onChange={(v) => setF({ ...f, backhandTurns: v })}
                />
                <Field
                  label="CLEAN REPS"
                  value={f.cleanReps}
                  onChange={(v) => setF({ ...f, cleanReps: v })}
                  hint="Reps fielded cleanly"
                />
              </div>
            </fieldset>
          )}

          {/* Hitting / Blast */}
          {useHitting && (
            <fieldset className="bg-sky-950/40 border border-sky-900 rounded-2xl p-4">
              <legend className="text-xs font-black text-yellow-300 tracking-wider px-2">
                HITTING — BLAST MOTION SESSION AVERAGES
              </legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Field label="SWINGS" value={h.swings} onChange={(v) => setH({ ...h, swings: v })} />
                <Field
                  label="BAT SPEED (MPH)"
                  value={h.batSpeed}
                  onChange={(v) => setH({ ...h, batSpeed: v })}
                  step="0.1"
                />
                <Field
                  label="PEAK HAND SPEED"
                  value={h.peakHandSpeed}
                  onChange={(v) => setH({ ...h, peakHandSpeed: v })}
                  step="0.1"
                />
                <Field
                  label="ROTATIONAL ACCEL (g)"
                  value={h.rotationalAcceleration}
                  onChange={(v) => setH({ ...h, rotationalAcceleration: v })}
                  step="0.1"
                />
                <Field
                  label="ON PLANE EFF. (%)"
                  value={h.onPlaneEfficiency}
                  onChange={(v) => setH({ ...h, onPlaneEfficiency: v })}
                  step="1"
                />
                <Field
                  label="ATTACK ANGLE (°)"
                  value={h.attackAngle}
                  onChange={(v) => setH({ ...h, attackAngle: v })}
                  step="0.1"
                />
                <Field
                  label="VERT BAT ANGLE (°)"
                  value={h.verticalBatAngle}
                  onChange={(v) => setH({ ...h, verticalBatAngle: v })}
                  step="0.1"
                  hint="Usually negative"
                />
                <Field
                  label="EARLY CONNECTION (°)"
                  value={h.earlyConnection}
                  onChange={(v) => setH({ ...h, earlyConnection: v })}
                  step="0.1"
                />
                <Field
                  label="CONN. AT IMPACT (°)"
                  value={h.connectionAtImpact}
                  onChange={(v) => setH({ ...h, connectionAtImpact: v })}
                  step="0.1"
                />
                <Field
                  label="TIME TO CONTACT (S)"
                  value={h.timeToContact}
                  onChange={(v) => setH({ ...h, timeToContact: v })}
                  step="0.01"
                />
                <Field
                  label="POWER (kW)"
                  value={h.power}
                  onChange={(v) => setH({ ...h, power: v })}
                  step="0.1"
                />
                <Field
                  label="BLAST FACTOR"
                  value={h.blastFactor}
                  onChange={(v) => setH({ ...h, blastFactor: v })}
                />
              </div>
            </fieldset>
          )}

          {/* Notes */}
          <label className="block">
            <span className="text-[10px] font-bold text-sky-500 tracking-wider block mb-1">
              COACH NOTES (OPTIONAL)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Worked on staying through the ball..."
              className="w-full bg-slate-950 border border-sky-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-400"
            />
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-sky-900 sticky bottom-0 bg-slate-900 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-3 rounded-xl border border-sky-800 text-sky-300 font-bold hover:bg-sky-950 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-300 text-slate-950 font-black tracking-wide py-3 rounded-xl hover:brightness-110 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'SAVING…' : 'SAVE & EARN XP'}
          </button>
        </div>
      </form>
    </div>
  );
}
