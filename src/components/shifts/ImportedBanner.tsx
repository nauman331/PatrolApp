import { CheckCircle2, X } from "lucide-react";

interface ImportedBannerProps {
  count: number;
  onClear: () => void;
}

export default function ImportedBanner({ count, onClear }: ImportedBannerProps) {
  return (
    <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">
            {count} shift{count !== 1 ? "s" : ""} imported
          </p>
          <p className="text-xs text-emerald-600">Showing imported data below the calendar</p>
        </div>
      </div>
      <button
        onClick={onClear}
        className="ml-4 shrink-0 rounded-full p-1.5 text-emerald-600 transition-colors hover:bg-emerald-100 hover:text-emerald-800"
        aria-label="Clear imported shifts"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}