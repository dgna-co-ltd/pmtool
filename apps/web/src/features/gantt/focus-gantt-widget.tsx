'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useUpdateTaskById } from '@pmtool/api-client';
import { GanttChart, type GanttTaskInput } from '@pmtool/ui';
import { useRouter } from '../../i18n/navigation';
import { useGanttData } from './use-gantt-data';

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 14;

/**
 * The Focus view's "what's coming up" glance: same data/mapping as the full Gantt tab, but narrowed to
 * tasks touching the next two weeks (today included) so it stays a quick read instead of the whole
 * project's timeline. Dates stay editable by dragging a bar — the same field the Focus row's date
 * inputs edit, just a second way to do it. Dependency links aren't wired here: editing the project's
 * dependency graph isn't a "daily glance" action, and the inline task rows already cover the fields
 * this page promises to make editable.
 */
export function FocusGanttWidget({ orgSlug, projectKey }: { orgSlug: string; projectKey: string }) {
  const t = useTranslations('gantt');
  const tFocus = useTranslations('projects.focus');
  const tTask = useTranslations('tasks.roles');
  const router = useRouter();

  const { tasks, ganttTasks, isLoading, isError } = useGanttData(orgSlug, projectKey);
  const updateTask = useUpdateTaskById(orgSlug, projectKey);

  const windowTasks = useMemo<GanttTaskInput[]>(() => {
    const now = new Date();
    const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const windowEnd = new Date(windowStart.getTime() + WINDOW_DAYS * DAY_MS);
    const inWindow = ganttTasks.filter(
      (gt) => gt.type !== 'summary' && gt.start < windowEnd && gt.end >= windowStart,
    );
    // A leaf task's parent (a phase/work package) is deliberately left out of this window — those
    // summary rows routinely span far more than two weeks. But the underlying library silently
    // drops a child whose `parent` id isn't present in the data instead of rooting it, so any task
    // whose parent got filtered out here has to be re-rooted or it vanishes from the chart entirely.
    const ids = new Set(inWindow.map((gt) => gt.id));
    return inWindow.map((gt) => (gt.parent && !ids.has(gt.parent) ? { ...gt, parent: undefined } : gt));
  }, [ganttTasks]);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-lg border border-line bg-surface" />;
  }
  if (isError) {
    return (
      <p role="alert" className="p-4 text-sm text-danger">
        {t('loadError')}
      </p>
    );
  }
  if (!tasks || windowTasks.length === 0) {
    return <p className="p-4 text-sm text-ink-secondary">{tFocus('ganttEmpty')}</p>;
  }

  return (
    <GanttChart
      tasks={windowTasks}
      links={[]}
      labels={{
        columnTask: t('columns.task'),
        columnAssignee: t('columns.assignee'),
        roleLabels: { primary: tTask('assignee'), support: tTask('supporter') },
        zoomDay: t('zoom.day'),
        zoomWeek: t('zoom.week'),
        zoomMonth: t('zoom.month'),
      }}
      onTaskUpdate={({ id, start, end }) => {
        if (!start && !end) return;
        updateTask.mutate({
          taskId: id,
          input: {
            ...(start ? { startDate: start.toISOString() } : {}),
            ...(end ? { dueDate: end.toISOString() } : {}),
          },
        });
      }}
      onTaskClick={(taskId) => {
        router.push(`/${orgSlug}/projects/${projectKey}/tasks/${taskId}`);
      }}
    />
  );
}
