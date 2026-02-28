"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useSeatMapStore } from "../../store/seatMapStore";
import { useThemeColors } from "../../hooks/useThemeColors";
import { Seat } from "./Seat";
import { Row } from "./Row";
import { Area } from "./Area";
import { Table } from "./Table";
import { Structure } from "./Structure";
import { CreateTableModal } from "../modals/CreateTableModal";
import { CreateAreaModal } from "../modals/CreateAreaModal";
import { CreateMultipleRowsModal } from "../modals/CreateMultipleRowsModal";
import { CreateStructureModal } from "../modals/CreateStructureModal";
import { CreateLineModal } from "../modals/CreateLineModal";
import { ContextMenu } from "../ContextMenu";
import { EditSelectionModal } from "../modals/EditSelectionModal";
import { ConfirmationModal } from "../modals/ConfirmationModal";
import type {
  Position,
  TableShape,
  RowId,
  AreaId,
  TableId,
  SeatId,
  StructureId,
  ElementId,
  ToolType,
  AreaShape,
  LineConfig,
} from "../../types";

const DEFAULT_ROW_SEAT_COUNT = 8;

const clampCurve = (curve: number): number =>
  Math.max(-1.5, Math.min(1.5, curve));

const getCurvedRowControlPoint = (
  start: Position,
  end: Position,
  curve: number,
): Position => {
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
  const sagitta = clampCurve(curve) * length * 0.35;

  return {
    x: midpoint.x + nx * sagitta,
    y: midpoint.y + ny * sagitta,
  };
};

const computeCurveFromPoint = (
  start: Position,
  end: Position,
  point: Position,
): number => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
  const projection = (point.x - midpoint.x) * nx + (point.y - midpoint.y) * ny;
  return clampCurve(projection / (length * 0.35));
};

const computeCurvedSeatPositions = (
  start: Position,
  end: Position,
  curve: number,
  seatCount: number,
): Position[] => {
  if (seatCount <= 0) return [];
  const control = getCurvedRowControlPoint(start, end, curve);

  return Array.from({ length: seatCount }, (_, index) => {
    const t = seatCount === 1 ? 0.5 : index / (seatCount - 1);
    const mt = 1 - t;

    return {
      x: mt * mt * start.x + 2 * mt * t * control.x + t * t * end.x,
      y: mt * mt * start.y + 2 * mt * t * control.y + t * t * end.y,
    };
  });
};

export function SeatMapCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { colors } = useThemeColors();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [lastPan, setLastPan] = useState<Position>({ x: 0, y: 0 });
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [pendingClick, setPendingClick] = useState<Position | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showMultipleRowsModal, setShowMultipleRowsModal] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showLineModal, setShowLineModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [previousTool, setPreviousTool] = useState<ToolType | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Box selection state
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const [boxStart, setBoxStart] = useState<Position>({ x: 0, y: 0 });
  const [boxEnd, setBoxEnd] = useState<Position>({ x: 0, y: 0 });
  const [isDrawingRow, setIsDrawingRow] = useState(false);
  const [rowDraftStart, setRowDraftStart] = useState<Position | null>(null);
  const [rowDraftEnd, setRowDraftEnd] = useState<Position | null>(null);
  const [rowDraftCurve] = useState(0.35);
  const [curveDraggingRowId, setCurveDraggingRowId] = useState<RowId | null>(
    null,
  );
  const [startDraggingRowId, setStartDraggingRowId] = useState<RowId | null>(
    null,
  );
  const [endDraggingRowId, setEndDraggingRowId] = useState<RowId | null>(null);

  const {
    rows,
    seats,
    areas,
    tables,
    structures,
    sections,
    selectedIds,
    purchaseSelectedSeatIds,
    zoom,
    pan,
    activeTool,
    appMode,
  } = useSeatMapStore(
    useShallow((state) => ({
      rows: state.rows,
      seats: state.seats,
      areas: state.areas,
      tables: state.tables,
      structures: state.structures,
      sections: state.sections,
      selectedIds: state.selectedIds,
      purchaseSelectedSeatIds: state.purchaseSelectedSeatIds,
      zoom: state.zoom,
      pan: state.pan,
      activeTool: state.activeTool,
      appMode: state.appMode,
    })),
  );

  const {
    selectElement,
    clearSelection,
    setPan,
    setZoom,
    addCurvedRow,
    addArea,
    addTable,
    addMultipleRows,
    addStructure,
    setActiveTool,
    deleteSelected,
    moveRow,
    moveArea,
    moveTable,
    moveStructure,
    moveSeat,
    bringToFront,
    sendToBack,
    rotateArea,
    rotateTable,
    rotateStructure,
    updateRowCurve,
    updateRowGeometry,
    undo,
    redo,
    copySelected,
    pasteClipboard,
    togglePurchaseSeat,
    lockElements,
    unlockElements,
  } = useSeatMapStore(
    useShallow((state) => ({
      selectElement: state.selectElement,
      clearSelection: state.clearSelection,
      setPan: state.setPan,
      setZoom: state.setZoom,
      addCurvedRow: state.addCurvedRow,
      addArea: state.addArea,
      addTable: state.addTable,
      addMultipleRows: state.addMultipleRows,
      addStructure: state.addStructure,
      setActiveTool: state.setActiveTool,
      deleteSelected: state.deleteSelected,
      moveRow: state.moveRow,
      moveArea: state.moveArea,
      moveTable: state.moveTable,
      moveStructure: state.moveStructure,
      moveSeat: state.moveSeat,
      bringToFront: state.bringToFront,
      sendToBack: state.sendToBack,
      rotateArea: state.rotateArea,
      rotateTable: state.rotateTable,
      rotateStructure: state.rotateStructure,
      updateRowCurve: state.updateRowCurve,
      updateRowGeometry: state.updateRowGeometry,
      undo: state.undo,
      redo: state.redo,
      copySelected: state.copySelected,
      pasteClipboard: state.pasteClipboard,
      togglePurchaseSeat: state.togglePurchaseSeat,
      lockElements: state.lockElements,
      unlockElements: state.unlockElements,
    })),
  );

  const isElementLockedById = useCallback(
    (id: string): boolean => {
      if (id.startsWith("row_")) return Boolean(rows[id]?.isLocked);
      if (id.startsWith("seat_")) return Boolean(seats[id as SeatId]?.isLocked);
      if (id.startsWith("area_")) return Boolean(areas[id]?.isLocked);
      if (id.startsWith("table_"))
        return Boolean(tables[id as TableId]?.isLocked);
      if (id.startsWith("structure_"))
        return Boolean(structures[id as StructureId]?.isLocked);
      return false;
    },
    [rows, seats, areas, tables, structures],
  );

  const getUnlockedElementIdAtPoint = useCallback(
    (clientX: number, clientY: number): string | null => {
      const elementsAtPoint = document.elementsFromPoint(clientX, clientY);
      for (const element of elementsAtPoint) {
        const elementId = element.getAttribute("data-element-id");
        if (!elementId) continue;
        if (isElementLockedById(elementId)) continue;
        return elementId;
      }
      return null;
    },
    [isElementLockedById],
  );

  const selectUnlockedElementAtPointer = useCallback(
    (e: React.MouseEvent, multi = false): boolean => {
      const unlockedId = getUnlockedElementIdAtPoint(e.clientX, e.clientY);
      if (!unlockedId) return false;
      selectElement(unlockedId as ElementId, multi);
      return true;
    },
    [getUnlockedElementIdAtPoint, selectElement],
  );

  // Drag state for moving elements
  const [isElementDragging, setIsElementDragging] = useState(false);
  const [dragElementStart, setDragElementStart] = useState<Position>({
    x: 0,
    y: 0,
  });
  const mouseMoveRafRef = useRef<number | null>(null);
  const scheduledMouseMoveRef = useRef<(() => void) | null>(null);

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedHasLocked = useMemo(
    () => selectedIds.some((id) => isElementLockedById(id)),
    [selectedIds, isElementLockedById],
  );
  const hasDraggableSelected = useMemo(
    () => selectedIds.some((id) => !isElementLockedById(id)),
    [selectedIds, isElementLockedById],
  );
  const shouldRenderSelectionDragHandle = useMemo(() => {
    if (selectedIds.length > 1) return true;
    if (selectedIds.length === 1) {
      return selectedIds[0].startsWith("row_");
    }
    return false;
  }, [selectedIds]);
  const multiSelectionBounds = useMemo(() => {
    if (selectedIds.length === 0) return null;

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    let hasBounds = false;

    selectedIds.forEach((id) => {
      if (id.startsWith("row_")) {
        const row = rows[id];
        if (!row) return;
        const rowSeats = row.seats
          .map((seatId) => seats[seatId])
          .filter((seat): seat is NonNullable<typeof seat> => Boolean(seat));
        if (rowSeats.length === 0) return;

        const rowMinX =
          Math.min(...rowSeats.map((seat) => seat.position.x)) - 24;
        const rowMaxX =
          Math.max(...rowSeats.map((seat) => seat.position.x)) + 24;
        const rowMinY =
          Math.min(...rowSeats.map((seat) => seat.position.y)) - 24;
        const rowMaxY =
          Math.max(...rowSeats.map((seat) => seat.position.y)) + 24;

        minX = Math.min(minX, rowMinX);
        maxX = Math.max(maxX, rowMaxX);
        minY = Math.min(minY, rowMinY);
        maxY = Math.max(maxY, rowMaxY);
        hasBounds = true;
        return;
      }

      if (id.startsWith("seat_")) {
        const seat = seats[id as SeatId];
        if (!seat) return;
        minX = Math.min(minX, seat.position.x - 14);
        maxX = Math.max(maxX, seat.position.x + 14);
        minY = Math.min(minY, seat.position.y - 14);
        maxY = Math.max(maxY, seat.position.y + 14);
        hasBounds = true;
        return;
      }

      if (id.startsWith("area_")) {
        const area = areas[id];
        if (!area) return;
        minX = Math.min(minX, area.position.x - 8);
        maxX = Math.max(maxX, area.position.x + area.size.width + 8);
        minY = Math.min(minY, area.position.y - 8);
        maxY = Math.max(maxY, area.position.y + area.size.height + 8);
        hasBounds = true;
        return;
      }

      if (id.startsWith("table_")) {
        const table = tables[id as TableId];
        if (!table) return;
        minX = Math.min(minX, table.position.x - 12);
        maxX = Math.max(maxX, table.position.x + table.size.width + 12);
        minY = Math.min(minY, table.position.y - 12);
        maxY = Math.max(maxY, table.position.y + table.size.height + 12);
        hasBounds = true;
        return;
      }

      if (id.startsWith("structure_")) {
        const structure = structures[id as StructureId];
        if (!structure) return;
        minX = Math.min(minX, structure.position.x - 8);
        maxX = Math.max(maxX, structure.position.x + structure.size.width + 8);
        minY = Math.min(minY, structure.position.y - 8);
        maxY = Math.max(maxY, structure.position.y + structure.size.height + 8);
        hasBounds = true;
      }
    });

    if (!hasBounds) return null;

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [selectedIds, rows, seats, areas, tables, structures]);
  const lockActionLabel: "Block" | "Unblock" = selectedHasLocked
    ? "Unblock"
    : "Block";
  const purchaseSelectedSeatSet = useMemo(
    () => new Set(purchaseSelectedSeatIds),
    [purchaseSelectedSeatIds],
  );
  const sortedAreas = useMemo(
    () =>
      [...Object.values(areas)].sort(
        (a, b) => (a.zIndex || 0) - (b.zIndex || 0),
      ),
    [areas],
  );
  const sortedStructures = useMemo(
    () =>
      [...Object.values(structures)].sort(
        (a, b) => (a.zIndex || 0) - (b.zIndex || 0),
      ),
    [structures],
  );
  const sortedRows = useMemo(
    () =>
      [...Object.values(rows)].sort(
        (a, b) => (a.zIndex || 0) - (b.zIndex || 0),
      ),
    [rows],
  );
  const sortedTables = useMemo(
    () =>
      [...Object.values(tables)].sort(
        (a, b) => (a.zIndex || 0) - (b.zIndex || 0),
      ),
    [tables],
  );
  const standaloneSeats = useMemo(
    () => Object.values(seats).filter((seat) => !seat.rowId && !seat.tableId),
    [seats],
  );

  const scheduleMouseMove = useCallback((callback: () => void) => {
    scheduledMouseMoveRef.current = callback;
    if (mouseMoveRafRef.current !== null) return;

    mouseMoveRafRef.current = window.requestAnimationFrame(() => {
      mouseMoveRafRef.current = null;
      const scheduled = scheduledMouseMoveRef.current;
      scheduledMouseMoveRef.current = null;
      scheduled?.();
    });
  }, []);

  useEffect(() => {
    return () => {
      if (mouseMoveRafRef.current !== null) {
        window.cancelAnimationFrame(mouseMoveRafRef.current);
      }
    };
  }, []);

  // Handle keyboard events for shift key, spacebar, rotation and layer shortcuts
  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;

      const tagName = target.tagName;
      if (
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT"
      ) {
        return true;
      }

      return (
        target.isContentEditable || !!target.closest("[contenteditable='true']")
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping = isTypingTarget(e.target);

      if (e.key === "Shift") setIsShiftPressed(true);
      if (e.key === " " && isTyping) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (appMode !== "editor") return;
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        if (appMode !== "editor") return;
        e.preventDefault();
        redo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (appMode !== "editor") return;
        if (!isTyping && selectedIds.length > 0) {
          e.preventDefault();
          copySelected();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        if (appMode !== "editor") return;
        if (!isTyping) {
          e.preventDefault();
          pasteClipboard();
        }
        return;
      }

      if (!isTyping && (e.key === "Delete" || e.key === "Backspace")) {
        if (appMode !== "editor") return;
        if (selectedIds.length > 0) {
          e.preventDefault();
          setShowDeleteConfirmModal(true);
        }
        return;
      }

      if (e.key === " " && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
        setPreviousTool(activeTool);
        setActiveTool("pan");
      }
      // Rotation shortcuts
      if (e.key === "r" || e.key === "R") {
        if (appMode !== "editor") return;
        if (selectedIds.length > 0) {
          const degrees = e.shiftKey ? -90 : 90;
          selectedIds.forEach((id) => {
            if (id.startsWith("area_")) rotateArea(id as AreaId, degrees);
            else if (id.startsWith("table_"))
              rotateTable(id as TableId, degrees);
            else if (id.startsWith("structure_"))
              rotateStructure(id as StructureId, degrees);
          });
        }
      }
      // Layer shortcuts - only bring to front / send to back
      if (
        (e.key === "]" || e.key === "}") &&
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey
      ) {
        if (appMode !== "editor") return;
        e.preventDefault();
        bringToFront(selectedIds);
      }
      if (
        (e.key === "[" || e.key === "{") &&
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey
      ) {
        if (appMode !== "editor") return;
        e.preventDefault();
        sendToBack(selectedIds);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(false);
      if (e.key === " " && isTypingTarget(e.target)) {
        return;
      }
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
  }, [
    appMode,
    activeTool,
    isSpacePressed,
    previousTool,
    setActiveTool,
    selectedIds,
    rotateArea,
    rotateTable,
    rotateStructure,
    bringToFront,
    sendToBack,
    undo,
    redo,
    copySelected,
    pasteClipboard,
  ]);

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

      const curveHandle = target.closest(
        "[data-row-curve-handle='true']",
      ) as SVGElement | null;
      const selectionDragHandle = target.closest(
        "[data-selection-drag-handle='true']",
      ) as SVGElement | null;
      const startHandle = target.closest(
        "[data-row-start-handle='true']",
      ) as SVGElement | null;
      const endHandle = target.closest(
        "[data-row-end-handle='true']",
      ) as SVGElement | null;

      if (appMode === "purchase") {
        if (activeTool === "pan" || e.altKey) {
          setIsDragging(true);
          setDragStart({ x: e.clientX, y: e.clientY });
          setLastPan(pan);
        }
        return;
      }

      if (
        activeTool === "select" &&
        selectionDragHandle &&
        hasDraggableSelected &&
        shouldRenderSelectionDragHandle
      ) {
        e.stopPropagation();
        setIsElementDragging(true);
        setDragElementStart(svgPoint);
        return;
      }

      if (activeTool === "select" && curveHandle) {
        const rowId = curveHandle.getAttribute("data-row-id");
        if (rowId && rows[rowId] && !rows[rowId].isLocked) {
          e.stopPropagation();
          setCurveDraggingRowId(rowId as RowId);
          return;
        }
      }

      if (activeTool === "select" && startHandle) {
        const rowId = startHandle.getAttribute("data-row-id");
        if (rowId && rows[rowId] && !rows[rowId].isLocked) {
          e.stopPropagation();
          setStartDraggingRowId(rowId as RowId);
          return;
        }
      }

      if (activeTool === "select" && endHandle) {
        const rowId = endHandle.getAttribute("data-row-id");
        if (rowId && rows[rowId] && !rows[rowId].isLocked) {
          e.stopPropagation();
          setEndDraggingRowId(rowId as RowId);
          return;
        }
      }

      if (activeTool === "addRow" && e.target === svgRef.current) {
        setIsDrawingRow(true);
        setRowDraftStart(svgPoint);
        setRowDraftEnd(svgPoint);
        return;
      }

      const unlockedElementId = getUnlockedElementIdAtPoint(
        e.clientX,
        e.clientY,
      );

      // Check if clicking on a selected element for dragging
      const clickedElementId =
        unlockedElementId && selectedIdSet.has(unlockedElementId)
          ? unlockedElementId
          : null;

      if (clickedElementId && activeTool === "select") {
        setIsElementDragging(true);
        setDragElementStart(svgPoint);
        return;
      }

      // Start box selection on empty canvas with select tool
      if (
        activeTool === "select" &&
        (e.target === svgRef.current || !unlockedElementId)
      ) {
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
      } else if (activeTool === "addLine") {
        setPendingClick(svgPoint);
        setShowLineModal(true);
      } else {
        // Select tool - clear selection if clicking on empty space
        if (e.target === svgRef.current) {
          clearSelection();
        }
      }
    },
    [
      appMode,
      activeTool,
      pan,
      screenToSVG,
      getUnlockedElementIdAtPoint,
      clearSelection,
      selectedIdSet,
      hasDraggableSelected,
      shouldRenderSelectionDragHandle,
      isShiftPressed,
      rows,
    ],
  );

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
    shape: AreaShape,
    opacity: number,
  ) => {
    if (pendingClick) {
      addArea(label, pendingClick, { width, height }, color, shape, opacity);
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

  const handleCreateLine = (
    label: string,
    color: string,
    strokeWidth: number,
    lineType: "straight" | "freehand",
    opacity: number,
  ) => {
    if (pendingClick) {
      const lineConfig: LineConfig = {
        points: [
          pendingClick,
          { x: pendingClick.x + 100, y: pendingClick.y + 100 },
        ],
        strokeWidth,
        lineType,
      };
      addArea(
        label,
        pendingClick,
        { width: 100, height: 100 },
        color,
        "line",
        opacity,
        lineConfig,
      );
      setPendingClick(null);
      setActiveTool("select");
    }
  };

  // Handle context menu
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (appMode !== "editor") {
        setContextMenu(null);
        return;
      }

      const target = e.target as Element;
      const clickedElement = target.closest("[data-element-id]");
      const clickedElementId = clickedElement?.getAttribute("data-element-id");
      if (clickedElementId && isElementLockedById(clickedElementId)) {
        const didSelectUnlocked = selectUnlockedElementAtPointer(e, false);
        if (!didSelectUnlocked) {
          selectElement(clickedElementId as ElementId, false);
        }
      } else if (clickedElementId && !selectedIdSet.has(clickedElementId)) {
        selectElement(clickedElementId as ElementId, false);
      }

      setContextMenu({ x: e.clientX, y: e.clientY });
    },
    [
      appMode,
      isElementLockedById,
      selectedIdSet,
      selectElement,
      selectUnlockedElementAtPointer,
    ],
  );

  const canEdit = () => {
    if (selectedIds.length === 0) return false;
    if (selectedIds.some((id) => isElementLockedById(id))) return false;
    if (selectedIds.length === 1) return true;
    const sectionIds = new Set<string | undefined>();
    for (const id of selectedIds) {
      let sectionId: string | undefined;
      if (id.startsWith("row_")) {
        sectionId = rows[id]?.sectionId;
      } else if (id.startsWith("seat_")) {
        sectionId = seats[id]?.sectionId;
      }
      sectionIds.add(sectionId);
    }
    return sectionIds.size === 1;
  };

  const handleEdit = () => {
    if (canEdit()) {
      setShowEditModal(true);
    }
  };

  const handleDeleteRequest = () => {
    if (selectedIds.some((id) => !isElementLockedById(id))) {
      setShowDeleteConfirmModal(true);
    }
  };

  const handleConfirmDelete = () => {
    deleteSelected();
    setShowDeleteConfirmModal(false);
  };

  // Handle mouse move (for panning, element dragging, and box selection)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const clientX = e.clientX;
      const clientY = e.clientY;

      scheduleMouseMove(() => {
        // Curvature handle drag
        if (curveDraggingRowId) {
          const row = rows[curveDraggingRowId];
          if (!row) return;

          const rowSeats = row.seats
            .map((seatId) => seats[seatId])
            .filter((seat): seat is NonNullable<typeof seat> => Boolean(seat));
          const start = row.start || rowSeats[0]?.position;
          const end = row.end || rowSeats[rowSeats.length - 1]?.position;
          if (!start || !end) return;

          const svgPoint = screenToSVG(clientX, clientY);
          const curve = computeCurveFromPoint(start, end, svgPoint);
          updateRowCurve(curveDraggingRowId, curve);
          return;
        }

        if (startDraggingRowId) {
          const row = rows[startDraggingRowId];
          if (!row) return;

          const rowSeats = row.seats
            .map((seatId) => seats[seatId])
            .filter((seat): seat is NonNullable<typeof seat> => Boolean(seat));
          const start = row.start || rowSeats[0]?.position;
          const end = row.end || rowSeats[rowSeats.length - 1]?.position;
          if (!start || !end) return;

          const svgPoint = screenToSVG(clientX, clientY);
          updateRowGeometry(startDraggingRowId, svgPoint, end, row.curve ?? 0);
          return;
        }

        if (endDraggingRowId) {
          const row = rows[endDraggingRowId];
          if (!row) return;

          const rowSeats = row.seats
            .map((seatId) => seats[seatId])
            .filter((seat): seat is NonNullable<typeof seat> => Boolean(seat));
          const start = row.start || rowSeats[0]?.position;
          const end = row.end || rowSeats[rowSeats.length - 1]?.position;
          if (!start || !end) return;

          const svgPoint = screenToSVG(clientX, clientY);
          updateRowGeometry(endDraggingRowId, start, svgPoint, row.curve ?? 0);
          return;
        }

        // Draft row drawing
        if (isDrawingRow) {
          const svgPoint = screenToSVG(clientX, clientY);
          setRowDraftEnd(svgPoint);
          return;
        }

        // Box selection
        if (isBoxSelecting) {
          const svgPoint = screenToSVG(clientX, clientY);
          setBoxEnd(svgPoint);
          return;
        }

        // Element dragging - move all selected elements
        if (isElementDragging) {
          const svgPoint = screenToSVG(clientX, clientY);
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

        const dx = clientX - dragStart.x;
        const dy = clientY - dragStart.y;

        setPan({
          x: lastPan.x + dx,
          y: lastPan.y + dy,
        });
      });
    },
    [
      isDragging,
      isDrawingRow,
      curveDraggingRowId,
      startDraggingRowId,
      endDraggingRowId,
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
      rows,
      seats,
      updateRowCurve,
      updateRowGeometry,
      scheduleMouseMove,
    ],
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (curveDraggingRowId) {
      setCurveDraggingRowId(null);
      return;
    }

    if (startDraggingRowId) {
      setStartDraggingRowId(null);
      return;
    }

    if (endDraggingRowId) {
      setEndDraggingRowId(null);
      return;
    }

    if (isDrawingRow && rowDraftStart && rowDraftEnd) {
      const length = Math.hypot(
        rowDraftEnd.x - rowDraftStart.x,
        rowDraftEnd.y - rowDraftStart.y,
      );

      if (length >= 20) {
        const rowLabel = `Row ${Object.keys(rows).length + 1}`;
        const rowId = addCurvedRow(
          rowLabel,
          DEFAULT_ROW_SEAT_COUNT,
          rowDraftStart,
          rowDraftEnd,
          rowDraftCurve,
        );
        selectElement(rowId, false);
        setActiveTool("select");
      }

      setIsDrawingRow(false);
      setRowDraftStart(null);
      setRowDraftEnd(null);
      return;
    }

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
        if (!selectedIdSet.has(id) && !isElementLockedById(id)) {
          selectElement(id, true);
        }
      });
    }

    setIsDragging(false);
    setIsElementDragging(false);
    setIsBoxSelecting(false);
  }, [
    curveDraggingRowId,
    startDraggingRowId,
    endDraggingRowId,
    isDrawingRow,
    rowDraftStart,
    rowDraftEnd,
    addCurvedRow,
    selectElement,
    setActiveTool,
    rowDraftCurve,
    rows,
    isBoxSelecting,
    boxStart,
    boxEnd,
    seats,
    areas,
    tables,
    structures,
    selectedIdSet,
    isElementLockedById,
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
      if (appMode !== "editor") return;
      if (isElementLockedById(rowId)) {
        selectUnlockedElementAtPointer(e, isShiftPressed);
        return;
      }
      selectElement(rowId, isShiftPressed);
    },
    [
      appMode,
      isElementLockedById,
      selectElement,
      isShiftPressed,
      selectUnlockedElementAtPointer,
    ],
  );

  const handleSeatClick = useCallback(
    (seatId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (appMode === "purchase") {
        togglePurchaseSeat(seatId);
        return;
      }
      if (isElementLockedById(seatId)) {
        selectUnlockedElementAtPointer(e, isShiftPressed);
        return;
      }
      selectElement(seatId, isShiftPressed);
    },
    [
      appMode,
      togglePurchaseSeat,
      isElementLockedById,
      selectElement,
      isShiftPressed,
      selectUnlockedElementAtPointer,
    ],
  );

  const handleAreaClick = useCallback(
    (areaId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (appMode !== "editor") return;
      if (isElementLockedById(areaId)) {
        selectUnlockedElementAtPointer(e, isShiftPressed);
        return;
      }
      selectElement(areaId, isShiftPressed);
    },
    [
      appMode,
      isElementLockedById,
      selectElement,
      isShiftPressed,
      selectUnlockedElementAtPointer,
    ],
  );

  const handleTableClick = useCallback(
    (tableId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (appMode !== "editor") return;
      if (isElementLockedById(tableId)) {
        selectUnlockedElementAtPointer(e, isShiftPressed);
        return;
      }
      selectElement(tableId, isShiftPressed);
    },
    [
      appMode,
      isElementLockedById,
      selectElement,
      isShiftPressed,
      selectUnlockedElementAtPointer,
    ],
  );

  const handleStructureClick = useCallback(
    (structureId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (appMode !== "editor") return;
      if (isElementLockedById(structureId)) {
        selectUnlockedElementAtPointer(e, isShiftPressed);
        return;
      }
      selectElement(structureId, isShiftPressed);
    },
    [
      appMode,
      isElementLockedById,
      selectElement,
      isShiftPressed,
      selectUnlockedElementAtPointer,
    ],
  );

  return (
    <div className={`absolute inset-0 ${colors.bgCanvas} w-full h-full`}>
      <svg
        ref={svgRef}
        className={`w-full h-full ${activeTool === "pan" || isDragging ? "cursor-grabbing" : activeTool !== "select" ? "cursor-crosshair" : "cursor-default"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Render areas sorted by zIndex */}
          {sortedAreas.map((area) => (
            <Area
              key={area.id}
              area={area}
              isSelected={appMode === "editor" && selectedIdSet.has(area.id)}
              onClick={(e) => handleAreaClick(area.id, e)}
              scale={zoom}
            />
          ))}

          {/* Row curve handles (only in select mode) */}
          {appMode === "editor" &&
            activeTool === "select" &&
            selectedIds
              .filter(
                (id) => id.startsWith("row_") && rows[id] && !rows[id].isLocked,
              )
              .map((rowId) => {
                const row = rows[rowId];
                const rowSeats = row.seats
                  .map((seatId) => seats[seatId])
                  .filter(Boolean);
                if (rowSeats.length === 0) return null;

                const start = row.start || rowSeats[0].position;
                const end = row.end || rowSeats[rowSeats.length - 1].position;
                const control = getCurvedRowControlPoint(
                  start,
                  end,
                  row.curve ?? 0,
                );

                return (
                  <g key={`row-curve-handle-${rowId}`}>
                    <circle
                      cx={start.x}
                      cy={start.y}
                      r={8 / zoom}
                      fill="#ffffff"
                      stroke="#16a34a"
                      strokeWidth={2 / zoom}
                      data-row-start-handle="true"
                      data-row-id={rowId}
                      className="cursor-ew-resize"
                    />

                    <circle
                      cx={end.x}
                      cy={end.y}
                      r={8 / zoom}
                      fill="#ffffff"
                      stroke="#dc2626"
                      strokeWidth={2 / zoom}
                      data-row-end-handle="true"
                      data-row-id={rowId}
                      className="cursor-ew-resize"
                    />

                    <circle
                      cx={control.x}
                      cy={control.y}
                      r={10 / zoom}
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth={2 / zoom}
                      data-row-curve-handle="true"
                      data-row-id={rowId}
                      className="cursor-grab"
                    />
                  </g>
                );
              })}

          {/* Render structures sorted by zIndex */}
          {sortedStructures.map((structure) => (
            <Structure
              key={structure.id}
              structure={structure}
              isSelected={
                appMode === "editor" && selectedIdSet.has(structure.id)
              }
              onClick={(e) => handleStructureClick(structure.id, e)}
              scale={zoom}
            />
          ))}

          {/* Render rows sorted by zIndex */}
          {sortedRows.map((row) => (
            <Row
              key={row.id}
              row={row}
              seats={row.seats.map((seatId) => seats[seatId]).filter(Boolean)}
              isSelected={appMode === "editor" && selectedIdSet.has(row.id)}
              onClick={(e) => handleRowClick(row.id, e)}
              onSeatClick={handleSeatClick}
              selectedIdSet={
                appMode === "purchase" ? purchaseSelectedSeatSet : selectedIdSet
              }
              scale={zoom}
              section={row.sectionId ? sections[row.sectionId] : undefined}
              appMode={appMode}
            />
          ))}

          {/* Render tables sorted by zIndex */}
          {sortedTables.map((table) => (
            <Table
              key={table.id}
              table={table}
              seats={table.seats.map((seatId) => seats[seatId]).filter(Boolean)}
              isSelected={appMode === "editor" && selectedIdSet.has(table.id)}
              onClick={(e) => handleTableClick(table.id, e)}
              onSeatClick={handleSeatClick}
              selectedIdSet={
                appMode === "purchase" ? purchaseSelectedSeatSet : selectedIdSet
              }
              scale={zoom}
              appMode={appMode}
            />
          ))}

          {/* Render individual seats (not in rows or tables) */}
          {standaloneSeats.map((seat) => (
            <Seat
              key={seat.id}
              seat={seat}
              isSelected={
                appMode === "purchase"
                  ? purchaseSelectedSeatSet.has(seat.id)
                  : selectedIdSet.has(seat.id)
              }
              onClick={handleSeatClick}
              scale={zoom}
              section={seat.sectionId ? sections[seat.sectionId] : undefined}
              appMode={appMode}
            />
          ))}

          {/* Expanded drag handle for multi-selection */}
          {appMode === "editor" &&
            activeTool === "select" &&
            multiSelectionBounds &&
            hasDraggableSelected &&
            shouldRenderSelectionDragHandle && (
              <g>
                <rect
                  x={multiSelectionBounds.x - 16}
                  y={multiSelectionBounds.y - 16}
                  width={multiSelectionBounds.width + 32}
                  height={multiSelectionBounds.height + 32}
                  fill="transparent"
                  pointerEvents="all"
                  data-selection-drag-handle="true"
                  className="cursor-move"
                />
                <rect
                  x={multiSelectionBounds.x}
                  y={multiSelectionBounds.y}
                  width={multiSelectionBounds.width}
                  height={multiSelectionBounds.height}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={1.5 / zoom}
                  strokeDasharray={`${5 / zoom} ${5 / zoom}`}
                  pointerEvents="none"
                />
              </g>
            )}

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

          {/* Draft curved row preview */}
          {isDrawingRow &&
            rowDraftStart &&
            rowDraftEnd &&
            (() => {
              const control = getCurvedRowControlPoint(
                rowDraftStart,
                rowDraftEnd,
                rowDraftCurve,
              );
              const draftPositions = computeCurvedSeatPositions(
                rowDraftStart,
                rowDraftEnd,
                rowDraftCurve,
                DEFAULT_ROW_SEAT_COUNT,
              );
              const path = `M ${rowDraftStart.x} ${rowDraftStart.y} Q ${control.x} ${control.y} ${rowDraftEnd.x} ${rowDraftEnd.y}`;

              return (
                <g>
                  <path
                    d={path}
                    fill="none"
                    stroke="#2563eb"
                    strokeDasharray={`${6 / zoom} ${6 / zoom}`}
                    strokeWidth={2 / zoom}
                    opacity={0.9}
                  />
                  {draftPositions.map((position, index) => (
                    <circle
                      key={`draft-seat-${index}`}
                      cx={position.x}
                      cy={position.y}
                      r={8 / zoom}
                      fill="#93c5fd"
                      stroke="#2563eb"
                      strokeWidth={1.5 / zoom}
                      opacity={0.9}
                    />
                  ))}
                </g>
              );
            })()}
        </g>
      </svg>

      {/* Modals */}
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

      <CreateLineModal
        isOpen={showLineModal}
        onClose={() => {
          setShowLineModal(false);
          setPendingClick(null);
          setActiveTool("select");
        }}
        onCreate={handleCreateLine}
      />

      {/* Context Menu */}
      {appMode === "editor" && contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          selectedIds={selectedIds}
          onClose={() => setContextMenu(null)}
          onToggleLock={() => {
            if (selectedHasLocked) {
              unlockElements(selectedIds);
              return;
            }
            lockElements(selectedIds);
          }}
          lockActionLabel={lockActionLabel}
          onBringToFront={() => bringToFront(selectedIds)}
          onSendToBack={() => sendToBack(selectedIds)}
          onRotate={(degrees) => {
            selectedIds.forEach((id) => {
              if (id.startsWith("area_")) rotateArea(id as AreaId, degrees);
              else if (id.startsWith("table_"))
                rotateTable(id as TableId, degrees);
              else if (id.startsWith("structure_"))
                rotateStructure(id as StructureId, degrees);
            });
          }}
          onDelete={handleDeleteRequest}
          onEdit={handleEdit}
          canEdit={canEdit()}
        />
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete selected items"
        message={`Are you sure you want to delete ${selectedIds.length} selected item${selectedIds.length === 1 ? "" : "s"}?`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />

      {/* Edit Selection Modal */}
      <EditSelectionModal
        key={`${showEditModal}-${selectedIds.join("|")}`}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        selectedIds={selectedIds}
        rows={rows}
        seats={seats}
        areas={areas}
        tables={tables}
        structures={structures}
        sections={sections}
      />
    </div>
  );
}
