import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-shell/layout";
import { useAuthProtection } from "@/hooks/useAuthProtection";

export const Route = createFileRoute("/incidents")({
  component: () => (
    <AppLayout>
      <IncidentsContent />
    </AppLayout>
  ),
  head: () => ({
    meta: [
      { title: "Incident Management • Shwanix" },
      { name: "description", content: "Track, escalate and resolve security incidents." },
    ],
  }),
});

const initialIncidents = [
  {
    id: 1,
    severity: "HIGH",
    time: "08:47 AM",
    site: "Mall of Lahore",
    title: "Physical Altercation – Food Court",
    detail: "Ahmed Khan responded • 5 photos • Police notified",
    border: "border-red-200",
    color: "text-red-500",
  },
  {
    id: 2,
    severity: "MEDIUM",
    time: "22:10 PM",
    site: "DHA Clinic",
    title: "Unattended Bag – Parking B2",
    detail: "Muhammad Raza • Resolved",
    border: "border-amber-200",
    color: "text-amber-500",
  },
  {
    id: 3,
    severity: "MEDIUM",
    time: "11:30 AM",
    site: "Packages Mall",
    title: "Suspicious Vehicle – East Lot",
    detail: "Bilal Hussain • Under investigation",
    border: "border-amber-200",
    color: "text-amber-500",
  },
];

function IncidentsContent() {
  useAuthProtection();
  const [items, setItems] = useState(initialIncidents);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filtered = activeFilter ? items.filter((i) => i.severity === activeFilter) : items;

  return (
    <>
      <h1 className="mb-8 font-heading text-4xl font-bold text-ink">Incident Management</h1>
      <div className="mb-8 flex flex-wrap gap-3">
        {[
          ["HIGH", "bg-red-500", `(${items.filter((i) => i.severity === "HIGH").length})`],
          ["MEDIUM", "bg-amber-500", `(${items.filter((i) => i.severity === "MEDIUM").length})`],
          ["RESOLVED", "bg-emerald-500", "(7)"],
        ].map(([label, color, count]) => (
          <button
            key={label}
            onClick={() => setActiveFilter((cur) => (cur === label ? null : label))}
            className={`rounded-3xl border border-hairline px-8 py-3 text-sm font-medium transition-colors ${
              activeFilter === label ? `${color} border-transparent text-white` : "bg-white text-ink"
            }`}
          >
            {label} {count}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search incidents..."
          className="ml-auto w-72 rounded-3xl border border-hairline bg-white px-6 py-3 text-ink focus:border-brand focus:outline-none"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((inc) => (
          <div
            key={inc.id}
            className={`card-hover rounded-3xl border bg-white p-8 shadow ${inc.border}`}
          >
            <div className="mb-3 flex justify-between">
              <div className={`text-xs font-bold ${inc.color}`}>
                {inc.severity} • {inc.time}
              </div>
              <div className="text-xs text-ink-muted">{inc.site}</div>
            </div>
            <div className="text-xl font-semibold text-ink">{inc.title}</div>
            <p className="mt-4 text-ink-muted">{inc.detail}</p>
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => toast.success("Incident escalated")}
                className="text-sm font-medium text-red-500"
              >
                ESCALATE
              </button>
              <button
                onClick={() => {
                  setItems((prev) => prev.filter((i) => i.id !== inc.id));
                  toast.success("Incident resolved");
                }}
                className="rounded-3xl bg-emerald-100 px-6 py-2.5 text-sm font-medium text-emerald-700"
              >
                MARK RESOLVED
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
