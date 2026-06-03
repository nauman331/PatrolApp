import { CalendarDay } from "@/types/shift";

interface RosterCalendarProps {
  days: CalendarDay[];
  month: string;
  onSelect: (day: CalendarDay) => void;
  onTodayClick: () => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function RosterCalendar({ days, month, onSelect, onTodayClick }: RosterCalendarProps) {
  return (
    <div className="mb-8 rounded-3xl bg-white p-4 shadow sm:p-6 lg:p-8">
      {/* Calendar header */}
      <div className="mb-4 flex flex-col gap-1 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-xl font-semibold text-ink sm:text-2xl">
          {month} &bull; Roster Calendar
        </h2>
        <span className="text-xs text-ink-muted sm:text-sm">Click any day to assign shifts</span>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-1.5 text-center text-[10px] font-medium text-ink-muted sm:text-xs"
          >
            <span className="hidden xs:inline">{d}</span>
            <span className="xs:hidden">{d.charAt(0)}</span>
          </div>
        ))}

        {/* Day cells */}
        {days.map((d) => (
          <button
            key={d.n}
            onClick={d.today ? onTodayClick : () => onSelect(d)}
            className={`flex flex-col items-start rounded-2xl border p-2 text-left transition-colors sm:rounded-3xl sm:p-3 lg:h-28 ${
              d.today
                ? "border-transparent bg-gradient-to-br from-brand to-brand-glow text-brand-foreground shadow-lg ring-4 ring-brand/30"
                : "border-hairline bg-white text-ink hover:border-brand"
            }`}
          >
            <span className="text-xs font-bold sm:text-sm">{d.n}</span>
            {d.badge ? (
              <span
                className={`mt-1.5 hidden rounded-2xl px-1.5 py-0.5 text-[9px] leading-tight sm:inline-block sm:px-2 sm:text-[10px] ${d.badge}`}
              >
                {d.sub}
              </span>
            ) : (
              <span
                className={`mt-1.5 hidden text-[9px] leading-tight sm:inline sm:text-[10px] ${d.color ?? ""}`}
              >
                {d.sub}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}