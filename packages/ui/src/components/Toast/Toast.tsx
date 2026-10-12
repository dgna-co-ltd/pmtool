'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';

type ToastVariant = 'success' | 'error';

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Errors stay up longer than success confirmations: a user who only glances over after an
// action needs more time to notice and read a failure than a routine "saved" confirmation.
const DURATIONS: Record<ToastVariant, number> = { success: 2500, error: 5000 };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, variant, message }]);
      setTimeout(() => dismiss(id), DURATIONS[variant]);
    },
    [dismiss],
  );

  const api = useRef<ToastContextValue>({
    success: (message) => push('success', message),
    error: (message) => push('error', message),
  }).current;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                role={toast.variant === 'error' ? 'alert' : 'status'}
                className={cn(
                  'pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border bg-surface p-3 text-sm shadow-lg',
                  toast.variant === 'success' ? 'border-success/30' : 'border-danger/30',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    toast.variant === 'success' ? 'bg-success' : 'bg-danger',
                  )}
                />
                <p className={cn('flex-1 pt-px', toast.variant === 'error' ? 'text-danger' : 'text-ink-primary')}>
                  {toast.message}
                </p>
                <button
                  type="button"
                  aria-label="Đóng"
                  onClick={() => dismiss(toast.id)}
                  className="shrink-0 text-ink-muted outline-none hover:text-ink-primary focus-visible:text-ink-primary"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
