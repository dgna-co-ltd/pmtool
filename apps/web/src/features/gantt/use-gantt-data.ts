import { useMemo } from 'react';
import type { DependencyDto, TaskDto, DependencyType } from '@pmtool/shared-types';
import { computeWbsCodes } from '@pmtool/shared-types';
import { useDependencies, useTasks } from '@pmtool/api-client';
import type { GanttAssignee, GanttLinkInput, GanttLinkType, GanttTaskInput } from '@pmtool/ui';

const DEPENDENCY_TYPE_TO_LINK_TYPE: Record<DependencyType, GanttLinkType> = {
  FINISH_TO_START: 'e2s',
  START_TO_START: 's2s',
  FINISH_TO_FINISH: 'e2e',
  START_TO_FINISH: 's2e',
};

// A CSS color value per status, driving GanttChart's per-task bar recolor
// (packages/ui's GanttChart has no notion of TaskStatus — it just paints
// whatever `barColor` string it's given). Mirrors STATUS_VARIANT's
// semantics (task-badges.tsx) so a bar's color always matches its badge.
// Exported: the Focus view's inline per-row timeline bar (inline-gantt-bar.tsx) reuses it too,
// so a task's color means the same thing whether it's on the full Gantt tab or a Focus row.
export const STATUS_BAR_COLOR: Record<TaskDto['status'], string> = {
  TODO: 'var(--color-text-muted)',
  IN_PROGRESS: 'var(--color-info)',
  IN_REVIEW: 'var(--color-warning)',
  DONE: 'var(--color-success)',
  BLOCKED: 'var(--color-danger)',
};

export const DAY_MS = 24 * 60 * 60 * 1000;

function toAssignees(task: TaskDto): GanttAssignee[] {
  return (task.assignees ?? []).map((a) => ({ name: a.fullName, character: a.mascotCharacter, role: a.role }));
}

// Local, not UTC: the chart buckets bars into day-columns by each Date's local calendar day (the
// JS/library-ecosystem default), so a boundary computed in UTC can land on the "wrong" side of
// midnight in the viewer's timezone and spill a bar into a neighbouring column. Task dates are stored
// at noon UTC specifically so they fall on the intended calendar day in any local timezone from
// UTC-12 to UTC+11 (see dateInputToIso's own comment) — reading them with local getters is exactly
// what makes that work here.
function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addLocalDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** Maps a project's tasks/dependencies into GanttChart's input shape — shared by the full Gantt tab and the Focus view's next-2-weeks strip. */
export function useGanttData(orgSlug: string, projectKey: string) {
  const { data: tasks, isLoading: tasksLoading, isError: tasksError } = useTasks(orgSlug, projectKey);
  const { data: dependencies, isLoading: depsLoading, isError: depsError } = useDependencies(orgSlug, projectKey);

  const ganttTasks = useMemo<GanttTaskInput[]>(() => {
    if (!tasks) return [];
    const wbsCodes = computeWbsCodes(
      tasks.map((t) => ({ id: t.id, parentTaskId: t.parentTaskId, orderIndex: t.orderIndex })),
    );
    const childrenByParentId = new Map<string, TaskDto[]>();
    for (const tsk of tasks) {
      if (!tsk.parentTaskId) continue;
      const siblings = childrenByParentId.get(tsk.parentTaskId) ?? [];
      siblings.push(tsk);
      childrenByParentId.set(tsk.parentTaskId, siblings);
    }

    // Task dates are calendar days stored at noon UTC (see dateInputToIso's own comment), so a 1-day
    // task has startDate === dueDate. GanttChart draws [start, end) in absolute time, so that pair
    // needs converting to day *boundaries* — the start of the start day through the start of the day
    // *after* the due day — rather than used as-is. A naive "if end <= start, add one day from start"
    // (the previous approach here) instead landed `end` at the same noon the next day, which — being
    // exactly as far into day 2 as `start` was into day 1 — straddles both day columns, drawing a
    // same-day task as two days wide. This still clamps a reversed pair (end before start) to a single day.
    function taskDates(task: TaskDto): { start: Date; end: Date } {
      const rawStart = task.startDate ? new Date(task.startDate) : new Date(task.createdAt);
      const start = startOfLocalDay(rawStart);
      if (task.dueDate) {
        const endDay = startOfLocalDay(new Date(task.dueDate));
        const end = addLocalDays(endDay < start ? start : endDay, 1);
        return { start, end };
      }
      // No due date at all: an estimate-based width in whole days (at least 1), not derived from a
      // real end date.
      const days = Math.max(1, task.estimateHours ? Math.ceil(task.estimateHours / 8) : 1);
      return { start, end: addLocalDays(start, days) };
    }

    return tasks.map((task) => {
      const children = childrenByParentId.get(task.id);
      let { start, end } = taskDates(task);
      let type: GanttTaskInput['type'] = 'task';

      if (children && children.length > 0) {
        type = 'summary';
        // PRO-only `rollups` (auto date-derivation from children) is
        // hard-disabled in the installed free build, so a summary bar's
        // own span has to be computed by hand, spanning all its children.
        const childRanges = children.map(taskDates);
        start = new Date(Math.min(...childRanges.map((r) => r.start.getTime())));
        end = new Date(Math.max(...childRanges.map((r) => r.end.getTime())));
      } else if (task.isMilestone) {
        type = 'milestone';
      }

      return {
        id: task.id,
        text: task.title,
        wbsCode: wbsCodes.get(task.id) ?? '',
        start,
        end,
        parent: task.parentTaskId ?? undefined,
        type,
        barColor: STATUS_BAR_COLOR[task.status],
        progress: task.percentComplete,
        assignees: toAssignees(task),
      };
    });
  }, [tasks]);

  const ganttLinks = useMemo<GanttLinkInput[]>(
    () =>
      (dependencies ?? []).map((dep: DependencyDto) => ({
        id: dep.id,
        source: dep.predecessorId,
        target: dep.successorId,
        type: DEPENDENCY_TYPE_TO_LINK_TYPE[dep.type],
      })),
    [dependencies],
  );

  return {
    tasks,
    dependencies,
    ganttTasks,
    ganttLinks,
    isLoading: tasksLoading || depsLoading,
    isError: tasksError || depsError,
  };
}
