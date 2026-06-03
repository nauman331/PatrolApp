import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Upload, AlertCircle, CheckCircle, X, FileSpreadsheet } from 'lucide-react';
import { previewExcelImport, confirmExcelImport } from '@/api/roster';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PreviewRow {
  row_index: number;
  state: string;
  site_name: string;
  staff_id: string;
  staff_name: string | number;
  staff_phone: string;
  staff_type: number;
  customer: string;
  start_datetime: string | null;
  end_datetime: string | null;
}

interface PreviewResponse {
  success: boolean;
  total: number;
  rows: PreviewRow[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

type Step = 'upload' | 'preview' | 'success';

// ─── Sub-component: error banner ──────────────────────────────────────────────
function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-red-700">Something went wrong</p>
        <p className="text-xs text-red-600 mt-0.5">{message}</p>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ExcelImportModal({ isOpen, onClose, onImportSuccess }: Props) {
  const [step, setStep]         = useState<Step>('upload');
  const [file, setFile]         = useState<File | null>(null);
  const [preview, setPreview]   = useState<PreviewResponse | null>(null);
  const [loading, setLoading]   = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Reset every time the modal opens — MUST be before the early return
  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen]);

  // Early return AFTER all hooks
  if (!isOpen) return null;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function reset() {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setLoading(false);
    setDragOver(false);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleClose() {
    reset();
    onClose();
  }

  function pickFile(selected: File) {
    if (!selected.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Please select an Excel file (.xlsx, .xls, or .csv)');
      return;
    }
    setFile(selected);
    setError(null);
  }

  // ── Step 1: Upload & Preview ──────────────────────────────────────────────
  async function handlePreview() {
    if (!file) { toast.error('Please select a file first'); return; }
    setLoading(true);
    setError(null);
    try {
      const data: PreviewResponse = await previewExcelImport(file);
      setPreview(data);
      setStep('preview');
      toast.success(`Preview ready — ${data.total} rows found`);
    } catch (err: any) {
      const msg = err.message ?? 'Failed to preview file';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Confirm import ────────────────────────────────────────────────
  async function handleConfirm() {
    if (!preview) return;
    setLoading(true);
    setError(null);
    try {
      await confirmExcelImport(preview.rows);
      toast.success('Import successful!');
      setStep('success');
      setTimeout(() => { handleClose(); onImportSuccess?.(); }, 2000);
    } catch (err: any) {
      const msg = err.message ?? 'Import failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="modal-pop w-full max-w-3xl rounded-3xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-hairline">
          <h2 className="font-heading text-2xl font-bold text-ink">Import Roster from Excel</h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1.5 hover:bg-surface transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-ink-muted" />
          </button>
        </div>

        <div className="px-8 py-8 space-y-6">

          {/* ── STEP 1: Upload ─────────────────────────────────────────────── */}
          {step === 'upload' && (
            <>
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) pickFile(f); }}
                className={[
                  'rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors select-none',
                  dragOver
                    ? 'border-brand bg-brand/5'
                    : 'border-brand/30 hover:border-brand/60 hover:bg-surface/40',
                ].join(' ')}
              >
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <FileSpreadsheet className="h-12 w-12 text-emerald-500" />
                    <p className="font-semibold text-emerald-700">{file.name}</p>
                    <p className="text-xs text-ink-muted">
                      {(file.size / 1024).toFixed(1)} KB · Click to change
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="h-12 w-12 text-brand/40" />
                    <p className="text-sm font-medium text-ink">Drag &amp; drop your Excel file here</p>
                    <p className="text-xs text-ink-muted">or click to browse</p>
                    <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                      .xlsx · .xls · .csv
                    </span>
                  </div>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
                />
              </div>

              {error && <ErrorBanner message={error} />}

              <div className="flex gap-4">
                <button
                  onClick={handleClose}
                  className="flex-1 rounded-3xl border border-hairline py-3 text-sm font-medium text-ink hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePreview}
                  disabled={!file || loading}
                  className="flex-1 rounded-3xl bg-brand py-3 text-sm font-medium text-brand-foreground disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                >
                  {loading ? 'Uploading…' : 'Upload & Preview'}
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2: Preview ────────────────────────────────────────────── */}
          {step === 'preview' && preview && (
            <>
              {/* Summary */}
              <div className="flex items-center justify-between rounded-2xl bg-surface px-5 py-4">
                <div>
                  <p className="text-xs text-ink-muted">File</p>
                  <p className="text-sm font-medium text-ink">{file?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-muted">Rows to import</p>
                  <p className="text-2xl font-bold text-brand">{preview.total}</p>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-hairline">
                <table className="w-full text-xs">
                  <thead className="bg-surface">
                    <tr>
                      {['#', 'Date', 'Site', 'Staff ID', 'Staff Name', 'Customer', 'Start', 'End'].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left font-semibold text-ink-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 10).map((row) => (
                      <tr key={row.row_index} className="border-t border-hairline/50 hover:bg-surface/50">
                        <td className="px-3 py-2 text-ink-muted">{row.row_index}</td>
                        <td className="px-3 py-2">{row.state}</td>
                        <td className="px-3 py-2 max-w-[150px] truncate" title={row.site_name}>{row.site_name}</td>
                        <td className="px-3 py-2 font-mono">{row.staff_id}</td>
                        <td className="px-3 py-2">{String(row.staff_name)}</td>
                        <td className="px-3 py-2">{row.customer}</td>
                        <td className="px-3 py-2">{row.start_datetime ?? '—'}</td>
                        <td className="px-3 py-2">{row.end_datetime ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.total > 10 && (
                  <p className="px-3 py-2 text-xs text-center text-ink-muted bg-surface border-t border-hairline">
                    Showing 10 of {preview.total} rows
                  </p>
                )}
              </div>

              {error && <ErrorBanner message={error} />}

              <div className="flex gap-4">
                <button
                  onClick={reset}
                  className="flex-1 rounded-3xl border border-hairline py-3 text-sm font-medium text-ink hover:bg-surface transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 rounded-3xl bg-brand py-3 text-sm font-medium text-brand-foreground disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                >
                  {loading ? 'Importing…' : `Confirm Import (${preview.total} rows)`}
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Success ─────────────────────────────────────────────── */}
          {step === 'success' && (
            <div className="flex flex-col items-center gap-6 py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">Import Successful!</h3>
                <p className="mt-1 text-sm text-ink-muted">Your roster has been imported. Closing shortly…</p>
              </div>
              <button
                onClick={handleClose}
                className="w-full rounded-3xl bg-brand py-3 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
              >
                Close
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}