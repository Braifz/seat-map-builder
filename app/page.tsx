"use client";

import { useEffect, useState } from "react";
import { SeatMapCanvas } from "./components/canvas/SeatMapCanvas";
import { FloatingToolbar } from "./components/ui/FloatingToolbar";
import { ZoomControls } from "./components/ui/ZoomControls";
import { FileActions } from "./components/ui/FileActions";
import { HelpButton } from "./components/ui/HelpButton";
import { ThemeToggle } from "./components/ui/ThemeToggle";
import { ModeSwitch } from "./components/ui/ModeSwitch";
import { PurchasePanel } from "./components/ui/PurchasePanel";
import { WelcomeModal } from "./components/modals/WelcomeModal";
import { useThemeColors } from "./hooks/useThemeColors";
import { useSeatMapStore } from "./store/seatMapStore";
import { getDefaultTemplatePayload } from "./lib/map-templates";

const ONBOARDING_SEEN_KEY = "seatmap-onboarding-seen";
const APP_INITIALIZED_KEY = "seatmap-initialized";
const STORAGE_KEY = "seatmap-storage";

const hasPersistedSeatMapData = (): boolean => {
  try {
    const rawStorage = localStorage.getItem(STORAGE_KEY);
    if (!rawStorage) return false;

    const parsed = JSON.parse(rawStorage) as {
      state?: {
        rows?: Record<string, unknown>;
        seats?: Record<string, unknown>;
        areas?: Record<string, unknown>;
        tables?: Record<string, unknown>;
        structures?: Record<string, unknown>;
      };
    };

    const state = parsed.state;
    if (!state) return false;

    return (
      Object.keys(state.rows ?? {}).length > 0 ||
      Object.keys(state.seats ?? {}).length > 0 ||
      Object.keys(state.areas ?? {}).length > 0 ||
      Object.keys(state.tables ?? {}).length > 0 ||
      Object.keys(state.structures ?? {}).length > 0
    );
  } catch {
    return false;
  }
};

export default function Home() {
  const { colors } = useThemeColors();
  const { importMap } = useSeatMapStore();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    let showModalTimer: number | undefined;

    if (localStorage.getItem(ONBOARDING_SEEN_KEY) !== "true") {
      showModalTimer = window.setTimeout(() => {
        setShowWelcomeModal(true);
      }, 0);
    }

    const isInitialized = localStorage.getItem(APP_INITIALIZED_KEY) === "true";

    if (!isInitialized) {
      if (hasPersistedSeatMapData()) {
        localStorage.setItem(APP_INITIALIZED_KEY, "true");
      } else {
        try {
          importMap(getDefaultTemplatePayload());
        } catch {
          console.error("Could not preload default map template.");
        }

        localStorage.setItem(APP_INITIALIZED_KEY, "true");
      }
    }

    return () => {
      if (showModalTimer !== undefined) {
        window.clearTimeout(showModalTimer);
      }
    };
  }, [importMap]);

  const handleCloseWelcomeModal = (): void => {
    localStorage.setItem(ONBOARDING_SEEN_KEY, "true");
    setShowWelcomeModal(false);
  };

  return (
    <main
      className={`h-screen w-screen overflow-hidden ${colors.bgPage} relative`}
    >
      {/* Canvas - Full screen */}
      <SeatMapCanvas />

      {/* Floating UI Controls */}
      <FloatingToolbar />
      <ModeSwitch />
      <ZoomControls />
      <FileActions />
      <HelpButton />
      <ThemeToggle />
      <PurchasePanel />

      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleCloseWelcomeModal}
      />
    </main>
  );
}
