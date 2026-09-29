'use client';

import { useTranslations } from 'next-intl';
import { addDays, daysBetween, percentFor, TASK_INFO_COL_PX, type TimelineScale } from './timeline-scale';

/**
 * Continuous vertical week lines + a "today" line, drawn ONCE as a single overlay spanning the header
 * and every row below it (mounted by the caller in a `position: relative` wrapper around both) — not
 * redrawn per row. A grid that only exists inside each row's own thin strip reads as a stack of small
 * decorations; one grid running the full height of the list is what makes it read as a Gantt chart.
 * Offset by TASK_INFO_COL_PX so it only covers the Gantt column, not the task-info column beside it.
 */
export function TimelineGrid({ scale }: { scale: TimelineScale }) {
  const totalDays = daysBetween(scale.start, scale.end);
  const todayPercent = percentFor(new Date(), scale);

  const weekLines: number[] = [];
  for (let i = 0; i <= totalDays; i++) {
    const day = addDays(scale.start, i);
    if (day.getDay() === 1) weekLines.push(percentFor(day, scale));
  }

  return (
    <div
      className="pointer-events-none absolute inset-y-0 z-0 hidden sm:block"
      style={{ left: TASK_INFO_COL_PX, right: 0 }}
      aria-hidden="true"
    >
      {weekLines.map((left, i) => (
        <span key={i} className="absolute inset-y-0 w-px bg-line" style={{ left: `${left}%` }} />
      ))}
      <span className="absolute inset-y-0 w-0.5 bg-action-primary" style={{ left: `${todayPercent}%` }} />
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
    <div className="hidden items-stretch sm:flex">
      <div style={{ width: TASK_INFO_COL_PX }} className="shrink-0" />
      <div className="relative h-6 flex-1 border-b border-l border-line">
        {labels.map((d, i) => (
          <span
            key={i}
            className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-ink-muted"
            style={{ left: `${percentFor(d, scale)}%` }}
          >
            {d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', timeZone: 'UTC' })}
          </span>
        ))}
        <span
          className="absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-b-sm bg-action-primary px-1 text-[10px] font-semibold text-ink-on-primary"
          style={{ left: `${percentFor(new Date(), scale)}%` }}
        >
          {t('today')}
        </span>
      </div>
    </div>
  );
}
