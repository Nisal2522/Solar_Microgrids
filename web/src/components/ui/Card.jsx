// -----------------------------------------------------------------------------
// File: Card.jsx
// Purpose: Surface primitives — the base Card container and a CardHeader with
//          optional eyebrow/title/description/actions used by every page panel.
// Module owner: shared infrastructure
// -----------------------------------------------------------------------------

// Base elevated surface used to group related content.
export function Card({ className = "", children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04),0_12px_32px_-16px_rgb(15_23_42/0.16)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// Title block for a card, with an optional right-aligned actions slot.
export function CardHeader({ title, description, icon: LeadIcon, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
      <div className="flex items-start gap-3.5">
        {LeadIcon && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
            <LeadIcon className="h-5 w-5" />
          </span>
        )}
        <div>
          <h2 className="text-[17px] font-bold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// Section heading used between cards on a page.
export function SectionTitle({ children, hint }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 className="text-lg font-bold tracking-tight text-slate-900">{children}</h2>
      {hint && <span className="text-sm text-slate-500">{hint}</span>}
    </div>
  );
}

export default Card;
