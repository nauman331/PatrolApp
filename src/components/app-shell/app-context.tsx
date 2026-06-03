import { createContext, useContext, useState, type ReactNode } from "react";

type AppContextValue = {
  liveMapOpen: boolean;
  openLiveMap: () => void;
  closeLiveMap: () => void;
  shiftModalOpen: boolean;
  openShiftModal: () => void;
  closeShiftModal: () => void;
  userModalOpen: boolean;
  openUserModal: () => void;
  closeUserModal: () => void;
  siteModalOpen: boolean;
  openSiteModal: () => void;
  closeSiteModal: () => void;
  notificationsOpen: boolean;
  toggleNotifications: () => void;
  closeNotifications: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [liveMapOpen, setLiveMapOpen] = useState(false);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [siteModalOpen, setSiteModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <AppContext.Provider
      value={{
        liveMapOpen,
        openLiveMap: () => setLiveMapOpen(true),
        closeLiveMap: () => setLiveMapOpen(false),
        shiftModalOpen,
        openShiftModal: () => setShiftModalOpen(true),
        closeShiftModal: () => setShiftModalOpen(false),
        userModalOpen,
        openUserModal: () => setUserModalOpen(true),
        closeUserModal: () => setUserModalOpen(false),
        siteModalOpen,
        openSiteModal: () => setSiteModalOpen(true),
        closeSiteModal: () => setSiteModalOpen(false),
        notificationsOpen,
        toggleNotifications: () => setNotificationsOpen((v) => !v),
        closeNotifications: () => setNotificationsOpen(false),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppShell() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppShell must be used within AppProvider");
  return ctx;
}
