// -----------------------------------------------------------------------------
// File: Modal.jsx
// Purpose: Accessible dialog used for confirmations and short forms, replacing
//          the browser's window.prompt/alert so the console keeps one visual
//          language. Closes on Escape and on backdrop click.
// Module owner: shared infrastructure
// -----------------------------------------------------------------------------
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "./Icons";

const SIZES = { md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-3xl" };

// Renders a centred dialog over a blurred backdrop when `open` is true.
export default function Modal({ open, onClose, title, description, icon: LeadIcon, tone = "brand", size = "md", children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const toneClasses =
    tone === "danger"
      ? "bg-rose-50 text-rose-600 ring-rose-100"
      : "bg-brand-50 text-brand-700 ring-brand-100";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-ink-900/55 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`animate-rise relative max-h-[92vh] w-full ${SIZES[size]} overflow-y-auto rounded-2xl bg-white shadow-[0_32px_80px_-20px_rgb(15_23_42/0.45)]`}
      >
        <div className="flex items-start gap-4 px-6 pb-4 pt-6">
          {LeadIcon && (
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ring-inset ${toneClasses}`}>
              <LeadIcon className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close dialog"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {children && <div className="px-6 pb-2">{children}</div>}

        {footer && (
          <div className="mt-4 flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
