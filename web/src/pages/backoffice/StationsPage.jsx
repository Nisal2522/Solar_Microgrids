// -----------------------------------------------------------------------------
// File: StationsPage.jsx
// Purpose: Backoffice screen to register microgrid node hubs (GPS, capacity,
//          battery slots, weekly operating schedule) and to deactivate them.
//          Deactivation is refused server-side while active reservations exist.
// Module owner: Member B (Microgrid Nodes & Maps)
// -----------------------------------------------------------------------------
import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import StatCard from "../../components/ui/StatCard";
import { Card, CardHeader } from "../../components/ui/Card";
import DataTable from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import { Field, Input, Select } from "../../components/ui/Field";
import { StatusBadge } from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Drawer from "../../components/ui/Drawer";
import { useToast } from "../../components/ui/Toast";
import {
  AlertIcon, BatteryIcon, BoltIcon, CalendarIcon, MapPinIcon, PlusIcon, StationIcon, XIcon,
} from "../../components/ui/Icons";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const EMPTY_FORM = {
  stationName: "", lat: "", lng: "", capacityKWh: "", totalBatterySlots: "",
  schedule: [{ day: "Monday", openTime: "08:00", closeTime: "18:00" }],
};

// Renders the node directory plus the registration dialog.
export default function StationsPage() {
  const [stations, setStations] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const toast = useToast();

  // Loads every station, active and deactivated.
  async function loadStations() {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/stations");
      setStations(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStations(); }, []);

  // Updates one field of one schedule row.
  function updateScheduleRow(index, field, value) {
    setForm({ ...form, schedule: form.schedule.map((row, i) => (i === index ? { ...row, [field]: value } : row)) });
  }

  // Appends another operating-hours row.
  function addScheduleRow() {
    setForm({ ...form, schedule: [...form.schedule, { day: "Monday", openTime: "08:00", closeTime: "18:00" }] });
  }

  // Removes an operating-hours row.
  function removeScheduleRow(index) {
    setForm({ ...form, schedule: form.schedule.filter((_, i) => i !== index) });
  }

  // Creates the station from the dialog form values.
  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post("/stations", {
        stationName: form.stationName,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        capacityKWh: parseFloat(form.capacityKWh),
        totalBatterySlots: parseInt(form.totalBatterySlots, 10),
        schedule: form.schedule,
      });
      toast.success(`${form.stationName} registered.`);
      setForm(EMPTY_FORM);
      setFormOpen(false);
      await loadStations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create this station.");
    } finally {
      setSaving(false);
    }
  }

  // Deactivates the station confirmed in the dialog.
  async function applyDeactivate() {
    const station = confirm;
    setConfirm(null);
    try {
      await apiClient.put(`/stations/${station.id}/deactivate`);
      toast.success(`${station.stationName} deactivated.`);
      await loadStations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not deactivate this station.");
    }
  }

  // Tops up bookable slots for a station from its schedule (also covers stations
  // registered before slot auto-generation, and extends the rolling window over time).
  async function handleGenerateSlots(station) {
    setGeneratingId(station.id);
    try {
      const { data } = await apiClient.post(`/stations/${station.id}/generate-slots`);
      toast.success(
        data.created > 0
          ? `${data.created} new slot${data.created === 1 ? "" : "s"} generated for ${station.stationName}.`
          : `${station.stationName} is already up to date — no new slots needed.`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not generate slots for this station.");
    } finally {
      setGeneratingId(null);
    }
  }

  // Column definitions for the station directory table. Each entry maps a
  // station field to a header and a custom cell renderer.
  const columns = [
    // Node: station name with its GPS coordinates (4 decimal places) underneath.
    {
      key: "stationName",
      header: "Node",
      className: "min-w-[240px]",
      render: (s) => (
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
            <StationIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{s.stationName}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <MapPinIcon className="h-3 w-3 shrink-0" />
              {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
            </p>
          </div>
        </div>
      ),
    },
    // Capacity: the node's energy storage capacity in kWh.
    {
      key: "capacityKWh",
      header: "Capacity",
      className: "whitespace-nowrap",
      render: (s) => (
        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
          <BoltIcon className="h-4 w-4 text-solar-500" />
          {s.capacityKWh} kWh
        </span>
      ),
    },
    // Battery slots: free/total count plus a progress bar coloured by how full
    // the node is (green > 50% free, amber > 20% free, red otherwise).
    {
      key: "battery",
      header: "Battery slots",
      className: "min-w-[180px]",
      render: (s) => {
        const pct = s.totalBatterySlots ? (s.availableBatterySlots / s.totalBatterySlots) * 100 : 0;
        return (
          <div className="w-40">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">{s.availableBatterySlots}/{s.totalBatterySlots} free</span>
              <span className="text-slate-400">{Math.round(pct)}%</span>
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
    // Operating hours: first schedule row's open/close times and the list of
    // days the node is open (abbreviated). Shows a dash when no schedule exists.
    {
      key: "schedule",
      header: "Operating hours",
      className: "whitespace-nowrap",
      render: (s) =>
        s.schedule?.length ? (
          <div>
            <p className="font-medium text-slate-700">{s.schedule[0].openTime} – {s.schedule[0].closeTime}</p>
            <p className="text-xs text-slate-500">{s.schedule.map((d) => d.day.slice(0, 3)).join(", ")}</p>
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    // Status: Active / Deactivated badge.
    { key: "status", header: "Status", render: (s) => <StatusBadge status={s.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right whitespace-nowrap",
      render: (s) =>
        s.status === "Active" ? (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="subtle"
              icon={CalendarIcon}
              disabled={generatingId === s.id}
              onClick={() => handleGenerateSlots(s)}
            >
              {generatingId === s.id ? "Generating…" : "Generate slots"}
            </Button>
            <Button size="sm" variant="dangerGhost" onClick={() => setConfirm(s)}>Deactivate</Button>
          </div>
        ) : null,
    },
  ];

  // Summary figures for the stat cards, derived from the loaded station list.
  const active = stations.filter((s) => s.status === "Active");                     // nodes currently accepting bookings
  const totalCapacity = stations.reduce((sum, s) => sum + s.capacityKWh, 0);         // combined kWh across all nodes
  const freeSlots = stations.reduce((sum, s) => sum + s.availableBatterySlots, 0);   // battery slots free right now
  const totalSlots = stations.reduce((sum, s) => sum + s.totalBatterySlots, 0);      // battery slots installed overall

  return (
    <div className="space-y-6">
      {/* Summary stat cards: active nodes, network capacity, free battery slots */}
      <section className="grid gap-5 sm:grid-cols-3">
        <StatCard label="Active nodes" value={active.length} hint={`${stations.length} registered in total`} icon={StationIcon} tone="emerald" loading={loading} />
        <StatCard label="Network capacity" value={`${totalCapacity} kWh`} hint="Combined across every node" icon={BoltIcon} tone="amber" loading={loading} />
        <StatCard label="Battery slots free" value={freeSlots} hint={`of ${totalSlots} installed`} icon={BatteryIcon} tone="sky" loading={loading} />
      </section>

      {/* Station directory table */}
      <Card>
        <CardHeader
          icon={StationIcon}
          title="Microgrid nodes"
          description="Solar hubs available for prosumer energy drop-off and charging."
          actions={<Button icon={PlusIcon} onClick={() => setFormOpen(true)}>Register node</Button>}
        />
        <DataTable
          columns={columns}
          rows={stations}
          loading={loading}
          empty={{
            icon: StationIcon,
            title: "No microgrid nodes yet",
            description: "Register the first solar hub to start accepting prosumer energy bookings.",
            action: <Button icon={PlusIcon} onClick={() => setFormOpen(true)}>Register node</Button>,
          }}
        />
      </Card>

      {/* Registration panel */}
      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        size="lg"
        icon={StationIcon}
        title="Register a microgrid node"
        description="GPS position drives the nearby-stations map in the prosumer mobile app."
        footer={
          <>
            <Button variant="subtle" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" form="station-form" icon={PlusIcon} disabled={saving}>
              {saving ? "Registering…" : "Register node"}
            </Button>
          </>
        }
      >
        <form id="station-form" onSubmit={handleCreate} className="space-y-4 pb-2">
          <Field label="Station name" required>
            <Input value={form.stationName} onChange={(e) => setForm({ ...form, stationName: e.target.value })} placeholder="Colombo Fort Hub" required />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Latitude" required>
              <Input type="number" step="0.000001" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="6.9344" required />
            </Field>
            <Field label="Longitude" required>
              <Input type="number" step="0.000001" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="79.8428" required />
            </Field>
            <Field label="Capacity (kWh)" required>
              <Input type="number" step="0.1" value={form.capacityKWh} onChange={(e) => setForm({ ...form, capacityKWh: e.target.value })} placeholder="75" required />
            </Field>
            <Field label="Total battery slots" required>
              <Input type="number" value={form.totalBatterySlots} onChange={(e) => setForm({ ...form, totalBatterySlots: e.target.value })} placeholder="12" required />
            </Field>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
              <BatteryIcon className="h-4 w-4 text-slate-400" />
              Operating schedule
            </p>
            <div className="space-y-2">
              {form.schedule.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select value={row.day} onChange={(e) => updateScheduleRow(i, "day", e.target.value)} className="h-10 flex-1 text-[13px]">
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </Select>
                  <Input type="time" value={row.openTime} onChange={(e) => updateScheduleRow(i, "openTime", e.target.value)} className="h-10 w-[120px] px-2.5 text-[13px]" />
                  <Input type="time" value={row.closeTime} onChange={(e) => updateScheduleRow(i, "closeTime", e.target.value)} className="h-10 w-[120px] px-2.5 text-[13px]" />
                  <button
                    type="button"
                    onClick={() => removeScheduleRow(i)}
                    disabled={form.schedule.length === 1}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    aria-label="Remove row"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addScheduleRow} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-700 hover:text-brand-800">
              <PlusIcon className="h-3.5 w-3.5" /> Add another day
            </button>
          </div>
        </form>
      </Drawer>

      {/* Deactivation confirmation */}
      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        icon={AlertIcon}
        tone="danger"
        title="Deactivate this node?"
        description={`${confirm?.stationName} will stop accepting new bookings. The API refuses this if the node still has pending or approved reservations.`}
        footer={
          <>
            <Button variant="subtle" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={applyDeactivate}>Deactivate</Button>
          </>
        }
      />
    </div>
  );
}
