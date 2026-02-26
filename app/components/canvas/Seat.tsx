"use client";

import { useState } from "react";
import type { Seat as SeatType, Section } from "../../types";
import { useThemeColors } from "../../hooks/useThemeColors";

interface SeatProps {
  seat: SeatType;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  scale?: number;
  section?: Section;
  rowLabel?: string;
}

const SEAT_SIZE = 24;

export function Seat({
  seat,
  isSelected,
  onClick,
  section,
  rowLabel,
}: SeatProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { isDark } = useThemeColors();

  const getSeatColor = () => {
    // If seat has a section, use section color
    if (section) {
      return { fill: section.color, stroke: section.color };
    }

    // Otherwise use default type-based colors
    switch (seat.type) {
      case "vip":
        return { fill: "#fbbf24", stroke: "#d97706" };
      case "wheelchair":
        return { fill: "#60a5fa", stroke: "#2563eb" };
      case "companion":
        return { fill: "#4ade80", stroke: "#16a34a" };
      default:
        return { fill: "#f3f4f6", stroke: "#9ca3af" };
    }
  };

  const getSeatShape = () => {
    switch (seat.type) {
      case "wheelchair":
        return "rect";
      default:
        return "circle";
    }
  };

  const size = SEAT_SIZE;
  const halfSize = size / 2;
  const seatColors = getSeatColor();
  const effectivePrice = seat.price ?? section?.price;

  return (
    <g
      transform={`translate(${seat.position.x}, ${seat.position.y})`}
      className="cursor-pointer"
      onClick={onClick}
      data-element-id={seat.id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {getSeatShape() === "circle" ? (
        <circle
          r={halfSize}
          fill={seatColors.fill}
          stroke={isSelected ? "#3b82f6" : seatColors.stroke}
          strokeWidth={isSelected ? 2 : 1}
          className="transition-all hover:stroke-2"
        />
      ) : (
        <rect
          x={-halfSize}
          y={-halfSize}
          width={size}
          height={size}
          rx={4}
          fill={seatColors.fill}
          stroke={isSelected ? "#3b82f6" : seatColors.stroke}
          strokeWidth={isSelected ? 2 : 1}
          className="transition-all hover:stroke-2"
        />
      )}
      <text
        y={size / 4}
        textAnchor="middle"
        className="text-xs fill-gray-700 pointer-events-none select-none"
        style={{ fontSize: `10px` }}
      >
        {seat.label}
      </text>

      {/* Hover Tooltip - Minimalist Style */}
      {isHovered && (
        <g transform={`translate(0, -${size + 12})`}>
          {/* Card background with subtle shadow */}
          <rect
            x={-60}
            y={-55}
            width={120}
            height={50}
            rx={8}
            fill={isDark ? "#1e1e1e" : "white"}
            stroke={isDark ? "#2d2d2d" : "#e5e7eb"}
            strokeWidth={1}
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
          />
          {/* Row | Seat info */}
          <text
            x={0}
            y={-38}
            textAnchor="middle"
            fill={isDark ? "#a0a0a0" : "#6b7280"}
            style={{ fontSize: `9px` }}
          >
            {rowLabel
              ? `Row ${rowLabel} • Seat ${seat.label}`
              : `Seat ${seat.label}`}
          </text>
          {/* Price */}
          <text
            x={0}
            y={-22}
            textAnchor="middle"
            fill={isDark ? "#e3e3e3" : "#111827"}
            fontWeight="bold"
            style={{ fontSize: `13px` }}
          >
            {effectivePrice !== undefined ? `€${effectivePrice}` : "—"}
          </text>
        </g>
      )}
    </g>
  );
}
