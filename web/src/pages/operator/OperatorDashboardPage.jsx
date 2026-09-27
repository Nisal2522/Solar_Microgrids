// -----------------------------------------------------------------------------
// File: OperatorDashboardPage.jsx
// Purpose: Grid Operator console — live pending/approved counters, an inline
//          battery-slot availability editor per node, and the queue of
//          reservations awaiting approval.
// Module owner: Member D (Grid Operator Ops & Service Integration)
// -----------------------------------------------------------------------------
import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import StatCard from "../../components/ui/StatCard";
import { Card, CardHeader } from "../../components/ui/Card";
import DataTable from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Field";
import { StatusBadge } from "../../components/ui/Badge";
import { useToast } from "../../components/ui/Toast";
import {
  BatteryIcon, CalendarIcon, CheckIcon, ClockIcon, GaugeIcon, StationIcon,
} from "../../components/ui/Icons";

// Renders the operator's counters, battery editor and approval queue.
export default function OperatorDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const toast = useToast();

  // Loads the dashboard summary and the station list for the battery editor.
  async function loadData() {
    setLoading(true);
    try {
      const [dashboardRes, stationsRes] = await Promise.all([
        apiClient.get("/dashboard/operator"),
        apiClient.get("/stations"),
      ]);
      setDashboard(dashboardRes.data);
      setStations(stationsRes.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  // Persists a new available-battery-slot count for one station.
  async function handleBatteryUpdate(station, newAvailable) {
    if (Number.isNaN(newAvailable) || newAvailable === station.availableBatterySlots) return;
    setSavingId(station.id);
    try {
      await apiClient.put(`/stations/${station.id}`, {
        stationName: station.stationName,
        lat: station.lat,
        lng: station.lng,
        capacityKWh: station.capacityKWh,
        totalBatterySlots: station.totalBatterySlots,
        availableBatterySlots: newAvailable,
        schedule: station.schedule,
      });
      toast.success(`${station.stationName} updated to ${newAvailable} free slots.`);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update battery availability.");
    } finally {
      setSavingId(null);
    }
  }

  // Approves a pending reservation straight from the queue.
  async function handleApprove(reservation) {
    try {
      await apiClient.put(`/reservations/${reservation.id}/approve`);
      toast.success(`${reservation.reservationCode} approved, QR issued.`);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not approve this reservation.");
    }
  }

  const batteryColumns = [
    {
      key: "stationName",
      header: "Node",
      render: (s) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
            <StationIcon className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">{s.stationName}</p>
            <p className="text-xs text-slate-500">{s.capacityKWh} kWh capacity</p>
          </div>
        </div>
      ),
    },
    {
      key: "availability",
      header: "Availability",
      render: (s) => {
        const pct = s.totalBatterySlots ? (s.availableBatterySlots / s.totalBatterySlots) * 100 : 0;
        return (
          <div className="w-40">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">{s.availableBatterySlots} free</span>
              <span className="text-slate-400">of {s.totalBatterySlots}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${pct > 50 ? "from-brand-400 to-brand-600" : pct > 20 ? "from-solar-300 to-solar-500" : "from-rose-400 to-rose-600"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    { key: "status", header: "Status", render: (s) => <StatusBadge status={s.status} /> },
    {
      key: "update",
      header: "Set free slots",
      className: "text-right",
      render: (s) => (
        <div className="flex items-center justify-end gap-2">
          <Input
            type="number"
            min={0}
            max={s.totalBatterySlots}
            defaultValue={s.availableBatterySlots}
            disabled={savingId === s.id}
            onBlur={(e) => handleBatteryUpdate(s, parseInt(e.target.value, 10))}
            className="h-10 w-24 text-center"
          />
          {savingId === s.id && <span className="text-xs text-slate-400">saving…</span>}
        </div>
      ),
    },
  ];

  const queueColumns = [
    {
      key: "reservationCode",
      header: "Reservation",
      render: (r) => (
        <div>
          <p className="font-mono text-[13px] font-bold text-slate-900">{r.reservationCode}</p>
          <p className="text-xs text-slate-500">NIC {r.prosumerNic}</p>
        </div>
      ),
    },
    {
      key: "scheduledDateTime",
      header: "Scheduled",
      render: (r) => (
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-slate-400" />
          {new Date(r.scheduledDateTime).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </div>
      ),
    },
    { key: "energyAmountKWh", header: "Energy", render: (r) => <span className="font-semibold text-slate-800">{r.energyAmountKWh} kWh</span> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => <Button size="sm" icon={CheckIcon} onClick={() => handleApprove(r)}>Approve</Button>,
    },
  ];

  const totalFree = stations.reduce((sum, s) => sum + s.availableBatterySlots, 0);
  const totalSlots = stations.reduce((sum, s) => sum + s.totalBatterySlots, 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending reservations" value={dashboard?.pendingReservationsCount ?? 0} hint="Waiting on your approval" icon={ClockIcon} tone="amber" loading={loading} />
        <StatCard label="Approved (future)" value={dashboard?.approvedFutureReservationsCount ?? 0} hint="Confirmed upcoming transfers" icon={CalendarIcon} tone="emerald" loading={loading} />
        <StatCard label="Battery slots free" value={totalFree} hint={`of ${totalSlots} across all nodes`} icon={BatteryIcon} tone="sky" loading={loading} />
        <StatCard label="Active nodes" value={stations.filter((s) => s.status === "Active").length} hint={`${stations.length} registered in total`} icon={StationIcon} tone="emerald" loading={loading} />
      </section>

      <Card>
        <CardHeader icon={GaugeIcon} title="Battery slot availability" description="Update free slot counts as batteries are swapped in and out at each node." />
        <DataTable
          columns={batteryColumns}
          rows={stations}
          loading={loading}
          empty={{ icon: StationIcon, title: "No nodes registered", description: "Ask a Backoffice officer to register a microgrid node first." }}
        />
      </Card>

      <Card>
        <CardHeader
          icon={CalendarIcon}
          title="Reservations awaiting approval"
          description="Approving a booking issues the prosumer's transaction QR code."
          actions={
            !loading && dashboard?.pendingReservations?.length > 0 && (
              <span className="rounded-full bg-solar-50 px-3 py-1.5 text-xs font-bold text-solar-600 ring-1 ring-inset ring-solar-200">
                {dashboard.pendingReservations.length} pending
              </span>
            )
          }
        />
        <DataTable
          columns={queueColumns}
          rows={dashboard?.pendingReservations || []}
          loading={loading}
          empty={{ icon: CheckIcon, title: "Queue is clear", description: "Every booking has been actioned. Nothing is waiting for approval." }}
        />
      </Card>
    </div>
  );
}
