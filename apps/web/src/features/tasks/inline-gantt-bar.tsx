'use client';

import { useTranslations } from 'next-intl';
import type { TaskDto } from '@pmtool/shared-types';
import { DAY_MS, STATUS_BAR_COLOR } from '../gantt/use-gantt-data';
import { formatDate } from '../../lib/date-input';

const WINDOW_DAYS = 14;
const TRACK_PX = 96;

/**
 * A small read-only strip showing where a task's start→due span falls within the next two weeks,
 * right on its own row — instead of a second, separate Gantt section listing every task again. Drag-
 * to-resize isn't offered here: the row's own date inputs already edit the same fields.
 */
export function InlineGanttBar({ task }: { task: TaskDto }) {
  const t = useTranslations('tasks.detail');
  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const windowEnd = new Date(windowStart.getTime() + WINDOW_DAYS * DAY_MS);

  const start = task.startDate ? new Date(task.startDate) : task.dueDate ? new Date(task.dueDate) : null;
  const end = task.dueDate ? new Date(task.dueDate) : start;
  if (!start || !end) return null;
  const taskStart = end < start ? end : start;
  const taskEnd = end < start ? start : end;

  // Entirely outside the window (already past, or further out than 2 weeks) — nothing useful to draw.
  if (taskEnd < windowStart || taskStart > windowEnd) return null;

  const span = windowEnd.getTime() - windowStart.getTime();
  const clip = (d: Date) => Math.min(Math.max(d.getTime(), windowStart.getTime()), windowEnd.getTime());
  const left = ((clip(taskStart) - windowStart.getTime()) / span) * TRACK_PX;
  const width = Math.max(4, ((clip(taskEnd) - clip(taskStart)) / span) * TRACK_PX);
  const todayLeft = ((now.getTime() - windowStart.getTime()) / span) * TRACK_PX;
  const color = STATUS_BAR_COLOR[task.status];
  const range = `${formatDate(task.startDate)} → ${formatDate(task.dueDate)}`;

  return (
    <span
      role="img"
      aria-label={`${t('startDate')}/${t('dueDate')}: ${range}`}
      title={range}
      className="relative hidden h-3 shrink-0 overflow-hidden rounded-full bg-surface-subtle sm:inline-block"
      style={{ width: TRACK_PX }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 w-px bg-ink-muted/50"
        style={{ left: Math.min(Math.max(todayLeft, 0), TRACK_PX - 1) }}
      />
      {task.isMilestone ? (
        <span
          aria-hidden="true"
          className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45"
          style={{ left: left - 5, backgroundColor: color }}
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-y-0.5 rounded-full"
          style={{ left, width, backgroundColor: color }}
        />
      )}
    </span>
  );
}
