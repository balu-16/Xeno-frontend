import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Trash2,
  UserCog,
  XCircle,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/QueryState";
import { TableSkeleton } from "@/components/Skeleton";
import { api, type Manager } from "@/lib/api";

export const Route = createFileRoute("/_app/managers")({
  head: () => ({ meta: [{ title: "Managers · Xeno Mini" }] }),
  component: Managers,
});

type Tab = "pending" | "all";

function Managers() {
  const [tab, setTab] = useState<Tab>("pending");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const pendingQuery = useQuery({
    queryKey: ["managers", "pending"],
    queryFn: () => api.pendingManagers(),
    refetchInterval: 30000,
  });

  const allQuery = useQuery({
    queryKey: ["managers", "all"],
    queryFn: () => api.allManagers(),
  });

  const approve = useMutation({
    mutationFn: (id: string) => {
      setApprovingId(id);
      return api.approveManager(id);
    },
    onSuccess: (result) => {
      setApprovingId(null);
      toast.success(`${result.manager.name} has been approved`);
      queryClient.invalidateQueries({ queryKey: ["managers"] });
    },
    onError: (error: Error) => {
      setApprovingId(null);
      toast.error(error.message || "Failed to approve manager");
    },
  });

  const reject = useMutation({
    mutationFn: (id: string) => {
      setRejectingId(id);
      return api.rejectManager(id);
    },
    onSuccess: (result) => {
      setRejectingId(null);
      toast.success(`${result.manager.name} has been rejected`);
      queryClient.invalidateQueries({ queryKey: ["managers"] });
    },
    onError: (error: Error) => {
      setRejectingId(null);
      toast.error(error.message || "Failed to reject manager");
    },
  });

  const deleteManager = useMutation({
    mutationFn: (id: string) => {
      setDeletingId(id);
      return api.deleteManager(id);
    },
    onSuccess: (result) => {
      setDeletingId(null);
      toast.success(`${result.manager.name} has been deleted`);
      queryClient.invalidateQueries({ queryKey: ["managers"] });
    },
    onError: (error: Error) => {
      setDeletingId(null);
      toast.error(error.message || "Failed to delete manager");
    },
  });

  const pendingManagers = pendingQuery.data?.managers ?? [];
  const allManagers = allQuery.data?.managers ?? [];
  const activeQuery = tab === "pending" ? pendingQuery : allQuery;

  return (
    <div className="px-8 py-8 max-w-[1400px] mx-auto">
      <PageHeader
        title="Managers"
        subtitle="Review manager sign-up requests and manage existing managers."
      />

      {/* Tabs */}
      <div className="mt-6 flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("pending")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "pending"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Clock className="h-4 w-4" />
          Pending Requests
          {pendingManagers.length > 0 && (
            <span className="ml-1 h-5 min-w-5 px-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold grid place-items-center">
              {pendingManagers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("all")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "all"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="h-4 w-4" />
          All Managers
          <span className="ml-1 h-5 min-w-5 px-1.5 rounded-full bg-slate-200 text-slate-600 text-xs font-semibold grid place-items-center">
            {allManagers.length}
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeQuery.isLoading ? (
          <TableSkeleton rows={5} />
        ) : activeQuery.error ? (
          <ErrorState
            error={activeQuery.error}
          />
        ) : tab === "pending" ? (
          <PendingTable
            managers={pendingManagers}
            onApprove={(id) => approve.mutate(id)}
            onReject={(id) => reject.mutate(id)}
            approvingId={approvingId}
            rejectingId={rejectingId}
          />
        ) : (
          <AllManagersTable
            managers={allManagers}
            onDelete={(id) => deleteManager.mutate(id)}
            deletingId={deletingId}
          />
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Manager["approvalStatus"] }) {
  const styles: Record<Manager["approvalStatus"], string> = {
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-rose-100 text-rose-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}
    >
      {status === "PENDING" && <Clock className="h-3 w-3" />}
      {status === "APPROVED" && <CheckCircle2 className="h-3 w-3" />}
      {status === "REJECTED" && <XCircle className="h-3 w-3" />}
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function PendingTable({
  managers,
  onApprove,
  onReject,
  approvingId,
  rejectingId,
}: {
  managers: Manager[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  approvingId: string | null;
  rejectingId: string | null;
}) {
  if (managers.length === 0) {
    return (
      <EmptyState
        icon={UserCog}
        title="No pending requests"
        description="All manager sign-up requests have been reviewed."
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/70 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="text-left px-4 py-3 font-medium text-slate-500">
              Name
            </th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">
              Email
            </th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">
              Requested
            </th>
            <th className="text-right px-4 py-3 font-medium text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {managers.map((manager) => (
            <tr
              key={manager.id}
              className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 grid place-items-center text-white text-xs font-semibold shrink-0">
                    {manager.name
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <span className="font-medium text-slate-900">
                    {manager.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">{manager.email}</td>
              <td className="px-4 py-3 text-slate-500">
                {new Date(manager.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onReject(manager.id)}
                    disabled={rejectingId !== null || approvingId !== null}
                    className="h-8 px-3 rounded-lg border border-slate-200 text-sm text-slate-600 flex items-center gap-1.5 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-50"
                  >
                    {rejectingId === manager.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    {rejectingId === manager.id ? "Rejecting..." : "Reject"}
                  </button>
                  <button
                    onClick={() => onApprove(manager.id)}
                    disabled={approvingId !== null || rejectingId !== null}
                    className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-sm flex items-center gap-1.5 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {approvingId === manager.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    {approvingId === manager.id ? "Approving..." : "Approve"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AllManagersTable({
  managers,
  onDelete,
  deletingId,
}: {
  managers: Manager[];
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (managers.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No managers yet"
        description="No manager accounts exist in the system."
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/70 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="text-left px-4 py-3 font-medium text-slate-500">
              Name
            </th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">
              Email
            </th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">
              Status
            </th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">
              Joined
            </th>
            <th className="text-right px-4 py-3 font-medium text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {managers.map((manager) => (
            <tr
              key={manager.id}
              className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 grid place-items-center text-white text-xs font-semibold shrink-0">
                    {manager.name
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <span className="font-medium text-slate-900">
                    {manager.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">{manager.email}</td>
              <td className="px-4 py-3">
                <StatusBadge status={manager.approvalStatus} />
              </td>
              <td className="px-4 py-3 text-slate-500">
                {new Date(manager.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end">
                  {deletingId === manager.id ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                      <span className="text-xs text-rose-600">Deleting...</span>
                    </div>
                  ) : confirmDeleteId === manager.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Delete?</span>
                      <button
                        onClick={() => {
                          onDelete(manager.id);
                          setConfirmDeleteId(null);
                        }}
                        className="h-7 px-2.5 rounded-md bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="h-7 px-2.5 rounded-md border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(manager.id)}
                      className="h-8 w-8 rounded-md grid place-items-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      title="Delete manager"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
