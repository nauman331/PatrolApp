import { FolderDown, FolderUp } from "lucide-react";
import { toast } from "sonner";

interface ShiftHeaderProps {
  filters: string[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onImportClick: () => void;
  onExport: () => void;
}

export default function ShiftHeader({
  filters,
  activeFilter,
  onFilterChange,
  onImportClick,
  onExport,
}: ShiftHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl lg:text-4xl">
        Shifts &amp; Roster Management
      </h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`shrink-0 cursor-pointer rounded-3xl px-4 py-2 text-sm font-medium transition-colors sm:px-6 sm:py-3 ${
                f === activeFilter
                  ? "border-2 border-brand bg-brand text-brand-foreground"
                  : "border border-hairline bg-white text-ink hover:border-brand"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={onImportClick}
            className="flex flex-1 items-center justify-center gap-2 rounded-3xl border border-hairline bg-white px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:border-brand sm:flex-none sm:px-8 sm:py-3"
          >
            <FolderDown className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Import</span>
          </button>

          <button
            onClick={onExport}
            className="flex flex-1 items-center justify-center gap-2 rounded-3xl bg-brand px-6 py-2.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 sm:flex-none sm:px-8 sm:py-3"
          >
            <FolderUp className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}