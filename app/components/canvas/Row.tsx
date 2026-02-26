"use client";

import type { Row as RowType, Seat as SeatType, Section } from "../../types";
import { Seat } from "./Seat";

interface RowProps {
  row: RowType;
  seats: SeatType[];
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onSeatClick: (seatId: string, e: React.MouseEvent) => void;
  selectedIds: string[];
  scale?: number;
  section?: Section;
}

export function Row({
  row,
  seats,
  isSelected,
  onClick,
  onSeatClick,
  selectedIds,
  scale = 1,
  section,
}: RowProps) {
  const firstSeat = seats[0];
  const lastSeat = seats[seats.length - 1];

  if (!firstSeat || !lastSeat) return null;

  const start = row.start || firstSeat.position;
  const end = row.end || lastSeat.position;
  const curve = row.curve ?? 0;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
  const sagitta = curve * length * 0.35;
  const control = {
    x: midpoint.x + nx * sagitta,
    y: midpoint.y + ny * sagitta,
  };
  const connectionPath = `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;

  const minX = Math.min(...seats.map((seat) => seat.position.x));
  const maxX = Math.max(...seats.map((seat) => seat.position.x));
  const minY = Math.min(...seats.map((seat) => seat.position.y));
  const maxY = Math.max(...seats.map((seat) => seat.position.y));

  return (
    <g className="cursor-pointer" onClick={onClick} data-element-id={row.id}>
      {/* Connection line between seats */}
      {seats.length > 1 && (
        <path
          d={connectionPath}
          fill="none"
          className="stroke-gray-300"
          strokeWidth={2}
        />
      )}

      {/* Selection highlight for the entire row */}
      {isSelected && (
        <rect
          x={minX - 24}
          y={minY - 24}
          width={maxX - minX + 48}
          height={maxY - minY + 48}
          rx={4}
          fill="none"
          className="stroke-blue-500"
          strokeWidth={2}
          strokeDasharray={`4 4`}
        />
      )}

      {/* Seats */}
      {seats.map((seat) => (
        <g key={seat.id} data-element-id={seat.id}>
          <Seat
            seat={seat}
            isSelected={selectedIds.includes(seat.id)}
            onClick={(e) => onSeatClick(seat.id, e)}
            scale={scale}
            section={section}
            rowLabel={row.label}
          />
        </g>
      ))}
    </g>
  );
}
