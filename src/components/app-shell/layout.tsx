import type { ReactNode } from "react";
import { AppProvider } from "./app-context";
import { AppHeader } from "./header";
import { AppSidebar } from "./sidebar";
import { useState } from "react";
import {
  LiveMapModal,
  NotificationPanel,
  ShiftModal,
  SiteModal,
  UserModal,
} from "./modals";


export function AppLayout({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // Sidebar width: 280px expanded, 80px collapsed
  const sidebarWidth = isSidebarCollapsed ? 80 : 280;
  return (
    <AppProvider>
      <div className="min-h-screen bg-surface text-ink">
        <AppHeader />
        <AppSidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
        <main
          className="flex-1 overflow-auto p-8"
          style={{ marginLeft: sidebarWidth }}
        >
          {children}
        </main>
        <LiveMapModal />
        <ShiftModal />
        <UserModal />
        <SiteModal />
    
        <NotificationPanel />
      </div>
    </AppProvider>
  );
}
