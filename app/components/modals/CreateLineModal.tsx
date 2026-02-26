"use client";

import { useState } from "react";
import { useThemeColors } from "../../hooks/useThemeColors";

interface CreateLineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    label: string,
    color: string,
    strokeWidth: number,
    lineType: "straight" | "freehand",
    opacity: number,
  ) => void;
}

export function CreateLineModal({
  isOpen,
  onClose,
  onCreate,
}: CreateLineModalProps) {
  const [label, setLabel] = useState("Line 1");
  const [color, setColor] = useState("#6b7280");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [lineType, setLineType] = useState<"straight" | "freehand">("straight");
  const [opacity, setOpacity] = useState(1);
  const { colors } = useThemeColors();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(label, color, strokeWidth, lineType, opacity);
    // Reset form
    setLabel("Line 1");
    setColor("#6b7280");
    setStrokeWidth(2);
    setLineType("straight");
    setOpacity(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className={`${colors.bgPrimary} rounded-lg shadow-xl w-96 p-6 border ${colors.border}`}
      >
        <h2 className={`text-lg font-semibold mb-4 ${colors.textPrimary}`}>
          Create Line
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
            >
              Line Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
              placeholder="e.g., Boundary Line"
              autoFocus
            />
          </div>

          {/* Line Type Selector */}
          <div>
            <label
              className={`block text-sm font-medium ${colors.textSecondary} mb-2`}
            >
              Line Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "straight" as const, label: "Straight", icon: "➖" },
                { value: "freehand" as const, label: "Freehand", icon: "〰️" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLineType(option.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-md border transition-all ${
                    lineType === option.value
                      ? `${colors.selectedBorder} ${colors.selectedBg} ${colors.selectedText}`
                      : `${colors.border} ${colors.bgHover}`
                  }`}
                >
                  <span className="text-lg">{option.icon}</span>
                  <span className={`text-xs ${colors.textSecondary}`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Stroke Width */}
          <div>
            <label
              className={`block text-sm font-medium ${colors.textSecondary} mb-2`}
            >
              Stroke Width: {strokeWidth}px
            </label>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div
              className={`flex justify-between text-xs ${colors.textMuted} mt-1`}
            >
              <span>Thin</span>
              <span>Thick</span>
            </div>
          </div>

          <div>
            <label
              className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
            >
              Line Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className={`w-12 h-10 rounded cursor-pointer border ${colors.border}`}
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className={`flex-1 px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                placeholder="#6b7280"
              />
            </div>
          </div>

          {/* Opacity Slider */}
          <div>
            <label
              className={`block text-sm font-medium ${colors.textSecondary} mb-2`}
            >
              Opacity: {Math.round(opacity * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div
              className={`flex justify-between text-xs ${colors.textMuted} mt-1`}
            >
              <span>Transparent</span>
              <span>Opaque</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 border ${colors.border} rounded-md ${colors.textPrimary} ${colors.bgHover} transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
