// -----------------------------------------------------------------------------
// File: PendingActivationsPage.jsx
// Purpose: Backoffice review queue for accounts awaiting activation (mostly
//          mobile prosumer registrations), with an approve action per row.
// Module owner: Member A (Identity & Access)
// -----------------------------------------------------------------------------
import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import { Card, CardHeader } from "../../components/ui/Card";
import DataTable from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/Badge";
import { useToast } from "../../components/ui/Toast";
import { CheckIcon, UserCheckIcon } from "../../components/ui/Icons";

// Renders the PendingActivation queue and approves accounts in place.
export default function PendingActivationsPage() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const toast = useToast();

  // Loads every account currently in PendingActivation.
  async function loadPending() {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/users/pending");
      setPending(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPending(); }, []);

  // Approves one account and refreshes the queue.
  async function handleApprove(user) {
    setBusyId(user.id);
    try {
      await apiClient.put(`/users/${user.id}/approve`);
      toast.success(`${user.fullName} activated.`);
      await loadPending();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not approve this account.");
    } finally {
      setBusyId(null);
    }
  }

  const columns = [
    {
      key: "fullName",
      header: "Applicant",
      render: (u) => (
        <div>
          <p className="font-semibold text-slate-900">{u.fullName}</p>
          <p className="text-xs text-slate-500">{u.email}</p>
        </div>
      ),
    },
    { key: "userType", header: "Type", render: (u) => <span className="text-slate-600">{u.userType}</span> },
    { key: "nic", header: "NIC", render: (u) => <span className="font-mono text-[13px]">{u.nic || "—"}</span> },
    { key: "phone", header: "Phone", render: (u) => u.phone || "—" },
    {
      key: "createdAt",
      header: "Registered",
      render: (u) => new Date(u.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
    },
    { key: "status", header: "Status", render: (u) => <StatusBadge status={u.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (u) => (
        <Button size="sm" icon={CheckIcon} disabled={busyId === u.id} onClick={() => handleApprove(u)}>
          {busyId === u.id ? "Approving…" : "Approve"}
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader
        icon={UserCheckIcon}
        title="Pending activations"
        description="Accounts registered from the mobile app stay inactive until a Backoffice officer approves them."
        actions={
          !loading && (
            <span className="rounded-full bg-solar-50 px-3 py-1.5 text-xs font-bold text-solar-600 ring-1 ring-inset ring-solar-200">
              {pending.length} waiting
            </span>
          )
        }
      />
      <DataTable
        columns={columns}
        rows={pending}
        loading={loading}
        empty={{
          icon: UserCheckIcon,
          title: "Nothing awaiting activation",
          description: "New prosumer registrations from the Android app will appear here for approval.",
        }}
      />
    </Card>
  );
}
