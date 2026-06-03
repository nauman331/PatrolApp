import { useState, useRef, useCallback } from "react";
import { X, Upload } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { ParsedShift } from "@/types/shift";
import { mapRow } from "@/utils/shiftHelpers";

interface ShiftImportModalProps {
  onClose: () => void;
  onImport: (shifts: ParsedShift[]) => void;
}

export default function ShiftImportModal({ onClose, onImport }: ShiftImportModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [parsed, setParsed] = useState<ParsedShift[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError("");
    setParsed([]);

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
          setError("No valid rows found. Make sure the file has 'Staff Name' and 'Site Name' columns.");
          return;
        }

        setParsed(result);
      } catch {
        setError("Failed to parse the file. Please check it is a valid spreadsheet.");
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

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleConfirm = () => {
    onImport(parsed);
    onClose();
    toast.success(`${parsed.length} shifts imported successfully`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 sm:items-center">
      <div className="modal-pop w-full max-w-2xl rounded-3xl bg-white shadow-2xl flex flex-col max-h-[90vh]">

        {/* ── Modal Header ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-hairline px-6 py-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-ink">Import Shifts</h2>
            <p className="mt-0.5 text-xs text-ink-muted">Upload a spreadsheet to bulk-add shifts</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-ink-muted transition-colors hover:bg-surface-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="flex flex-col gap-5 overflow-y-auto p-6">

          {/* Dropzone */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              isDragging
                ? "border-brand bg-brand/5"
                : "border-hairline hover:border-brand hover:bg-surface-muted"
            }`}
          >
            <div className={`rounded-2xl p-4 transition-colors ${isDragging ? "bg-brand/20" : "bg-brand/10"}`}>
              <Upload className="h-6 w-6 text-brand" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">
                {fileName ? fileName : "Drop your file here or click to browse"}
              </p>
              <p className="mt-1 text-xs text-ink-muted">Supports .xlsx, .xls, .csv</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) processFile(e.target.files[0]);
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Column hint — shown before a file is loaded */}
          {!parsed.length && !error && (
            <div className="rounded-2xl bg-surface-muted px-4 py-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                Expected columns
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["Date", "Site Name", "Staff Name", "Start", "End", "Total Hours", "Signin Time", "Signout Time", "Notes"].map(
                  (col) => (
                    <span
                      key={col}
                      className="rounded-full border border-hairline bg-white px-2.5 py-0.5 text-xs text-ink-muted"
                    >
                      {col}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {/* Preview table */}
          {parsed.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-ink">
                  Preview
                </p>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {parsed.length} row{parsed.length !== 1 ? "s" : ""} ready
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-hairline">
                <table className="w-full text-sm">
                  <thead className="bg-surface-muted">
                    <tr>
                      {["Date", "Site", "Staff", "Start", "End", "Hrs"].map((h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {parsed.slice(0, 8).map((row, i) => (
                      <tr key={i} className="hover:bg-surface-muted">
                        <td className="whitespace-nowrap px-4 py-3 text-ink">{row.date}</td>
                        <td className="max-w-[160px] truncate px-4 py-3 text-ink">{row.siteName}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{row.staffName}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-ink">{row.start}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-ink">{row.end}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-ink">{row.totalHours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {parsed.length > 8 && (
                  <div className="border-t border-hairline px-4 py-3 text-center text-xs text-ink-muted">
                    +{parsed.length - 8} more rows not shown
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-hairline px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-3xl border border-hairline px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:border-brand"
          >
            Cancel
          </button>
          <button
            disabled={parsed.length === 0}
            onClick={handleConfirm}
            className="rounded-3xl bg-brand px-6 py-2.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {parsed.length > 0 ? `Import ${parsed.length} Shifts` : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}