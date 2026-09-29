'use client';

import type { TaskDto } from '@pmtool/shared-types';
import { STATUS_BAR_COLOR } from '../gantt/use-gantt-data';
import { formatDate } from '../../lib/date-input';
import { TimelineGrid } from './timeline-grid';
import { percentFor, type TimelineScale } from './timeline-scale';

/**
 * A task's start→due span, drawn full-width on its own line under the row's fields, against the same
 * shared scale as every other row (timeline-grid.tsx) — so position is comparable across the whole
 * list, like a real Gantt chart, instead of a second, separate Gantt section listing every task again.
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
    <div className="relative mt-1.5 h-3 w-full overflow-hidden rounded-full bg-surface-subtle/60" role="img" aria-label={range} title={range}>
      <TimelineGrid scale={scale} />
      {task.isMilestone ? (
        <span
          aria-hidden="true"
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] ring-2 ring-surface"
          style={{ left: `${left}%`, backgroundColor: color }}
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 rounded-full ring-2 ring-surface"
          style={{ left: `${left}%`, width: `${width}%`, backgroundColor: color }}
        />
      )}
    </div>
  );
}
