// -----------------------------------------------------------------------------
// File: Badge.jsx
// Purpose: Status pills. StatusBadge maps the API's status strings
//          (Pending/Approved/Active/Deactivated/...) onto a consistent colour
//          language so the same state always looks the same everywhere.
// Module owner: shared infrastructure
// -----------------------------------------------------------------------------

const TONES = {
  emerald: "bg-brand-50 text-brand-700 ring-brand-200",
  amber: "bg-solar-50 text-solar-600 ring-solar-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  sky: "bg-sky-50 text-sky-700 ring-sky-200",
};

// Generic coloured pill.
export function Badge({ tone = "slate", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

const STATUS_TONES = {
  Active: "emerald",
  Approved: "emerald",
  Completed: "sky",
  Open: "emerald",
  Pending: "amber",
  PendingActivation: "amber",
  Full: "amber",
  Cancelled: "rose",
  Deactivated: "rose",
  Closed: "slate",
};

const STATUS_LABELS = {
  PendingActivation: "Pending",
};

// Status pill that colours itself from the API status string.
export function StatusBadge({ status }) {
  const tone = STATUS_TONES[status] || "slate";
  return (
    <Badge tone={tone}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[status] || status}
    </Badge>
  );
}

export default Badge;
