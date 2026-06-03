import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-shell/layout";
import { useAppShell } from "@/components/app-shell/app-context";
import { FolderUp, FolderDown, X, Upload, ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { useState, useRef, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";
import ExcelImportModal from "@/components/app-shell/ExcelImportModal";
import RosterCalendarView from "@/components/app-shell/RosterCalendarView";
// import { getRosters} from "@/api/roster";
import AllShiftListings from "@/components/shifts/AllShiftListings";
import { Progress } from "@/components/ui/progress";
import FileSaver from "file-saver";

const { saveAs } = FileSaver;

export const Route = createFileRoute("/shifts")({
  component: () => (
    <AppLayout>
      <ShiftsContent />
    </AppLayout>
  ),
  head: () => ({
    meta: [
      { title: "Shifts & Roster • Shwanix" },
      { name: "description", content: "Calendar-based shift roster and assignment management." },
    ],
  }),
});

// ── Types ──────────────────────────────────────────────────────
interface ParsedShift {
  date: string;
  siteName: string;
  staffName: string;
  start: string;
  end: string;
  totalHours: number | string;
  signinTime: string;
  signoutTime: string;
  notes: string;
}

interface List {
    id: number,
            title: string,
            start: string,
            shift_date: string,
            end: string,
            site_id: number,
            site_name: string,
            guard_name:string,
            guard_phone: string
}



// ── Helpers ────────────────────────────────────────────────────
function mapRow(row: Record<string, unknown>): ParsedShift {
  return {
    date: String(row["Date"] ?? ""),
    siteName: String(row["Site Name"] ?? ""),
    staffName: String(row["Staff Name"] ?? ""),
    start: String(row["Start"] ?? ""),
    end: String(row["End"] ?? ""),
    totalHours: row["Total Hours"] as number ?? "",
    signinTime: String(row["Signin Time"] ?? ""),
    signoutTime: String(row["Signout Time"] ?? ""),
    notes: String(row["Notes"] ?? ""),
  };
}

// ── Site filter options ────────────────────────────────────────
const siteFilters = [
  { label: "All Sites", id: 0 },
  // { label: "Mall of Lahore", id: 1 },
  // { label: "DHA Clinic Block", id: 2 },
  // { label: "Packages Mall", id: 3 },
];

const handleExport = () => {
  toast.success("Export started");
  if (!displayRows.length) {
    toast.error('No data available to export');
    return;
  }

  
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Roster'
  );

  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });

  const fileData = new Blob([excelBuffer], {
    type:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });

  const fileName = selectedDay
    ? `Roster-${selectedDay}.xlsx`
    : `Roster-${currentMonth}.xlsx`;

  saveAs(fileData, fileName);
};

// ── Import Modal ───────────────────────────────────────────────
function ShiftImportModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (shifts: ParsedShift[]) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [parsed, setParsed] = useState<ParsedShift[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [list, setList] = useState<List[]>([]);

  const processFile = (file: File) => {
    setError("");
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError("Please upload an .xlsx, .xls, or .csv file.");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target!.result, { type: "array", cellDates: true });
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          wb.Sheets[wb.SheetNames[0]],
          { defval: "" }
        );
        const result = rows.map(mapRow).filter((r) => r.staffName && r.siteName);
        if (result.length === 0) {
          setError("No valid rows found. Make sure columns include 'Staff Name' and 'Site Name'.");
          return;
        }
        setParsed(result);
        setList(result.map((r) => ({
          id: Math.floor(Math.random() * 1000),
          title: `${r.staffName} - ${r.siteName}`,
          start: r.start,
          shift_date: r.date,
          end: r.end,
          site_id: siteFilters.find((s) => s.label === r.siteName)?.id || 0,
          site_name: r.siteName,
          guard_name: r.staffName,
          guard_phone: "",
        })));
      } catch {
        setError("Failed to parse file. Please check it's a valid spreadsheet.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" style={{zIndex: 9999}}>
      <div className="modal-pop w-full max-w-2xl rounded-3xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-hairline shrink-0">
          <h2 className="font-heading text-xl font-semibold text-ink">Import Shifts</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-surface-muted text-ink-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 flex flex-col gap-5">
          {/* Dropzone */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-3 py-10 px-6 text-center
              ${isDragging ? "border-brand bg-brand/5" : "border-hairline hover:border-brand hover:bg-surface-muted"}`}
          >
            <div className="rounded-2xl bg-brand/10 p-4">
              <Upload className="h-6 w-6 text-brand" />
            </div>
            <div>
              <p className="font-medium text-ink text-sm">
                {fileName ? fileName : "Drop your file here or click to browse"}
              </p>
              <p className="text-xs text-ink-muted mt-1">Supports .xlsx, .xls, .csv</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); }}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Column hint */}
          {!parsed.length && !error && (
            <div className="rounded-2xl bg-surface-muted px-4 py-3">
              <p className="text-xs text-ink-muted font-medium mb-1 uppercase tracking-wide">Expected columns</p>
              <p className="text-xs text-ink-muted">
                Date · Site Name · Staff Name · Start · End · Total Hours · Signin Time · Signout Time · Notes
              </p>
            </div>
          )}

          {/* Preview table */}
          {parsed.length > 0 && (
            <div>
              <p className="text-sm font-medium text-ink mb-3">
                Preview — {parsed.length} row{parsed.length !== 1 ? "s" : ""} found
              </p>
              <div className="overflow-x-auto rounded-2xl border border-hairline">
                <table className="w-full text-sm">
                  <thead className="bg-surface-muted">
                    <tr>
                      {["Date", "Site", "Staff", "Start", "End", "Hours"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {parsed.slice(0, 8).map((row, i) => (
                      <tr key={i} className="hover:bg-surface-muted">
                        <td className="px-4 py-3 text-ink whitespace-nowrap">{row.date}</td>
                        <td className="px-4 py-3 text-ink max-w-[180px] truncate">{row.siteName}</td>
                        <td className="px-4 py-3 text-ink whitespace-nowrap">{row.staffName}</td>
                        <td className="px-4 py-3 text-ink whitespace-nowrap">{row.start}</td>
                        <td className="px-4 py-3 text-ink whitespace-nowrap">{row.end}</td>
                        <td className="px-4 py-3 text-ink whitespace-nowrap">{row.totalHours}h</td>
                      </tr>
                    ))}
                    {parsed.length > 8 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-3 text-xs text-ink-muted text-center">
                          +{parsed.length - 8} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-hairline shrink-0">
          <button
            onClick={onClose}
            className="rounded-3xl border border-hairline px-6 py-2.5 text-sm font-medium text-ink hover:border-brand transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={parsed.length === 0}
            onClick={() => { onImport(parsed); onClose(); toast.success(`Imported ${parsed.length} shifts successfully`); }}
            className="rounded-3xl bg-brand px-6 py-2.5 text-sm font-medium text-brand-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            Import {parsed.length > 0 ? `${parsed.length} Shifts` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────
function ShiftsContent() {
  useAuthProtection();
  const { openShiftModal } = useAppShell();
  const [showImport, setShowImport] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [importedShifts, setImportedShifts] = useState<ParsedShift[]>([]);
  const [selectedSiteIdx, setSelectedSiteIdx] = useState(0);
  const [rosters, setRosters] = useState<List[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedDateRosters, setSelectedDateRosters] = useState<List[]>([]);

  // When "All Sites" is selected (id=0), pass 0 to indicate no site filter
  const activeSiteId = siteFilters[selectedSiteIdx].id;

  // Fetch all rosters
  // useEffect(() => {
  //   const fetchRosters = async () => {
  //     setLoading(true);
  //     try {
  //      // const data = await getRosters();
  //       let rosterList: List[] = [];
        
  //       // Normalize API response - check for 'events' array first
  //       if (Array.isArray(data?.events)) {
  //         rosterList = data.events;
  //       } else if (Array.isArray(data)) {
  //         rosterList = data;
  //       } else if (Array.isArray(data?.data)) {
  //         rosterList = data.data;
  //       } else if (Array.isArray(data?.rows)) {
  //         rosterList = data.rows;
  //       }

  //       // Transform to List interface if needed
  //       rosterList = rosterList.map((r: any) => ({
  //         id: r.id || Math.random(),
  //         title: `${r.guard_name || 'N/A'} - ${r.site_name || 'N/A'}`,
  //         start: r.start || r.start_datetime || '',
  //         shift_date: r.shift_date || r.state || '',
  //         end: r.end || r.end_datetime || '',
  //         site_id: r.site_id || 0,
  //         site_name: r.site_name || '',
  //         guard_name: r.guard_name || r.staff_name || '',
  //         guard_phone: r.guard_phone || r.staff_phone || '',
  //       }));

  //       setRosters(rosterList);
  //       console.log('Loaded rosters:', rosterList);
  //     } catch (error: any) {
  //       toast.error(error.message || 'Failed to load rosters');
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchRosters();
  // }, []);

  const handleImport = (shifts: ParsedShift[]) => {
    setImportedShifts(shifts);
  };

  // Pagination logic
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

  // Smart pagination - show limited page numbers with ellipsis
  const getPageNumbers = () => {
    const delta = 2; // Show 2 pages on each side of current page
    const left = currentPage - delta;
    const right = currentPage + delta;
    const range = [];
    
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= left && i <= right)
      ) {
        range.push(i);
      } else if (
        (i === left - 1 && left > 2) ||
        (i === right + 1 && right < totalPages - 1)
      ) {
        range.push('...');
      }
    }
    
    return range;
  };

  return (
    <>
      {/* {loading && (
        <div className="w-full mb-6">
          <Progress value={60} className="h-1 bg-slate-100" />
        </div>
      )} */}

      {showImport && (
        <ShiftImportModal
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}

      <ExcelImportModal
        isOpen={showExcelImport}
        onClose={() => setShowExcelImport(false)}
        onImportSuccess={() => {
          toast.success("Roster imported successfully");
          setShowExcelImport(false);
        }}
        siteId={activeSiteId}
      />

      {/* ── Page Header ── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl lg:text-4xl">
          Shifts &amp; Roster Management
        </h1>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {/* Site filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {siteFilters.map((f, i) => (
              <button
                key={f.label}
                onClick={() => setSelectedSiteIdx(i)}
                className={`shrink-0 cursor-pointer rounded-3xl px-4 py-2 text-sm font-medium transition-colors sm:px-6 sm:py-3 ${
                  selectedSiteIdx === i
                    ? "border-2 border-brand bg-brand text-brand-foreground"
                    : "border border-hairline bg-white text-ink hover:border-brand"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 sm:gap-3">
            

            {/* Excel Import button */}
            <button
              onClick={() => setShowExcelImport(true)}
              className="flex w-full items-center justify-center gap-2 rounded-3xl border border-brand bg-brand/10 px-6 py-2.5 text-sm font-medium text-brand hover:bg-brand/20 sm:w-auto sm:px-8 sm:py-3 transition-colors"
            >
              <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Import Excel</span>
            </button>

        
          </div>
        </div>
      </div>

      {/* ── Imported shifts banner ── */}
      {importedShifts.length > 0 && (
        <div className="mb-6 flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4">
          <p className="text-sm font-medium text-emerald-700">
            {importedShifts.length} shifts imported from file
          </p>
          <button
            onClick={() => setImportedShifts([])}
            className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Imported shifts table ── */}
      {importedShifts.length > 0 && (
        <div className="mb-8 hidden overflow-hidden rounded-3xl bg-white shadow lg:block">
          <table className="w-full">
            <thead className="bg-surface-muted">
              <tr>
                {["Date", "Site", "Staff", "Start", "End", "Hours", "Sign In", "Sign Out"].map((h) => (
                  <th key={h} className="px-6 py-5 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {importedShifts.map((s, i) => (
                <tr key={i} className="hover:bg-surface-muted">
                  <td className="px-6 py-4 text-ink text-sm">{s.date}</td>
                  <td className="px-6 py-4 text-ink text-sm max-w-[200px] truncate">{s.siteName}</td>
                  <td className="px-6 py-4 text-ink text-sm font-medium">{s.staffName}</td>
                  <td className="px-6 py-4 text-ink text-sm">{s.start}</td>
                  <td className="px-6 py-4 text-ink text-sm">{s.end}</td>
                  <td className="px-6 py-4 text-ink text-sm">{s.totalHours}h</td>
                  <td className="px-6 py-4 text-ink text-sm">{s.signinTime}</td>
                  <td className="px-6 py-4 text-ink text-sm">{s.signoutTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Roster Calendar View (single source of truth for calendar + list) ── */}

     <RosterCalendarView
  key={activeSiteId}
  siteId={activeSiteId}
  onDaySelect={(date, rows) => {
    const formatted: List[] = rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      start: r.start,
      shift_date: r.shift_date,
      end: r.end,
      site_id: r.site_id,
      site_name: r.site_name,
      guard_name: r.guard_name,
      guard_phone: r.guard_phone,
    }));

    setSelectedDateRosters(formatted);
  }}
/>
      



      {/* ── All Rosters Table with Pagination ── */}
     <div className="mt-12">
  <h2 className="font-heading text-2xl font-bold text-ink mb-6">
    All Rosters
  </h2>

  <AllShiftListings
  rosters={
    selectedDateRosters.length > 0
      ? selectedDateRosters
      : rosters
  }
  loading={loading}
/>
</div>
</>
      
  );
}