"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Toast = { id: number; kind: "success" | "error"; message: string };

type ToastContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

/**
 * Minimal toast system for the authenticated BlokMate app — bottom-right
 * stack, auto-dismiss after 5s. Deliberately not a general-purpose
 * component: scoped to app/blokmate/(app) where every create/update
 * mutation wants a transient success/error notice alongside (not instead
 * of) the existing inline error <p> on each form, which stays as the
 * persistent, accessible record of the failure.
 */
export function BlokmateToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: Toast["kind"], message: string) => {
    const id = nextId++;
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  const value: ToastContextValue = {
    success: (message) => push("success", message),
    error: (message) => push("error", message),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto max-w-sm rounded-lg border px-4 py-3 text-sm font-medium shadow-lift ${
              t.kind === "error"
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/80 dark:text-red-300"
                : "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/80 dark:text-green-300"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useBlokmateToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useBlokmateToast must be used within BlokmateToastProvider");
  return ctx;
}
