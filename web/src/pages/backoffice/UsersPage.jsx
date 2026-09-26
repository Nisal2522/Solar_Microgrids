// -----------------------------------------------------------------------------
// File: UsersPage.jsx
// Purpose: Backoffice screen to create Backoffice/Grid Operator staff accounts
//          and to deactivate or reactivate existing ones.
// Module owner: Member A (Identity & Access)
// -----------------------------------------------------------------------------
import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import StatCard from "../../components/ui/StatCard";
import { Card, CardHeader } from "../../components/ui/Card";
import DataTable from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import { Field, Input, Select } from "../../components/ui/Field";
import Badge, { StatusBadge } from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Drawer from "../../components/ui/Drawer";
import { useToast } from "../../components/ui/Toast";
import { AlertIcon, GaugeIcon, PlusIcon, ShieldIcon, UsersIcon } from "../../components/ui/Icons";

const EMPTY_FORM = { userType: "GridOperator", fullName: "", email: "", phone: "", username: "", password: "" };

// Returns a person's initials for the avatar chip.
function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// Renders the staff directory and the create-account dialog.
export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const toast = useToast();

  // Loads all Backoffice/GridOperator accounts.
  async function loadUsers() {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/users");
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  // Creates a staff account from the dialog form.
  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post("/users", form);
      toast.success(`${form.fullName} added as ${form.userType}.`);
      setForm(EMPTY_FORM);
      setFormOpen(false);
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create this account.");
    } finally {
      setSaving(false);
    }
  }

  // Applies the deactivate/reactivate action confirmed in the dialog.
  async function applyStatusChange() {
    const user = confirm;
    const action = user.status === "Deactivated" ? "reactivate" : "deactivate";
    setConfirm(null);
    try {
      await apiClient.put(`/users/${user.id}/${action}`);
      toast.success(`${user.fullName} ${action === "reactivate" ? "reactivated" : "deactivated"}.`);
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update this account.");
    }
  }

  const columns = [
    {
      key: "fullName",
      header: "Staff member",
      className: "min-w-[260px]",
      render: (u) => (
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
            {initials(u.fullName)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{u.fullName}</p>
            <p className="truncate text-xs text-slate-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "userType",
      header: "Role",
      className: "whitespace-nowrap",
      render: (u) => (
        <Badge tone={u.userType === "Backoffice" ? "sky" : "emerald"}>
          {u.userType === "Backoffice" ? <ShieldIcon className="h-3 w-3" /> : <GaugeIcon className="h-3 w-3" />}
          {u.userType}
        </Badge>
      ),
    },
    { key: "username", header: "Username", render: (u) => <span className="font-mono text-[13px] text-slate-600">{u.username}</span> },
    { key: "phone", header: "Phone", className: "whitespace-nowrap", render: (u) => u.phone || "—" },
    { key: "status", header: "Status", render: (u) => <StatusBadge status={u.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right whitespace-nowrap",
      render: (u) => (
        <Button size="sm" variant={u.status === "Deactivated" ? "subtle" : "dangerGhost"} onClick={() => setConfirm(u)}>
          {u.status === "Deactivated" ? "Reactivate" : "Deactivate"}
        </Button>
      ),
    },
  ];

  const backoffice = users.filter((u) => u.userType === "Backoffice").length;
  const operators = users.filter((u) => u.userType === "GridOperator").length;
  const deactivated = users.filter((u) => u.status === "Deactivated").length;

  return (
    <div className="space-y-6">
      <section className="grid gap-5 sm:grid-cols-3">
        <StatCard label="Backoffice officers" value={backoffice} hint="Full administrative access" icon={ShieldIcon} tone="sky" loading={loading} />
        <StatCard label="Grid operators" value={operators} hint="Web console + mobile scanner" icon={GaugeIcon} tone="emerald" loading={loading} />
        <StatCard label="Deactivated" value={deactivated} hint="No longer able to sign in" icon={AlertIcon} tone="slate" loading={loading} />
      </section>

      <Card>
        <CardHeader
          icon={UsersIcon}
          title="Staff directory"
          description="Backoffice and Grid Operator accounts with console access."
          actions={<Button icon={PlusIcon} onClick={() => setFormOpen(true)}>New staff account</Button>}
        />
        <DataTable
          columns={columns}
          rows={users}
          loading={loading}
          empty={{
            icon: UsersIcon,
            title: "No staff accounts yet",
            description: "Create the first Backoffice or Grid Operator account to give your team console access.",
            action: <Button icon={PlusIcon} onClick={() => setFormOpen(true)}>New staff account</Button>,
          }}
        />
      </Card>

      {/* Create panel */}
      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        size="lg"
        icon={UsersIcon}
        title="New staff account"
        description="The account is created active and can sign in immediately."
        footer={
          <>
            <Button variant="subtle" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" form="user-form" icon={PlusIcon} disabled={saving}>
              {saving ? "Creating…" : "Create account"}
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleCreate} className="space-y-4 pb-2">
          <Field label="Role" required>
            <Select value={form.userType} onChange={(e) => setForm({ ...form, userType: e.target.value })}>
              <option value="GridOperator">Grid Operator (operations &amp; QR scanning)</option>
              <option value="Backoffice">Backoffice (full administration)</option>
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Kasun Silva" required />
            </Field>
            <Field label="Email" required>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="kasun@solarmicrogrid.lk" required />
            </Field>
            <Field label="Phone" required>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0771112222" required />
            </Field>
            <Field label="Username" required>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="operator1" required />
            </Field>
          </div>

          <Field label="Password" required hint="Share this with the staff member securely. They can sign in right away.">
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
          </Field>
        </form>
      </Drawer>

      {/* Status change confirmation */}
      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        icon={AlertIcon}
        tone={confirm?.status === "Deactivated" ? "brand" : "danger"}
        title={confirm?.status === "Deactivated" ? "Reactivate account?" : "Deactivate account?"}
        description={
          confirm?.status === "Deactivated"
            ? `${confirm?.fullName} will be able to sign in again immediately.`
            : `${confirm?.fullName} will lose console access until a Backoffice officer reactivates the account.`
        }
        footer={
          <>
            <Button variant="subtle" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant={confirm?.status === "Deactivated" ? "primary" : "danger"} onClick={applyStatusChange}>
              {confirm?.status === "Deactivated" ? "Reactivate" : "Deactivate"}
            </Button>
          </>
        }
      />
    </div>
  );
}
