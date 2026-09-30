'use client';

import { useTranslations } from 'next-intl';
import { useTask } from '@pmtool/api-client';
import { Modal } from '@pmtool/ui';
import { UserAvatar } from '../people/user-avatar';
import { Link } from '../../i18n/navigation';
import { formatDate } from '../../lib/date-input';
import { TaskPriorityBadge, TaskStatusBadge } from '../tasks/task-badges';

/**
 * Clicking a bar in the Gantt chart opens this instead of navigating away — the point of clicking a
 * chart cell is to glance at the task, not to lose your place in the timeline. "Xem chi tiết" is the
 * deliberate way out to the full page (comments, dependencies, history, ...) this modal doesn't carry.
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

  const primary = task?.assignees.find((a) => a.role === 'PRIMARY');
  const supporters = task?.assignees.filter((a) => a.role === 'SUPPORT') ?? [];

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
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
            {task.percentComplete > 0 && (
              <span className="text-sm text-ink-secondary">{task.percentComplete}%</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-medium text-ink-muted">{t('startDate')}</p>
              <p className="text-ink-primary">{formatDate(task.startDate)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted">{t('dueDate')}</p>
              <p className="text-ink-primary">{formatDate(task.dueDate)}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-ink-muted">{t('assignee')}</p>
            {primary || supporters.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                {primary && (
                  <span className="flex items-center gap-1.5 text-sm text-ink-primary">
                    <UserAvatar userId={primary.id} name={primary.fullName} character={primary.mascotCharacter} />
                    {primary.fullName}
                  </span>
                )}
                {supporters.map((s) => (
                  <span key={s.id} className="flex items-center gap-1.5 text-sm text-ink-secondary">
                    <UserAvatar userId={s.id} name={s.fullName} character={s.mascotCharacter} />
                    {s.fullName}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-sm text-ink-muted">{t('noAssignee')}</p>
            )}
          </div>

          {task.description && (
            <div>
              <p className="text-xs font-medium text-ink-muted">{t('description')}</p>
              <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm text-ink-secondary">
                {task.description}
              </p>
            </div>
          )}

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
