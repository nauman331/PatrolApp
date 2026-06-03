import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppLayout } from "@/components/app-shell/layout";
import { useAppShell } from "@/components/app-shell/app-context";
import { UserModal, EditUserModal } from "@/components/app-shell/modals";
import { fetchUsers, deleteUser, CreatedUser } from "@/store/slice/user-management/addUserSlice";
import { AppDispatch, RootState } from "@/store";
import { toast } from "sonner";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/users")({
  component: () => (
    <AppLayout>
      <UsersContent />
    </AppLayout>
  ),
  head: () => ({
    meta: [
      { title: "User Management • Shwanix" },
      { name: "description", content: "Manage guards, managers, and admin users." },
    ],
  }),
});

const roleStyle: Record<string, string> = {
  guard:         "text-emerald-600",
  manager:       "text-blue-500",
  "super-admin": "text-purple-600",
};

const statusStyle: Record<number, string> = {
  1: "bg-emerald-100 text-emerald-700",
  0: "bg-red-100 text-red-600",
};

const statusLabel: Record<number, string> = {
  1: "Active",
  0: "Inactive",
};

// ─── Smart page numbers ───────────────────────────────────────────────────────
// Always show: first, last, current, and 1 neighbour on each side.
// Gaps become "…" ellipsis items.
function buildPageWindows(current: number, last: number): (number | "…")[] {
  if (last <= 3) return Array.from({ length: last }, (_, i) => i + 1);

  const pages = new Set<number>();
  pages.add(1);
  pages.add(last);
  for (let d = -1; d <= 1; d++) {
    const p = current + d;
    if (p >= 1 && p <= last) pages.add(p);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: (number | "…")[] = [];

  for (let i = 0; i < sorted.length; i++) {
    result.push(sorted[i]);
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) {
      result.push("…");
    }
  }
  return result;
}

function UsersContent() {
  useAuthProtection();
  const dispatch = useDispatch<AppDispatch>();
  const { openUserModal } = useAppShell();
  const { users, fetchingUsers, deleteLoadingId, pagination, success } =
    useSelector((state: RootState) => state.user);
  const [editingUser, setEditingUser] = useState<CreatedUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchUsers(currentPage));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (success && currentPage === 1) dispatch(fetchUsers(1));
  }, [success, dispatch]);

  const handleDelete = async (u: CreatedUser) => {
    if (!confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    const res = await dispatch(deleteUser(u.id));
    if (deleteUser.fulfilled.match(res)) {
      toast.success(`${u.name} deleted successfully`);
      dispatch(fetchUsers(currentPage));
    } else {
      toast.error((res.payload as string) || "Failed to delete user");
    }
  };

  const pageWindows = useMemo(
    () => buildPageWindows(currentPage, pagination.last_page ?? 1),
    [currentPage, pagination.last_page]
  );

  const from = (pagination.current_page - 1) * pagination.per_page + 1;
  const to   = Math.min(pagination.current_page * pagination.per_page, pagination.total);

  return (
    <>
      <UserModal />
      {editingUser && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />
      )}

      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-heading text-4xl font-bold text-ink">User Management</h1>
        <button
          onClick={openUserModal}
          className="flex items-center gap-2 rounded-3xl bg-brand px-8 py-3 font-medium text-brand-foreground"
        >
          + Add New User
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow">
        {fetchingUsers ? (
          <div className="flex items-center justify-center py-20 text-ink-muted">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-ink-muted">No users found.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-surface-muted">
              <tr>
                {["Name", "Email", "Phone", "Role", "Status", ""].map((h) => (
                  <th key={h} className="px-8 py-6 text-left text-xs font-semibold uppercase text-ink-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-muted">
                  <td className="px-8 py-6 font-medium text-ink">{u.name}</td>
                  <td className="px-8 py-6 text-ink-muted">{u.email}</td>
                  <td className="px-8 py-6 text-ink-muted">{u.phone ?? "—"}</td>
                  <td className={`px-8 py-6 font-semibold capitalize ${roleStyle[u.user_type] ?? "text-ink"}`}>
                    {u.user_type}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`rounded-3xl px-5 py-2 text-xs font-bold ${statusStyle[u.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {statusLabel[u.status] ?? "Unknown"}
                    </span>
                  </td>
                  <td className="flex gap-3 px-8 py-6">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="rounded-2xl border border-brand px-4 py-1.5 text-sm font-medium text-brand hover:bg-brand hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={deleteLoadingId === u.id}
                      className="rounded-2xl border border-red-400 px-4 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteLoadingId === u.id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── Pagination ── */}
        {pagination.total > 0 && (
          <div className="flex items-center justify-between border-t border-hairline bg-surface-muted px-8 py-5">
            {/* Count */}
            <p className="text-sm text-ink-muted">
              <span className="font-bold text-ink">{from}–{to}</span> of{" "}
              <span className="font-bold text-ink">{pagination.total}</span> users
            </p>

            {/* Controls */}
            <div className="flex items-center gap-1.5">
              {/* Prev */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-ink hover:border-brand hover:text-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Page buttons (desktop) */}
              <div className="hidden sm:flex items-center gap-1">
                {pageWindows.map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="flex h-9 w-8 items-center justify-center text-sm text-ink-muted select-none">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`h-9 min-w-[2.25rem] rounded-xl px-2 text-sm font-semibold transition-all ${
                        currentPage === p
                          ? "bg-brand text-white shadow shadow-brand/30"
                          : "border border-slate-200 text-ink hover:border-brand hover:bg-brand/5"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              {/* Mobile indicator */}
              <span className="flex sm:hidden text-sm font-semibold text-ink-muted px-2">
                {currentPage} / {pagination.last_page}
              </span>

              {/* Next */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                disabled={currentPage === pagination.last_page}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-ink hover:border-brand hover:text-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}