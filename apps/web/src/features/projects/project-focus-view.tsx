'use client';

import { useTranslations } from 'next-intl';
import { useProjectDashboard } from '@pmtool/api-client';
import { TASK_STATUSES } from '@pmtool/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '@pmtool/ui';
import { StatCard } from '../dashboard/stat-card';
import { StatusBreakdown } from '../dashboard/status-breakdown';
import { FocusGanttWidget } from '../gantt/focus-gantt-widget';
import { TaskList } from '../tasks/task-list';

/**
 * A single scrolling page with no tab-switching: just the numbers and the task list people check
 * daily. Everything else (Gantt, Charter, Risks, ...) stays one click away via "Xem đầy đủ".
 */
export function ProjectFocusView({ orgSlug, projectKey }: { orgSlug: string; projectKey: string }) {
  const t = useTranslations('projects.focus');
  const tDashboard = useTranslations('dashboard.project');
  const tTaskStatus = useTranslations('tasks.status');
  const { data } = useProjectDashboard(orgSlug, projectKey);

  return (
    <div className="flex flex-col gap-6">
      {data && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard label={tDashboard('completion')} value={data.completionPercent} />
          <StatCard label={tDashboard('totalTasks')} value={data.totalTasks} />
          <StatCard label={tDashboard('overdueTasks')} value={data.overdueTasks.length} tone="danger" />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('ganttTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <FocusGanttWidget orgSlug={orgSlug} projectKey={projectKey} />
        </CardContent>
      </Card>

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>{tDashboard('taskBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBreakdown counts={data.taskCounts} statuses={TASK_STATUSES} labelFor={(s) => tTaskStatus(s)} />
          </CardContent>
        </Card>
      )}

      <Card className="p-4">
        <TaskList orgSlug={orgSlug} projectKey={projectKey} compact />
      </Card>

      <p className="text-center text-xs text-ink-muted">{t('hint')}</p>
    </div>
  );
}
