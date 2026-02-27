"use client";

import type { Area as AreaType } from "../../types";

interface AreaProps {
  area: AreaType;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  scale?: number;
}

export function Area({
  area,
  isSelected,
  onClick,
  scale: _scale = 1,
}: AreaProps) {
  const shape = area.shape || "rectangle";
  const opacity = area.opacity ?? 0.8;
  const rotation = area.rotation || 0;
  const centerX = area.position.x + area.size.width / 2;
  const centerY = area.position.y + area.size.height / 2;

  const renderShape = () => {
    const commonProps = {
      fill: area.color || "#e5e7eb",
      opacity,
      className: `transition-all ${
        isSelected ? "stroke-blue-500" : "stroke-gray-400"
      } hover:stroke-blue-400`,
      strokeWidth: isSelected ? 2 : 1,
    };

    switch (shape) {
      case "circle": {
        const radius = Math.min(area.size.width, area.size.height) / 2;
        return <circle cx={centerX} cy={centerY} r={radius} {...commonProps} />;
      }
      case "oval": {
        return (
          <ellipse
            cx={centerX}
            cy={centerY}
            rx={area.size.width / 2}
            ry={area.size.height / 2}
            {...commonProps}
          />
        );
      }
      case "square": {
        const size = Math.min(area.size.width, area.size.height);
        const offsetX = (area.size.width - size) / 2;
        const offsetY = (area.size.height - size) / 2;
        return (
          <rect
            x={area.position.x + offsetX}
            y={area.position.y + offsetY}
            width={size}
            height={size}
            rx={4}
            {...commonProps}
          />
        );
      }
      case "line": {
        if (
          area.lineConfig?.lineType === "freehand" &&
          area.lineConfig.points.length > 1
        ) {
          const points = area.lineConfig.points
            .map((p) => `${p.x},${p.y}`)
            .join(" ");
          return (
            <polyline
              points={points}
              fill="none"
              stroke={area.color || "#6b7280"}
              strokeWidth={area.lineConfig.strokeWidth}
              opacity={opacity}
            />
          );
        }
        // Straight line (default for line shape)
        return (
          <line
            x1={area.position.x}
            y1={area.position.y}
            x2={area.position.x + area.size.width}
            y2={area.position.y + area.size.height}
            stroke={area.color || "#6b7280"}
            strokeWidth={area.lineConfig?.strokeWidth || 2}
            opacity={opacity}
          />
        );
      }
      case "rectangle":
      default:
        return (
          <rect
            x={area.position.x}
            y={area.position.y}
            width={area.size.width}
            height={area.size.height}
            rx={8}
            {...commonProps}
          />
        );
    }
  };

  // Calculate transform for rotation
  const transform = rotation
    ? `rotate(${rotation}, ${centerX}, ${centerY})`
    : undefined;

  return (
    <g
      className={
        area.isLocked ? "cursor-not-allowed opacity-80" : "cursor-pointer"
      }
      onClick={onClick}
      data-element-id={area.id}
      transform={transform}
    >
      {renderShape()}

      {/* Area label (hidden for line shapes) */}
      {shape !== "line" && (
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
          className={`font-medium select-none ${
            isSelected ? "fill-blue-700" : "fill-gray-700"
          }`}
          style={{ fontSize: `14px` }}
        >
          {area.label}
        </text>
      )}
    </g>
  );
}
