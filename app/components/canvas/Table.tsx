"use client";

import type { Table as TableType, Seat as SeatType } from "../../types";
import { Seat } from "./Seat";

interface TableProps {
  table: TableType;
  seats: SeatType[];
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onSeatClick: (seatId: string, e: React.MouseEvent) => void;
  selectedIds: string[];
  scale?: number;
}

export function Table({
  table,
  seats,
  isSelected,
  onClick,
  onSeatClick,
  selectedIds,
  scale = 1,
}: TableProps) {
  const centerX = table.position.x + table.size.width / 2;
  const centerY = table.position.y + table.size.height / 2;

  return (
    <g className="cursor-pointer" onClick={onClick} data-element-id={table.id}>
      {/* Selection highlight */}
      {isSelected && (
        <rect
          x={table.position.x - 10}
          y={table.position.y - 10}
          width={table.size.width + 20}
          height={table.size.height + 20}
          rx={table.shape === "round" ? table.size.width / 2 + 10 : 12}
          fill="none"
          className="stroke-blue-500"
          strokeWidth={2 / scale}
          strokeDasharray={`${4 / scale} ${4 / scale}`}
        />
      )}

      {/* Table shape */}
      {table.shape === "round" ? (
        <circle
          cx={centerX}
          cy={centerY}
          r={Math.max(table.size.width, table.size.height) / 2}
          className="fill-amber-50 stroke-amber-300"
          strokeWidth={2 / scale}
        />
      ) : (
        <rect
          x={table.position.x}
          y={table.position.y}
          width={table.size.width}
          height={table.size.height}
          rx={8}
          className="fill-amber-50 stroke-amber-300"
          strokeWidth={2 / scale}
        />
      )}

      {/* Table label */}
      <text
        x={centerX}
        y={centerY}
        textAnchor="middle"
        dominantBaseline="middle"
        className={`font-semibold select-none ${
          isSelected ? "fill-blue-700" : "fill-amber-800"
        }`}
        style={{ fontSize: `${12 / scale}px` }}
      >
        {table.label}
      </text>

      {/* Seats around table */}
      {seats.map((seat) => (
        <g key={seat.id} data-element-id={seat.id}>
          <Seat
            seat={seat}
            isSelected={selectedIds.includes(seat.id)}
            onClick={(e) => onSeatClick(seat.id, e)}
            scale={scale}
          />
        </g>
      ))}
    </g>
  );
}
