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
  AlertIcon, BoltIcon, CalendarIcon, CheckIcon, ClockIcon, PlusIcon, StationIcon,
} from "../../components/ui/Icons";

const EMPTY_FORM = { prosumerNic: "", stationId: "", slotId: "", scheduledDateTime: "", energyAmountKWh: "" };

// Renders the pending-reservation queue and the book-on-behalf dialog.
export default function ReservationsPage() {
  const [stations, setStations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [pending, setPending] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const toast = useToast();

  // Loads active stations and the pending-reservations queue together.
  async function loadInitial() {
    setLoading(true);
    try {
      const [stationsRes, pendingRes] = await Promise.all([
        apiClient.get("/stations"),
        apiClient.get("/reservations/pending"),
      ]);
      setStations(stationsRes.data.filter((s) => s.status === "Active"));
      setPending(pendingRes.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadInitial(); }, []);

  // Fetches bookable slots whenever the chosen station changes.
  async function handleStationChange(stationId) {
    setForm({ ...form, stationId, slotId: "" });
    if (!stationId) { setSlots([]); return; }
    const { data } = await apiClient.get(`/stations/${stationId}/slots`);
    setSlots(data.filter((s) => s.status !== "Closed"));
  }

  // Creates a reservation for the entered prosumer NIC.
  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post("/reservations", {
        prosumerNic: form.prosumerNic,
        stationId: form.stationId,
        slotId: form.slotId,
        scheduledDateTime: new Date(form.scheduledDateTime).toISOString(),
        energyAmountKWh: parseFloat(form.energyAmountKWh),
      });
      toast.success("Reservation created.");
      setForm(EMPTY_FORM);
      setSlots([]);
      setFormOpen(false);
      await loadInitial();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create this reservation.");
    } finally {
      setSaving(false);
    }
  }

  // Approves a pending reservation, which issues its QR token.
  async function handleApprove(reservation) {
    setBusyId(reservation.id);
    try {
      await apiClient.put(`/reservations/${reservation.id}/approve`);
      toast.success(`${reservation.reservationCode} approved, QR issued.`);
      await loadInitial();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not approve this reservation.");
    } finally {
      setBusyId(null);
    }
  }

  // Submits the cancellation confirmed in the dialog.
  async function applyCancel() {
    const reservation = cancelTarget;
    setCancelTarget(null);
    try {
      await apiClient.put(`/reservations/${reservation.id}/cancel`, { reason: cancelReason });
      toast.success(`${reservation.reservationCode} cancelled.`);
      setCancelReason("");
      await loadInitial();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel this reservation.");
    }
  }

  const stationName = (id) => stations.find((s) => s.id === id)?.stationName || "—";

  const columns = [
    {
      key: "reservationCode",
      header: "Reservation",
      className: "min-w-[200px]",
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-solar-50 text-solar-600 ring-1 ring-inset ring-solar-200">
            <CalendarIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-mono text-[13px] font-bold text-slate-900">{r.reservationCode}</p>
            <p className="text-xs text-slate-500">NIC {r.prosumerNic}</p>
          </div>
        </div>
      ),
    },
    {
      key: "station",
      header: "Node",
      className: "whitespace-nowrap",
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-slate-700">
          <StationIcon className="h-4 w-4 text-slate-400" />
          {stationName(r.stationId)}
        </span>
      ),
    },
    {
      key: "scheduledDateTime",
      header: "Scheduled",
      className: "whitespace-nowrap",
      render: (r) => (
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 shrink-0 text-slate-400" />
          <span>{new Date(r.scheduledDateTime).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
        </div>
      ),
    },
    {
      key: "energyAmountKWh",
      header: "Energy",
      className: "whitespace-nowrap",
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
          <BoltIcon className="h-4 w-4 text-solar-500" />
          {r.energyAmountKWh} kWh
        </span>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right whitespace-nowrap",
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" icon={CheckIcon} disabled={busyId === r.id} onClick={() => handleApprove(r)}>
            {busyId === r.id ? "Approving…" : "Approve"}
          </Button>
          <Button size="sm" variant="dangerGhost" onClick={() => setCancelTarget(r)}>Cancel</Button>
        </div>
      ),
    },
  ];

  const totalEnergy = pending.reduce((sum, r) => sum + r.energyAmountKWh, 0);
  const next = [...pending].sort((a, b) => new Date(a.scheduledDateTime) - new Date(b.scheduledDateTime))[0];

  return (
    <div className="space-y-6">
      <section className="grid gap-5 sm:grid-cols-3">
        <StatCard label="Pending approval" value={pending.length} hint="Bookings waiting on an operator" icon={ClockIcon} tone="amber" loading={loading} />
        <StatCard label="Energy requested" value={`${totalEnergy.toFixed(1)} kWh`} hint="Across all pending bookings" icon={BoltIcon} tone="emerald" loading={loading} />
        <StatCard
          label="Next transfer"
          value={next ? new Date(next.scheduledDateTime).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "—"}
          hint={next ? `${next.reservationCode} · ${new Date(next.scheduledDateTime).toLocaleTimeString(undefined, { timeStyle: "short" })}` : "Nothing scheduled"}
          icon={CalendarIcon}
          tone="sky"
          loading={loading}
        />
      </section>

      <Card>
        <CardHeader
          icon={CalendarIcon}
          title="Pending reservations"
          description="Bookings waiting for approval before a transaction QR token is issued."
          actions={<Button icon={PlusIcon} onClick={() => setFormOpen(true)}>Book on behalf</Button>}
        />
        <DataTable
          columns={columns}
          rows={pending}
          loading={loading}
          empty={{
            icon: CheckIcon,
            title: "Queue is clear",
            description: "Approved, completed and cancelled bookings no longer appear in this queue.",
            action: <Button icon={PlusIcon} onClick={() => setFormOpen(true)}>Book on behalf</Button>,
          }}
        />
      </Card>

      {/* Booking panel */}
      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        size="lg"
        icon={PlusIcon}
        title="Book an energy slot on behalf"
        description="For prosumers who call in rather than booking through the mobile app."
        footer={
          <>
            <Button variant="subtle" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" form="reservation-form" icon={PlusIcon} disabled={saving}>
              {saving ? "Creating…" : "Create reservation"}
            </Button>
          </>
        }
      >
        <form id="reservation-form" onSubmit={handleCreate} className="space-y-4 pb-2">
          <Field label="Prosumer NIC" required hint="The prosumer's account must already be active.">
            <Input value={form.prosumerNic} onChange={(e) => setForm({ ...form, prosumerNic: e.target.value })} placeholder="199512345678" required />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Station" required>
              <Select value={form.stationId} onChange={(e) => handleStationChange(e.target.value)} required>
                <option value="">Select a station…</option>
                {stations.map((s) => <option key={s.id} value={s.id}>{s.stationName}</option>)}
              </Select>
            </Field>
            <Field label="Available slot" required>
              <Select value={form.slotId} onChange={(e) => setForm({ ...form, slotId: e.target.value })} required disabled={!form.stationId}>
                <option value="">{form.stationId ? "Select a slot…" : "Choose a station first"}</option>
                {slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {new Date(s.date).toLocaleDateString()} · {s.startTime}–{s.endTime} ({s.capacityAvailable} left)
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Scheduled date & time" required hint="Must fall within the next 7 days.">
              <Input type="datetime-local" value={form.scheduledDateTime} onChange={(e) => setForm({ ...form, scheduledDateTime: e.target.value })} required />
            </Field>
            <Field label="Energy amount (kWh)" required>
              <Input type="number" step="0.1" value={form.energyAmountKWh} onChange={(e) => setForm({ ...form, energyAmountKWh: e.target.value })} placeholder="6.5" required />
            </Field>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-solar-200 bg-solar-50 p-3.5">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-solar-600" />
            <p className="text-[13px] leading-relaxed text-solar-600">
              The service enforces a 7-day booking window, and later updates or cancellations need at
              least 12 hours' notice before the scheduled time.
            </p>
          </div>
        </form>
      </Drawer>

      {/* Cancellation confirmation */}
      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        icon={AlertIcon}
        tone="danger"
        title="Cancel this reservation?"
        description={`${cancelTarget?.reservationCode} will be released back to the slot. The API rejects this if less than 12 hours remain before the scheduled time.`}
        footer={
          <>
            <Button variant="subtle" onClick={() => setCancelTarget(null)}>Keep reservation</Button>
            <Button variant="danger" onClick={applyCancel}>Cancel reservation</Button>
          </>
        }
      >
        <Field label="Reason">
          <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Prosumer requested cancellation" />
        </Field>
      </Modal>
    </div>
  );
}
