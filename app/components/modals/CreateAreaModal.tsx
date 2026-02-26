"use client";

import { useState } from "react";
import { useThemeColors } from "../../hooks/useThemeColors";
import type { AreaShape } from "../../types";

interface CreateAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    label: string,
    width: number,
    height: number,
    color: string,
    shape: AreaShape,
    opacity: number,
  ) => void;
}

export function CreateAreaModal({
  isOpen,
  onClose,
  onCreate,
}: CreateAreaModalProps) {
  const [label, setLabel] = useState("Area 1");
  const [width, setWidth] = useState(200);
  const [height, setHeight] = useState(150);
  const [color, setColor] = useState("#e5e7eb");
  const [shape, setShape] = useState<AreaShape>("rectangle");
  const [opacity, setOpacity] = useState(0.8);
  const { colors } = useThemeColors();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(label, width, height, color, shape, opacity);
    // Reset form
    setLabel("Area 1");
    setWidth(200);
    setHeight(150);
    setColor("#e5e7eb");
    setShape("rectangle");
    setOpacity(0.8);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className={`${colors.bgPrimary} rounded-lg shadow-xl w-96 p-6 border ${colors.border}`}
      >
        <h2 className={`text-lg font-semibold mb-4 ${colors.textPrimary}`}>
          Create Area
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
            >
              Area Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
              placeholder="e.g., Stage Area"
              autoFocus
            />
          </div>

          {/* Shape Selector */}
          <div>
            <label
              className={`block text-sm font-medium ${colors.textSecondary} mb-2`}
            >
              Shape
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: "rectangle" as const, label: "Rectangle", icon: "▭" },
                { value: "square" as const, label: "Square", icon: "□" },
                { value: "circle" as const, label: "Circle", icon: "○" },
                { value: "oval" as const, label: "Oval", icon: "⬭" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setShape(option.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-md border transition-all ${
                    shape === option.value
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
              >
                Width (px)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) =>
                  setWidth(Math.max(50, parseInt(e.target.value) || 50))
                }
                min={50}
                max={2000}
                className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
              >
                Height (px)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) =>
                  setHeight(Math.max(50, parseInt(e.target.value) || 50))
                }
                min={50}
                max={2000}
                className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
              />
            </div>
          </div>

          <div>
            <label
              className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
            >
              Background Color
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
                placeholder="#e5e7eb"
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
