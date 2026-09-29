'use client';

import { useTranslations } from 'next-intl';
import { addDays, daysBetween, percentFor, type TimelineScale } from './timeline-scale';

/** Weekend shading + a "today" line, shared by the header and every row so they read as one grid. */
export function TimelineGrid({ scale }: { scale: TimelineScale }) {
  const totalDays = daysBetween(scale.start, scale.end);
  const todayPercent = percentFor(new Date(), scale);

  const weekends: { left: number; width: number }[] = [];
  for (let i = 0; i <= totalDays; i++) {
    const day = addDays(scale.start, i);
    if (day.getDay() !== 0 && day.getDay() !== 6) continue;
    const left = percentFor(day, scale);
    weekends.push({ left, width: percentFor(addDays(day, 1), scale) - left });
  }

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {weekends.map((w, i) => (
        <span key={i} className="absolute inset-y-0 bg-surface-subtle" style={{ left: `${w.left}%`, width: `${w.width}%` }} />
      ))}
      <span className="absolute inset-y-0 w-px bg-action-primary/70" style={{ left: `${todayPercent}%` }} />
    </div>
  );
}

/** Date labels above the list, evenly spaced across the shared scale — no day/week/month zoom control, just this one fixed view. */
export function TimelineHeader({ scale }: { scale: TimelineScale }) {
  const t = useTranslations('tasks.list');
  const totalDays = daysBetween(scale.start, scale.end);
  const labelCount = Math.min(8, Math.max(3, Math.round(totalDays / 7) + 1));
  const step = totalDays / (labelCount - 1);
  const labels = Array.from({ length: labelCount }, (_, i) => addDays(scale.start, Math.round(i * step)));

  return (
    <div className="relative mb-1.5 h-9 overflow-hidden rounded-md">
      <TimelineGrid scale={scale} />
      {labels.map((d, i) => (
        <span
          key={i}
          className="absolute top-1 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-ink-muted"
          style={{ left: `${percentFor(d, scale)}%` }}
        >
          {d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', timeZone: 'UTC' })}
        </span>
      ))}
      <span
        className="absolute bottom-1 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-action-primary"
        style={{ left: `${percentFor(new Date(), scale)}%` }}
      >
        {t('today')}
      </span>
    </div>
  );
}
