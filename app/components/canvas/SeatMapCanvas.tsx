"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useSeatMapStore } from "../../store/seatMapStore";
import { Seat } from "./Seat";
import { Row } from "./Row";
import { Area } from "./Area";
import { Table } from "./Table";
import { CreateRowModal } from "../modals/CreateRowModal";
import { CreateTableModal } from "../modals/CreateTableModal";
import { CreateAreaModal } from "../modals/CreateAreaModal";
import type {
  Position,
  TableShape,
  RowId,
  AreaId,
  TableId,
  SeatId,
} from "../../types";

export function SeatMapCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [lastPan, setLastPan] = useState<Position>({ x: 0, y: 0 });
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [pendingClick, setPendingClick] = useState<Position | null>(null);
  const [showRowModal, setShowRowModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);

  const {
    rows,
    seats,
    areas,
    tables,
    sections,
    selectedIds,
    zoom,
    pan,
    activeTool,
    selectElement,
    clearSelection,
    setPan,
    setZoom,
    addRow,
    addArea,
    addTable,
    setActiveTool,
    moveRow,
    moveArea,
    moveTable,
    moveSeat,
  } = useSeatMapStore();

  // Drag state for moving elements
  const [isElementDragging, setIsElementDragging] = useState(false);
  const [dragElementStart, setDragElementStart] = useState<Position>({
    x: 0,
    y: 0,
  });
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);

  // Handle keyboard events for shift key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Convert screen coordinates to SVG coordinates
  const screenToSVG = useCallback(
    (screenX: number, screenY: number): Position => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      return {
        x: (screenX - rect.left - pan.x) / zoom,
        y: (screenY - rect.top - pan.y) / zoom,
      };
    },
    [pan, zoom],
  );

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only left click

      const target = e.target as Element;
      const svgPoint = screenToSVG(e.clientX, e.clientY);

      // Check if clicking on a selected element for dragging
      const isClickOnSelected = selectedIds.some((id) => {
        if (target.closest(`[data-element-id="${id}"]`)) {
          setDraggedElementId(id);
          return true;
        }
        return false;
      });

      if (isClickOnSelected && activeTool === "select") {
        setIsElementDragging(true);
        setDragElementStart(svgPoint);
        return;
      }

      if (activeTool === "pan" || e.altKey) {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setLastPan(pan);
      } else if (activeTool === "addRow") {
        setPendingClick(svgPoint);
        setShowRowModal(true);
      } else if (activeTool === "addArea") {
        setPendingClick(svgPoint);
        setShowAreaModal(true);
      } else if (activeTool === "addTable") {
        setPendingClick(svgPoint);
        setShowTableModal(true);
      } else {
        // Select tool - clear selection if clicking on empty space
        if (e.target === svgRef.current) {
          clearSelection();
        }
      }
    },
    [activeTool, pan, screenToSVG, clearSelection, selectedIds],
  );

  // Handle row creation from modal
  const handleCreateRow = (
    label: string,
    seatCount: number,
    sectionId?: string,
  ) => {
    if (pendingClick) {
      addRow(label, seatCount, pendingClick, sectionId);
      setPendingClick(null);
      setActiveTool("select");
    }
  };

  // Handle area creation from modal
  const handleCreateArea = (
    label: string,
    width: number,
    height: number,
    color: string,
  ) => {
    if (pendingClick) {
      addArea(label, pendingClick, { width, height }, color);
      setPendingClick(null);
      setActiveTool("select");
    }
  };
  const handleCreateTable = (
    label: string,
    shape: TableShape,
    seatCount: number,
  ) => {
    if (pendingClick) {
      const size =
        shape === "round"
          ? { width: 80, height: 80 }
          : { width: 120, height: 80 };
      addTable(label, pendingClick, shape, size, seatCount);
      setPendingClick(null);
      setActiveTool("select");
    }
  };

  // Handle mouse move (for panning and element dragging)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Element dragging
      if (isElementDragging && draggedElementId) {
        const svgPoint = screenToSVG(e.clientX, e.clientY);
        const delta = {
          x: svgPoint.x - dragElementStart.x,
          y: svgPoint.y - dragElementStart.y,
        };

        // Move the dragged element
        if (draggedElementId.startsWith("row_")) {
          moveRow(draggedElementId as RowId, delta);
        } else if (draggedElementId.startsWith("area_")) {
          moveArea(draggedElementId as AreaId, delta);
        } else if (draggedElementId.startsWith("table_")) {
          moveTable(draggedElementId as TableId, delta);
        } else if (draggedElementId.startsWith("seat_")) {
          moveSeat(draggedElementId as SeatId, delta);
        }

        setDragElementStart(svgPoint);
        return;
      }

      // Panning
      if (!isDragging || activeTool !== "pan") return;

      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      setPan({
        x: lastPan.x + dx,
        y: lastPan.y + dy,
      });
    },
    [
      isDragging,
      isElementDragging,
      activeTool,
      dragStart,
      lastPan,
      setPan,
      screenToSVG,
      draggedElementId,
      dragElementStart,
      moveRow,
      moveArea,
      moveTable,
      moveSeat,
    ],
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsElementDragging(false);
    setDraggedElementId(null);
  }, []);

  // Handle wheel for zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, zoom * delta));
      setZoom(newZoom);
    },
    [zoom, setZoom],
  );

  // Handle element clicks
  const handleRowClick = useCallback(
    (rowId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      selectElement(rowId, isShiftPressed);
    },
    [selectElement, isShiftPressed],
  );

  const handleSeatClick = useCallback(
    (seatId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      selectElement(seatId, isShiftPressed);
    },
    [selectElement, isShiftPressed],
  );

  const handleAreaClick = useCallback(
    (areaId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      selectElement(areaId, isShiftPressed);
    },
    [selectElement, isShiftPressed],
  );

  const handleTableClick = useCallback(
    (tableId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      selectElement(tableId, isShiftPressed);
    },
    [selectElement, isShiftPressed],
  );

  return (
    <div className="flex-1 overflow-hidden bg-gray-100 relative">
      <svg
        ref={svgRef}
        className={`w-full h-full ${activeTool === "pan" || isDragging ? "cursor-grabbing" : activeTool !== "select" ? "cursor-crosshair" : "cursor-default"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Render areas first (background layer) */}
          {Object.values(areas).map((area) => (
            <Area
              key={area.id}
              area={area}
              isSelected={selectedIds.includes(area.id)}
              onClick={(e) => handleAreaClick(area.id, e)}
              scale={zoom}
            />
          ))}

          {/* Render rows */}
          {Object.values(rows).map((row) => (
            <Row
              key={row.id}
              row={row}
              seats={row.seats.map((seatId) => seats[seatId]).filter(Boolean)}
              isSelected={selectedIds.includes(row.id)}
              onClick={(e) => handleRowClick(row.id, e)}
              onSeatClick={handleSeatClick}
              selectedIds={selectedIds}
              scale={zoom}
              section={row.sectionId ? sections[row.sectionId] : undefined}
            />
          ))}

          {/* Render tables */}
          {Object.values(tables).map((table) => (
            <Table
              key={table.id}
              table={table}
              seats={table.seats.map((seatId) => seats[seatId]).filter(Boolean)}
              isSelected={selectedIds.includes(table.id)}
              onClick={(e) => handleTableClick(table.id, e)}
              onSeatClick={handleSeatClick}
              selectedIds={selectedIds}
              scale={zoom}
            />
          ))}

          {/* Render individual seats (not in rows or tables) */}
          {Object.values(seats)
            .filter((seat) => !seat.rowId && !seat.tableId)
            .map((seat) => (
              <Seat
                key={seat.id}
                seat={seat}
                isSelected={selectedIds.includes(seat.id)}
                onClick={(e) => handleSeatClick(seat.id, e)}
                scale={zoom}
              />
            ))}
        </g>
      </svg>

      {/* Zoom info */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md px-3 py-2 text-sm text-gray-600">
        {Math.round(zoom * 100)}%
      </div>

      {/* Modals */}
      <CreateRowModal
        isOpen={showRowModal}
        onClose={() => {
          setShowRowModal(false);
          setPendingClick(null);
          setActiveTool("select");
        }}
        onCreate={handleCreateRow}
        defaultPosition={pendingClick || undefined}
      />

      <CreateAreaModal
        isOpen={showAreaModal}
        onClose={() => {
          setShowAreaModal(false);
          setPendingClick(null);
          setActiveTool("select");
        }}
        onCreate={handleCreateArea}
      />

      <CreateTableModal
        isOpen={showTableModal}
        onClose={() => {
          setShowTableModal(false);
          setPendingClick(null);
          setActiveTool("select");
        }}
        onCreate={handleCreateTable}
      />
    </div>
  );
}
