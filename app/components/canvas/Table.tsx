"use client";

import { memo } from "react";
import type { Table as TableType, Seat as SeatType } from "../../types";
import { Seat } from "./Seat";

interface TableProps {
  table: TableType;
  seats: SeatType[];
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onSeatClick: (seatId: string, e: React.MouseEvent) => void;
  selectedIdSet?: Set<string>;
  scale?: number;
}

export const Table = memo(function Table({
  table,
  seats,
  isSelected,
  onClick,
  onSeatClick,
  selectedIdSet,
  scale: _scale = 1,
}: TableProps) {
  const centerX = table.position.x + table.size.width / 2;
  const centerY = table.position.y + table.size.height / 2;
  const rotation = table.rotation || 0;

  // Calculate transform for rotation
  const transform = rotation
    ? `rotate(${rotation}, ${centerX}, ${centerY})`
    : undefined;

  return (
    <g
      className={
        table.isLocked ? "cursor-not-allowed opacity-80" : "cursor-pointer"
      }
      onClick={onClick}
      data-element-id={table.id}
      transform={transform}
    >
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
          strokeWidth={2}
          strokeDasharray={`4 4`}
        />
      )}

      {/* Table shape */}
      {table.shape === "round" ? (
        <circle
          cx={centerX}
          cy={centerY}
          r={Math.max(table.size.width, table.size.height) / 2}
          className="fill-amber-50 stroke-amber-300"
          strokeWidth={2}
        />
      ) : (
        <rect
          x={table.position.x}
          y={table.position.y}
          width={table.size.width}
          height={table.size.height}
          rx={8}
          className="fill-amber-50 stroke-amber-300"
          strokeWidth={2}
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
        style={{ fontSize: `12px` }}
      >
        {table.label}
      </text>

      {/* Seats around table */}
      {seats.map((seat) => (
        <g key={seat.id} data-element-id={seat.id}>
          <Seat
            seat={seat}
            isSelected={selectedIdSet?.has(seat.id) ?? false}
            onClick={onSeatClick}
            scale={_scale}
          />
        </g>
      ))}
    </g>
  );
});
