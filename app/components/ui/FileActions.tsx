"use client";

import { useState } from "react";
import { FilePlus, Download, Upload } from "lucide-react";
import { useSeatMapStore } from "../../store/seatMapStore";
import { Tooltip } from "./Tooltip";
import { useThemeColors } from "../../hooks/useThemeColors";
import { NewMapModal } from "../modals/NewMapModal";
import {
  MAP_TEMPLATES,
  getTemplatePayloadById,
  type MapTemplateId,
} from "../../lib/map-templates";

export function FileActions() {
  const { exportMap, importMap, resetMap } = useSeatMapStore();
  const { colors } = useThemeColors();
  const [showNewMapModal, setShowNewMapModal] = useState(false);

  const handleExport = () => {
    const data = exportMap();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seatmap_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
            try {
              importMap(content);
            } catch {
              alert("Invalid file format");
            }
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleNewMap = () => {
    setShowNewMapModal(true);
  };

  const handleCreateEmptyMap = () => {
    resetMap();
    setShowNewMapModal(false);
  };

  const handleCreateFromTemplate = (templateId: MapTemplateId) => {
    try {
      importMap(getTemplatePayloadById(templateId));
      setShowNewMapModal(false);
    } catch {
      alert("Could not load selected template.");
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`flex items-center gap-1 ${colors.bgPrimary} rounded-2xl px-2 py-2 shadow-lg border ${colors.border}`}
      >
        <Tooltip content="New Map" position="bottom">
          <button
            onClick={handleNewMap}
            className={`p-2.5 rounded-xl ${colors.textSecondary} ${colors.bgHover} ${colors.textPrimary} transition-all duration-150`}
          >
            <FilePlus size={20} />
          </button>
        </Tooltip>

        <Tooltip content="Export" position="bottom">
          <button
            onClick={handleExport}
            className={`p-2.5 rounded-xl ${colors.textSecondary} ${colors.bgHover} ${colors.textPrimary} transition-all duration-150`}
          >
            <Download size={20} />
          </button>
        </Tooltip>

        <Tooltip content="Import" position="bottom">
          <button
            onClick={handleImport}
            className={`p-2.5 rounded-xl ${colors.textSecondary} ${colors.bgHover} ${colors.textPrimary} transition-all duration-150`}
          >
            <Upload size={20} />
          </button>
        </Tooltip>
      </div>

      <NewMapModal
        isOpen={showNewMapModal}
        templates={MAP_TEMPLATES}
        onClose={() => setShowNewMapModal(false)}
        onCreateEmpty={handleCreateEmptyMap}
        onSelectTemplate={handleCreateFromTemplate}
      />
    </div>
  );
}
