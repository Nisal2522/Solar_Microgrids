// -----------------------------------------------------------------------------
// File: AppShell.jsx
// Purpose: The console's application frame — a dark fixed sidebar with
//          role-aware navigation, a sticky top bar, and a full-width content
//          area. Collapses to an overlay drawer on small screens.
// Module owner: shared infrastructure
// -----------------------------------------------------------------------------
import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  GaugeIcon, GridIcon, LogoutIcon, MenuIcon, StationIcon,
  UserCheckIcon, UsersIcon, CalendarIcon, XIcon, ShieldIcon, ChevronLeftIcon,
} from "./ui/Icons";

const NAV = [
  {
    section: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: GridIcon, roles: ["Backoffice", "GridOperator"], end: true }],
  },
  {
    section: "Administration",
    items: [
      { to: "/backoffice/pending", label: "Pending Activations", icon: UserCheckIcon, roles: ["Backoffice"] },
      { to: "/backoffice/users", label: "Staff Users", icon: UsersIcon, roles: ["Backoffice"] },
    ],
  },
  {
    section: "Grid",
    items: [
      { to: "/backoffice/stations", label: "Microgrid Nodes", icon: StationIcon, roles: ["Backoffice"] },
      { to: "/backoffice/reservations", label: "Reservations", icon: CalendarIcon, roles: ["Backoffice"] },
      { to: "/operator", label: "Operator Console", icon: GaugeIcon, roles: ["Backoffice", "GridOperator"] },
    ],
  },
];

// Returns the user's initials for the avatar chip.
function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// Sidebar navigation; `onNavigate` lets the mobile drawer close after a click.
function SidebarNav({ role, onNavigate, collapsed }) {
  const sections = NAV.map((s) => ({
    ...s,
    items: s.items.filter((i) => i.roles.includes(role)),
  })).filter((s) => s.items.length > 0);

  return (
    <nav className="flex-1 space-y-7 overflow-y-auto overflow-x-hidden px-4 py-6">
      {sections.map((section) => (
        <div key={section.section}>
          {!collapsed && (
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
              {section.section}
            </p>
          )}
          <div className="space-y-1">
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    collapsed ? "justify-center" : ""
                  } ${
                    isActive
                      ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-brand-300 to-brand-500" />
                    )}
                    <item.icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-brand-300" : ""}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

// Brand lockup shown at the top of the sidebar.
function Brand({ collapsed }) {
  return (
    <Link to="/" className={`flex items-center gap-3 px-6 pb-2 pt-6 ${collapsed ? "justify-center px-0" : ""}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-[0_10px_24px_-8px_rgb(16_185_129/0.9)]">
        <img src="/logo.png" alt="Smart Solar Microgrid logo" className="h-9 w-9 object-contain" />
      </span>
      {!collapsed && (
        <span className="min-w-0">
          <span className="block truncate font-display text-[15px] font-extrabold leading-tight text-white">
            Solar Microgrid
          </span>
          <span className="block text-[11px] font-medium tracking-wide text-white/45">Trading Console</span>
        </span>
      )}
    </Link>
  );
}

// User card pinned to the bottom of the sidebar with a sign-out action.
function UserCard({ user, onLogout, collapsed }) {
  return (
    <div className="border-t border-white/10 p-4">
      <div className={`flex items-center gap-3 rounded-xl bg-white/5 p-3 ${collapsed ? "flex-col" : ""}`}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-solar-300 to-solar-500 text-[12px] font-bold text-ink-900">
          {initials(user.fullName)}
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-white">{user.fullName}</span>
            <span className="block truncate text-[11px] text-white/45">{user.userType}</span>
          </span>
        )}
        <button
          onClick={onLogout}
          title="Sign out"
          className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogoutIcon className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  );
}

// Derives the page title shown in the top bar from the current route.
const TITLES = {
  "/": "Dashboard",
  "/backoffice/pending": "Pending Activations",
  "/backoffice/users": "Staff Users",
  "/backoffice/stations": "Microgrid Nodes",
  "/backoffice/reservations": "Energy Slot Reservations",
  "/operator": "Operator Console",
};

// Application frame: sidebar + top bar + content outlet.
export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Clears the session and returns to the sign-in screen.
  function handleLogout() {
    logout();
    navigate("/login");
  }

  // The grid texture lives on its own layer: both it and the gradient set
  // background-image, so they cannot share an element.
  function renderSidebar(isCollapsed, onNavigate) {
    return (
      <div className="relative h-full overflow-hidden bg-gradient-to-b from-ink-800 via-ink-900 to-ink-950">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative flex h-full flex-col">
          <Brand collapsed={isCollapsed} />
          <SidebarNav role={user.userType} onNavigate={onNavigate} collapsed={isCollapsed} />
          <UserCard user={user} onLogout={handleLogout} collapsed={isCollapsed} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-200 lg:block ${
          collapsed ? "w-[84px]" : "w-[264px]"
        }`}
      >
        {renderSidebar(collapsed, () => {})}
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3.5 top-5 grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-md transition-colors hover:text-slate-900"
        >
          <ChevronLeftIcon className={`h-4 w-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="animate-rise absolute inset-y-0 left-0 w-[264px]">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute -right-11 top-4 rounded-lg bg-white/10 p-2 text-white backdrop-blur"
              aria-label="Close navigation"
            >
              <XIcon className="h-5 w-5" />
            </button>
            {renderSidebar(false, () => setDrawerOpen(false))}
          </aside>
        </div>
      )}

      <div className={`transition-[padding] duration-200 ${collapsed ? "lg:pl-[84px]" : "lg:pl-[264px]"}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-4 px-5 sm:px-8">
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation"
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-[19px] font-extrabold tracking-tight text-slate-900">
                {TITLES[location.pathname] || "Console"}
              </h1>
            </div>

            <span className="hidden items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100 sm:inline-flex">
              <ShieldIcon className="h-3.5 w-3.5" />
              {user.userType}
            </span>
          </div>
        </header>

        <main className="animate-rise px-5 py-7 sm:px-8 sm:py-9">{children}</main>
      </div>
    </div>
  );
}
