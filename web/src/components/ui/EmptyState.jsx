// -----------------------------------------------------------------------------
// File: EmptyState.jsx
// Purpose: Friendly placeholder shown when a list has no rows yet, instead of
//          a bare "no data" line.
// Module owner: shared infrastructure
// -----------------------------------------------------------------------------

// Renders a centred icon, title, description and optional action.
export default function EmptyState({ icon: LeadIcon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {LeadIcon && (
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 text-slate-300 ring-1 ring-slate-100">
          <LeadIcon className="h-7 w-7" />
        </span>
      )}
      <p className="text-[15px] font-semibold text-slate-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
