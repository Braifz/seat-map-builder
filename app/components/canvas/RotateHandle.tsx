"use client";

import type { Position, Size } from "../../types";

interface RotateHandleProps {
  position: Position;
  size: Size;
  rotation?: number;
  onRotateStart: (e: React.MouseEvent) => void;
}

export function RotateHandle({ position, size, rotation = 0, onRotateStart }: RotateHandleProps) {
  const centerX = position.x + size.width / 2;
  const centerY = position.y + size.height / 2;
  
  // Position the rotate handle above the element
  const handleX = centerX;
  const handleY = position.y - 25;

  return (
    <g className="pointer-events-none">
      {/* Line connecting to center */}
      <line
        x1={centerX}
        y1={centerY}
        x2={handleX}
        y2={handleY}
        stroke="#3b82f6"
        strokeWidth={1}
        strokeDasharray="2 2"
        transform={rotation ? `rotate(${rotation}, ${centerX}, ${centerY})` : undefined}
      />

      {/* Rotate handle circle */}
      <circle
        cx={handleX}
        cy={handleY}
        r={6}
        fill="white"
        stroke="#3b82f6"
        strokeWidth={2}
        className="pointer-events-auto cursor-grab"
        transform={rotation ? `rotate(${rotation}, ${centerX}, ${centerY})` : undefined}
        onMouseDown={(e) => {
          e.stopPropagation();
          onRotateStart(e);
        }}
      />
    </g>
  );
}
