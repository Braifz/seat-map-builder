"use client";

import {
  MousePointer2,
  RectangleHorizontal,
  Rows3,
  Square,
  Minus,
  Circle,
  Building2,
  Hand,
} from "lucide-react";
import { useSeatMapStore } from "../../store/seatMapStore";
import type { ToolType } from "../../types";
import { Tooltip } from "./Tooltip";
import { useThemeColors } from "../../hooks/useThemeColors";

const tools: { id: ToolType; label: string; icon: React.ReactNode }[] = [
  { id: "select", label: "Select (V)", icon: <MousePointer2 size={20} /> },
  { id: "addRow", label: "Add Row", icon: <RectangleHorizontal size={20} /> },
  {
    id: "addMultipleRows",
    label: "Add Multiple Rows",
    icon: <Rows3 size={20} />,
  },
  { id: "addArea", label: "Add Area", icon: <Square size={20} /> },
  { id: "addLine", label: "Add Line", icon: <Minus size={20} /> },
  { id: "addTable", label: "Add Table", icon: <Circle size={20} /> },
  { id: "addStructure", label: "Add Structure", icon: <Building2 size={20} /> },
  { id: "pan", label: "Pan (Space)", icon: <Hand size={20} /> },
];

export function FloatingToolbar() {
  const { activeTool, setActiveTool, appMode } = useSeatMapStore();
  const { colors } = useThemeColors();
  const visibleTools =
    appMode === "purchase"
      ? tools.filter((tool) => tool.id === "select" || tool.id === "pan")
      : tools;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div
        className={`flex items-center gap-1 ${colors.bgPrimary} rounded-2xl px-2 py-2 shadow-lg border ${colors.border}`}
      >
        {visibleTools.map((tool) => (
          <Tooltip key={tool.id} content={tool.label} position="bottom">
            <button
              onClick={() => setActiveTool(tool.id)}
              className={`p-2.5 rounded-xl transition-all duration-150 ${
                activeTool === tool.id
                  ? `${colors.bgActive} ${colors.textPrimary}`
                  : `${colors.textSecondary} ${colors.bgHover} hover:${colors.textPrimary}`
              }`}
            >
              {tool.icon}
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
