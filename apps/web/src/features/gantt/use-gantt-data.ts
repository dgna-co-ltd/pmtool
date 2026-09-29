import { useMemo } from 'react';
import type { DependencyDto, TaskDto, DependencyType } from '@pmtool/shared-types';
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

/** Maps a project's tasks/dependencies into GanttChart's input shape — shared by the full Gantt tab and the Focus view's next-2-weeks strip. */
export function useGanttData(orgSlug: string, projectKey: string) {
  const { data: tasks, isLoading: tasksLoading, isError: tasksError } = useTasks(orgSlug, projectKey);
  const { data: dependencies, isLoading: depsLoading, isError: depsError } = useDependencies(orgSlug, projectKey);

  const ganttTasks = useMemo<GanttTaskInput[]>(() => {
    if (!tasks) return [];
    const childrenByParentId = new Map<string, TaskDto[]>();
    for (const tsk of tasks) {
      if (!tsk.parentTaskId) continue;
      const siblings = childrenByParentId.get(tsk.parentTaskId) ?? [];
      siblings.push(tsk);
      childrenByParentId.set(tsk.parentTaskId, siblings);
    }

    function taskDates(task: TaskDto): { start: Date; end: Date } {
      const start = task.startDate ? new Date(task.startDate) : new Date(task.createdAt);
      let end = task.dueDate
        ? new Date(task.dueDate)
        : new Date(start.getTime() + Math.max(1, task.estimateHours ? task.estimateHours / 8 : 1) * DAY_MS);
      if (end <= start) end = new Date(start.getTime() + DAY_MS);
      return { start, end };
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
        text: `${task.humanKey} ${task.title}`,
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
