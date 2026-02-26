"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useSeatMapStore } from "../../store/seatMapStore";
import { Tooltip } from "./Tooltip";

export function MenuButton() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { selectedIds, deleteSelected, bringToFront, sendToBack } =
    useSeatMapStore();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete ${selectedIds.length} selected item(s)?`,
      )
    ) {
      deleteSelected();
    }
    setIsOpen(false);
  };

  const hasSelection = selectedIds.length > 0;

  return (
    <div ref={menuRef} className="fixed top-4 left-4 z-50">
      <Tooltip content="Menu">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2.5 rounded-xl transition-all duration-150 bg-[#1e1e1e] shadow-lg border border-[#2d2d2d] ${
            isOpen
              ? "text-[#e3e3e3] bg-[#4a4a4a]"
              : "text-[#a0a0a0] hover:bg-[#2d2d2d] hover:text-[#e3e3e3]"
          }`}
        >
          <Menu size={20} />
        </button>
      </Tooltip>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-[#1e1e1e] rounded-xl shadow-lg border border-[#2d2d2d] py-2 min-w-[200px]">
          <div className="px-3 py-1.5 text-xs text-[#a0a0a0] uppercase tracking-wider">
            Layers
          </div>
          <button
            onClick={() => {
              bringToFront(selectedIds);
              setIsOpen(false);
            }}
            disabled={!hasSelection}
            className="w-full px-3 py-2 text-left text-sm text-[#e3e3e3] hover:bg-[#2d2d2d] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <ArrowUp size={16} />
            Bring to Front
          </button>
          <button
            onClick={() => {
              sendToBack(selectedIds);
              setIsOpen(false);
            }}
            disabled={!hasSelection}
            className="w-full px-3 py-2 text-left text-sm text-[#e3e3e3] hover:bg-[#2d2d2d] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <ArrowDown size={16} />
            Send to Back
          </button>

          <div className="my-1.5 h-px bg-[#2d2d2d]" />

          <div className="px-3 py-1.5 text-xs text-[#a0a0a0] uppercase tracking-wider">
            Actions
          </div>
          <button
            onClick={handleDelete}
            disabled={!hasSelection}
            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-[#2d2d2d] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <Trash2 size={16} />
            Delete Selected
          </button>

          {hasSelection && (
            <>
              <div className="my-1.5 h-px bg-[#2d2d2d]" />
              <div className="px-3 py-1 text-xs text-[#a0a0a0]">
                {selectedIds.length} item(s) selected
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
