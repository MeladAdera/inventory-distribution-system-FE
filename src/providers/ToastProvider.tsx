'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/common/utils/cn';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
  action?: ToastAction;
}

interface ToastContextValue {
  success: (message: string, action?: ToastAction) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const add = (message: string, type: Toast['type'], action?: ToastAction) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type, action }]);
    // Actionable toasts linger a bit longer so the action is reachable
    setTimeout(() => remove(id), action ? 6000 : 4000);
  };

  return (
    <ToastContext.Provider
      value={{
        success: (msg, action) => add(msg, 'success', action),
        error: (msg) => add(msg, 'error'),
      }}
    >
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-2 rounded-md px-4 py-3 text-sm font-medium text-white shadow-lg',
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            )}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" />
            )}
            {toast.message}
            {toast.action && (
              <button
                onClick={() => {
                  remove(toast.id);
                  toast.action!.onClick();
                }}
                className="ms-1 shrink-0 font-bold underline underline-offset-2 hover:opacity-80"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
