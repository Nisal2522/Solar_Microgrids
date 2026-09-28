// -----------------------------------------------------------------------------
// File: Field.jsx
// Purpose: Form primitives — labelled Input and Select wrappers that share one
//          focus ring, sizing and error treatment across every form.
// Module owner: shared infrastructure
// -----------------------------------------------------------------------------

const CONTROL =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:bg-slate-50 disabled:text-slate-400";

// Label + control wrapper providing consistent vertical rhythm.
export function Field({ label, hint, required, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-slate-700">
          {label}
          {required && <span className="text-rose-500">*</span>}
        </span>
      )}
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

// Text/number/date input styled to the design system.
export function Input({ className = "", ...props }) {
  return <input className={`${CONTROL} ${className}`} {...props} />;
}

// Native select with a custom chevron so it matches Input height/rounding.
export function Select({ className = "", children, ...props }) {
  return (
    <div className="relative">
      <select
        className={`${CONTROL} appearance-none pr-10 ${className}`}
        {...props}
      >
        {children}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

export default Field;
