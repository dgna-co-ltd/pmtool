'use client';

import { useTranslations } from 'next-intl';
import { useOrganizationMembers, useTask } from '@pmtool/api-client';
import { Modal } from '@pmtool/ui';
import { Link } from '../../i18n/navigation';
import {
  InlineAssignee,
  InlineDates,
  InlineDescription,
  InlinePercent,
  InlinePriority,
  InlineStatus,
} from '../tasks/task-row-quick-edit';

/**
 * Clicking a bar in the Gantt chart opens this instead of navigating away — the point of clicking a
 * chart cell is to glance at (and tweak) the task, not to lose your place in the timeline. Reuses the
 * same inline editors as the Focus view's task rows, so a value edited here or there behaves the same
 * way. "Xem chi tiết" is the deliberate way out to the full page (comments, dependencies, history, ...)
 * this modal doesn't carry.
 */
export function TaskPreviewModal({
  orgSlug,
  projectKey,
  taskId,
  onClose,
}: {
  orgSlug: string;
  projectKey: string;
  taskId: string;
  onClose: () => void;
}) {
  const t = useTranslations('tasks.detail');
  const tGantt = useTranslations('gantt.preview');
  const { data: task, isLoading } = useTask(orgSlug, projectKey, taskId);
  const { data: members } = useOrganizationMembers(orgSlug);

  return (
    <Modal
      open
      onClose={onClose}
      title={task ? `${task.humanKey} ${task.title}` : tGantt('loading')}
      className="max-w-lg"
    >
      {isLoading || !task ? (
        <div className="h-24 animate-pulse rounded-md bg-surface-subtle" />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <InlineStatus task={task} orgSlug={orgSlug} projectKey={projectKey} />
            <InlinePriority task={task} orgSlug={orgSlug} projectKey={projectKey} />
            <InlinePercent task={task} orgSlug={orgSlug} projectKey={projectKey} />
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-ink-muted">{`${t('startDate')} / ${t('dueDate')}`}</p>
            <InlineDates task={task} orgSlug={orgSlug} projectKey={projectKey} />
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-ink-muted">{t('assignee')}</p>
            <InlineAssignee task={task} orgSlug={orgSlug} projectKey={projectKey} members={members ?? []} />
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-ink-muted">{t('description')}</p>
            <InlineDescription task={task} orgSlug={orgSlug} projectKey={projectKey} indent={0} />
          </div>

          <Link
            href={`/${orgSlug}/projects/${projectKey}/tasks/${task.id}`}
            className="self-start text-sm font-medium text-action-primary hover:underline"
          >
            {tGantt('viewDetails')}
          </Link>
        </div>
      )}
    </Modal>
  );
}
