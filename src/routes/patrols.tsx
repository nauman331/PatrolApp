import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Footprints,
  Radio,
  Image,
  AlertTriangle,
  Mic,
  FolderUp,
  Camera,
  UserSearch,
} from "lucide-react";
import { AppLayout } from "@/components/app-shell/layout";
import { useAuthProtection } from "@/hooks/useAuthProtection";

export const Route = createFileRoute("/patrols")({
  component: () => (
    <AppLayout>
      <PatrolsContent />
    </AppLayout>
  ),
  head: () => ({
    meta: [
      { title: "Patrol Reports • Shwanix" },
      { name: "description", content: "Live patrol timeline, NFC scans, and photo evidence." },
    ],
  }),
});

function PatrolsContent() {
  useAuthProtection();
  return (
    <>
      {/* ── Page Header ── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl lg:text-4xl">
            Patrol Reports
          </h1>
          <p className="mt-1 text-sm text-ink-muted sm:text-base">
            Real-time visibility • 16 April 2026 • 92 patrols logged
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => toast.success("Patrols exported as CSV")}
            className="flex h-11 items-center justify-center gap-2 rounded-3xl border border-brand px-6 text-sm font-medium text-brand sm:h-12 sm:px-8"
          >
            <FolderUp className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => toast.success("Gallery opened")}
            className="flex h-11 items-center justify-center gap-2 rounded-3xl bg-brand px-6 text-sm font-medium text-brand-foreground sm:h-12 sm:px-8"
          >
            <Image className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Full Image Gallery</span>
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        {[
          { Icon: Footprints, num: "92",  label: "Patrols Completed", border: "border-brand/30",       text: "text-brand" },
          { Icon: Radio,      num: "214", label: "NFC Scans",          border: "border-emerald-500/30", text: "text-emerald-700" },
          { Icon: Image,      num: "341", label: "Photos Uploaded",    border: "border-blue-400/30",    text: "text-blue-500" },
          { Icon: AlertTriangle, num: "4", label: "Incidents Flagged", border: "border-red-400/30",     text: "text-red-500" },
        ].map(({ Icon, num, label, border, text }, idx) => (
          <div
            key={idx}
            className={`rounded-3xl border bg-white/95 p-4 text-center backdrop-blur sm:p-6 ${border}`}
          >
            <div className="mb-3 flex justify-center sm:mb-4">
              <Icon className={`h-8 w-8 sm:h-12 sm:w-12 ${text}`} />
            </div>
            <div className="font-heading text-3xl font-bold text-ink sm:text-4xl">{num}</div>
            <div className={`mt-1 text-[10px] uppercase tracking-wider sm:text-xs ${text}`}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid gap-6 lg:grid-cols-12">

        {/* Timeline */}
        <div className="rounded-3xl bg-white p-5 shadow sm:p-8 lg:col-span-7">
          <h3 className="mb-6 font-heading text-xl font-semibold text-ink sm:text-2xl">
            Today's Patrol Timeline
          </h3>
          <div className="relative border-l-2 border-dashed border-brand pl-6 sm:pl-8">

            {/* Entry 1 – Done */}
            <div className="relative mb-8 sm:mb-10">
              <div className="absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-2xl bg-emerald-600 text-xs text-white">
                ✓
              </div>
              <div className="ml-3 sm:ml-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="font-semibold text-ink text-sm sm:text-base">
                    Gate A – North Entrance • Mall of Lahore
                  </div>
                  <div className="shrink-0 text-xs font-medium text-brand sm:text-sm">
                    07:02 AM • DONE
                  </div>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  All clear. NFC verified. 3 photos attached.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="flex items-center gap-1 rounded-3xl bg-emerald-600/10 px-3 py-1 text-xs text-emerald-700 sm:px-4">
                    <UserSearch className="h-3 w-3" /> NFC
                  </span>
                  <span className="flex items-center gap-1 rounded-3xl bg-blue-400/10 px-3 py-1 text-xs text-blue-500 sm:px-4">
                    <Camera className="h-3 w-3" /> 3 Photos
                  </span>
                </div>
              </div>
            </div>

            {/* Entry 2 – Incident */}
            <div className="relative mb-8 sm:mb-10">
              <div className="absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-2xl bg-red-500 text-xs text-white">
                !
              </div>
              <div className="ml-3 sm:ml-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="font-semibold text-red-500 text-sm sm:text-base">
                    Food Court – Level 2
                  </div>
                  <div className="shrink-0 text-xs font-medium text-red-500 sm:text-sm">
                    08:47 AM • INCIDENT
                  </div>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  Altercation resolved. 5 photos + voice note.
                </p>
              </div>
            </div>

            {/* Entry 3 – Live */}
            <div className="relative">
              <div className="absolute -left-[11px] flex h-5 w-5 animate-pulse items-center justify-center rounded-2xl bg-brand text-xs text-white">
                ▶
              </div>
              <div className="ml-3 sm:ml-4 rounded-3xl border border-brand/30 bg-gradient-to-r from-brand/10 to-transparent p-4 sm:p-6">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="font-semibold text-brand text-sm sm:text-base">
                    Rooftop Access • NOW
                  </div>
                  <div className="text-sm text-brand">09:15 AM</div>
                </div>
                <p className="mt-1 text-sm text-ink">Guard is currently on patrol.</p>
                <button
                  onClick={() => toast.success("Live patrol feed opened")}
                  className="mt-4 rounded-3xl bg-brand px-5 py-2 text-xs font-medium uppercase tracking-widest text-brand-foreground sm:px-6 sm:py-2.5"
                >
                  View Live Feed
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Evidence */}
        <div className="rounded-3xl bg-white p-5 shadow sm:p-8 lg:col-span-5">
          <h3 className="mb-5 font-heading text-xl font-semibold text-ink sm:mb-6 sm:text-2xl">
            Latest Evidence
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[
              { Icon: Image, label: "07:02 • Gate A" },
              { Icon: Image, label: "08:05 • B2 Parking" },
              { Icon: Image, label: "08:47 • Food Court" },
              { Icon: Mic,   label: "Voice Note • 08:55" },
            ].map(({ Icon, label }, idx) => (
              <button
                key={idx}
                onClick={() => toast.success(`${label} opened`)}
                className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-ink to-blue-900 transition-opacity hover:opacity-90 sm:rounded-3xl"
              >
                <Icon className="h-10 w-10 text-white/60 sm:h-16 sm:w-16" />
                <div className="absolute bottom-2 left-2 rounded-xl bg-black/60 px-2 py-0.5 text-[10px] text-white sm:bottom-3 sm:left-3 sm:rounded-2xl sm:px-3 sm:py-1 sm:text-xs">
                  {label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}