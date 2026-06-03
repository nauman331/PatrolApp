import { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Clock, Upload, FileDown, Eye, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { exportShiftsToExcel } from "@/utils/Exporttoexcel";


interface List {
  id: number;
  title: string;
  start: string;
  shift_date: string;
  end: string;
  site_id: number;
  site_name: string;
  guard_name: string;
  guard_phone: string;
  // Optional sign-in/out detail fields
  signin_date?: string;
  signout_date?: string;
  signin_time?: string;
  signout_time?: string;
  signin_notes?: string;
  signout_notes?: string;
  signin_picture?: string;
  signout_picture?: string;
  signin_location?: { lat: number; lng: number };
  signout_location?: { lat: number; lng: number };
}

interface Props {
  rosters: List[];
  loading: boolean;
}

// ── SignIn/Out Detail Modal ────────────────────────────────────────────────────
export function ShiftDetailModal({
  roster,
  onClose,
}: {
  roster: List | null;
  onClose: () => void;
}) {
  if (!roster) return null;

  const na = (v?: string) => v || "N/A";

  const tabs = [
    { label: "Sign In/Out Details", color: "bg-teal-100 text-teal-700 border-teal-400" },
    { label: "Break Details", color: "bg-yellow-100 text-yellow-700" },
    { label: "Green Call", color: "bg-green-100 text-green-700" },
    { label: "Welfare Call", color: "bg-blue-100 text-blue-700" },
    { label: "Tracker", color: "bg-gray-100 text-gray-600" },
    { label: "Incident Report", color: "bg-red-100 text-red-600" },
    { label: "Operation Notes", color: "bg-amber-100 text-amber-700" },
    { label: "Shift Activity", color: "bg-green-100 text-green-700" },
    { label: "Shift Task", color: "bg-cyan-100 text-cyan-700" },
    { label: "Foot Patrol Report", color: "bg-red-100 text-red-600" },
    { label: "Patrolling Report", color: "bg-amber-100 text-amber-700" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" style={{zIndex: 9999}}>
      <div className="modal-pop relative flex w-[90vw] max-w-4xl max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* ── Left Sidebar ── */}
        <aside className="w-56 shrink-0 border-r border-gray-100 overflow-y-auto">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Job Activity</h2>
          </div>
          <nav className="py-2">
            {tabs.map((tab, i) => (
              <button
                key={tab.label}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors ${
                  i === 0
                    ? `${tab.color} border-l-4`
                    : `${tab.color} hover:opacity-80`
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/50 flex items-center justify-center text-xs shrink-0">
                  {i === 0 ? "≡" : i === 1 ? "☕" : i === 2 ? "📞" : i === 3 ? "📱" : i === 4 ? "📍" : i === 5 ? "⚠" : i === 6 ? "📋" : i === 7 ? "📊" : i === 8 ? "✅" : i === 9 ? "🦶" : "🗺"}
                </span>
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">SignIn/Out Details</h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* Date / Time / Notes grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {/* SignIn Date */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">SignIn Date</p>
                <p className="text-sm text-gray-500">{na(roster.signin_date)}</p>
              </div>
              {/* SignOut Date */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">SignOut Date</p>
                <p className="text-sm text-gray-500">{na(roster.signout_date)}</p>
              </div>

              {/* SignIn Time */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">SignIn Time</p>
                <p className="text-sm text-gray-500">{na(roster.signin_time)}</p>
              </div>
              {/* SignOut Time */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">SignOut Time</p>
                <p className="text-sm text-gray-500">{na(roster.signout_time)}</p>
              </div>

              {/* SignIn Notes */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">SignIn Notes</p>
                <p className="text-sm text-gray-500">{na(roster.signin_notes)}</p>
              </div>
              {/* SignOut Notes */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">SignOut Notes</p>
                <p className="text-sm text-gray-500">{na(roster.signout_notes)}</p>
              </div>
            </div>

            {/* Pictures */}
            <div className="grid grid-cols-2 gap-x-8 mt-6">
              {/* Sign In Picture */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Sign In Picture</p>
                <div className="w-full h-44 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                  {roster.signin_picture ? (
                    <img
                      src={roster.signin_picture}
                      alt="Sign In"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                      <span className="text-2xl">🖼</span>
                      <p className="text-sm font-semibold">Broken Image ☹</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sign Out Picture */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Sign Out Picture</p>
                <div className="w-full h-44 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                  {roster.signout_picture ? (
                    <img
                      src={roster.signout_picture}
                      alt="Sign Out"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                      <span className="text-2xl">🖼</span>
                      <p className="text-sm font-semibold">Broken Image ☹</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Locations */}
            <div className="grid grid-cols-2 gap-x-8 mt-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">SignIN Location</p>
                <button className="flex items-center gap-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 transition-colors">
                  <MapPin className="h-4 w-4" />
                  Show Map
                </button>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">SignOut Location</p>
                <button className="flex items-center gap-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 transition-colors">
                  <MapPin className="h-4 w-4" />
                  Show Map
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


