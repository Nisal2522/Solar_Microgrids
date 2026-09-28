// -----------------------------------------------------------------------------
// File: Drawer.jsx
// Purpose: Slide-in side panel used for create/edit forms, so a long form gets
//          room to breathe instead of being cramped into a centred dialog.
//          Same open/onClose/Escape/backdrop-click behaviour as Modal.
// Module owner: shared infrastructure
// -----------------------------------------------------------------------------
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "./Icons";

const SIZES = { md: "max-w-md", lg: "max-w-xl", xl: "max-w-2xl" };

// Renders a right-anchored sliding panel over a blurred backdrop when `open` is true.
export default function Drawer({ open, onClose, title, description, icon: LeadIcon, tone = "brand", size = "md", children, footer }) {
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
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="animate-fade absolute inset-0 bg-ink-900/55 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`animate-slide-in relative flex h-full w-full ${SIZES[size]} flex-col bg-white shadow-[-32px_0_80px_-20px_rgb(15_23_42/0.45)]`}
      >
        <div className="flex shrink-0 items-start gap-4 border-b border-slate-100 px-6 pb-5 pt-6">
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
            aria-label="Close panel"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {children && <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>}

        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
