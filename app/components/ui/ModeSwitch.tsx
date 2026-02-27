"use client";

import { Pencil, ShoppingCart } from "lucide-react";
import { useSeatMapStore } from "../../store/seatMapStore";
import { useThemeColors } from "../../hooks/useThemeColors";

export function ModeSwitch() {
  const { appMode, setAppMode } = useSeatMapStore();
  const { colors } = useThemeColors();

  return (
    <div className="fixed top-20 right-4 z-50">
      <div
        className={`flex items-center gap-1 ${colors.bgPrimary} rounded-2xl p-1.5 shadow-lg border ${colors.border}`}
      >
        <button
          onClick={() => setAppMode("editor")}
          className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            appMode === "editor"
              ? `${colors.selectedBg} ${colors.selectedText}`
              : `${colors.textSecondary} ${colors.bgHover}`
          }`}
        >
          <Pencil size={16} />
          Editor
        </button>
        <button
          onClick={() => setAppMode("purchase")}
          className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            appMode === "purchase"
              ? `${colors.selectedBg} ${colors.selectedText}`
              : `${colors.textSecondary} ${colors.bgHover}`
          }`}
        >
          <ShoppingCart size={16} />
          Compra
        </button>
      </div>
    </div>
  );
}
