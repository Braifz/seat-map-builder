"use client";

import { useState, useCallback } from "react";
import { useSeatMapStore } from "../../store/seatMapStore";
import type { SectionId, RowConfig } from "../../types";

interface CreateMultipleRowsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (rowConfigs: RowConfig[], spacing: number) => void;
  defaultPosition?: { x: number; y: number };
}

interface RowDefinition {
  id: string;
  label: string;
  seatCount: number;
  sectionId?: SectionId;
}

const generateRowLabel = (index: number, prefix: string = "Row"): string => {
  if (prefix.length === 1 && prefix.match(/[a-z]/i)) {
    // Letter-based: A, B, C...
    return String.fromCharCode(65 + index);
  }
  return `${prefix} ${index + 1}`;
};

export function CreateMultipleRowsModal({
  isOpen,
  onClose,
  onCreate,
  defaultPosition,
}: CreateMultipleRowsModalProps) {
  const { sections, addSection } = useSeatMapStore();
  const [rows, setRows] = useState<RowDefinition[]>([
    { id: "1", label: "A", seatCount: 6 },
  ]);
  const [spacing, setSpacing] = useState(50);
  const [labelPrefix, setLabelPrefix] = useState("A");
  const [sectionMode, setSectionMode] = useState<"new" | "existing">("new");
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionColor, setNewSectionColor] = useState("#f97316");
  const [newSectionPrice, setNewSectionPrice] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState<SectionId>("");

  const addRow = useCallback(() => {
    const newRow: RowDefinition = {
      id: Date.now().toString(),
      label: generateRowLabel(rows.length, labelPrefix),
      seatCount: 6,
    };
    setRows([...rows, newRow]);
  }, [rows, labelPrefix]);

  const removeRow = useCallback(
    (id: string) => {
      if (rows.length > 1) {
        setRows(rows.filter((row) => row.id !== id));
      }
    },
    [rows],
  );

  const updateRow = useCallback(
    (id: string, updates: Partial<RowDefinition>) => {
      setRows(
        rows.map((row) => (row.id === id ? { ...row, ...updates } : row)),
      );
    },
    [rows],
  );

  const handleLabelPrefixChange = useCallback(
    (prefix: string) => {
      setLabelPrefix(prefix);
      // Regenerate all row labels
      setRows(
        rows.map((row, index) => ({
          ...row,
          label: generateRowLabel(index, prefix),
        })),
      );
    },
    [rows],
  );

  const handleClose = useCallback(() => {
    setRows([{ id: "1", label: "A", seatCount: 6 }]);
    setSpacing(50);
    setLabelPrefix("A");
    setSectionMode("new");
    setNewSectionName("");
    setNewSectionColor("#f97316");
    setNewSectionPrice("");
    setSelectedSectionId("");
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const existingSections = Object.values(sections);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create or get section
    let sectionId: SectionId | undefined;
    if (sectionMode === "new" && newSectionName.trim()) {
      const price = newSectionPrice ? parseFloat(newSectionPrice) : undefined;
      const sectionNumber = Object.keys(sections).length + 1;
      sectionId = addSection(
        newSectionName.trim(),
        newSectionColor,
        sectionNumber,
        price,
      );
    } else if (sectionMode === "existing" && selectedSectionId) {
      sectionId = selectedSectionId;
    }

    // Build row configs
    const rowConfigs: RowConfig[] = rows.map((row) => ({
      label: row.label,
      seatCount: row.seatCount,
      sectionId,
    }));

    onCreate(rowConfigs, spacing);
    handleClose();
  };

  const totalSeats = rows.reduce((sum, row) => sum + row.seatCount, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[600px] p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Create Multiple Rows</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label Prefix */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Row Label Prefix
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={labelPrefix}
                onChange={(e) => handleLabelPrefixChange(e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="A"
              />
              <p className="text-sm text-gray-500 flex items-center">
                Use single letter (A, B, C...) or prefix (Row 1, Row 2...)
              </p>
            </div>
          </div>

          {/* Spacing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spacing Between Rows (px)
            </label>
            <input
              type="number"
              value={spacing}
              onChange={(e) =>
                setSpacing(Math.max(20, parseInt(e.target.value) || 50))
              }
              min={20}
              max={200}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Section Selection */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section (optional)
            </label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setSectionMode("new")}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                  sectionMode === "new"
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                }`}
              >
                New Section
              </button>
              <button
                type="button"
                onClick={() => setSectionMode("existing")}
                disabled={existingSections.length === 0}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                  sectionMode === "existing"
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                } ${existingSections.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Existing Section
              </button>
            </div>

            {sectionMode === "new" ? (
              <div className="space-y-3 bg-gray-50 p-3 rounded-md">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Section Name
                  </label>
                  <input
                    type="text"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Bronze, Silver, Gold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newSectionColor}
                        onChange={(e) => setNewSectionColor(e.target.value)}
                        className="w-10 h-9 rounded cursor-pointer border border-gray-300"
                      />
                      <input
                        type="text"
                        value={newSectionColor}
                        onChange={(e) => setNewSectionColor(e.target.value)}
                        className="flex-1 px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="#f97316"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Price (€)
                    </label>
                    <input
                      type="number"
                      value={newSectionPrice}
                      onChange={(e) => setNewSectionPrice(e.target.value)}
                      min={0}
                      step={0.01}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="25.00"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded-md">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Select Section
                </label>
                <select
                  value={selectedSectionId}
                  onChange={(e) =>
                    setSelectedSectionId(e.target.value as SectionId)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select a section --</option>
                  {existingSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.label}{" "}
                      {section.price ? `- €${section.price}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Rows Table */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Rows ({rows.length}) - Total Seats: {totalSeats}
              </label>
              <button
                type="button"
                onClick={addRow}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                + Add Row
              </button>
            </div>

            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                      Row Label
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                      Seats
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700 w-16">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={row.label}
                          onChange={(e) =>
                            updateRow(row.id, { label: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={row.seatCount}
                          onChange={(e) =>
                            updateRow(row.id, {
                              seatCount: Math.max(
                                1,
                                parseInt(e.target.value) || 1,
                              ),
                            })
                          }
                          min={1}
                          max={100}
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length <= 1}
                          className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={
                            rows.length <= 1
                              ? "Cannot remove last row"
                              : "Remove row"
                          }
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Position Info */}
          {defaultPosition && (
            <div className="text-sm text-gray-500">
              Will be placed at: ({Math.round(defaultPosition.x)},{" "}
              {Math.round(defaultPosition.y)})
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rows.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create {rows.length} Row{rows.length > 1 ? "s" : ""}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
