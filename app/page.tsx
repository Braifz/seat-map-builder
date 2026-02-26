"use client";

import { SeatMapCanvas } from "./components/canvas/SeatMapCanvas";
import { FloatingToolbar } from "./components/ui/FloatingToolbar";
import { ZoomControls } from "./components/ui/ZoomControls";
import { FileActions } from "./components/ui/FileActions";
import { HelpButton } from "./components/ui/HelpButton";
import { ThemeToggle } from "./components/ui/ThemeToggle";
import { useThemeColors } from "./hooks/useThemeColors";

export default function Home() {
  const { colors } = useThemeColors();

  return (
    <main
      className={`h-screen w-screen overflow-hidden ${colors.bgPage} relative`}
    >
      {/* Canvas - Full screen */}
      <SeatMapCanvas />

      {/* Floating UI Controls */}
      <FloatingToolbar />
      <ZoomControls />
      <FileActions />
      <HelpButton />
      <ThemeToggle />
    </main>
  );
}
