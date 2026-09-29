import type { TaskDto } from '@pmtool/shared-types';

export interface TimelineScale {
  start: Date;
  end: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_SPAN_DAYS = 21;

/**
 * Width of the task-info column in the Focus list's two-column layout (info | Gantt) — shared by the
 * header, the grid overlay and every row's own left column so all three split at the exact same x
 * position. task-tree.tsx applies it as a Tailwind arbitrary value (`sm:w-[480px]`, since inline
 * styles can't express a `sm:` breakpoint); keep that literal in sync with this constant by hand.
 */
export const TASK_INFO_COL_PX = 480;

/**
 * The date range every row's timeline bar is drawn against — the same scale for the whole list, so a
 * row's position is comparable to every other row's, like a real Gantt chart. Spans every dated task
 * (a task is never hidden just because it's overdue or months out) plus today, with a floor so a
 * cluster of same-day tasks still gets a readable strip instead of a sliver.
 */
export function computeTimelineScale(tasks: TaskDto[]): TimelineScale {
  const now = new Date();
  let min = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let max = new Date(min.getTime() + DAY_MS);

  for (const task of tasks) {
    const s = task.startDate ? new Date(task.startDate) : task.dueDate ? new Date(task.dueDate) : null;
    const e = task.dueDate ? new Date(task.dueDate) : s;
    if (!s || !e) continue;
    const lo = e < s ? e : s;
    const hi = e < s ? s : e;
    if (lo < min) min = lo;
    if (hi > max) max = hi;
  }

  // Pad a day on each side so a bar's edge never touches the container border.
  min = new Date(min.getTime() - DAY_MS);
  max = new Date(max.getTime() + DAY_MS);
  if (max.getTime() - min.getTime() < MIN_SPAN_DAYS * DAY_MS) {
    max = new Date(min.getTime() + MIN_SPAN_DAYS * DAY_MS);
  }
  return { start: min, end: max };
}

/** Where a date falls across the scale, as a 0–100 percentage — clamped, so an out-of-range instant still resolves to an edge instead of `NaN`/off-screen. */
export function percentFor(date: Date, scale: TimelineScale): number {
  const span = scale.end.getTime() - scale.start.getTime();
  if (span <= 0) return 0;
  const clamped = Math.min(Math.max(date.getTime(), scale.start.getTime()), scale.end.getTime());
  return ((clamped - scale.start.getTime()) / span) * 100;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS);
}
