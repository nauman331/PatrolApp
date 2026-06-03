import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/slice/auth-management/authSlice";
import { RootState, AppDispatch } from "@/store";
import {
  BarChart3,
  Calendar,
  Footprints,
  AlertTriangle,
  Users,
  MapPin,
  Download,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: BarChart3 },
  { to: "/shifts", label: "Shifts & Roster", icon: Calendar },
  { to: "/patrols", label: "Patrol Reports", icon: Footprints, badge: "LIVE" },
  { to: "/incidents", label: "Incidents", icon: AlertTriangle },
  { to: "/users", label: "User Management", icon: Users },
  { to: "/sites", label: "Sites & SOPs", icon: MapPin },
  { to: "/nfc-scans", label: "NFC Scans", icon: MapPin }

] as const;

export function AppSidebar({ isCollapsed, setIsCollapsed }: { isCollapsed: boolean; setIsCollapsed: (v: boolean) => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
  };

  return (
    <>
      <style>{`
        :root {
          --brand-orange: #ff6b00;
          --brand-light: #fff5ed;
          --text-main: #2d2d2d;
          --text-muted: #717171;
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-container {
        margin-top: 97px;
          position: fixed;
          height: calc(100vh - 97px);
          background: white;
          border-right: 1px solid #f0f0f0;
          display: flex;
          flex-direction: column;
          transition: var(--transition);
          z-index: 1000;
          box-shadow: 4px 0 10px rgba(0,0,0,0.02);
        }

        .sidebar-expanded { width: 280px; padding: 24px; }
        .sidebar-collapsed { width: 80px; padding: 24px 12px; }

        .toggle-btn {
          position: absolute;
          right: -12px;
          top: 32px;
          background: var(--brand-orange);
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          z-index: 1001;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 40px;
          color: var(--brand-orange);
          overflow: hidden;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          color: var(--text-muted);
          text-decoration: none;
          transition: var(--transition);
          margin-bottom: 4px;
          white-space: nowrap;
        }

        .nav-link:hover {
          background: var(--brand-light);
          color: var(--brand-orange);
        }

        .nav-active {
          background: var(--brand-orange) !important;
          color: white !important;
          box-shadow: 0 4px 12px rgba(255, 107, 0, 0.2);
        }

        .badge {
          background: #ff4d4d;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 8px;
          font-weight: bold;
        }

        .export-btn {
          background: var(--brand-orange);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          width: 100%;
          font-weight: 600;
          transition: var(--transition);
          overflow: hidden;
        }

        .export-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        
        .footer-info {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 16px;
          border-top: 1px solid #f0f0f0;
          padding-top: 16px;
        }
      `}</style>

      <aside className={`sidebar-container ${isCollapsed ? "sidebar-collapsed" : "sidebar-expanded"}`} style={{ left: 0, top: 0 }}>
        <button className="toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* <div className="logo-section">
          <ShieldCheck size={32} strokeWidth={2.5} />
          {!isCollapsed && <span style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.5px" }}>SENTRY PRO</span>}
        </div> */}

        <nav style={{ flex: 1 }}>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === "/" }}
              activeProps={{ className: "nav-active" }}
              className="nav-link"
              title={isCollapsed ? link.label : ""}
            >
              <link.icon size={20} />
              {!isCollapsed && (
                <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
                  <span>{link.label}</span>
                  {"badge" in link && <span className="badge" style={{ marginLeft: "auto" }}>{link.badge}</span>}
                </div>
              )}
            </Link>
          ))}
        </nav>

        <div className="footer">
          <button className="export-btn" onClick={() => toast.success("PDF Exported")}>
            <Download size={18} />
            {!isCollapsed && <span>EXPORT REPORTS</span>}
          </button>

          {!isCollapsed && (
            <div className="footer-info">
              <div style={{ marginBottom: "8px" }}>3 Sites • 24 Guards Online</div>
              {auth.isAuthenticated && (
                <button
                  onClick={handleLogout}
                  style={{ background: "none", border: "none", color: "var(--brand-orange)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}
                >
                  <LogOut size={14} /> Logout
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}