"use client";

import { useState } from "react";
import type { TableShape } from "../../types";

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (label: string, shape: TableShape, seatCount: number) => void;
}

export function CreateTableModal({
  isOpen,
  onClose,
  onCreate,
}: CreateTableModalProps) {
  const [label, setLabel] = useState("Table 1");
  const [seatCount, setSeatCount] = useState(6);
  const [shape, setShape] = useState<TableShape>("round");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(label, shape, seatCount);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 p-6">
        <h2 className="text-lg font-semibold mb-4 text-black">Create Table</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Table Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-black focus:ring-blue-500"
              placeholder="e.g., VIP Table 1"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Table Shape
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShape("round")}
                className={`flex-1 py-2 rounded-md border ${
                  shape === "round"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "border-gray-300 hover:bg-gray-50 text-gray-500"
                }`}
              >
                Round
              </button>
              <button
                type="button"
                onClick={() => setShape("rectangular")}
                className={`flex-1 py-2 rounded-md border  ${
                  shape === "rectangular"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "border-gray-300 hover:bg-gray-50 text-gray-500"
                }`}
              >
                Rectangular
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Seats
            </label>
            <input
              type="number"
              value={seatCount}
              onChange={(e) =>
                setSeatCount(Math.max(1, parseInt(e.target.value) || 1))
              }
              min={1}
              max={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-black focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {shape === "round"
                ? "Seats arranged around the table"
                : "Seats arranged in rows"}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md  hover:bg-gray-50 transition-colors text-black"
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
