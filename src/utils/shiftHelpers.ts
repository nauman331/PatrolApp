import * as XLSX from "xlsx";
import { ParsedShift, DefaultShift } from "@/types/shift";

export function mapRow(row: Record<string, unknown>): ParsedShift {
  return {
    date: String(row["Date"] ?? ""),
    siteName: String(row["Site Name"] ?? ""),
    staffName: String(row["Staff Name"] ?? ""),
    start: String(row["Start"] ?? ""),
    end: String(row["End"] ?? ""),
    totalHours: (row["Total Hours"] as number) ?? "",
    signinTime: String(row["Signin Time"] ?? ""),
    signoutTime: String(row["Signout Time"] ?? ""),
    notes: String(row["Notes"] ?? ""),
  };
}

export function exportShifts(shifts: DefaultShift[]) {
  const data = shifts.map((s) => ({
    "Shift ID": s.id,
    Site: s.site,
    Guard: s.guard,
    Time: s.time,
    Status: s.status,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Shifts");
  XLSX.writeFile(wb, "shifts.xlsx");
}

export function statusStyle(color: string) {
  if (color === "emerald") return "bg-emerald-100 text-emerald-700";
  if (color === "brand") return "bg-brand/10 text-brand";
  return "bg-blue-500/10 text-blue-500";
}