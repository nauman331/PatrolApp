import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { toast } from "sonner";
import {
  CheckCircle,
  Image,
  AlertTriangle,
  Radio,
  BookOpenText,
} from "lucide-react";
import { AppLayout } from "@/components/app-shell/layout";
import { useAppShell } from "@/components/app-shell/app-context";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard • Shwanix Guard Manager Pro" },
      {
        name: "description",
        content: "Real-time guard, patrol, and incident overview across all sites.",
      },
    ],
  }),
});

function DashboardPage() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <AppLayout>
      <DashboardContent />
    </AppLayout>
  );
}

function DashboardContent() {
  const { openLiveMap } = useAppShell();
  return (
    <div className="px-4 py-6 md:px-0">
      {/* Header Section */}
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink md:text-5xl">
            Good morning, Sara!
          </h1>
          <p className="mt-2 text-base text-ink-muted md:text-lg">
            Everything looks calm across your 3 sites • 16 April 2026
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <button
            onClick={openLiveMap}
            className="flex flex-1 items-center justify-center rounded-3xl border border-hairline bg-white px-5 py-3 text-sm font-medium text-ink hover:border-brand md:flex-none md:px-7 md:text-base"
          >
            <BookOpenText className="h-5 w-5" />
            <span className="ml-2">Live Site Map</span>
          </button>
          <div className="flex flex-1 items-center justify-center rounded-3xl bg-emerald-100 px-5 py-3 text-xs font-semibold text-emerald-700 md:flex-none md:px-6 md:text-sm">
            <span className="mr-2 h-3 w-3 animate-pulse rounded-full bg-emerald-500" />
            <span className="whitespace-nowrap">ALL SITES OPERATIONAL</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <StatCard
          accent="text-brand"
          label="Guards on Duty"
          value="24"
          delta="↑ +4 from yesterday"
          deltaClass="text-emerald-600"
        />
        <StatCard
          accent="text-emerald-500"
          label="Patrols Today"
          value="92"
          delta="↑ 94% compliance"
          deltaClass="text-emerald-600"
        />
        <StatCard
          accent="text-amber-500"
          label="Open Incidents"
          value="3"
          delta="↓ 2 resolved today"
          deltaClass="text-amber-600"
        />
        <div className="rounded-3xl bg-white p-6 shadow card-hover md:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-500">
            Active Sites
          </p>
          <div className="mt-3 font-heading text-5xl font-extrabold text-ink md:text-7xl">
            3
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-3xl bg-brand/10 px-3 py-1.5 text-[10px] font-bold text-brand md:px-4 md:py-2 md:text-xs">
              Mall of Lahore
            </span>
            <span className="rounded-3xl bg-blue-500/10 px-3 py-1.5 text-[10px] font-bold text-blue-500 md:px-4 md:py-2 md:text-xs">
              DHA Clinic
            </span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="mt-8 rounded-3xl bg-white p-6 shadow md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="font-heading text-xl font-semibold text-ink md:text-2xl">
            Hourly Patrol Activity • Today
          </h3>
          <div className="flex flex-wrap items-center gap-4 text-[10px] text-ink-muted md:gap-6 md:text-xs">
            <div className="flex items-center">
              <span className="mr-2 inline-block h-3 w-3 rounded bg-brand" />{" "}
              Completed Patrols
            </div>
            <div className="flex items-center">
              <span className="mr-2 inline-block h-3 w-3 rounded bg-red-500" />{" "}
              Incidents
            </div>
          </div>
        </div>
        
        {/* Scrollable Container for Chart on Mobile */}
        <div className="overflow-x-auto pb-4">
          <div className="flex h-64 min-w-[600px] items-end gap-3 md:min-w-full">
            {[
              { h: 28, label: "05:00", color: "bg-red-500" },
              { h: 95, label: "06:00", color: "bg-brand" },
              { h: 110, label: "07:00", color: "bg-brand" },
              { h: 132, label: "08:00", color: "bg-brand" },
              { h: 88, label: "09:00", color: "bg-brand" },
              { h: 145, label: "10:00", color: "bg-brand", now: true },
              { h: 65, label: "11:00", color: "bg-ink" },
              { h: 42, label: "12:00", color: "bg-ink" },
            ].map((b) => (
              <div
                key={b.label}
                className="relative flex flex-1 flex-col items-center gap-1"
              >
                {b.now && (
                  <div className="absolute -top-8 rounded-2xl bg-brand/10 px-3 py-px text-[10px] font-bold text-brand">
                    NOW
                  </div>
                )}
                <div
                  className={`${b.color} w-full rounded-t-2xl transition-all duration-500`}
                  style={{ height: `${b.h}px` }}
                />
                <div className="text-[10px] text-ink-muted md:text-xs">
                  {b.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-3xl bg-white p-6 shadow md:p-8">
          <h3 className="mb-4 font-heading text-xl font-semibold text-ink md:text-2xl">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {[
              [CheckCircle, "Ahmed completed Gate A patrol", "2 min ago"],
              [Image, "4 photos uploaded from Food Court", "8 min ago"],
              [AlertTriangle, "Incident logged at Mall of Lahore", "15 min ago"],
              [Radio, "NFC scan verified at Rooftop Access", "22 min ago"],
            ].map(([Icon, text, time], idx) => (
              <div
                key={idx}
                className="flex flex-col gap-1 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0 text-ink-muted md:h-5 md:w-5" />
                  <span className="text-xs font-medium text-ink md:text-sm">
                    {text}
                  </span>
                </div>
                <span className="ml-7 text-[10px] text-ink-muted sm:ml-0 md:text-xs">
                  {time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="rounded-3xl bg-white p-6 shadow md:p-8">
          <h3 className="mb-4 font-heading text-xl font-semibold text-ink md:text-2xl">
            Top Performers
          </h3>
          <div className="space-y-3">
            {[
              ["Ahmed Khan", "Mall of Lahore", "98%"],
              ["Muhammad Raza", "DHA Clinic", "95%"],
              ["Bilal Hussain", "Packages Mall", "92%"],
            ].map(([name, site, score]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 sm:rounded-3xl"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink md:text-base">
                    {name}
                  </div>
                  <div className="truncate text-[10px] text-ink-muted md:text-xs">
                    {site}
                  </div>
                </div>
                <button
                  onClick={() => toast.success(`${name}'s profile opened`)}
                  className="ml-4 rounded-3xl bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand md:px-4 md:py-2 md:text-sm"
                >
                  {score}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  accent,
  label,
  value,
  delta,
  deltaClass,
}: {
  accent: string;
  label: string;
  value: string;
  delta: string;
  deltaClass: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow card-hover md:p-8">
      <p className={`text-[10px] font-bold uppercase tracking-widest md:text-xs ${accent}`}>
        {label}
      </p>
      <div className="mt-3 font-heading text-5xl font-extrabold text-ink md:text-7xl">
        {value}
      </div>
      <div className={`mt-6 flex items-center text-xs md:text-sm ${deltaClass}`}>
        {delta}
      </div>
    </div>
  );
}
