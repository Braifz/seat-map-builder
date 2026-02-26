"use client";

import type { Position, Size } from "../../types";

interface ResizeHandlesProps {
  position: Position;
  size: Size;
  rotation?: number;
  onResizeStart: (handle: string, e: React.MouseEvent) => void;
}

export function ResizeHandles({ position, size, rotation = 0, onResizeStart }: ResizeHandlesProps) {
  const centerX = position.x + size.width / 2;
  const centerY = position.y + size.height / 2;

  // Calculate handle positions relative to center
  const handles = [
    { id: "nw", x: position.x, y: position.y, cursor: "nwse-resize" },
    { id: "n", x: centerX, y: position.y, cursor: "ns-resize" },
    { id: "ne", x: position.x + size.width, y: position.y, cursor: "nesw-resize" },
    { id: "e", x: position.x + size.width, y: centerY, cursor: "ew-resize" },
    { id: "se", x: position.x + size.width, y: position.y + size.height, cursor: "nwse-resize" },
    { id: "s", x: centerX, y: position.y + size.height, cursor: "ns-resize" },
    { id: "sw", x: position.x, y: position.y + size.height, cursor: "nesw-resize" },
    { id: "w", x: position.x, y: centerY, cursor: "ew-resize" },
  ];

  return (
    <g className="pointer-events-none">
      {/* Selection outline */}
      <rect
        x={position.x}
        y={position.y}
        width={size.width}
        height={size.height}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={1}
        strokeDasharray="4 4"
        transform={rotation ? `rotate(${rotation}, ${centerX}, ${centerY})` : undefined}
      />

      {/* Resize handles */}
      {handles.map((handle) => (
        <rect
          key={handle.id}
          x={handle.x - 4}
          y={handle.y - 4}
          width={8}
          height={8}
          fill="white"
          stroke="#3b82f6"
          strokeWidth={1}
          className="pointer-events-auto cursor-pointer"
          style={{ cursor: handle.cursor }}
          transform={rotation ? `rotate(${rotation}, ${centerX}, ${centerY})` : undefined}
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizeStart(handle.id, e);
          }}
        />
      ))}
    </g>
  );
}
