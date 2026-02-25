"use client";

import { useState } from "react";
import type { Seat as SeatType, Section } from "../../types";

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
  scale = 1,
  section,
  rowLabel,
}: SeatProps) {
  const [isHovered, setIsHovered] = useState(false);

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

  const size = SEAT_SIZE / scale;
  const halfSize = size / 2;
  const colors = getSeatColor();

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
          fill={colors.fill}
          stroke={isSelected ? "#3b82f6" : colors.stroke}
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
          fill={colors.fill}
          stroke={isSelected ? "#3b82f6" : colors.stroke}
          strokeWidth={isSelected ? 2 : 1}
          className="transition-all hover:stroke-2"
        />
      )}
      <text
        y={size / 4}
        textAnchor="middle"
        className="text-xs fill-gray-700 pointer-events-none select-none"
        style={{ fontSize: `${10 / scale}px` }}
      >
        {seat.label}
      </text>

      {/* Hover Tooltip */}
      {isHovered && (
        <g transform={`translate(0, -${size + 10})`}>
          <rect
            x={-70}
            y={-60}
            width={140}
            height={55}
            rx={8}
            fill="#1f2937"
            stroke="#374151"
            strokeWidth={1}
          />
          {/* Section header */}
          <text
            x={0}
            y={-42}
            textAnchor="middle"
            className="fill-gray-400 text-xs uppercase tracking-wider"
            style={{ fontSize: `${8 / scale}px` }}
          >
            {section ? `SECTION ${section.sectionNumber}` : "NO SECTION"}
          </text>
          {/* Section name */}
          <text
            x={0}
            y={-25}
            textAnchor="middle"
            className="fill-white font-semibold"
            style={{ fontSize: `${12 / scale}px` }}
          >
            {section?.label || "General"}
          </text>
          {/* Row | Seat info */}
          <text
            x={0}
            y={-8}
            textAnchor="middle"
            className="fill-gray-300"
            style={{ fontSize: `${10 / scale}px` }}
          >
            {rowLabel
              ? `Row ${rowLabel} | Seat ${seat.label}`
              : `Seat ${seat.label}`}
          </text>
          {/* Price */}
          {section?.price && (
            <text
              x={0}
              y={8}
              textAnchor="middle"
              className="fill-green-400 font-semibold"
              style={{ fontSize: `${11 / scale}px` }}
            >
              €{section.price}
            </text>
          )}
        </g>
      )}
    </g>
  );
}
