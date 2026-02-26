"use client";

import { useState } from "react";
import { useSeatMapStore } from "../../store/seatMapStore";
import type { ToolType } from "../../types";
import { EditSelectionModal } from "../modals/EditSelectionModal";

export function Toolbar() {
  const {
    activeTool,
    setActiveTool,
    zoomIn,
    zoomOut,
    resetView,
    exportMap,
    importMap,
    resetMap,
    selectedIds,
    deleteSelected,
    rows,
    seats,
    areas,
    tables,
    structures,
    sections,
  } = useSeatMapStore();

  const [showEditModal, setShowEditModal] = useState(false);

  const tools: { id: ToolType; label: string; icon: string }[] = [
    { id: "select", label: "Select", icon: "◉" },
    { id: "addRow", label: "Add Row", icon: "▭" },
    { id: "addMultipleRows", label: "Add Multiple Rows", icon: "▭+" },
    { id: "addArea", label: "Add Area", icon: "▢" },
    { id: "addTable", label: "Add Table", icon: "○" },
    { id: "addStructure", label: "Add Structure", icon: "🏛️" },
    { id: "pan", label: "Pan", icon: "✋" },
  ];

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
    if (
      confirm(
        "Are you sure you want to create a new map? All unsaved changes will be lost.",
      )
    ) {
      resetMap();
    }
  };

  const canEdit = () => {
    if (selectedIds.length === 0) return false;
    if (selectedIds.length === 1) return true;

    // Check if all selected items belong to the same section
    const sectionIds = new Set<string | undefined>();

    for (const id of selectedIds) {
      let sectionId: string | undefined;

      if (id.startsWith("row_")) {
        sectionId = rows[id]?.sectionId;
      } else if (id.startsWith("seat_")) {
        sectionId = seats[id]?.sectionId;
      }
      // Areas, tables, structures don't have sections

      sectionIds.add(sectionId);
    }

    // Can edit if all belong to same section (including undefined)
    return sectionIds.size === 1;
  };

  const handleEdit = () => {
    if (canEdit()) {
      setShowEditModal(true);
    }
  };

  const handleDeleteSelected = () => {
    if (
      confirm(
        `Are you sure you want to delete ${selectedIds.length} selected item(s)?`,
      )
    ) {
      deleteSelected();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-3 flex items-center gap-2 flex-wrap shadow-sm">
      {/* Tools */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTool === tool.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:bg-gray-200"
            }`}
            title={tool.label}
          >
            <span className="text-lg">{tool.icon}</span>
            <span className="hidden sm:inline">{tool.label}</span>
          </button>
        ))}
      </div>

      <div className="w-px h-8 bg-gray-300 mx-2" />

      {/* Zoom controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={zoomOut}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={resetView}
          className="px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          title="Reset View"
        >
          100%
        </button>
        <button
          onClick={zoomIn}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
          title="Zoom In"
        >
          +
        </button>
      </div>

      <div className="w-px h-8 bg-gray-300 mx-2" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleNewMap}
          className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          New Map
        </button>
        <button
          onClick={handleExport}
          className="px-3 py-2 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
        >
          Export
        </button>
        <button
          onClick={handleImport}
          className="px-3 py-2 rounded-md text-sm font-medium text-green-600 hover:bg-green-50 transition-colors"
        >
          Import
        </button>
      </div>

      <div className="flex-1" />

      {/* Edit button (only shown when items can be edited) */}
      {canEdit() && (
        <button
          onClick={handleEdit}
          className="px-3 py-2 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
        >
          Edit ({selectedIds.length})
        </button>
      )}

      {/* Delete button (only shown when items selected) */}
      {selectedIds.length > 0 && (
        <button
          onClick={handleDeleteSelected}
          className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          Delete ({selectedIds.length})
        </button>
      )}

      {/* Edit Modal */}
      <EditSelectionModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        selectedIds={selectedIds}
        rows={rows}
        seats={seats}
        areas={areas}
        tables={tables}
        structures={structures}
        sections={sections}
      />
    </div>
  );
}
