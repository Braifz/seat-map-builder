"use client";

import { useState, useMemo } from "react";
import { useSeatMapStore } from "../../store/seatMapStore";
import type {
  Row,
  Seat,
  Area,
  Table,
  Structure,
  Section,
  SeatType,
} from "../../types";

interface EditSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  rows: Record<string, Row>;
  seats: Record<string, Seat>;
  areas: Record<string, Area>;
  tables: Record<string, Table>;
  structures: Record<string, Structure>;
  sections: Record<string, Section>;
}

export function EditSelectionModal({
  isOpen,
  onClose,
  selectedIds,
  rows,
  seats,
  areas,
  tables,
  structures,
  sections,
}: EditSelectionModalProps) {
  const {
    updateRowLabel,
    updateSeatLabel,
    updateSeatType,
    updateAreaLabel,
    updateTableLabel,
    updateStructureLabel,
    updateSelectedLabels,
    addSection,
  } = useSeatMapStore();

  // Compute element info first
  const elementInfo = useMemo(() => {
    if (selectedIds.length === 1) {
      const id = selectedIds[0];
      if (id.startsWith("row_") && rows[id]) {
        return {
          type: "row",
          label: rows[id].label,
          seatType: "seat" as SeatType,
          sectionId: rows[id].sectionId,
        };
      } else if (id.startsWith("seat_") && seats[id]) {
        return {
          type: "seat",
          label: seats[id].label,
          seatType: seats[id].type,
          sectionId: seats[id].sectionId,
        };
      } else if (id.startsWith("area_") && areas[id]) {
        return {
          type: "area",
          label: areas[id].label,
          seatType: "seat" as SeatType,
        };
      } else if (id.startsWith("table_") && tables[id]) {
        return {
          type: "table",
          label: tables[id].label,
          seatType: "seat" as SeatType,
        };
      } else if (id.startsWith("structure_") && structures[id]) {
        return {
          type: "structure",
          label: structures[id].label,
          seatType: "seat" as SeatType,
        };
      }
    }
    return { type: "multiple", label: "", seatType: "seat" as SeatType };
  }, [selectedIds, rows, seats, areas, tables, structures]);

  const [label, setLabel] = useState(elementInfo.label);
  const [pattern, setPattern] = useState("{n}");
  const [seatType, setSeatType] = useState<SeatType>(elementInfo.seatType);
  const [sectionId, setSectionId] = useState<string>("");
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionColor, setNewSectionColor] = useState("#3b82f6");
  const [newSectionNumber, setNewSectionNumber] = useState("");
  const [newSectionPrice, setNewSectionPrice] = useState("");

  const elementType = elementInfo.type;

  if (!isOpen) return null;

  const handleSave = () => {
    if (selectedIds.length === 1) {
      const id = selectedIds[0];
      if (elementType === "row") {
        updateRowLabel(id, label);
      } else if (elementType === "seat") {
        updateSeatLabel(id, label);
        updateSeatType(id, seatType);
      } else if (elementType === "area") {
        updateAreaLabel(id, label);
      } else if (elementType === "table") {
        updateTableLabel(id, label);
      } else if (elementType === "structure") {
        updateStructureLabel(id, label);
      }
    } else if (selectedIds.length > 1 && pattern) {
      updateSelectedLabels(pattern);
    }

    // Handle section assignment
    if (sectionId === "new" && newSectionName) {
      addSection(
        newSectionName,
        newSectionColor,
        parseInt(newSectionNumber) || 1,
        newSectionPrice ? parseFloat(newSectionPrice) : undefined,
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-black mb-4">
          Edit{" "}
          {selectedIds.length === 1
            ? elementType
            : `${selectedIds.length} items`}
        </h2>

        <div className="space-y-4">
          {selectedIds.length === 1 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              {elementType === "seat" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seat Type
                  </label>
                  <select
                    value={seatType}
                    onChange={(e) => setSeatType(e.target.value as SeatType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    <option value="seat">Standard Seat</option>
                    <option value="vip">VIP</option>
                    <option value="wheelchair">Wheelchair</option>
                    <option value="companion">Companion</option>
                  </select>
                </div>
              )}
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label Pattern (use {"{n}"} or {"{N}"} for numbering)
              </label>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="e.g., A-{'{n}'}, Row {'{N}'}"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
              <p className="text-xs text-gray-500 mt-1">
                {"{n}"} = 1, 2, 3... | {"{N}"} = 01, 02, 03...
              </p>
            </div>
          )}

          {/* Section Assignment (only for rows and seats) */}
          {(elementType === "row" ||
            elementType === "seat" ||
            elementType === "multiple") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="">No Section</option>
                {Object.values(sections).map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.label} (#{section.sectionNumber})
                  </option>
                ))}
                <option value="new">+ Create New Section</option>
              </select>

              {sectionId === "new" && (
                <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-md">
                  <input
                    type="text"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    placeholder="Section Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={newSectionColor}
                      onChange={(e) => setNewSectionColor(e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="number"
                      value={newSectionNumber}
                      onChange={(e) => setNewSectionNumber(e.target.value)}
                      placeholder="Section #"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={newSectionPrice}
                      onChange={(e) => setNewSectionPrice(e.target.value)}
                      placeholder="Price $"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
