"use client";

import type { ElementId } from "../types";

interface ContextMenuProps {
  x: number;
  y: number;
  selectedIds: ElementId[];
  onClose: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onRotate: (degrees: number) => void;
  onDelete: () => void;
}

interface MenuItem {
  type: "action" | "separator";
  label?: string;
  shortcut?: string;
  onClick?: () => void;
  danger?: boolean;
}

export function ContextMenu({
  x,
  y,
  selectedIds,
  onClose,
  onBringToFront,
  onSendToBack,
  onRotate,
  onDelete,
}: ContextMenuProps) {
  const menuItems: MenuItem[] = [
    {
      type: "action",
      label: "🔼 Bring to Front",
      shortcut: "Ctrl+Shift+]",
      onClick: onBringToFront,
    },
    {
      type: "action",
      label: "🔽 Send to Back",
      shortcut: "Ctrl+Shift+[",
      onClick: onSendToBack,
    },
    { type: "separator" },
    {
      type: "action",
      label: "🔄 Rotate 90° CW",
      shortcut: "R",
      onClick: () => onRotate(90),
    },
    {
      type: "action",
      label: "🔄 Rotate 90° CCW",
      shortcut: "Shift+R",
      onClick: () => onRotate(-90),
    },
    { type: "separator" },
    {
      type: "action",
      label: "🗑️ Delete",
      shortcut: "Delete",
      onClick: onDelete,
      danger: true,
    },
  ];

  // Adjust position to keep menu within viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 250);

  return (
    <>
      {/* Backdrop to close menu */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />

      {/* Context Menu */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[180px]"
        style={{ left: adjustedX, top: adjustedY }}
      >
        {selectedIds.length > 0 && (
          <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100 mb-1">
            {selectedIds.length} item{selectedIds.length > 1 ? "s" : ""}{" "}
            selected
          </div>
        )}

        {menuItems.map((item, index) => {
          if (item.type === "separator") {
            return (
              <div key={index} className="my-1 border-t border-gray-100" />
            );
          }

          return (
            <button
              key={index}
              onClick={() => {
                if (item.onClick) {
                  item.onClick();
                }
                onClose();
              }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${
                item.danger ? "text-red-600 hover:bg-red-50" : "text-gray-700"
              }`}
            >
              <span>{item.label}</span>
              {item.shortcut && (
                <span className="text-xs text-gray-400 ml-4">
                  {item.shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
