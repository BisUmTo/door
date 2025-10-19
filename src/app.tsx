import { Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useGameStore } from "@/state/store";
import MenuRoute from "./routes/menu";
import SettingsRoute from "./routes/settings";
import SavesRoute from "./routes/saves";
import LobbyRoute from "./routes/lobby";
import DoorRoute from "./routes/door";
import HouseRoute from "./routes/house";
import ChestRoute from "./routes/chest";
import CreditsRoute from "./routes/credits";
import InventoryRoute from "./routes/inventory";
import MedalsRoute from "./routes/medals";
import DoorTypesRoute from "./routes/doorTypes";

const App = () => {
  const { status, bootstrap, onlineStatus, setOnlineStatus } = useGameStore((state) => ({
    status: state.status,
    bootstrap: state.bootstrap,
    onlineStatus: state.onlineStatus,
    setOnlineStatus: state.setOnlineStatus
  }));

  useEffect(() => {
    if (status === "idle") {
      void bootstrap();
    }
  }, [status, bootstrap]);

  useEffect(() => {
    let cancelled = false;

    const checkOnline = async () => {
      if (typeof window !== "undefined" && (window as any).__FORCE_ONLINE__ === true) {
        setOnlineStatus("online");
        return;
      }

      try {
        setOnlineStatus("checking");
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 2000);
        const response = await fetch("/assets/file_structure.json", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal
        });
        window.clearTimeout(timeout);
        if (!cancelled) {
          setOnlineStatus(response.ok ? "online" : "offline");
        }
      } catch {
        if (!cancelled) {
          setOnlineStatus("offline");
        }
      }
    };

    void checkOnline();

    const handleOnline = () => {
      void checkOnline();
    };
    const handleOffline = () => {
      setOnlineStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      cancelled = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnlineStatus]);

  return (
    <>
      {onlineStatus === "offline" ? (
        <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full bg-red-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg">
          Connessione richiesta
        </div>
      ) : null}
      <Suspense fallback={<div className="p-6 text-xl text-white">Loading...</div>}>
        <Routes>
          <Route path="/" element={<MenuRoute key="menu" />} />
          <Route path="/settings" element={<SettingsRoute key="settings" />} />
          <Route path="/saves" element={<SavesRoute key="saves" />} />
          <Route path="/lobby" element={<LobbyRoute key="lobby" />} />
          <Route path="/door" element={<DoorRoute key="door" />} />
          <Route path="/house" element={<HouseRoute key="house" />} />
          <Route path="/chest" element={<ChestRoute key="chest" />} />
          <Route path="/credits" element={<CreditsRoute key="credits" />} />
          <Route path="/inventory" element={<InventoryRoute key="inventory" />} />
          <Route path="/medals" element={<MedalsRoute key="medals" />} />
          <Route path="/door-types" element={<DoorTypesRoute key="door-types" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
