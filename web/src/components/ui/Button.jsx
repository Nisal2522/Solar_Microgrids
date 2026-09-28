// -----------------------------------------------------------------------------
// File: Button.jsx
// Purpose: Single button primitive with brand/solar/ghost/danger variants so
//          every action in the console shares one interaction language.
// Module owner: shared infrastructure
// -----------------------------------------------------------------------------

const VARIANTS = {
  primary:
    "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-[0_10px_24px_-10px_rgb(5_150_105/0.9)] hover:from-brand-400 hover:to-brand-600 active:translate-y-px",
  solar:
    "bg-gradient-to-b from-solar-400 to-solar-500 text-ink-900 shadow-[0_10px_24px_-10px_rgb(217_119_6/0.8)] hover:from-solar-300 hover:to-solar-500 active:translate-y-px",
  subtle:
    "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger:
    "bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-[0_10px_24px_-10px_rgb(225_29_72/0.8)] hover:from-rose-400 hover:to-rose-600 active:translate-y-px",
  dangerGhost: "text-rose-600 hover:bg-rose-50",
};

const SIZES = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
};

// Renders a styled button; `icon` is an optional leading icon component.
export default function Button({
  variant = "primary",
  size = "md",
  icon: LeadingIcon,
  className = "",
  children,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-semibold tracking-tight transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {LeadingIcon && <LeadingIcon className="h-4 w-4" />}
      {children}
    </button>
  );
}
