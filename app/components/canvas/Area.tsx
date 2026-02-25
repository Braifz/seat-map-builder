"use client";

import type { Area as AreaType } from "../../types";

interface AreaProps {
  area: AreaType;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  scale?: number;
}

export function Area({ area, isSelected, onClick, scale = 1 }: AreaProps) {
  return (
    <g className="cursor-pointer" onClick={onClick} data-element-id={area.id}>
      {/* Area rectangle */}
      <rect
        x={area.position.x}
        y={area.position.y}
        width={area.size.width}
        height={area.size.height}
        rx={8}
        fill={area.color || "#e5e7eb"}
        className={`transition-all ${
          isSelected ? "stroke-blue-500 stroke-2" : "stroke-gray-400 stroke-1"
        } hover:stroke-2`}
        strokeWidth={isSelected ? 2 / scale : 1 / scale}
        opacity={0.8}
      />

      {/* Area label */}
      <text
        x={area.position.x + area.size.width / 2}
        y={area.position.y + area.size.height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className={`font-medium select-none ${
          isSelected ? "fill-blue-700" : "fill-gray-700"
        }`}
        style={{ fontSize: `${14 / scale}px` }}
      >
        {area.label}
      </text>
    </g>
  );
}
