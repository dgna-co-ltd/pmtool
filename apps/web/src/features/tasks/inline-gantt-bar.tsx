'use client';

import type { TaskDto } from '@pmtool/shared-types';
import { STATUS_BAR_COLOR } from '../gantt/use-gantt-data';
import { formatDate } from '../../lib/date-input';
import { percentFor, type TimelineScale } from './timeline-scale';

/**
 * A task's start→due span, drawn full-width on its own line under the row's fields, against the same
 * shared scale as every other row — position is comparable across the whole list, like a real Gantt
 * chart bar, instead of a second, separate Gantt section listing every task again. The vertical grid
 * lines behind it (timeline-grid.tsx) are a single overlay spanning the whole list, not redrawn here.
 * Read-only: the row's own date inputs already edit start/due, so dragging isn't offered here.
 */
export function InlineGanttBar({ task, scale }: { task: TaskDto; scale: TimelineScale }) {
  const start = task.startDate ? new Date(task.startDate) : task.dueDate ? new Date(task.dueDate) : null;
  const end = task.dueDate ? new Date(task.dueDate) : start;
  if (!start || !end) return null;
  const taskStart = end < start ? end : start;
  const taskEnd = end < start ? start : end;

  const left = percentFor(taskStart, scale);
  const right = percentFor(taskEnd, scale);
  const width = Math.max(right - left, 0.6);
  const color = STATUS_BAR_COLOR[task.status];
  const range = `${formatDate(task.startDate)} → ${formatDate(task.dueDate)}`;

  return (
    <div className="relative z-10 mt-1.5 h-4 w-full" role="img" aria-label={range} title={range}>
      {task.isMilestone ? (
        <span
          aria-hidden="true"
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[3px] border-2 border-surface"
          style={{ left: `${left}%`, backgroundColor: color }}
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 rounded-sm border-2 border-surface"
          style={{ left: `${left}%`, width: `${width}%`, backgroundColor: color }}
        />
      )}
    </div>
  );
}
