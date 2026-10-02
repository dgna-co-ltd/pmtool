'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DependencyType } from '@pmtool/shared-types';
import { useCreateDependency, useDeleteDependency, useUpdateTaskById } from '@pmtool/api-client';
import { GanttChart, type GanttLinkChange, type GanttLinkCreate, type GanttLinkType } from '@pmtool/ui';
import { useGanttData } from './use-gantt-data';
import { TaskPreviewModal } from './task-preview-modal';

const LINK_TYPE_TO_DEPENDENCY_TYPE: Record<GanttLinkType, DependencyType> = {
  e2s: 'FINISH_TO_START',
  s2s: 'START_TO_START',
  e2e: 'FINISH_TO_FINISH',
  s2e: 'START_TO_FINISH',
};

export function GanttWidget({ orgSlug, projectKey }: { orgSlug: string; projectKey: string }) {
  const t = useTranslations('gantt');
  const tTask = useTranslations('tasks.roles');
  const tTaskList = useTranslations('tasks.list');

  const { tasks, dependencies, ganttTasks, ganttLinks, isLoading, isError } = useGanttData(orgSlug, projectKey);
  const updateTask = useUpdateTaskById(orgSlug, projectKey);
  const createDependency = useCreateDependency(orgSlug, projectKey);
  const deleteDependency = useDeleteDependency(orgSlug, projectKey);

  const [previewTaskId, setPreviewTaskId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const saveStatusTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flashSaveStatus = (status: 'saved' | 'error') => {
    setSaveStatus(status);
    clearTimeout(saveStatusTimer.current);
    saveStatusTimer.current = setTimeout(() => setSaveStatus('idle'), 2500);
  };

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-lg border border-line bg-surface" />;
  }
  if (isError) {
    return (
      <p role="alert" className="p-6 text-sm text-danger">
        {t('loadError')}
      </p>
    );
  }
  if (!tasks || tasks.length === 0) {
    return <p className="p-6 text-sm text-ink-secondary">{t('empty')}</p>;
  }

  return (
    <div>
      {saveStatus === 'saved' && (
        <p role="status" className="mb-2 text-xs text-ink-secondary">
          {t('saved')}
        </p>
      )}
      {saveStatus === 'error' && (
        <p role="alert" className="mb-2 text-xs text-danger">
          {t('saveError')}
        </p>
      )}
      <GanttChart
        tasks={ganttTasks}
        links={ganttLinks}
        labels={{
          columnCode: t('columns.code'),
          columnTask: t('columns.task'),
          columnAssignee: t('columns.assignee'),
          roleLabels: { primary: tTask('assignee'), support: tTask('supporter') },
          zoomDay: t('zoom.day'),
          zoomWeek: t('zoom.week'),
          zoomMonth: t('zoom.month'),
          today: t('today'),
          expandAll: tTaskList('expandAll'),
          collapseAll: tTaskList('collapseAll'),
        }}
        onTaskUpdate={({ id, start, end }) => {
          if (!start && !end) return;
          updateTask.mutate(
            {
              taskId: id,
              input: {
                ...(start ? { startDate: start.toISOString() } : {}),
                ...(end ? { dueDate: end.toISOString() } : {}),
              },
            },
            {
              onSuccess: () => flashSaveStatus('saved'),
              onError: () => flashSaveStatus('error'),
            },
          );
        }}
        onTaskClick={(taskId) => setPreviewTaskId(taskId)}
        onLinkAdd={(link: GanttLinkCreate) => {
          createDependency.mutate(
            {
              predecessorId: link.source,
              successorId: link.target,
              type: LINK_TYPE_TO_DEPENDENCY_TYPE[link.type],
              ...(link.lag ? { lagDays: link.lag } : {}),
            },
            {
              onError: () => flashSaveStatus('error'),
            },
          );
        }}
        onLinkDelete={(linkId) => {
          deleteDependency.mutate(linkId, {
            onError: () => flashSaveStatus('error'),
          });
        }}
        onLinkUpdate={(change: GanttLinkChange) => {
          // No update-dependency endpoint exists — implemented as delete-then-recreate.
          // Low-traffic path: update-link only fires from an Editor sidebar this screen doesn't render.
          const existing = (dependencies ?? []).find((dep) => dep.id === change.id);
          if (!existing) return;
          deleteDependency.mutate(existing.id, {
            onSuccess: () => {
              createDependency.mutate(
                {
                  predecessorId: change.source ?? existing.predecessorId,
                  successorId: change.target ?? existing.successorId,
                  type: change.type ? LINK_TYPE_TO_DEPENDENCY_TYPE[change.type] : existing.type,
                  ...(change.lag ? { lagDays: change.lag } : {}),
                },
                { onError: () => flashSaveStatus('error') },
              );
            },
            onError: () => flashSaveStatus('error'),
          });
        }}
      />
      {previewTaskId && (
        <TaskPreviewModal
          orgSlug={orgSlug}
          projectKey={projectKey}
          taskId={previewTaskId}
          onClose={() => setPreviewTaskId(null)}
        />
      )}
    </div>
  );
}
