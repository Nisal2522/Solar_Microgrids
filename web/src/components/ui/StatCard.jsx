// -----------------------------------------------------------------------------
// File: StatCard.jsx
// Purpose: KPI tile used on the dashboards — large value, label, optional
//          trailing hint and a tinted icon badge.
// Module owner: shared infrastructure
// -----------------------------------------------------------------------------

const TONES = {
  emerald: { ring: "ring-brand-100", bg: "bg-brand-50", fg: "text-brand-700", bar: "from-brand-400 to-brand-600" },
  amber: { ring: "ring-solar-200", bg: "bg-solar-50", fg: "text-solar-600", bar: "from-solar-300 to-solar-500" },
  sky: { ring: "ring-sky-100", bg: "bg-sky-50", fg: "text-sky-700", bar: "from-sky-400 to-sky-600" },
  slate: { ring: "ring-slate-200", bg: "bg-slate-100", fg: "text-slate-700", bar: "from-slate-400 to-slate-600" },
};

// Renders one KPI tile. `value` is displayed large; `hint` sits under it.
export default function StatCard({ label, value, hint, icon: LeadIcon, tone = "emerald", loading = false }) {
  const t = TONES[tone];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgb(15_23_42/0.04),0_12px_32px_-16px_rgb(15_23_42/0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgb(15_23_42/0.05),0_22px_44px_-20px_rgb(15_23_42/0.28)]">
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${t.bar}`} />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-500">{label}</p>
          {loading ? (
            <div className="mt-2 h-9 w-16 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <p className="mt-1 font-display text-4xl font-extrabold tracking-tight text-slate-900">{value}</p>
          )}
          {hint && <p className="mt-1.5 truncate text-xs text-slate-400">{hint}</p>}
        </div>
        {LeadIcon && (
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ring-inset ${t.bg} ${t.fg} ${t.ring}`}>
            <LeadIcon className="h-5 w-5" />
          </span>
        )}
      </div>
    </div>
  );
}
