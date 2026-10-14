'use client';
import PlayerSwitch from '@/components/PlayerSwitch';
import { Bar, Card, Eyebrow, H1, Icon } from '@/components/ui';
import { badgesFor, bestStreak, levelFor, xpFor } from '@/lib/calc';
import { BADGES, LEVELS, playerById } from '@/lib/program';
import { usePlayer, useRecords } from '@/lib/useData';

export default function BadgesPage() {
  const { recs } = useRecords();
  const [pid, setPid] = usePlayer();
  const p = playerById(pid);
  const earned = badgesFor(recs, pid);
  const xp = xpFor(recs, pid);
  const lvl = levelFor(xp);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PlayerSwitch value={pid} onChange={setPid} />
      <H1>
        {p.name}&apos;s badges · {earned.size}/{BADGES.length}
      </H1>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {BADGES.map((b) => {
          const on = earned.has(b.id);
          return (
            <div key={b.id} className={`rounded-2xl border p-3 text-center ${on ? 'border-amber bg-raised' : 'border-line bg-ink text-muted'}`}>
              <span className={on ? 'text-amber' : 'text-line'}>
                <Icon name="star" size={34} className="mx-auto" />
              </span>
              <div className={`mt-1 text-[13px] font-semibold leading-tight ${on ? 'text-chalk' : ''}`}>{b.name}</div>
              <div className="mt-0.5 text-[11px]">{b.req}</div>
            </div>
          );
        })}
      </div>

      <Card>
        <Eyebrow className="mb-3">Levels · best streak {bestStreak(recs, pid)} days</Eyebrow>
        <ol className="space-y-2">
          {LEVELS.map((l, i) => {
            const reached = xp >= l.xp;
            const isCur = i === lvl.index;
            return (
              <li key={l.name} className="flex items-center gap-3">
                <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-semibold ${reached ? 'bg-amber text-ink' : 'border border-line text-muted'}`}>{i + 1}</span>
                <span className={`flex-1 ${isCur ? 'font-semibold' : reached ? '' : 'text-muted'}`}>{l.name}</span>
                <span className="font-mono text-sm text-muted">{l.xp.toLocaleString()} XP</span>
              </li>
            );
          })}
        </ol>
        {lvl.next && (
          <div className="mt-3">
            <Bar pct={lvl.pct} color={p.color} />
            <div className="mt-1 text-xs text-muted">
              {(lvl.next.xp - xp).toLocaleString()} XP to {lvl.next.name}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <Eyebrow className="mb-2">How XP works</Eyebrow>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          <li>Training slot done · +10</li>
          <li>Private lesson done · +15</li>
          <li>Game / pick-up · +10</li>
          <li>Bands + mobility · +5</li>
          <li>Rest day honored · +5</li>
          <li>Slept 9+ hours · +3</li>
          <li>New personal record · +50</li>
          <li>Combine / re-test day · +100</li>
        </ul>
        <p className="mt-2 text-xs text-muted">Brothers compete against their own numbers. Head-to-head is for fun games only — derby, target challenge, sprint relay.</p>
      </Card>
    </div>
  );
}
