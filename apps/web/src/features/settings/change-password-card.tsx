'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { passwordSchema } from '@pmtool/shared-types';
import { ApiError, useChangePassword, useMe } from '@pmtool/api-client';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FormField, Input, useToast } from '@pmtool/ui';

export function ChangePasswordCard() {
  const t = useTranslations('settings.changePassword');
  const { data: me } = useMe();
  const changePassword = useChangePassword();
  const toast = useToast();
  // Accounts made through Google have no password yet — the form sets the first one instead.
  const hasPassword = me?.hasPassword !== false;

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(next);
    if (!parsed.success) {
      setProblem(parsed.error.issues[0]?.message ?? t('weak'));
      return;
    }
    if (next !== confirm) {
      setProblem(t('mismatch'));
      return;
    }
    setProblem(null);
    changePassword.mutate(
      { ...(hasPassword ? { currentPassword: current } : {}), newPassword: next },
      {
        onSuccess: () => {
          toast.success(t('done'));
          setCurrent('');
          setNext('');
          setConfirm('');
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{hasPassword ? t('title') : t('setTitle')}</CardTitle>
        <CardDescription>{hasPassword ? t('description') : t('setDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {hasPassword && (
            <FormField label={t('current')} htmlFor="current-password-settings">
              <Input
                id="current-password-settings"
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </FormField>
          )}
          <FormField label={t('new')} htmlFor="new-password-settings" hint={t('hint')}>
            <Input
              id="new-password-settings"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </FormField>
          <FormField label={t('confirm')} htmlFor="confirm-password-settings">
            <Input
              id="confirm-password-settings"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </FormField>
          {(problem || changePassword.isError) && (
            <p role="alert" className="text-sm text-danger">
              {problem ?? (changePassword.error instanceof ApiError ? changePassword.error.message : t('error'))}
            </p>
          )}
          <div>
            <Button type="submit" disabled={changePassword.isPending}>
              {hasPassword ? t('submit') : t('setSubmit')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
