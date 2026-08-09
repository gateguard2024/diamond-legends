'use client';

import React from 'react';

export function SectionCard({
  title,
  icon,
  accentText = 'text-sky-300',
  children,
  right,
}: {
  title: string;
  icon: React.ReactNode;
  accentText?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="p-4 sm:p-5 bg-sky-950/40 rounded-2xl border border-sky-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm sm:text-base font-bold ${accentText} flex items-center gap-2`}>
          {icon}
          {title}
        </h3>
        {right}
      </div>
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  suffix,
  highlight = false,
  span = false,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  highlight?: boolean;
  span?: boolean;
}) {
  return (
    <div
      className={[
        'bg-sky-950 border p-2.5 rounded-lg text-center',
        highlight ? 'border-amber-500/60 shadow-[0_0_18px_-6px] shadow-amber-500/60' : 'border-sky-800',
        span ? 'col-span-2' : '',
      ].join(' ')}
    >
      <div className="text-xl sm:text-2xl font-black text-white leading-none">
        {value}
        {suffix ? <span className="text-sm text-sky-400 font-bold ml-0.5">{suffix}</span> : null}
      </div>
      <div className="text-[9px] sm:text-[10px] text-sky-500 font-bold tracking-wider mt-1.5 leading-tight">
        {label}
      </div>
    </div>
  );
}

/** Simple bar chart. Values are normalized against the max in the set. */
export function BarTrend({
  data,
  label,
  from = 'from-orange-600',
  to = 'to-amber-300',
  format = (n: number) => String(Math.round(n)),
}: {
  data: { label: string; value: number }[];
  label: string;
  from?: string;
  to?: string;
  format?: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="bg-sky-950 p-3 rounded-lg border border-sky-800 flex flex-col">
      <div className="text-[10px] text-sky-500 font-bold mb-2 tracking-wider">{label}</div>
      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[11px] text-sky-700 py-4">
          No sessions logged yet
        </div>
      ) : (
        <>
          <div className="flex items-end gap-1.5 h-24">
            {data.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end h-full group relative">
                <div className="text-[9px] text-sky-400 font-bold text-center mb-1">
                  {format(d.value)}
                </div>
                <div
                  className={`w-full bg-gradient-to-t ${from} ${to} rounded-t-md transition-all duration-500 min-h-[3px]`}
                  style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 mt-1.5">
            {data.map((d, i) => (
              <div key={i} className="flex-1 text-[9px] text-sky-600 font-bold text-center">
                {d.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Compact SVG line chart with an optional dashed target line.
 * Renders "progress over time" for a single metric.
 */
export function LineChart({
  points,
  target,
  stroke = '#38bdf8',
  fill = 'rgba(56,189,248,0.18)',
  decimals = 0,
  unit = '',
  height = 150,
}: {
  points: { label: string; value: number }[];
  target?: number | null;
  stroke?: string;
  fill?: string;
  decimals?: number;
  unit?: string;
  height?: number;
}) {
  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-sky-700 border border-dashed border-sky-900 rounded-xl"
        style={{ height }}
      >
        No data yet — log a session to start the chart
      </div>
    );
  }

  const W = 320;
  const H = height;
  const padX = 6;
  const padY = 14;

  const values = points.map((p) => p.value);
  const candidates = target != null ? [...values, target] : values;
  let min = Math.min(...candidates);
  let max = Math.max(...candidates);
  if (max === min) {
    max = max + 1;
    min = min - 1;
  }
  const range = max - min;
  min -= range * 0.12;
  max += range * 0.12;

  const x = (i: number) =>
    points.length === 1 ? W / 2 : padX + (i / (points.length - 1)) * (W - padX * 2);
  const y = (v: number) => padY + (1 - (v - min) / (max - min)) * (H - padY * 2);

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.value)}`).join(' ');
  const area = `${line} L ${x(points.length - 1)} ${H - padY} L ${x(0)} ${H - padY} Z`;
  const last = points[points.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        {points.length > 1 && <path d={area} fill={fill} />}
        <path d={line} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />
        {target != null && (
          <line
            x1={0}
            x2={W}
            y1={y(target)}
            y2={y(target)}
            stroke="#fbbf24"
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
        )}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(p.value)}
            r={i === points.length - 1 ? 4 : 2.5}
            fill={i === points.length - 1 ? '#fff' : stroke}
            stroke={stroke}
            strokeWidth={1.5}
          />
        ))}
      </svg>

      <div className="flex justify-between items-center mt-1.5">
        <span className="text-[10px] text-sky-600 font-bold">{points[0].label}</span>
        {target != null && (
          <span className="text-[10px] text-amber-400 font-bold">
            — — goal {target.toFixed(decimals)}
            {unit}
          </span>
        )}
        <span className="text-[10px] text-white font-bold">
          {last.label}: {last.value.toFixed(decimals)}
          {unit}
        </span>
      </div>
    </div>
  );
}

export function ProgressRing({ progress }: { progress: number }) {
  const pct = Math.round(progress * 100);
  return (
    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mt-1.5">
      <div
        className="h-full bg-gradient-to-r from-sky-500 to-cyan-300 rounded-full"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
