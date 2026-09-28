// -----------------------------------------------------------------------------
// File: Toast.jsx
// Purpose: Lightweight toast system (provider + useToast hook) so success and
//          error feedback appears consistently instead of via alert().
// Module owner: shared infrastructure
// -----------------------------------------------------------------------------
import { createContext, useCallback, useContext, useState } from "react";
import { AlertIcon, CheckIcon, XIcon } from "./Icons";

const ToastContext = createContext(null);

const TONES = {
  success: { ring: "ring-brand-200", bg: "bg-brand-50", fg: "text-brand-700", Icon: CheckIcon },
  error: { ring: "ring-rose-200", bg: "bg-rose-50", fg: "text-rose-700", Icon: AlertIcon },
};

// Provides toast state to the tree and renders the stack in the corner.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Adds a toast and schedules its removal.
  const push = useCallback((message, tone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const api = {
    success: useCallback((m) => push(m, "success"), [push]),
    error: useCallback((m) => push(m, "error"), [push]),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-full max-w-sm flex-col gap-2.5">
        {toasts.map((t) => {
          const tone = TONES[t.tone];
          return (
            <div
              key={t.id}
              className="animate-rise pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-[0_18px_40px_-14px_rgb(15_23_42/0.35)]"
            >
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset ${tone.bg} ${tone.fg} ${tone.ring}`}>
                <tone.Icon className="h-4 w-4" />
              </span>
              <p className="flex-1 pt-1 text-sm font-medium text-slate-700">{t.message}</p>
              <button
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Dismiss notification"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// Hook returning { success, error } notification helpers.
export function useToast() {
  return useContext(ToastContext);
}
