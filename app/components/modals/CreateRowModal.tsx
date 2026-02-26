"use client";

import { useState, useCallback } from "react";
import { useSeatMapStore } from "../../store/seatMapStore";
import { useThemeColors } from "../../hooks/useThemeColors";
import type { SectionId } from "../../types";

interface CreateRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (label: string, seatCount: number, sectionId?: SectionId) => void;
  defaultPosition?: { x: number; y: number };
}

const DEFAULT_FORM_STATE = {
  label: "Row 1",
  seatCount: 8,
  useDefaultPosition: true,
  sectionMode: "new" as "new" | "existing",
  selectedSectionId: "" as SectionId | "",
  newSectionName: "",
  newSectionColor: "#f97316",
  newSectionPrice: "",
};

export function CreateRowModal({
  isOpen,
  onClose,
  onCreate,
  defaultPosition,
}: CreateRowModalProps) {
  const { sections, addSection } = useSeatMapStore();
  const { colors } = useThemeColors();

  const [formState, setFormState] = useState(DEFAULT_FORM_STATE);

  const {
    label,
    seatCount,
    useDefaultPosition,
    sectionMode,
    selectedSectionId,
    newSectionName,
    newSectionColor,
    newSectionPrice,
  } = formState;

  const updateField = useCallback(
    <K extends keyof typeof formState>(
      field: K,
      value: (typeof formState)[K],
    ) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleClose = useCallback(() => {
    setFormState(DEFAULT_FORM_STATE);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const existingSections = Object.values(sections);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    onCreate(label, seatCount, sectionId);
    handleClose();
  };

  const isSubmitDisabled =
    sectionMode === "new" ? !newSectionName.trim() : !selectedSectionId;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className={`${colors.bgPrimary} rounded-lg shadow-xl w-[420px] p-6 max-h-[90vh] overflow-y-auto border ${colors.border}`}
      >
        <h2 className={`text-lg font-semibold mb-4 ${colors.textPrimary}`}>
          Create Row
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
            >
              Row Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => updateField("label", e.target.value)}
              className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
              placeholder="e.g., Platea A"
              autoFocus
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
            >
              Number of Seats
            </label>
            <input
              type="number"
              value={seatCount}
              onChange={(e) =>
                updateField(
                  "seatCount",
                  Math.max(1, parseInt(e.target.value) || 1),
                )
              }
              min={1}
              max={100}
              className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
            />
            <p className={`text-xs ${colors.textMuted} mt-1`}>
              Max 100 seats per row
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="usePosition"
              checked={useDefaultPosition}
              onChange={(e) =>
                updateField("useDefaultPosition", e.target.checked)
              }
              className={`rounded ${colors.border}`}
            />
            <label
              htmlFor="usePosition"
              className={`text-sm ${colors.textSecondary}`}
            >
              {defaultPosition
                ? `Place at clicked position (${Math.round(defaultPosition.x)}, ${Math.round(defaultPosition.y)})`
                : "Place at default position"}
            </label>
          </div>

          {/* Section Selection */}
          <div className={`border-t ${colors.border} pt-4 mt-4`}>
            <label
              className={`block text-sm font-medium ${colors.textSecondary} mb-2`}
            >
              Section
            </label>

            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => updateField("sectionMode", "new")}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors border ${
                  sectionMode === "new"
                    ? `${colors.selectedBg} ${colors.selectedText} ${colors.selectedBorder}`
                    : `${colors.bgSecondary} ${colors.textPrimary} ${colors.border} ${colors.bgHover}`
                }`}
              >
                New Section
              </button>
              <button
                type="button"
                onClick={() => updateField("sectionMode", "existing")}
                disabled={existingSections.length === 0}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors border ${
                  sectionMode === "existing"
                    ? `${colors.selectedBg} ${colors.selectedText} ${colors.selectedBorder}`
                    : `${colors.bgSecondary} ${colors.textPrimary} ${colors.border} ${colors.bgHover}`
                } ${existingSections.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Existing Section
              </button>
            </div>

            {sectionMode === "new" ? (
              <div className={`space-y-3 ${colors.bgSecondary} p-3 rounded-md`}>
                <div>
                  <label
                    className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                  >
                    Section Name
                  </label>
                  <input
                    type="text"
                    value={newSectionName}
                    onChange={(e) =>
                      updateField("newSectionName", e.target.value)
                    }
                    className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                    placeholder="e.g., Bronze, Silver, Gold"
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                  >
                    Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newSectionColor}
                      onChange={(e) =>
                        updateField("newSectionColor", e.target.value)
                      }
                      className={`w-10 h-9 rounded cursor-pointer border ${colors.border}`}
                    />
                    <input
                      type="text"
                      value={newSectionColor}
                      onChange={(e) =>
                        updateField("newSectionColor", e.target.value)
                      }
                      className={`flex-1 px-2 py-2 text-sm border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                      placeholder="#f97316"
                    />
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                  >
                    Price (€)
                  </label>
                  <input
                    type="number"
                    value={newSectionPrice}
                    onChange={(e) =>
                      updateField("newSectionPrice", e.target.value)
                    }
                    min={0}
                    step={0.01}
                    className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                    placeholder="25.00"
                  />
                </div>
              </div>
            ) : (
              <div className={`${colors.bgSecondary} p-3 rounded-md`}>
                <label
                  className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                >
                  Select Section
                </label>
                <select
                  value={selectedSectionId}
                  onChange={(e) =>
                    updateField(
                      "selectedSectionId",
                      e.target.value as SectionId,
                    )
                  }
                  className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
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

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className={`flex-1 px-4 py-2 border ${colors.border} rounded-md ${colors.textPrimary} ${colors.bgHover} transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
