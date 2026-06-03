import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

import { AppLayout } from "@/components/app-shell/layout";
import { useAppShell } from "@/components/app-shell/app-context";
import { SiteModal, EditSiteModal, useDeleteSite } from "@/components/app-shell/modals";
import { AppDispatch } from "@/store";
import { fetchAllSites } from "@/store/slice/sites-&-sops/Allsitesslice";
import type { Site } from "@/store/slice/sites-&-sops/Allsitesslice";
import { useAuthProtection } from "@/hooks/useAuthProtection";

export const Route = createFileRoute("/sites")({
  component: () => (
    <AppLayout>
      <SitesContent />
    </AppLayout>
  ),
  head: () => ({
    meta: [
      { title: "Sites & SOPs • Shwanix" },
      { name: "description", content: "Active site directory and SOP document library." },
    ],
  }),
});

const sops = [
  "Emergency Procedures",
  "Patrol Checkpoints",
  "Incident Reporting Guide",
  "NFC Scan Protocol",
];
const BASE_URL = "https://apis-nfc.arrowbyte.com.au/storage/";

const SOP_KEYS = [
  { label: "Emergency Procedures",   key: "emergency_procedures" },
  { label: "Patrol Checkpoints",     key: "patrol_checkpoints" },
  { label: "Incident Reporting Guide", key: "incident_reporting_guide" },
  { label: "NFC Scan Protocol",      key: "nfc_scan_protocol" },
] as const;

function SitesContent() {
  useAuthProtection();
  const dispatch = useDispatch<AppDispatch>();
  const { openSiteModal } = useAppShell();
  const { sites, loading, error } = useSelector((state: any) => state.allSites);
  const { handleDelete, deleteLoading } = useDeleteSite();

  // Track which site is open in the edit modal
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [sitePageCurrent, setSitePageCurrent] = useState(1);
  const [sopPageCurrent, setSopPageCurrent] = useState(1);
  const sitesPerPage = 8;
  const sopsPerPage = 5;
  
  // Fetch on mount — and re-fetch after create/edit/delete by watching success states
  const createSuccess = useSelector((state: any) => state.createSite.success);
  const updateSuccess = useSelector((state: any) => state.editSite.updateSuccess);
  const deleteSuccess = useSelector((state: any) => state.deleteSite.success);

  useEffect(() => {
    dispatch(fetchAllSites());
  }, [dispatch, createSuccess, updateSuccess, deleteSuccess]);

  useEffect(() => {
    if (!selectedSite && sites.length > 0) {
      setSelectedSite(sites[0]);
    }
  }, [sites]);

  // Pagination logic for sites
  const sitesTotalPages = Math.ceil(sites.length / sitesPerPage);
  const siteStartIndex = (sitePageCurrent - 1) * sitesPerPage;
  const paginatedSites = sites.slice(siteStartIndex, siteStartIndex + sitesPerPage);

  // Pagination logic for SOPs
  const sopsTotalPages = Math.ceil(SOP_KEYS.length / sopsPerPage);
  const sopStartIndex = (sopPageCurrent - 1) * sopsPerPage;
  const paginatedSops = SOP_KEYS.slice(sopStartIndex, sopStartIndex + sopsPerPage);

  return (
    <>
      {/* ── Create modal (controlled by app-context) */}
      <SiteModal />

      {/* ── Edit modal (controlled locally) */}
      {editingSite && (
        <EditSiteModal
          site={editingSite}
          onClose={() => setEditingSite(null)}
        />
      )}

      {/* ── Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-heading text-4xl font-bold text-ink">Sites & SOP Library</h1>
        <button
          onClick={openSiteModal}
          className="rounded-3xl bg-brand px-8 py-3 font-medium text-brand-foreground"
        >
          + Add New Site / SOP
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">

        {/* ── Active Sites ── */}
        <div className="rounded-3xl bg-white p-8 shadow">
          <h2 className="mb-6 font-heading text-xl font-semibold text-ink">
            Active Sites ({loading ? "…" : sites.length})
          </h2>

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-3xl bg-surface-muted" />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-3xl bg-red-50 p-5 text-sm text-red-600">
              Failed to load sites.{" "}
              <button
                onClick={() => dispatch(fetchAllSites())}
                className="font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && sites.length === 0 && (
            <p className="text-sm text-ink/50">No sites found. Add your first site above.</p>
          )}

          {/* List */}
          {!loading && !error && sites.length > 0 && (
            <>
              <div className="space-y-4">
                {paginatedSites.map((site: Site) => (
                  <div
                    key={site.id}
                    className={`flex items-center justify-between rounded-3xl px-5 py-4 cursor-pointer transition ${selectedSite?.id === site.id ? 'bg-brand/10 ring-2 ring-brand' : 'bg-surface-muted hover:bg-surface'}`}
                    onClick={() => setSelectedSite(site)}
                    tabIndex={0}
                    role="button"
                    aria-pressed={selectedSite?.id === site.id}
                  >
                    <div>
                      <p className="font-medium text-ink">{site.site_name}</p>
                      <p className="text-xs text-ink/50">{site.address}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status badge */}
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          site.state === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {site.state}
                      </span>

                      {/* Edit */}
                      <button
                        onClick={e => { e.stopPropagation(); setEditingSite(site); }}
                        className="rounded-full p-2 text-ink/40 transition hover:bg-white hover:text-brand"
                        title="Edit site"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(site.id, site.site_name); }}
                        disabled={deleteLoading}
                        className="rounded-full p-2 text-ink/40 transition hover:bg-white hover:text-red-500 disabled:opacity-40"
                        title="Delete site"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sites Pagination */}
              {sitesTotalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6">
                  <div className="text-xs text-ink-muted">
                    Page {sitePageCurrent} of {sitesTotalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSitePageCurrent(prev => Math.max(1, prev - 1))}
                      disabled={sitePageCurrent === 1}
                      className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-ink transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => setSitePageCurrent(prev => Math.min(sitesTotalPages, prev + 1))}
                      disabled={sitePageCurrent === sitesTotalPages}
                      className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-ink transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

          <div className="rounded-3xl bg-white p-8 shadow">
  <h2 className="mb-1 font-heading text-xl font-semibold text-ink">
    SOP Documents
  </h2>

  <p className="mb-6 text-sm text-ink/50">
    {selectedSite
      ? `Showing SOPs for: ${selectedSite.site_name}`
      : "Select a site to view its SOPs"}
  </p>

  {!selectedSite ? (
    <div className="rounded-3xl bg-surface-muted p-8 text-center text-sm text-ink/40">
      ← Click any site to view its SOP documents
    </div>
  ) : (
    <>
      <div className="space-y-4">
        {paginatedSops.map(({ label, key }) => {
          const filePath = selectedSite[key as keyof Site] as string | null;
          const url = filePath ? `${BASE_URL}${filePath}` : null;

          return (
            <div
              key={key}
              className="flex items-center justify-between rounded-3xl bg-surface-muted p-5 text-ink"
            >
              <span className="font-medium">{label}</span>

              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-brand hover:underline"
                >
                  VIEW PDF
                </a>
              ) : (
                <span className="text-sm text-ink/30">No file</span>
              )}
            </div>
          );
        })}
      </div>

      {/* SOPs Pagination */}
      {sopsTotalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6">
          <div className="text-xs text-ink-muted">
            Page {sopPageCurrent} of {sopsTotalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSopPageCurrent(prev => Math.max(1, prev - 1))}
              disabled={sopPageCurrent === 1}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-ink transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <button
              onClick={() => setSopPageCurrent(prev => Math.min(sopsTotalPages, prev + 1))}
              disabled={sopPageCurrent === sopsTotalPages}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-ink transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </>
  )}
</div>
</div>
    </>
  );
}


// import { createFileRoute } from "@tanstack/react-router";
// import { AppLayout } from "@/components/app-shell/layout";
// import { useState } from "react";

// import ShiftHeader from "@/components/shifts/ShiftHeader";
// import ShiftImportModal from "@/components/shifts/ShiftImportModal";
// import ImportedBanner from "@/components/shifts/ImportedBanner";
// import ImportedTable from "@/components/shifts/ImportedTable";
// import RosterCalendar from "@/components/shifts/RosterCalendar";
// import ShiftTable from "@/components/shifts/ShiftTable";
// import ShiftMobileCards from "@/components/shifts/ShiftMobileCards";

// import { exportShifts } from "@/utils/shiftHelpers";

// export const Route = createFileRoute("/sites")({
//   component: () => (
//     <AppLayout>
//       <ShiftsPage />
//     </AppLayout>
//   ),
// });

// function ShiftsPage() {
//   const [showImport, setShowImport] = useState(false);
//   const [importedShifts, setImportedShifts] = useState([]);

//   return (
//     <>
//       {showImport && (
//         <ShiftImportModal
//           onClose={() => setShowImport(false)}
//           onImport={setImportedShifts}
//         />
//       )}

//       <ShiftHeader
//         filters={["All", "Mall", "DHA"]}
//         onImportClick={() => setShowImport(true)}
//         onExport={() => exportShifts([])}
//       />

//       {importedShifts.length > 0 && (
//         <>
//           <ImportedBanner
//             count={importedShifts.length}
//             onClear={() => setImportedShifts([])}
//           />
//           <ImportedTable shifts={importedShifts} />
//         </>
//       )}

//       <RosterCalendar days={[]} onSelect={() => {}} />
//       <ShiftTable />
//       <ShiftMobileCards />
//     </>
//   );
// }

// import { createFileRoute } from "@tanstack/react-router";
// import { useState } from "react";
// import { toast } from "sonner";

// import { AppLayout } from "@/components/app-shell/layout";
// import { useAppShell } from "@/components/app-shell/app-context";
// import { useAuthProtection } from "@/hooks/useAuthProtection";

// import ShiftHeader from "@/components/shifts/ShiftHeader";
// import ShiftImportModal from "@/components/shifts/ShiftImportModal";
// import ImportedBanner from "@/components/shifts/ImportedBanner";
// import ImportedTable from "@/components/shifts/ImportedTable";
// import RosterCalendar from "@/components/shifts/RosterCalendar";

// import { exportShifts, statusStyle } from "@/utils/shiftHelpers";
// import { ParsedShift, DefaultShift, CalendarDay } from "@/types/shift";

// // ── Route ─────────────────────────────────────────────────────
// export const Route = createFileRoute("/sites")({
//   component: () => (
//     <AppLayout>
//       <ShiftsContent />
//     </AppLayout>
//   ),
//   head: () => ({
//     meta: [
//       { title: "Shifts & Roster • Shwanix" },
//       { name: "description", content: "Calendar-based shift roster and assignment management." },
//     ],
//   }),
// });

// // ── Static data ───────────────────────────────────────────────
// const FILTERS = ["All Sites", "Mall of Lahore", "DHA Clinic Block", "Packages Mall"];

// const CALENDAR_DAYS: CalendarDay[] = [
//   { n: 13, sub: "2 shifts", color: "text-emerald-600" },
//   { n: 14, sub: "1 break", color: "text-amber-600" },
//   { n: 15, sub: "Mall of Lahore", badge: "bg-emerald-100 text-emerald-700" },
//   { n: 16, sub: "3 active", today: true, badge: "bg-brand text-brand-foreground" },
//   { n: 17, sub: "DHA Clinic", badge: "bg-brand/10 text-brand" },
//   { n: 18, sub: "No shifts", color: "text-ink-muted" },
//   { n: 19, sub: "4 patrols", color: "text-emerald-600" },
// ];

// const DEFAULT_SHIFTS: DefaultShift[] = [
//   { id: "#SHF-0416-A", site: "Mall of Lahore", guard: "Ahmed Khan", time: "06:00 – 14:00", status: "ACTIVE", color: "emerald" },
//   { id: "#SHF-0416-B", site: "DHA Clinic Block", guard: "Muhammad Raza", time: "14:00 – 22:00", status: "ON PATROL", color: "brand" },
//   { id: "#SHF-0416-C", site: "Packages Mall", guard: "Bilal Hussain", time: "22:00 – 06:00", status: "SCHEDULED", color: "blue" },
// ];

// // ── Page ──────────────────────────────────────────────────────
// function ShiftsContent() {
//   useAuthProtection();
//   const { openShiftModal } = useAppShell();

//   const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
//   const [showImport, setShowImport] = useState(false);
//   const [importedShifts, setImportedShifts] = useState<ParsedShift[]>([]);

//   return (
//     <>
//       {/* Import modal (portal-like, rendered at top) */}
//       {showImport && (
//         <ShiftImportModal
//           onClose={() => setShowImport(false)}
//           onImport={(shifts) => setImportedShifts(shifts)}
//         />
//       )}

//       {/* Page header */}
//       <ShiftHeader
//         filters={FILTERS}
//         activeFilter={activeFilter}
//         onFilterChange={setActiveFilter}
//         onImportClick={() => setShowImport(true)}
//         onExport={() => exportShifts(DEFAULT_SHIFTS)}
//       />

//       {/* Imported data feedback */}
//       {importedShifts.length > 0 && (
//         <>
//           <ImportedBanner
//             count={importedShifts.length}
//             onClear={() => setImportedShifts([])}
//           />
//           <ImportedTable shifts={importedShifts} />
//         </>
//       )}

//       {/* Roster calendar */}
//       <RosterCalendar
//         days={CALENDAR_DAYS}
//         month="April 2026"
//         onSelect={(d) => toast.success(`Day ${d.n} selected`)}
//         onTodayClick={openShiftModal}
//       />

//       {/* ── Default shift list — desktop table ── */}
//       <div className="hidden overflow-hidden rounded-3xl bg-white shadow lg:block">
//         <table className="w-full">
//           <thead className="bg-surface-muted">
//             <tr>
//               {["Shift ID", "Site", "Guard", "Time", "Status"].map((h) => (
//                 <th
//                   key={h}
//                   className="px-8 py-6 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted"
//                 >
//                   {h}
//                 </th>
//               ))}
//               <th className="w-40" />
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-hairline">
//             {DEFAULT_SHIFTS.map(({ id, site, guard, time, status, color }) => (
//               <tr key={id} className="hover:bg-surface-muted">
//                 <td className="px-8 py-6 font-medium text-ink">{id}</td>
//                 <td className="px-8 py-6 text-ink">{site}</td>
//                 <td className="px-8 py-6 text-ink">{guard}</td>
//                 <td className="px-8 py-6 text-ink">{time}</td>
//                 <td className="px-8 py-6">
//                   <span className={`rounded-3xl px-6 py-2 text-xs font-bold ${statusStyle(color)}`}>
//                     {status}
//                   </span>
//                 </td>
//                 <td className="px-8 py-6">
//                   <button
//                     onClick={() => toast.success("Shift detail opened")}
//                     className="font-medium text-brand"
//                   >
//                     View →
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* ── Mobile cards (< lg) ── */}
//       <div className="flex flex-col gap-4 lg:hidden">
//         {DEFAULT_SHIFTS.map(({ id, site, guard, time, status, color }) => (
//           <div key={id} className="overflow-hidden rounded-3xl bg-white shadow">
//             <div className="flex items-center justify-between border-b border-hairline px-5 py-4 sm:px-6">
//               <span className="font-mono text-sm font-semibold text-ink">{id}</span>
//               <span className={`rounded-3xl px-4 py-1.5 text-xs font-bold ${statusStyle(color)}`}>
//                 {status}
//               </span>
//             </div>
//             <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-3 sm:px-6">
//               {[
//                 { label: "Site", value: site },
//                 { label: "Guard", value: guard },
//                 { label: "Time", value: time },
//               ].map(({ label, value }) => (
//                 <div key={label}>
//                   <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
//                     {label}
//                   </p>
//                   <p className={`text-sm text-ink ${label === "Site" ? "font-medium" : ""}`}>{value}</p>
//                 </div>
//               ))}
//             </div>
//             <div className="border-t border-hairline px-5 py-3 sm:px-6">
//               <button
//                 onClick={() => toast.success("Shift detail opened")}
//                 className="text-sm font-medium text-brand"
//               >
//                 View details →
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </>
//   );
// }