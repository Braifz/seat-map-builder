"use client";

import { useState } from "react";
import type { StructureType, Position } from "../../types";

interface CreateStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    label: string,
    type: StructureType,
    size: { width: number; height: number },
    color: string,
  ) => void;
  defaultPosition?: Position;
}

const structureTypes: { type: StructureType; label: string; icon: string }[] = [
  { type: "stage", label: "Stage", icon: "🎭" },
  { type: "bar", label: "Bar", icon: "🍸" },
  { type: "entrance", label: "Entrance", icon: "🚪" },
  { type: "exit", label: "Exit", icon: "→" },
  { type: "custom", label: "Custom", icon: "⬜" },
];

const defaultSizes: Record<StructureType, { width: number; height: number }> = {
  stage: { width: 200, height: 80 },
  bar: { width: 120, height: 60 },
  entrance: { width: 80, height: 60 },
  exit: { width: 80, height: 60 },
  custom: { width: 100, height: 60 },
};

const defaultColors: Record<StructureType, string> = {
  stage: "#dc2626",
  bar: "#facc15",
  entrance: "#16a34a",
  exit: "#f97316",
  custom: "#6b7280",
};

export function CreateStructureModal({
  isOpen,
  onClose,
  onCreate,
  defaultPosition,
}: CreateStructureModalProps) {
  const [label, setLabel] = useState("Stage");
  const [type, setType] = useState<StructureType>("stage");
  const [width, setWidth] = useState(200);
  const [height, setHeight] = useState(80);
  const [color, setColor] = useState("#dc2626");

  if (!isOpen) return null;

  const handleTypeChange = (newType: StructureType) => {
    setType(newType);
    setWidth(defaultSizes[newType].width);
    setHeight(defaultSizes[newType].height);
    setColor(defaultColors[newType]);

    // Auto-update label based on type
    const typeLabel = structureTypes.find((t) => t.type === newType)?.label || "Structure";
    if (label === "Stage" || label === "Bar" || label === "Entrance" || label === "Exit" || label === "Custom") {
      setLabel(typeLabel);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(label, type, { width, height }, color);
    handleClose();
  };

  const handleClose = () => {
    setLabel("Stage");
    setType("stage");
    setWidth(200);
    setHeight(80);
    setColor("#dc2626");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Add Structure</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Structure Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Structure Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {structureTypes.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => handleTypeChange(t.type)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    type === t.type
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="mr-1">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Main Stage"
            />
          </div>

          {/* Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width (px)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Math.max(40, parseInt(e.target.value) || 40))}
                min={40}
                max={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (px)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Math.max(40, parseInt(e.target.value) || 40))}
                min={40}
                max={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-gray-300"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Structure
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
