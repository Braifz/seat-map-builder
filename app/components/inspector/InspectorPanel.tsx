"use client";

import { useSeatMapStore } from "../../store/seatMapStore";
import type { SeatType } from "../../types";

export function InspectorPanel() {
  const {
    name,
    selectedIds,
    seats,
    rows,
    areas,
    tables,
    updateSeatLabel,
    updateRowLabel,
    updateAreaLabel,
    updateTableLabel,
    updateSeatType,
    updateSelectedLabels,
    clearSelection,
    setMapName,
  } = useSeatMapStore();

  // Get selected elements
  const selectedElements = selectedIds
    .map((id) => {
      if (id.startsWith("seat_")) return { type: "seat", id, data: seats[id] };
      if (id.startsWith("row_")) return { type: "row", id, data: rows[id] };
      if (id.startsWith("area_")) return { type: "area", id, data: areas[id] };
      if (id.startsWith("table_"))
        return { type: "table", id, data: tables[id] };
      return null;
    })
    .filter(Boolean);

  const firstElement = selectedElements[0];
  const isSingleSelection = selectedElements.length === 1;
  const isMultiSelection = selectedElements.length > 1;

  const getLabel = () => {
    if (!firstElement) return "";
    return firstElement.data?.label || "";
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;

    if (isMultiSelection) {
      return; // Don't allow individual label change on multi-selection
    }

    if (!firstElement) return;

    const { type, id } = firstElement;
    if (type === "seat") updateSeatLabel(id, newLabel);
    else if (type === "row") updateRowLabel(id, newLabel);
    else if (type === "area") updateAreaLabel(id, newLabel);
    else if (type === "table") updateTableLabel(id, newLabel);
  };

  const handleSeatTypeChange = (type: SeatType) => {
    if (!firstElement || firstElement.type !== "seat") return;
    updateSeatType(firstElement.id, type);
  };

  const handleBulkLabeling = (pattern: string) => {
    updateSelectedLabels(pattern);
  };

  return (
    <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      {/* Map Name */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Map Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setMapName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Selection Info */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Selection
          </label>
          {selectedIds.length > 0 && (
            <button
              onClick={clearSelection}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Clear
            </button>
          )}
        </div>

        {selectedIds.length === 0 ? (
          <p className="text-sm text-gray-400">No elements selected</p>
        ) : (
          <div>
            <p className="text-sm font-medium text-gray-700">
              {selectedIds.length} item(s) selected
            </p>
            <div className="mt-2 space-y-1">
              {selectedElements.slice(0, 5).map((el) => (
                <p key={el?.id} className="text-xs text-gray-500 truncate">
                  {el?.type}: {el?.data?.label}
                </p>
              ))}
              {selectedElements.length > 5 && (
                <p className="text-xs text-gray-400">
                  ...and {selectedElements.length - 5} more
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Properties */}
      {firstElement && (
        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            {isMultiSelection ? "Bulk Properties" : "Properties"}
          </label>

          {/* Label */}
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">Label</label>
            <input
              type="text"
              value={getLabel()}
              onChange={handleLabelChange}
              disabled={isMultiSelection}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder={
                isMultiSelection ? "Use bulk labeling below" : "Label"
              }
            />
          </div>

          {/* Seat Type (only for single seat selection) */}
          {isSingleSelection &&
            firstElement?.type === "seat" &&
            firstElement?.data &&
            "type" in firstElement.data && (
              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1">Type</label>
                <select
                  value={
                    (firstElement.data as { type: SeatType }).type || "seat"
                  }
                  onChange={(e) =>
                    handleSeatTypeChange(e.target.value as SeatType)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="seat">Standard Seat</option>
                  <option value="vip">VIP Seat</option>
                  <option value="wheelchair">Wheelchair</option>
                  <option value="companion">Companion</option>
                </select>
              </div>
            )}
        </div>
      )}

      {/* Bulk Labeling */}
      {isMultiSelection && (
        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Bulk Labeling
          </label>
          <div className="space-y-2">
            <button
              onClick={() => handleBulkLabeling("{n}")}
              className="w-full px-3 py-2 text-left text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              1, 2, 3...
            </button>
            <button
              onClick={() => handleBulkLabeling("{N}")}
              className="w-full px-3 py-2 text-left text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              01, 02, 03...
            </button>
            <button
              onClick={() => handleBulkLabeling("A{n}")}
              className="w-full px-3 py-2 text-left text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              A1, A2, A3...
            </button>
            <button
              onClick={() => handleBulkLabeling("Platea {n}")}
              className="w-full px-3 py-2 text-left text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Platea 1, Platea 2...
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Shortcuts
        </h4>
        <div className="space-y-1 text-xs text-gray-500">
          <p>
            <kbd className="font-mono bg-gray-100 px-1 rounded">Shift</kbd> +
            Click for multi-select
          </p>
          <p>
            <kbd className="font-mono bg-gray-100 px-1 rounded">Alt</kbd> + Drag
            to pan
          </p>
          <p>
            <kbd className="font-mono bg-gray-100 px-1 rounded">Wheel</kbd> to
            zoom
          </p>
        </div>
      </div>
    </div>
  );
}
