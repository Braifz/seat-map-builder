"use client";

import { ZoomOut, ZoomIn, Maximize } from "lucide-react";
import { useSeatMapStore } from "../../store/seatMapStore";
import { Tooltip } from "./Tooltip";
import { useThemeColors } from "../../hooks/useThemeColors";

export function ZoomControls() {
  const { zoom, zoomIn, zoomOut, resetView } = useSeatMapStore();
  const { colors } = useThemeColors();

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div
        className={`flex items-center gap-1 ${colors.bgPrimary} rounded-2xl px-2 py-2 shadow-lg border ${colors.border}`}
      >
        <Tooltip content="Zoom Out">
          <button
            onClick={zoomOut}
            className={`p-2.5 rounded-xl ${colors.textSecondary} ${colors.bgHover} ${colors.textPrimary} transition-all duration-150`}
          >
            <ZoomOut size={20} />
          </button>
        </Tooltip>

        <span
          className={`px-2 text-sm ${colors.textPrimary} min-w-12 text-center`}
        >
          {Math.round(zoom * 100)}%
        </span>

        <Tooltip content="Zoom In">
          <button
            onClick={zoomIn}
            className={`p-2.5 rounded-xl ${colors.textSecondary} ${colors.bgHover} ${colors.textPrimary} transition-all duration-150`}
          >
            <ZoomIn size={20} />
          </button>
        </Tooltip>

        <div className={`w-px h-6 ${colors.border} mx-1`} />

        <Tooltip content="Reset View">
          <button
            onClick={resetView}
            className={`p-2.5 rounded-xl ${colors.textSecondary} ${colors.bgHover} ${colors.textPrimary} transition-all duration-150`}
          >
            <Maximize size={20} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
