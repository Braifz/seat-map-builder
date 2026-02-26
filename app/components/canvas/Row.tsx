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

  return (
    <g className="cursor-pointer" onClick={onClick} data-element-id={row.id}>
      {/* Connection line between seats */}
      {seats.length > 1 && (
        <line
          x1={firstSeat.position.x}
          y1={firstSeat.position.y}
          x2={lastSeat.position.x}
          y2={lastSeat.position.y}
          className="stroke-gray-300"
          strokeWidth={2 / scale}
        />
      )}

      {/* Selection highlight for the entire row */}
      {isSelected && (
        <rect
          x={firstSeat.position.x - 30}
          y={firstSeat.position.y - 20}
          width={lastSeat.position.x - firstSeat.position.x + 60}
          height={40}
          rx={4}
          fill="none"
          className="stroke-blue-500"
          strokeWidth={2 / scale}
          strokeDasharray={`${4 / scale} ${4 / scale}`}
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
