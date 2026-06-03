import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Calendar, Building2 } from 'lucide-react';
import { getRosterCalendar } from '@/api/roster';
import { Progress } from '@/components/ui/progress';

interface RosterRow {
  id: number;
  site_id?: number;
  site_name: string;
  guard_name?: string;
  guard_phone?: string;
  staff_name?: string;
  staff_phone?: string;
  start_datetime?: string | null;
  start?: string;
  end_datetime?: string | null;
  end?: string;
  shift_date?: string;
  title?: string;
  state?: string;
}

interface RosterCalendarViewProps {
  siteId: number;
  month?: string;
  onDaySelect?: (date: string, rows: RosterRow[]) => void;
}

// ─── helpers ────────────────────────────────────────────────────────────────

/** Returns "YYYY-MM-DD" from a RosterRow */
const getRowDate = (r: RosterRow): string => {
  if (r.shift_date && r.shift_date.length >= 10) return r.shift_date.slice(0, 10);
  if (r.state && r.state.length >= 10) return r.state.slice(0, 10);
  if (r.start_datetime && r.start_datetime.length >= 10) return r.start_datetime.slice(0, 10);
  return '';
};

/** "YYYY-MM-DD" → Date (local midnight, avoids UTC off-by-one) */
const parseLocal = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Date → "YYYY-MM-DD" (local) */
const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Sunday-anchored week start for a given date string */
const weekStartFor = (dateStr: string) => {
  const d = parseLocal(dateStr);
  d.setDate(d.getDate() - d.getDay());
  return toDateStr(d);
};

/** First day of the month containing a date string */
const monthStartFor = (dateStr: string) => {
  const d = parseLocal(dateStr);
  return toDateStr(new Date(d.getFullYear(), d.getMonth(), 1));
};

/** Last day of the month containing a date string */
const monthEndFor = (dateStr: string) => {
  const d = parseLocal(dateStr);
  return toDateStr(new Date(d.getFullYear(), d.getMonth() + 1, 0));
};

/** Build array of 7 day-objects for a week starting at weekStart */
const buildWeek = (weekStart: string, rows: RosterRow[]) => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = parseLocal(weekStart);
    d.setDate(d.getDate() + i);
    const dateStr = toDateStr(d);
    const dayShifts = rows.filter((r) => getRowDate(r) === dateStr);
    const sites = Array.from(new Set(dayShifts.map((s) => s.site_name))).filter(Boolean);
    days.push({
      date: dateStr,
      dayNum: d.getDate(),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      shiftCount: dayShifts.length,
      sites,
    });
  }
  return days;
};

// ─── component ──────────────────────────────────────────────────────────────

export default function RosterCalendarView({ siteId, month, onDaySelect }: RosterCalendarViewProps) {
  const todayStr = toDateStr(new Date());

  // ── state ──────────────────────────────────────────────────────────────
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [loadedMonth, setLoadedMonth] = useState<string>('');          // "YYYY-MM-DD" of month-start
  const [loading, setLoading] = useState(false);

  // The week being displayed (Sunday-anchored, "YYYY-MM-DD")
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(() => weekStartFor(todayStr));

  // Slide animation direction  (+1 = forward, -1 = back, 0 = static)
  const [slideDir, setSlideDir] = useState<0 | 1 | -1>(0);
  const [animating, setAnimating] = useState(false);

  const [selectedDay, setSelectedDay] = useState<string>(todayStr);

  const datePickerRef = useRef<HTMLInputElement>(null);

  // ── derive which month the current week belongs to ─────────────────────
  // Use the Wednesday of the current week to decide month ownership
  const anchorDate = useMemo(() => {
    const d = parseLocal(currentWeekStart);
    d.setDate(d.getDate() + 3); // Wednesday
    return toDateStr(d);
  }, [currentWeekStart]);

  const currentMonthStart = useMemo(() => monthStartFor(anchorDate), [anchorDate]);
  const currentMonthEnd   = useMemo(() => monthEndFor(anchorDate),   [anchorDate]);

  // ── fetch (once per month) ─────────────────────────────────────────────
  const loadData = useCallback(async (mStart: string, mEnd: string) => {
    setLoading(true);
    try {
      const res = await getRosterCalendar(siteId || undefined, mStart, mEnd);
      let data: RosterRow[] = [];
      if (res?.events) data = res.events;
      else if (Array.isArray(res)) data = res;
      else if (res?.data) data = res.data;
      setRows(data);
      setLoadedMonth(mStart);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load roster');
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  // Re-fetch only when month or siteId changes
  useEffect(() => {
    if (currentMonthStart !== loadedMonth) {
      loadData(currentMonthStart, currentMonthEnd);
    }
  }, [currentMonthStart, currentMonthEnd, loadedMonth, loadData]);

  // Also re-fetch when siteId changes regardless of month
  useEffect(() => {
    loadData(currentMonthStart, currentMonthEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  // ── week navigation ────────────────────────────────────────────────────
  const navigate = useCallback(
    (direction: 1 | -1) => {
      if (animating) return;
      setSlideDir(direction);
      setAnimating(true);

      setTimeout(() => {
        setCurrentWeekStart((prev) => {
          const d = parseLocal(prev);
          d.setDate(d.getDate() + direction * 7);
          return toDateStr(d);
        });
        setSlideDir(0);
        setAnimating(false);
      }, 320);
    },
    [animating]
  );

  // ── current week days ─────────────────────────────────────────────────
  const weekDays = useMemo(() => buildWeek(currentWeekStart, rows), [currentWeekStart, rows]);

  // ── display rows (shifts for selected day) ────────────────────────────
  const displayRows = useMemo(
    () => (selectedDay ? rows.filter((r) => getRowDate(r) === selectedDay) : rows),
    [selectedDay, rows]
  );

  // ── month label ───────────────────────────────────────────────────────
  const monthLabel = parseLocal(anchorDate).toLocaleDateString('en-US', { month: 'long' });
  const yearLabel  = parseLocal(anchorDate).getFullYear();

  // ── slide transform style ─────────────────────────────────────────────
  const slideStyle: React.CSSProperties = {
    transform: animating ? `translateX(${slideDir * -60}px)` : 'translateX(0)',
    opacity: animating ? 0 : 1,
    transition: 'transform 0.32s cubic-bezier(.4,0,.2,1), opacity 0.28s ease',
  };

  return (
    <div className="calendar-container w-full max-w-full overflow-hidden flex flex-col gap-6 p-1">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap');
        .calendar-container { font-family: 'DM Sans', sans-serif; }
        .cal-heading { font-family: 'Syne', sans-serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* Date card */
        .date-card {
          transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s ease;
          flex: 1 1 0;
          min-width: 0;
        }
        .date-card.active {
          transform: translateY(-8px) scale(1.04);
          box-shadow: 0 20px 40px -12px rgba(249,115,22,0.45);
        }
        .date-card:not(.active):hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px -6px rgba(0,0,0,0.12);
        }

        .site-badge-pill {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Pulsing dot */
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.4} }
        .pulse-dot { animation: pulse-dot 1.6s ease-in-out infinite; }
      `}} />

      {/* Loading bar */}
      {loading && (
        <div className="w-full">
          <Progress value={65} className="h-1 bg-slate-100" />
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-4">
          <div className="bg-orange-500 p-3 rounded-2xl shadow-lg shadow-orange-200">
            <Calendar className="text-white h-6 w-6" />
          </div>
          <div>
            <h2 className="cal-heading text-3xl font-black text-slate-900 tracking-tight">
              {monthLabel}
              <span className="text-orange-500 ml-2">{yearLabel}</span>
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Week of {parseLocal(currentWeekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mt-2">
              <Building2 className="h-3 w-3" />
              <span>{rows.length} Total Shifts This Month</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Hidden date picker */}
            <div className="relative flex items-center px-4">
              <button
                onClick={() => datePickerRef.current?.showPicker?.()}
                className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors"
              >
                <Calendar className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Jump to Date
                </span>
              </button>
              <input
                ref={datePickerRef}
                type="date"
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const ws = weekStartFor(e.target.value);
                  setCurrentWeekStart(ws);
                  setSelectedDay(e.target.value);
                }}
              />
            </div>

            <button
              onClick={() => navigate(1)}
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
              aria-label="Next week"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Today button */}
          <button
            onClick={() => {
              setCurrentWeekStart(weekStartFor(todayStr));
              setSelectedDay(todayStr);
            }}
            className="text-xs font-bold uppercase tracking-wider text-orange-500 bg-orange-50 px-4 py-2 rounded-xl border border-orange-200 hover:bg-orange-100 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* ── WEEK STRIP ── */}
      <div className="flex items-center gap-2">
        {/* Prev */}
        <button
          onClick={() => navigate(-1)}
          disabled={animating}
          className="shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-40"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-5 w-5 text-slate-700" />
        </button>

        {/* 7-day grid — all days visible at once */}
        <div className="flex-1 overflow-hidden">
          <div
            className="grid grid-cols-7 gap-2 py-4 px-1"
            style={slideStyle}
          >
            {weekDays.map((day) => {
              const isSelected  = selectedDay === day.date;
              const isToday     = day.date === todayStr;

              return (
                <button
                  key={day.date}
                  onClick={() => {
                    setSelectedDay(day.date);
                    onDaySelect?.(day.date, rows.filter((r) => getRowDate(r) === day.date));
                  }}
                  className={`date-card group flex flex-col items-center pt-3 pb-10 px-2 rounded-[1.75rem] border-2 relative overflow-hidden min-h-[150px] h-[150px] ${  isSelected
                      ? 'bg-orange-500 border-orange-500 active'
                      : isToday
                      ? 'bg-orange-50 border-orange-200 shadow-sm'
                      : 'bg-white border-slate-100 shadow-sm'
                  }`}
                >
                  {/* Today ring */}
                  {isToday && !isSelected && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-orange-400" />
                  )}

                  {/* Day name */}
                  <span className={`text-[9px] font-black uppercase tracking-[0.18em] mb-1 ${
                    isSelected ? 'text-orange-100' : 'text-slate-400'
                  }`}>
                    {day.dayName}
                  </span>

                  {/* Day number */}
                  <span className={`text-2xl font-black mb-2 leading-none ${
                    isSelected ? 'text-white' : isToday ? 'text-orange-600' : 'text-slate-800'
                  }`}>
                    {day.dayNum}
                  </span>

                  {/* Site badges */}
                  <div className="flex flex-col gap-1 w-full items-center">
                    {day.sites.slice(0, 1).map((site, idx) => (
                      <div
                        key={idx}
                        className={`site-badge-pill px-1.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-tight w-full text-center ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-600'
                        }`}
                        title={site}
                      >
                        {site}
                      </div>
                    ))}
                    {day.sites.length > 1 && (
                      <span className={`text-[10px] font-bold ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>
                        +{day.sites.length - 1} more
                      </span>
                    )}
                  </div>

                  {/* Shift count badge — pinned to bottom */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                    {day.shiftCount > 0 ? (
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-orange-600' : 'bg-emerald-500'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full bg-white pulse-dot`} />
                        <span className="text-[10px] font-black text-white">
                          {day.shiftCount}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase italic"> Empty</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Next */}
        <button
          onClick={() => navigate(1)}
          disabled={animating}
          className="shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-40"
          aria-label="Next week"
        >
          <ChevronRight className="h-5 w-5 text-slate-700" />
        </button>
      </div>

      {/* ── SLOT for your existing table / list view ── */}
      {/* Pass `displayRows` (shifts for selectedDay) to whatever table you render below */}
    </div>
  );
}