import { ParsedShift } from "@/types/shift";

interface ImportedTableProps {
  shifts: ParsedShift[];
}

const HEADERS = ["Date", "Site", "Staff", "Start", "End", "Hours", "Sign In", "Sign Out"];

export default function ImportedTable({ shifts }: ImportedTableProps) {
  return (
    <>
      {/* ── Desktop table (lg+) ── */}
      <div className="mb-8 hidden overflow-hidden rounded-3xl bg-white shadow lg:block">
        <div className="border-b border-hairline px-8 py-5">
          <h3 className="font-heading text-base font-semibold text-ink">Imported Shifts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-muted">
              <tr>
                {HEADERS.map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {shifts.map((s, i) => (
                <tr key={i} className="hover:bg-surface-muted">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-ink">{s.date}</td>
                  <td className="max-w-[200px] truncate px-6 py-4 text-sm text-ink">{s.siteName}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-ink">{s.staffName}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-ink">{s.start}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-ink">{s.end}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-ink">{s.totalHours}h</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-ink">{s.signinTime}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-ink">{s.signoutTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile cards (< lg) ── */}
      <div className="mb-8 flex flex-col gap-3 lg:hidden">
        <h3 className="font-heading text-base font-semibold text-ink">Imported Shifts</h3>
        {shifts.map((s, i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-white shadow">
            <div className="border-b border-hairline px-5 py-3">
              <p className="text-sm font-semibold text-ink">{s.staffName}</p>
              <p className="text-xs text-ink-muted">{s.siteName}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 px-5 py-3 sm:grid-cols-4">
              {[
                { label: "Date", value: s.date },
                { label: "Hours", value: `${s.totalHours}h` },
                { label: "Start", value: s.start },
                { label: "End", value: s.end },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                    {label}
                  </p>
                  <p className="text-sm text-ink">{value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}