import { useState, useEffect, useRef } from "react";
import { useAppShell } from "./app-context";
//import { useNavigate } from "react-router-dom";
import { CalendarRange, BookOpenText, Bell, UserRound, Search, LogOut, User, Settings } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { logout } from "@/store/slice/auth-management/authSlice";
import { toast } from "sonner";
export function AppHeader() {
  const { openLiveMap, toggleNotifications } = useAppShell();
//  const navigate = useNavigate();
  const auth = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [mounted, setMounted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    if (!mounted) return;
    if (!auth.isAuthenticated) {
      window.location.href = "/login";
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setShowDropdown(false);
    toast.success("Logged out successfully");
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-white shadow-sm">
      {/* Internal CSS for the dropdown animation */}
      <style>{`
        .profile-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 220px;
          background: white;
          border: 1px solid #f0f0f0;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
          padding: 8px;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.2s ease-out;
          z-index: 100;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 10px;
          color: #444;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }
        .dropdown-item:hover {
          background: #fff5ed;
          color: #ff6b00;
        }
        .dropdown-divider {
          height: 1px;
          background: #f0f0f0;
          margin: 4px 8px;
        }
      `}</style>

      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-6 px-8 py-5">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-linear-to-br from-brand to-brand-glow shadow-xl">
             <svg width="28" height="28" viewBox="0 0 42 42" fill="none">
              <path d="M21 3L5 10v11c0 9.4 6.8 18.2 16 20 9.2-1.8 16-10.6 16-20V10L21 3z" fill="#fff" fillOpacity="0.95" />
              <path d="M15 21l4 4 8-8" stroke="var(--brand)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-ink">Shwanix</h1>
            <p className="-mt-1 text-[10px] font-semibold tracking-[2px] text-brand">GUARD • MANAGER PRO</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mx-8 hidden max-w-2xl flex-1 lg:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Search patrols, guards, incidents, sites..."
              className="w-full rounded-3xl border border-hairline bg-white py-4 px-6 pl-14 text-base shadow-sm placeholder:text-ink-muted focus:border-brand focus:outline-none"
            />
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-brand"><Search className="h-5 w-5" /></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button onClick={openLiveMap} className="hidden items-center rounded-3xl border border-hairline bg-white px-6 py-3 text-sm font-medium text-ink hover:border-brand md:flex">
            <BookOpenText className="h-5 w-5" />
            <span className="ml-2">Live Site Map</span>
          </button>
          
          <button className="relative flex h-11 w-11 items-center justify-center rounded-3xl border border-hairline bg-white text-2xl hover:border-brand">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-2xl bg-brand text-[10px] font-bold text-brand-foreground shadow">5</span>
          </button>

          {/* Profile Section with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={handleProfileClick}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <div className="font-heading text-base font-semibold text-ink">
                  {mounted && auth.isAuthenticated ? auth.username : "Guest User"}
                </div>
                <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-brand">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
                  {mounted && auth.isAuthenticated ? auth.role?.toUpperCase() : "CLICK TO LOGIN"}
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-linear-to-br from-brand to-brand-glow shadow-inner">
                <UserRound className="h-5 w-5 text-white" />
              </div>
            </div>

            {/* The Dropdown Menu */}
            {mounted && auth.isAuthenticated && showDropdown && (
              <div className="profile-dropdown">
                <div className="px-4 py-2 mb-2">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Account</p>
                </div>
                <button className="dropdown-item">
                  <User size={16} /> Profile Settings
                </button>
                <button className="dropdown-item">
                  <Settings size={16} /> System Preferences
                </button>
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="dropdown-item" style={{ color: '#ff4d4d' }}>
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
