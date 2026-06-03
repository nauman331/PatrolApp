import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { exportShiftsToExcel } from "@/utils/Exporttoexcel";
import { ShiftDetailModal } from "./ShiftDetailModal";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Upload,
  FileDown,
  Eye,
} from "lucide-react";

interface List {
  id: number;
  title: string;
  start: string;
  shift_date: string;
  end: string;
  site_id: number;
  site_name: string;
  guard_name: string;
  guard_phone: string;
  // Optional sign-in/out detail fields
  signin_date?: string;
  signout_date?: string;
  signin_time?: string;
  signout_time?: string;
  signin_notes?: string;
  signout_notes?: string;
  signin_picture?: string;
  signout_picture?: string;
  signin_location?: { lat: number; lng: number };
  signout_location?: { lat: number; lng: number };
}

interface Props {
  rosters: List[];
  loading: boolean;
}


// ── Main Component ─────────────────────────────────────────────────────────────
export default function AllShiftListings({ rosters, loading }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRoster, setSelectedRoster] = useState<List | null>(null);

  const totalPages = Math.ceil(rosters.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRosters = rosters.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const getPageNumbers = () => {
    const delta = 2;
    const left = currentPage - delta;
    const right = currentPage + delta;
    const range: (number | string)[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        range.push(i);
      } else if (
        (i === left - 1 && left > 2) ||
        (i === right + 1 && right < totalPages - 1)
      ) {
        range.push("...");
      }
    }

    return range;
  };

  const handleExport = () => {
    exportShiftsToExcel(rosters, "Shifts_Export");
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3 h-64 items-center justify-center rounded-3xl bg-white shadow">
        <Progress value={75} className="h-2 w-1/2" />
        <p className="text-sm text-ink-muted">Loading rosters...</p>
      </div>
    );
  }

  if (rosters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl bg-white shadow py-12 px-4">
        <Upload className="h-12 w-12 text-ink-muted/30 mb-3" />
        <p className="text-sm font-medium text-ink-muted">No rosters found</p>
      </div>
    );
  }

  return (
    <>
      {/* Detail Modal */}
      <ShiftDetailModal
        roster={selectedRoster}
        onClose={() => setSelectedRoster(null)}
      />

      <div className="rounded-3xl bg-white shadow overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline">
          <p className="text-sm font-medium text-ink-muted">
            {rosters.length} shift{rosters.length !== 1 ? "s" : ""} total
          </p>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-2xl bg-brand px-5 py-2 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
          >
            <FileDown className="h-4 w-4" />
            Export Excel
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-muted/50 border-b border-hairline">
              <tr>
                {["ID", "Title", "Date", "Site", "Guard", "Phone", "Start", "End", ""].map((h, i) => (
                  <th key={i} className="px-6 py-4 text-xs text-ink-muted uppercase text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginatedRosters.map((r) => (
                <tr key={`${r.id}-${r.site_id}`} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-sm">{r.id}</td>
                  <td className="px-6 py-3 text-sm">{r.title}</td>
                  <td className="px-6 py-3 text-sm">{r.shift_date}</td>
                  <td className="px-6 py-3 text-sm">{r.site_name}</td>
                  <td className="px-6 py-3 text-sm">{r.guard_name}</td>
                  <td className="px-6 py-3 text-sm">{r.guard_phone || "—"}</td>
                  <td className="px-6 py-3 text-sm">{r.start}</td>
                  <td className="px-6 py-3 text-sm">{r.end}</td>
                  {/* Eye icon column */}
                  <td className="px-6 py-3 text-sm">
                    <button
                      onClick={() => setSelectedRoster(r)}
                      title="View SignIn/Out Details"
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y">
          {paginatedRosters.map((r) => (
            <div key={`${r.id}-${r.site_id}`} className="p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{r.guard_name}</p>
                <p className="text-xs text-muted">{r.guard_phone}</p>

                <div className="flex items-center gap-2 text-xs mt-2">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {r.site_name}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Clock className="h-3 w-3 shrink-0" />
                  {r.start} – {r.end}
                </div>
              </div>

              {/* Eye icon on mobile */}
              <button
                onClick={() => setSelectedRoster(r)}
                title="View SignIn/Out Details"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-700 transition-colors shrink-0 mt-1"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center p-4 border-t">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="p-1 rounded disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex gap-1">
            {getPageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-2 py-1 text-sm text-gray-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p as number)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    currentPage === p
                      ? "bg-brand text-brand-foreground"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="p-1 rounded disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
}