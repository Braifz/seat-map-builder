"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useSeatMapStore } from "../../store/seatMapStore";
import { Seat } from "./Seat";
import { Row } from "./Row";
import { Area } from "./Area";
import { Table } from "./Table";
import { Structure } from "./Structure";
import { CreateRowModal } from "../modals/CreateRowModal";
import { CreateTableModal } from "../modals/CreateTableModal";
import { CreateAreaModal } from "../modals/CreateAreaModal";
import { CreateMultipleRowsModal } from "../modals/CreateMultipleRowsModal";
import { CreateStructureModal } from "../modals/CreateStructureModal";
import type {
  Position,
  TableShape,
  RowId,
  AreaId,
  TableId,
  SeatId,
  StructureId,
  ToolType,
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
  const [showMultipleRowsModal, setShowMultipleRowsModal] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [previousTool, setPreviousTool] = useState<ToolType | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Box selection state
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const [boxStart, setBoxStart] = useState<Position>({ x: 0, y: 0 });
  const [boxEnd, setBoxEnd] = useState<Position>({ x: 0, y: 0 });

  const {
    rows,
    seats,
    areas,
    tables,
    structures,
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
    addMultipleRows,
    addStructure,
    setActiveTool,
    moveRow,
    moveArea,
    moveTable,
    moveStructure,
    moveSeat,
  } = useSeatMapStore();

  // Drag state for moving elements
  const [isElementDragging, setIsElementDragging] = useState(false);
  const [dragElementStart, setDragElementStart] = useState<Position>({
    x: 0,
    y: 0,
  });

  // Handle keyboard events for shift key and spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(true);
      if (e.key === " " && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
        setPreviousTool(activeTool);
        setActiveTool("pan");
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(false);
      if (e.key === " " && isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(false);
        if (previousTool) {
          setActiveTool(previousTool);
          setPreviousTool(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [activeTool, isSpacePressed, previousTool, setActiveTool]);

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
      const clickedElementId = selectedIds.find((id) => {
        if (target.closest(`[data-element-id="${id}"]`)) {
          return true;
        }
        return false;
      });

      if (clickedElementId && activeTool === "select") {
        setIsElementDragging(true);
        setDragElementStart(svgPoint);
        return;
      }

      // Start box selection on empty canvas with select tool
      if (activeTool === "select" && e.target === svgRef.current) {
        setIsBoxSelecting(true);
        setBoxStart(svgPoint);
        setBoxEnd(svgPoint);
        if (!isShiftPressed) {
          clearSelection();
        }
        return;
      }

      if (activeTool === "pan" || e.altKey) {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setLastPan(pan);
      } else if (activeTool === "addRow") {
        setPendingClick(svgPoint);
        setShowRowModal(true);
      } else if (activeTool === "addMultipleRows") {
        setPendingClick(svgPoint);
        setShowMultipleRowsModal(true);
      } else if (activeTool === "addArea") {
        setPendingClick(svgPoint);
        setShowAreaModal(true);
      } else if (activeTool === "addTable") {
        setPendingClick(svgPoint);
        setShowTableModal(true);
      } else if (activeTool === "addStructure") {
        setPendingClick(svgPoint);
        setShowStructureModal(true);
      } else {
        // Select tool - clear selection if clicking on empty space
        if (e.target === svgRef.current) {
          clearSelection();
        }
      }
    },
    [activeTool, pan, screenToSVG, clearSelection, selectedIds, isShiftPressed],
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

  // Handle multiple rows creation from modal
  const handleCreateMultipleRows = (
    rowConfigs: { label: string; seatCount: number; sectionId?: string }[],
    spacing: number,
  ) => {
    if (pendingClick) {
      addMultipleRows(rowConfigs, pendingClick, spacing);
      setPendingClick(null);
      setActiveTool("select");
    }
  };
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

  const handleCreateStructure = (
    label: string,
    type: "stage" | "bar" | "entrance" | "exit" | "custom",
    size: { width: number; height: number },
    color: string,
  ) => {
    if (pendingClick) {
      addStructure(label, type, pendingClick, size, color);
      setPendingClick(null);
      setActiveTool("select");
    }
  };

  // Handle mouse move (for panning, element dragging, and box selection)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Box selection
      if (isBoxSelecting) {
        const svgPoint = screenToSVG(e.clientX, e.clientY);
        setBoxEnd(svgPoint);
        return;
      }

      // Element dragging - move all selected elements
      if (isElementDragging) {
        const svgPoint = screenToSVG(e.clientX, e.clientY);
        const delta = {
          x: svgPoint.x - dragElementStart.x,
          y: svgPoint.y - dragElementStart.y,
        };

        // Move all selected elements
        selectedIds.forEach((id) => {
          if (id.startsWith("row_")) {
            moveRow(id as RowId, delta);
          } else if (id.startsWith("area_")) {
            moveArea(id as AreaId, delta);
          } else if (id.startsWith("table_")) {
            moveTable(id as TableId, delta);
          } else if (id.startsWith("structure_")) {
            moveStructure(id as StructureId, delta);
          } else if (id.startsWith("seat_")) {
            moveSeat(id as SeatId, delta);
          }
        });

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
      isBoxSelecting,
      activeTool,
      dragStart,
      lastPan,
      setPan,
      screenToSVG,
      selectedIds,
      dragElementStart,
      moveRow,
      moveArea,
      moveTable,
      moveStructure,
      moveSeat,
    ],
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    // Finish box selection and select elements inside
    if (isBoxSelecting) {
      const minX = Math.min(boxStart.x, boxEnd.x);
      const maxX = Math.max(boxStart.x, boxEnd.x);
      const minY = Math.min(boxStart.y, boxEnd.y);
      const maxY = Math.max(boxStart.y, boxEnd.y);

      const elementsInBox: string[] = [];

      // Check rows (use first seat position)
      Object.values(rows).forEach((row) => {
        const firstSeat = seats[row.seats[0]];
        if (firstSeat) {
          const x = firstSeat.position.x;
          const y = firstSeat.position.y;
          if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
            elementsInBox.push(row.id);
          }
        }
      });

      // Check areas
      Object.values(areas).forEach((area) => {
        const x = area.position.x + area.size.width / 2;
        const y = area.position.y + area.size.height / 2;
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          elementsInBox.push(area.id);
        }
      });

      // Check tables
      Object.values(tables).forEach((table) => {
        const x = table.position.x + table.size.width / 2;
        const y = table.position.y + table.size.height / 2;
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          elementsInBox.push(table.id);
        }
      });

      // Check structures
      Object.values(structures).forEach((structure) => {
        const x = structure.position.x + structure.size.width / 2;
        const y = structure.position.y + structure.size.height / 2;
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          elementsInBox.push(structure.id);
        }
      });

      // Check individual seats
      Object.values(seats)
        .filter((seat) => !seat.rowId && !seat.tableId)
        .forEach((seat) => {
          const x = seat.position.x;
          const y = seat.position.y;
          if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
            elementsInBox.push(seat.id);
          }
        });

      // Select all elements in box
      elementsInBox.forEach((id) => {
        if (!selectedIds.includes(id)) {
          selectElement(id, true);
        }
      });
    }

    setIsDragging(false);
    setIsElementDragging(false);
    setIsBoxSelecting(false);
  }, [
    isBoxSelecting,
    boxStart,
    boxEnd,
    rows,
    seats,
    areas,
    tables,
    structures,
    selectedIds,
    selectElement,
  ]);

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

  const handleStructureClick = useCallback(
    (structureId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      selectElement(structureId, isShiftPressed);
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

          {/* Render structures (between areas and rows) */}
          {Object.values(structures).map((structure) => (
            <Structure
              key={structure.id}
              structure={structure}
              isSelected={selectedIds.includes(structure.id)}
              onClick={(e) => handleStructureClick(structure.id, e)}
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

          {/* Box selection rectangle */}
          {isBoxSelecting && (
            <rect
              x={Math.min(boxStart.x, boxEnd.x)}
              y={Math.min(boxStart.y, boxEnd.y)}
              width={Math.abs(boxEnd.x - boxStart.x)}
              height={Math.abs(boxEnd.y - boxStart.y)}
              fill="rgba(59, 130, 246, 0.2)"
              stroke="#3b82f6"
              strokeWidth={1 / zoom}
              strokeDasharray={`${4 / zoom} ${4 / zoom}`}
            />
          )}
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

      <CreateMultipleRowsModal
        isOpen={showMultipleRowsModal}
        onClose={() => {
          setShowMultipleRowsModal(false);
          setPendingClick(null);
          setActiveTool("select");
        }}
        onCreate={handleCreateMultipleRows}
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

      <CreateStructureModal
        isOpen={showStructureModal}
        onClose={() => {
          setShowStructureModal(false);
          setPendingClick(null);
          setActiveTool("select");
        }}
        onCreate={handleCreateStructure}
      />
    </div>
  );
}
