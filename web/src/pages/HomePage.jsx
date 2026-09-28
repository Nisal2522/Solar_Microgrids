// -----------------------------------------------------------------------------
// File: HomePage.jsx
// Purpose: Main landing dashboard — a welcome hero, live KPI tiles pulled from
//          the API, and quick-access cards for each area the signed-in role can
//          reach. This is the console's opening screen after sign-in.
// Module owner: shared infrastructure
// -----------------------------------------------------------------------------
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/ui/StatCard";
import { Card } from "../components/ui/Card";
import {
  ArrowRightIcon, BatteryIcon, BoltIcon, CalendarIcon, ClockIcon, GaugeIcon,
  StationIcon, SunIcon, UserCheckIcon, UsersIcon,
} from "../components/ui/Icons";

const QUICK_LINKS = {
  Backoffice: [
    { to: "/backoffice/pending", label: "Pending Activations", copy: "Review and approve new prosumer registrations.", icon: UserCheckIcon, tone: "amber" },
    { to: "/backoffice/users", label: "Staff Users", copy: "Create Backoffice and Grid Operator accounts.", icon: UsersIcon, tone: "sky" },
    { to: "/backoffice/stations", label: "Microgrid Nodes", copy: "Manage hubs, GPS, capacity and schedules.", icon: StationIcon, tone: "emerald" },
    { to: "/backoffice/reservations", label: "Reservations", copy: "Book on behalf, approve and cancel bookings.", icon: CalendarIcon, tone: "emerald" },
    { to: "/operator", label: "Operator Console", copy: "Battery availability and the approval queue.", icon: GaugeIcon, tone: "sky" },
  ],
  GridOperator: [
    { to: "/operator", label: "Operator Console", copy: "Battery availability and the approval queue.", icon: GaugeIcon, tone: "emerald" },
  ],
};

const TONE_RING = {
  emerald: "bg-brand-50 text-brand-700 ring-brand-100",
  amber: "bg-solar-50 text-solar-600 ring-solar-200",
  sky: "bg-sky-50 text-sky-700 ring-sky-100",
};

// Renders the role-aware dashboard landing page.
export default function HomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Loads the counters shown in the KPI row (dashboard + stations + pending queue).
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const requests = [apiClient.get("/dashboard/operator"), apiClient.get("/stations")];
        if (user.userType === "Backoffice") requests.push(apiClient.get("/users/pending"));
        const [dash, stations, pending] = await Promise.all(requests);
        if (cancelled) return;
        setStats({
          pendingReservations: dash.data.pendingReservationsCount,
          approvedFuture: dash.data.approvedFutureReservationsCount,
          activeStations: stations.data.filter((s) => s.status === "Active").length,
          totalStations: stations.data.length,
          batteryAvailable: stations.data.reduce((sum, s) => sum + s.availableBatterySlots, 0),
          batteryTotal: stations.data.reduce((sum, s) => sum + s.totalBatterySlots, 0),
          pendingAccounts: pending ? pending.data.length : null,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user.userType]);

  const links = QUICK_LINKS[user.userType] || [];
  const firstName = user.fullName?.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="bg-aurora relative overflow-hidden rounded-3xl bg-ink-900 px-7 py-9 sm:px-10 sm:py-11">
        <div className="bg-grid absolute inset-0 opacity-60" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-200 ring-1 ring-inset ring-white/15">
              <SunIcon className="h-3.5 w-3.5" />
              {user.userType === "Backoffice" ? "Backoffice control centre" : "Grid operations"}
            </span>
            <h2 className="mt-4 font-display text-[32px] font-extrabold leading-tight tracking-tight text-white sm:text-[38px]">
              Good to see you, {firstName}.
            </h2>
            <p className="mt-2.5 max-w-xl text-[15px] leading-relaxed text-white/60">
              Here's the live state of the microgrid network: nodes, battery capacity and the
              energy-trading bookings waiting on your action.
            </p>
          </div>
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-brand-200 ring-1 ring-inset ring-white/15 backdrop-blur">
            <BoltIcon className="h-8 w-8" />
          </span>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending reservations"
          value={stats?.pendingReservations ?? 0}
          hint="Awaiting operator approval"
          icon={ClockIcon}
          tone="amber"
          loading={loading}
        />
        <StatCard
          label="Approved (future)"
          value={stats?.approvedFuture ?? 0}
          hint="Confirmed upcoming transfers"
          icon={CalendarIcon}
          tone="emerald"
          loading={loading}
        />
        <StatCard
          label="Active nodes"
          value={stats?.activeStations ?? 0}
          hint={stats ? `${stats.totalStations} registered in total` : ""}
          icon={StationIcon}
          tone="sky"
          loading={loading}
        />
        <StatCard
          label="Battery slots free"
          value={stats?.batteryAvailable ?? 0}
          hint={stats ? `of ${stats.batteryTotal} across all nodes` : ""}
          icon={BatteryIcon}
          tone="emerald"
          loading={loading}
        />
      </section>

      {/* Quick access */}
      <section>
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h3 className="font-display text-lg font-bold tracking-tight text-slate-900">Quick access</h3>
          {stats?.pendingAccounts > 0 && (
            <Link to="/backoffice/pending" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
              {stats.pendingAccounts} account{stats.pendingAccounts === 1 ? "" : "s"} awaiting activation →
            </Link>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="group">
              <Card className="h-full p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_2px_4px_rgb(15_23_42/0.05),0_22px_44px_-20px_rgb(5_150_105/0.35)]">
                <div className="flex items-start justify-between gap-4">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ring-1 ring-inset ${TONE_RING[link.tone]}`}>
                    <link.icon className="h-6 w-6" />
                  </span>
                  <ArrowRightIcon className="h-5 w-5 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand-600" />
                </div>
                <h4 className="mt-5 text-[15px] font-bold text-slate-900">{link.label}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{link.copy}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
