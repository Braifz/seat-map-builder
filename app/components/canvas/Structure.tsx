"use client";

import type { Structure as StructureType } from "../../types";

interface StructureProps {
  structure: StructureType;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  scale?: number;
}

// SVG Icons for different structure types
const StructureIcon = ({ type }: { type: StructureType["type"] }) => {
  switch (type) {
    case "stage":
      // Stage - rectangle with podium/stand
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
          <rect
            x="2"
            y="8"
            width="20"
            height="12"
            rx="1"
            fill="currentColor"
            opacity="0.9"
          />
          <rect
            x="6"
            y="4"
            width="12"
            height="6"
            rx="0.5"
            fill="currentColor"
            opacity="0.7"
          />
        </svg>
      );
    case "bar":
      // Bar - drink/martini glass
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
          <path
            d="M8 3L12 11M12 11L16 3M12 11V18M12 18L9 21M12 18L15 21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "entrance":
      // Entrance - arrow pointing in
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M16 12H8M8 12L11 9M8 12L11 15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "exit":
      // Exit - arrow pointing out
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M8 12H16M16 12L13 9M16 12L13 15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      // Custom - square with corners
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      );
  }
};

export function Structure({
  structure,
  isSelected,
  onClick,
  scale: _scale = 1,
}: StructureProps) {
  const centerX = structure.position.x + structure.size.width / 2;
  const centerY = structure.position.y + structure.size.height / 2;
  const rotation = structure.rotation || 0;

  // Text color based on background brightness
  const textColor = "#ffffff";

  // Calculate transform for rotation
  const transform = rotation
    ? `rotate(${rotation}, ${centerX}, ${centerY})`
    : undefined;

  return (
    <g
      className={
        structure.isLocked ? "cursor-not-allowed opacity-80" : "cursor-pointer"
      }
      onClick={onClick}
      data-element-id={structure.id}
      transform={transform}
    >
      {/* Selection highlight */}
      {isSelected && (
        <rect
          x={structure.position.x - 6}
          y={structure.position.y - 6}
          width={structure.size.width + 12}
          height={structure.size.height + 12}
          rx={6}
          fill="none"
          className="stroke-blue-500"
          strokeWidth={2}
          strokeDasharray={`4 4`}
        />
      )}

      {/* Structure background */}
      <rect
        x={structure.position.x}
        y={structure.position.y}
        width={structure.size.width}
        height={structure.size.height}
        rx={4}
        fill={structure.color || "#6b7280"}
        className="stroke-gray-700"
        strokeWidth={1}
        opacity={0.9}
      />

      {/* Icon in center */}
      <foreignObject x={centerX - 16} y={centerY - 20} width={32} height={32}>
        <div
          className="flex items-center justify-center w-full h-full"
          style={{ color: textColor }}
        >
          <StructureIcon type={structure.type} />
        </div>
      </foreignObject>

      {/* Label below */}
      <text
        x={centerX}
        y={structure.position.y + structure.size.height + 15}
        textAnchor="middle"
        className="font-medium select-none fill-gray-700 text-xs"
        style={{ fontSize: `12px` }}
      >
        {structure.label}
      </text>
    </g>
  );
}
