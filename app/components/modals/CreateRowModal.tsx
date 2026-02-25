'use client';

import { useState } from 'react';

interface CreateRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (label: string, seatCount: number) => void;
  defaultPosition?: { x: number; y: number };
}

export function CreateRowModal({ isOpen, onClose, onCreate, defaultPosition }: CreateRowModalProps) {
  const [label, setLabel] = useState('Row 1');
  const [seatCount, setSeatCount] = useState(8);
  const [useDefaultPosition, setUseDefaultPosition] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(label, seatCount);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 p-6">
        <h2 className="text-lg font-semibold mb-4">Create Row</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Row Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Platea A"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Seats
            </label>
            <input
              type="number"
              value={seatCount}
              onChange={(e) => setSeatCount(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Max 100 seats per row</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="usePosition"
              checked={useDefaultPosition}
              onChange={(e) => setUseDefaultPosition(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="usePosition" className="text-sm text-gray-700">
              {defaultPosition
                ? `Place at clicked position (${Math.round(defaultPosition.x)}, ${Math.round(defaultPosition.y)})`
                : 'Place at default position'}
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
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
