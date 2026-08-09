'use client';

import React, { useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { Player } from '@/lib/types';
import { displayName } from '@/lib/players';

/**
 * The name block at the top of a player card. Tap the pencil to edit the
 * jersey number and slogan inline.
 */
export default function PlayerIdentityEditor({
  player,
  onSave,
}: {
  player: Player;
  onSave: (patch: { number: number; slogan: string }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [number, setNumber] = useState(String(player.number));
  const [slogan, setSlogan] = useState(player.slogan);

  const open = () => {
    setNumber(String(player.number));
    setSlogan(player.slogan);
    setEditing(true);
  };

  const commit = () => {
    const parsed = parseInt(number, 10);
    onSave({
      number: Number.isNaN(parsed) ? player.number : Math.max(0, Math.min(99, parsed)),
      slogan: slogan.trim().slice(0, 24),
    });
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="flex items-start gap-1.5 min-w-0">
        <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight truncate">
          {displayName(player)}
        </h2>
        <button
          onClick={open}
          aria-label="Edit number and slogan"
          title="Edit number and slogan"
          className="text-slate-600 hover:text-amber-300 p-0.5 shrink-0 mt-1"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div>
        <span className="text-[9px] font-black text-sky-600 tracking-wider block">#</span>
        <input
          type="number"
          min={0}
          max={99}
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="w-12 bg-slate-950 border border-amber-500 rounded-md px-1.5 py-1 text-white font-black text-sm text-center focus:outline-none"
        />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[9px] font-black text-sky-600 tracking-wider block">SLOGAN</span>
        <input
          autoFocus
          type="text"
          maxLength={24}
          value={slogan}
          placeholder="The Slugger"
          onChange={(e) => setSlogan(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="w-full bg-slate-950 border border-amber-500 rounded-md px-2 py-1 text-white font-bold text-sm focus:outline-none placeholder:text-slate-700"
        />
      </div>
      <button onClick={commit} className="text-emerald-400 p-1 mt-3" aria-label="Save">
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={() => setEditing(false)}
        className="text-slate-500 p-1 mt-3"
        aria-label="Cancel"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
