'use client';

import React from 'react';
import { Shield, Sparkles, Target, Trophy, X, Zap } from 'lucide-react';
import { xpForLevel } from '@/lib/gamification';

/**
 * The scoring rules, written for a 9-year-old. Open it and hand them the
 * phone — that's the whole point of this screen.
 */

const RULES: {
  group: string;
  icon: React.ReactNode;
  accent: string;
  items: { what: string; xp: string }[];
}[] = [
  {
    group: 'Just showing up',
    icon: <Sparkles className="w-4 h-4" />,
    accent: 'text-amber-300',
    items: [
      { what: 'Log any workout', xp: '+20' },
      { what: 'Do all three — batting, pitching AND fielding in one day', xp: '+50 bonus' },
    ],
  },
  {
    group: 'Batting',
    icon: <Zap className="w-4 h-4" />,
    accent: 'text-yellow-300',
    items: [
      { what: 'Every swing you track', xp: '+1 each' },
      { what: 'Session On Plane Efficiency of 70% or better', xp: '+25' },
      { what: 'New best bat speed average', xp: '+50' },
    ],
  },
  {
    group: 'Pitching',
    icon: <Target className="w-4 h-4" />,
    accent: 'text-orange-300',
    items: [
      { what: 'Every pitch you throw', xp: '+1 each' },
      { what: 'Every strike', xp: '+2 each' },
      { what: '60%+ strikes on 20 or more pitches', xp: '+25' },
      { what: 'New best average velo', xp: '+50' },
      { what: 'New best top velo', xp: '+50' },
    ],
  },
  {
    group: 'Fielding',
    icon: <Shield className="w-4 h-4" />,
    accent: 'text-sky-300',
    items: [
      { what: 'Every ball hit at you', xp: '+2 each' },
      { what: 'Every ball you field clean', xp: '+1 extra' },
      { what: 'Every throw on target', xp: '+2 each' },
      { what: '50 or more chances in one session', xp: '+25' },
      { what: '90%+ catch rate on 20+ chances', xp: '+25' },
      { what: '85%+ throwing accuracy on 20+ throws', xp: '+25' },
    ],
  },
];

export default function PointsExplainer({ onClose }: { onClose: () => void }) {
  const sampleLevels = [1, 2, 3, 5, 10, 20];

  return (
    <div className="fixed inset-0 z-[75] bg-black/85 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-sky-800 rounded-3xl w-full max-w-2xl my-4 animate-slideUp">
        <div className="flex items-center justify-between p-5 border-b border-sky-900 sticky top-0 bg-slate-900 rounded-t-3xl z-10">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> HOW POINTS WORK
            </h2>
            <p className="text-xs text-sky-400 font-medium">Every rule, no secrets</p>
          </div>
          <button onClick={onClose} className="text-sky-500 hover:text-white p-1">
            <X />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-sm text-sky-200 bg-sky-950/60 border border-sky-800 rounded-xl p-3.5">
            You earn <strong className="text-amber-300">XP</strong> for work you actually do. More
            XP means a higher <strong className="text-white">Level</strong>. The fastest way to
            level up isn&apos;t one huge day — it&apos;s showing up over and over.
          </p>

          {RULES.map((group) => (
            <div key={group.group}>
              <h3
                className={`text-xs font-black tracking-wider mb-2 flex items-center gap-2 ${group.accent}`}
              >
                {group.icon}
                {group.group.toUpperCase()}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <div
                    key={item.what}
                    className="flex items-center justify-between gap-3 bg-slate-950 border border-sky-900 rounded-lg px-3 py-2"
                  >
                    <span className="text-xs text-sky-200">{item.what}</span>
                    <span className="text-xs font-black text-amber-300 shrink-0">{item.xp}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Levels */}
          <div>
            <h3 className="text-xs font-black tracking-wider mb-2 text-indigo-300">LEVELING UP</h3>
            <div className="bg-slate-950 border border-sky-900 rounded-xl p-3.5">
              <p className="text-xs text-sky-300 mb-3">
                Each level costs a little more than the last one:
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {sampleLevels.map((lvl) => (
                  <div key={lvl} className="text-center bg-sky-950 border border-sky-800 rounded-lg py-2">
                    <div className="text-[9px] text-sky-600 font-bold">LEVEL {lvl}</div>
                    <div className="text-sm font-black text-white">{xpForLevel(lvl)} XP</div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-sky-500 mt-3">
                Ranks: <span className="text-white font-bold">Rookie</span> (1-9) →{' '}
                <span className="text-white font-bold">Pro</span> (10-24) →{' '}
                <span className="text-white font-bold">All-Star</span> (25-39) →{' '}
                <span className="text-amber-300 font-bold">Hall of Famer</span> (40+)
              </p>
            </div>
          </div>

          {/* Worked example */}
          <div>
            <h3 className="text-xs font-black tracking-wider mb-2 text-emerald-300">
              REAL EXAMPLE
            </h3>
            <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-xl p-3.5 space-y-1.5">
              <p className="text-xs text-emerald-200 font-bold mb-2">
                A full workout: 40 swings, 30 pitches with 19 strikes, 25 ground balls with 22
                clean and 20 throws with 17 on target.
              </p>
              {[
                ['Showed up', '+20'],
                ['40 swings', '+40'],
                ['30 pitches', '+30'],
                ['19 strikes × 2', '+38'],
                ['63% strikes on 20+ pitches', '+25'],
                ['25 chances × 2', '+50'],
                ['22 clean × 1', '+22'],
                ['17 on-target throws × 2', '+34'],
                ['88% catch rate on 20+ chances', '—'],
                ['85% throwing accuracy on 20 throws', '+25'],
                ['All three phases in one day', '+50'],
              ].map(([label, xp]) => (
                <div key={label} className="flex justify-between text-[11px]">
                  <span className="text-sky-300">{label}</span>
                  <span className="font-bold text-emerald-300">{xp}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-emerald-800/60 pt-2 mt-2">
                <span className="text-xs font-black text-white">TOTAL</span>
                <span className="text-base font-black text-amber-300">334 XP</span>
              </div>
              <p className="text-[10px] text-emerald-400/80 pt-1">
                That&apos;s Level 1 and 2 cleared in a single workout — plus another +50 for every
                personal best set that day.
              </p>
            </div>
          </div>

          <p className="text-[11px] text-sky-600 text-center">
            Badges and milestones don&apos;t give XP — they&apos;re trophies. Goals don&apos;t
            either. XP is purely for the work.
          </p>
        </div>

        <div className="p-5 border-t border-sky-900">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-300 text-slate-950 font-black py-3 rounded-xl hover:brightness-110"
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
}
