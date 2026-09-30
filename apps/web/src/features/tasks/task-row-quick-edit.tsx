'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useUpdateTaskById } from '@pmtool/api-client';
import { TASK_PRIORITIES, TASK_STATUSES, type TaskDto } from '@pmtool/shared-types';
import { Input } from '@pmtool/ui';
import { UserAvatar } from '../people/user-avatar';
import { dateInputToIso, isoToDateInput } from '../../lib/date-input';
import { MemberPicker } from './assignees-editor';
import { NoteIcon } from './task-list-icons';

type Member = { userId: string; user?: { fullName: string; avatarUrl: string | null } | null };

/** Same person-picker as the task detail page, but the trigger is the current avatar itself — no separate "+". */
export function InlineAssignee({
  task,
  orgSlug,
  projectKey,
  members,
}: {
  task: TaskDto;
  orgSlug: string;
  projectKey: string;
  members: Member[];
}) {
  const t = useTranslations('tasks.detail');
  const tRoles = useTranslations('tasks.roles');
  const update = useUpdateTaskById(orgSlug, projectKey);
  const primary = task.assignees.find((a) => a.role === 'PRIMARY');
  const supporters = task.assignees.filter((a) => a.role === 'SUPPORT');

  return (
    <span className="flex shrink-0 items-center gap-0.5">
      <MemberPicker
        label={primary ? t('changeAssignee') : t('assignAssignee')}
        candidates={members.filter((m) => m.userId !== primary?.id)}
        onPick={(userId) => update.mutate({ taskId: task.id, input: { assigneeId: userId } })}
        trigger={
          primary ? (
            <UserAvatar userId={primary.id} name={primary.fullName} character={primary.mascotCharacter} />
          ) : undefined
        }
      />
      {primary && (
        <button
          type="button"
          aria-label={`${t('unassign')} — ${task.humanKey}`}
          title={t('unassign')}
          onClick={() => update.mutate({ taskId: task.id, input: { assigneeId: null } })}
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-line text-[10px] leading-none text-ink-muted hover:border-danger hover:bg-danger/10 hover:text-danger"
        >
          ×
        </button>
      )}
      {supporters.length > 0 && (
        <span
          title={supporters.map((s) => `${s.fullName} — ${tRoles('supporter')}`).join('\n')}
          className="rounded-full bg-surface-subtle px-1.5 py-0.5 text-xs text-ink-secondary"
        >
          +{supporters.length}
        </span>
      )}
    </span>
  );
}

/** Start/due date inputs, same onChange-immediate + date-order guard as the task detail page. */
export function InlineDates({
  task,
  orgSlug,
  projectKey,
}: {
  task: TaskDto;
  orgSlug: string;
  projectKey: string;
}) {
  const t = useTranslations('tasks.detail');
  const update = useUpdateTaskById(orgSlug, projectKey);
  const [startDate, setStartDate] = useState(() => isoToDateInput(task.startDate));
  const [dueDate, setDueDate] = useState(() => isoToDateInput(task.dueDate));
  const [error, setError] = useState(false);

  useEffect(() => {
    setStartDate(isoToDateInput(task.startDate));
    setDueDate(isoToDateInput(task.dueDate));
    setError(false);
  }, [task.startDate, task.dueDate]);

  return (
    <span className="flex shrink-0 items-center gap-1">
      {!task.isMilestone && (
        <Input
          type="date"
          aria-label={`${t('startDate')} — ${task.humanKey}`}
          value={startDate}
          invalid={error}
          className="h-7 w-[8.25rem] px-1.5 text-xs"
          onChange={(e) => {
            const next = e.target.value;
            setStartDate(next);
            if (next && dueDate && next > dueDate) {
              setError(true);
              return;
            }
            setError(false);
            update.mutate({ taskId: task.id, input: { startDate: next ? dateInputToIso(next) : null } });
          }}
        />
      )}
      <Input
        type="date"
        aria-label={`${t('dueDate')} — ${task.humanKey}`}
        value={dueDate}
        invalid={error}
        className="h-7 w-[8.25rem] px-1.5 text-xs"
        onChange={(e) => {
          const next = e.target.value;
          setDueDate(next);
          if (task.isMilestone && !next) return;
          if (next && startDate && !task.isMilestone && startDate > next) {
            setError(true);
            return;
          }
          setError(false);
          update.mutate({ taskId: task.id, input: { dueDate: next ? dateInputToIso(next) : null } });
        }}
      />
    </span>
  );
}

/** % complete, saved onBlur (matches the detail page — not every keystroke). */
export function InlinePercent({
  task,
  orgSlug,
  projectKey,
}: {
  task: TaskDto;
  orgSlug: string;
  projectKey: string;
}) {
  const update = useUpdateTaskById(orgSlug, projectKey);
  const [value, setValue] = useState(() => String(task.percentComplete));

  useEffect(() => setValue(String(task.percentComplete)), [task.percentComplete]);

  return (
    <span className="flex shrink-0 items-center gap-1">
      <input
        type="number"
        min={0}
        max={100}
        aria-label={`% — ${task.humanKey}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          const clamped = Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
          if (clamped !== task.percentComplete) {
            update.mutate({ taskId: task.id, input: { percentComplete: clamped } });
          }
          setValue(String(clamped));
        }}
        className="h-7 w-12 glass-field rounded-md border border-line-glass px-1.5 text-xs text-ink-primary outline-none focus-visible:ring-2 focus-visible:ring-focus"
      />
      <span className="text-xs text-ink-secondary">%</span>
    </span>
  );
}

/** Status dropdown, saved immediately on change — same convention as task-tree.tsx's row status select. */
export function InlineStatus({
  task,
  orgSlug,
  projectKey,
}: {
  task: TaskDto;
  orgSlug: string;
  projectKey: string;
}) {
  const tStatus = useTranslations('tasks.status');
  const update = useUpdateTaskById(orgSlug, projectKey);
  return (
    <select
      aria-label={`${tStatus('label')} ${task.humanKey}`}
      value={task.status}
      disabled={update.isPending}
      onChange={(e) =>
        update.mutate({ taskId: task.id, input: { status: e.target.value as TaskDto['status'] } })
      }
      className="h-7 shrink-0 glass-field rounded-md border border-line-glass px-1.5 text-xs text-ink-primary outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60"
    >
      {TASK_STATUSES.map((s) => (
        <option key={s} value={s}>
          {tStatus(s)}
        </option>
      ))}
    </select>
  );
}

/** Priority dropdown, saved immediately on change — same convention as InlineStatus. */
export function InlinePriority({
  task,
  orgSlug,
  projectKey,
}: {
  task: TaskDto;
  orgSlug: string;
  projectKey: string;
}) {
  const t = useTranslations('tasks.detail');
  const tPriority = useTranslations('tasks.priority');
  const update = useUpdateTaskById(orgSlug, projectKey);
  return (
    <select
      aria-label={`${t('priority')} — ${task.humanKey}`}
      value={task.priority}
      disabled={update.isPending}
      onChange={(e) =>
        update.mutate({ taskId: task.id, input: { priority: e.target.value as TaskDto['priority'] } })
      }
      className="h-7 shrink-0 glass-field rounded-md border border-line-glass px-1.5 text-xs text-ink-primary outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60"
    >
      {TASK_PRIORITIES.map((p) => (
        <option key={p} value={p}>
          {tPriority(p)}
        </option>
      ))}
    </select>
  );
}

/** The description toggle button — icon lights up once a description exists, so it also signals "has notes". */
export function DescriptionToggle({
  taskHumanKey,
  hasDescription,
  open,
  onToggle,
}: {
  taskHumanKey: string;
  hasDescription: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations('tasks.detail');
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`${t('description')} — ${taskHumanKey}`}
      aria-expanded={open}
      title={t('description')}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded hover:bg-surface-subtle ${
        open || hasDescription ? 'text-action-primary' : 'text-ink-muted hover:text-ink-primary'
      }`}
    >
      <NoteIcon />
    </button>
  );
}

/** The description textarea itself, shown as a full-width second line under the row while toggled open. */
export function InlineDescription({
  task,
  orgSlug,
  projectKey,
  indent,
}: {
  task: TaskDto;
  orgSlug: string;
  projectKey: string;
  indent: number;
}) {
  const t = useTranslations('tasks.detail');
  const update = useUpdateTaskById(orgSlug, projectKey);
  const [value, setValue] = useState(task.description ?? '');

  useEffect(() => setValue(task.description ?? ''), [task.description]);

  return (
    <textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== (task.description ?? '')) {
          update.mutate({ taskId: task.id, input: { description: value || null } });
        }
      }}
      placeholder={t('descriptionPlaceholder')}
      rows={2}
      style={{ marginLeft: indent }}
      className="mt-1.5 w-full glass-field rounded-md border border-line-glass px-2 py-1.5 text-xs text-ink-primary outline-none focus-visible:ring-2 focus-visible:ring-focus"
    />
  );
}
