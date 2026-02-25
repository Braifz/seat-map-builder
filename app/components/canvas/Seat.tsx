"use client";

import type { Seat as SeatType } from "../../types";

interface SeatProps {
  seat: SeatType;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  scale?: number;
}

const SEAT_SIZE = 24;

export function Seat({ seat, isSelected, onClick, scale = 1 }: SeatProps) {
  const getSeatColor = () => {
    switch (seat.type) {
      case "vip":
        return "fill-amber-400 stroke-amber-600";
      case "wheelchair":
        return "fill-blue-400 stroke-blue-600";
      case "companion":
        return "fill-green-400 stroke-green-600";
      default:
        return "fill-gray-100 stroke-gray-400";
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

  return (
    <g
      transform={`translate(${seat.position.x}, ${seat.position.y})`}
      className="cursor-pointer"
      onClick={onClick}
      data-element-id={seat.id}
    >
      {getSeatShape() === "circle" ? (
        <circle
          r={halfSize}
          className={`${getSeatColor()} ${
            isSelected ? "stroke-2 stroke-blue-500" : "stroke-1"
          } transition-all hover:stroke-2`}
        />
      ) : (
        <rect
          x={-halfSize}
          y={-halfSize}
          width={size}
          height={size}
          rx={4}
          className={`${getSeatColor()} ${
            isSelected ? "stroke-2 stroke-blue-500" : "stroke-1"
          } transition-all hover:stroke-2`}
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
    </g>
  );
}
