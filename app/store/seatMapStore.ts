import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  SeatMapStore,
  SeatId,
  RowId,
  AreaId,
  TableId,
  SectionId,
  StructureId,
  ElementId,
  Seat,
  Row,
  Section,
  Structure,
  Position,
  AreaShape,
  LineConfig,
} from "../types";

const generateId = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const DEFAULT_ZOOM = 1;
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const CURVE_LIMIT = 1.5;
const HISTORY_LIMIT = 50;

type HistorySnapshot = {
  name: string;
  rows: Record<RowId, Row>;
  seats: Record<SeatId, Seat>;
  areas: SeatMapStore["areas"];
  tables: SeatMapStore["tables"];
  structures: SeatMapStore["structures"];
  sections: Record<SectionId, Section>;
  selectedIds: ElementId[];
};

const createHistorySnapshot = (state: SeatMapStore): HistorySnapshot => ({
  name: state.name,
  rows: structuredClone(state.rows),
  seats: structuredClone(state.seats),
  areas: structuredClone(state.areas),
  tables: structuredClone(state.tables),
  structures: structuredClone(state.structures),
  sections: structuredClone(state.sections),
  selectedIds: [...state.selectedIds],
});

const clampCurve = (curve: number): number =>
  Math.max(-CURVE_LIMIT, Math.min(CURVE_LIMIT, curve));

const inferRowEndpoints = (
  row: Row,
  seats: Record<SeatId, Seat>,
): { start: Position; end: Position } => {
  if (row.start && row.end) {
    return { start: row.start, end: row.end };
  }

  const firstSeat = seats[row.seats[0]];
  const lastSeat = seats[row.seats[row.seats.length - 1]];

  if (firstSeat && lastSeat) {
    return {
      start: firstSeat.position,
      end: lastSeat.position,
    };
  }

  return {
    start: row.position,
    end: {
      x: row.position.x + Math.max(1, row.seats.length - 1) * 35,
      y: row.position.y,
    },
  };
};

const computeCurvedRowSeatPositions = (
  start: Position,
  end: Position,
  curve: number,
  seatCount: number,
): Position[] => {
  if (seatCount <= 0) return [];

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const clampedCurve = clampCurve(curve);
  const sagitta = clampedCurve * length * 0.35;

  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };

  const control = {
    x: midpoint.x + nx * sagitta,
    y: midpoint.y + ny * sagitta,
  };

  return Array.from({ length: seatCount }, (_, index) => {
    const t = seatCount === 1 ? 0.5 : index / (seatCount - 1);
    const mt = 1 - t;

    return {
      x: mt * mt * start.x + 2 * mt * t * control.x + t * t * end.x,
      y: mt * mt * start.y + 2 * mt * t * control.y + t * t * end.y,
    };
  });
};

const buildCurvedRowData = (
  rowId: RowId,
  label: string,
  seatCount: number,
  start: Position,
  end: Position,
  curve: number,
  sectionId?: SectionId,
): {
  row: Row;
  seatIds: SeatId[];
  seats: Record<SeatId, Seat>;
} => {
  const seatIds: SeatId[] = [];
  const seats: Record<SeatId, Seat> = {};
  const positions = computeCurvedRowSeatPositions(start, end, curve, seatCount);

  for (let i = 0; i < seatCount; i++) {
    const seatId = generateId("seat") as SeatId;
    seatIds.push(seatId);
    seats[seatId] = {
      id: seatId,
      label: `${i + 1}`,
      position: positions[i],
      type: "seat",
      status: "available",
      rowId,
      sectionId,
    };
  }

  const row: Row = {
    id: rowId,
    label,
    position: {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    },
    seats: seatIds,
    curve: clampCurve(curve),
    start,
    end,
    sectionId,
  };

  return { row, seatIds, seats };
};

const initialState = {
  name: "Untitled Map",
  rows: {},
  seats: {},
  areas: {},
  tables: {},
  structures: {},
  sections: {},
  selectedIds: [],
  zoom: DEFAULT_ZOOM,
  pan: { x: 0, y: 0 },
  activeTool: "select" as const,
};

let historyPast: HistorySnapshot[] = [];
let historyFuture: HistorySnapshot[] = [];
let isHistorySuspended = false;

export const useSeatMapStore = create<SeatMapStore>()(
  persist(
    (set, get) => {
      const recordHistory = (): void => {
        if (isHistorySuspended) return;
        const snapshot = createHistorySnapshot(get());
        historyPast = [...historyPast, snapshot].slice(-HISTORY_LIMIT);
        historyFuture = [];
      };

      return {
        ...initialState,

        // Row actions
        addRow: (
          label,
          seatCount,
          position = { x: 100, y: 100 },
          sectionId?: SectionId,
        ) => {
          recordHistory();
          const rowId = generateId("row") as RowId;
          const end = {
            x: position.x + Math.max(1, seatCount - 1) * 35,
            y: position.y,
          };
          const { row, seats } = buildCurvedRowData(
            rowId,
            label,
            seatCount,
            position,
            end,
            0,
            sectionId,
          );

          set((state) => ({
            rows: {
              ...state.rows,
              [rowId]: row,
            },
            seats: { ...state.seats, ...seats },
          }));

          return rowId;
        },

        addCurvedRow: (
          label,
          seatCount,
          start,
          end,
          curve = 0.35,
          sectionId,
        ) => {
          recordHistory();
          const rowId = generateId("row") as RowId;
          const { row, seats } = buildCurvedRowData(
            rowId,
            label,
            seatCount,
            start,
            end,
            curve,
            sectionId,
          );

          set((state) => ({
            rows: {
              ...state.rows,
              [rowId]: row,
            },
            seats: { ...state.seats, ...seats },
          }));

          return rowId;
        },

        removeRow: (rowId) => {
          const row = get().rows[rowId];
          if (!row) return;
          recordHistory();

          const seats = { ...get().seats };
          row.seats.forEach((seatId) => {
            delete seats[seatId];
          });

          const rows = { ...get().rows };
          delete rows[rowId];

          set({
            rows,
            seats,
            selectedIds: get().selectedIds.filter(
              (id) => id !== rowId && !row.seats.includes(id as SeatId),
            ),
          });
        },

        updateRowSeatCount: (rowId, seatCount) => {
          const row = get().rows[rowId];
          if (!row) return;
          const nextSeatCount = Math.max(1, Math.floor(seatCount));
          recordHistory();

          set((state) => {
            const currentRow = state.rows[rowId];
            if (!currentRow) return state;

            const existingSeatIds = [...currentRow.seats];
            const updatedSeatIds = existingSeatIds.slice(0, nextSeatCount);
            const removedSeatIds = existingSeatIds.slice(nextSeatCount);
            const updatedSeats = { ...state.seats };

            removedSeatIds.forEach((seatId) => {
              delete updatedSeats[seatId];
            });

            if (nextSeatCount > existingSeatIds.length) {
              for (let i = existingSeatIds.length; i < nextSeatCount; i++) {
                const seatId = generateId("seat") as SeatId;
                updatedSeatIds.push(seatId);
                updatedSeats[seatId] = {
                  id: seatId,
                  label: `${i + 1}`,
                  position: currentRow.position,
                  type: "seat",
                  status: "available",
                  rowId,
                  sectionId: currentRow.sectionId,
                };
              }
            }

            const { start, end } = inferRowEndpoints(currentRow, state.seats);
            const curve = currentRow.curve ?? 0;
            const positions = computeCurvedRowSeatPositions(
              start,
              end,
              curve,
              updatedSeatIds.length,
            );

            updatedSeatIds.forEach((seatId, index) => {
              const existingSeat = updatedSeats[seatId];
              updatedSeats[seatId] = {
                id: seatId,
                label: `${index + 1}`,
                position: positions[index],
                type: existingSeat?.type || "seat",
                status: existingSeat?.status || "available",
                rowId,
                sectionId:
                  currentRow.sectionId !== undefined
                    ? currentRow.sectionId
                    : existingSeat?.sectionId,
              };
            });

            return {
              rows: {
                ...state.rows,
                [rowId]: {
                  ...currentRow,
                  seats: updatedSeatIds,
                  start,
                  end,
                  curve,
                  position: {
                    x: (start.x + end.x) / 2,
                    y: (start.y + end.y) / 2,
                  },
                },
              },
              seats: updatedSeats,
              selectedIds: state.selectedIds.filter(
                (id) => !removedSeatIds.includes(id as SeatId),
              ),
            };
          });
        },

        updateRowCurve: (rowId, curve) => {
          const row = get().rows[rowId];
          if (!row) return;
          recordHistory();

          const currentSeats = get().seats;
          const { start, end } = inferRowEndpoints(row, currentSeats);
          const nextCurve = clampCurve(curve);
          const positions = computeCurvedRowSeatPositions(
            start,
            end,
            nextCurve,
            row.seats.length,
          );

          set((state) => {
            const updatedSeats = { ...state.seats };
            row.seats.forEach((seatId, index) => {
              const seat = updatedSeats[seatId];
              if (!seat) return;
              updatedSeats[seatId] = {
                ...seat,
                position: positions[index],
              };
            });

            return {
              rows: {
                ...state.rows,
                [rowId]: {
                  ...state.rows[rowId],
                  curve: nextCurve,
                  start,
                  end,
                  position: {
                    x: (start.x + end.x) / 2,
                    y: (start.y + end.y) / 2,
                  },
                },
              },
              seats: updatedSeats,
            };
          });
        },

        updateRowGeometry: (rowId, start, end, curve) => {
          const row = get().rows[rowId];
          if (!row) return;
          recordHistory();

          const nextCurve = clampCurve(curve ?? row.curve ?? 0);
          const positions = computeCurvedRowSeatPositions(
            start,
            end,
            nextCurve,
            row.seats.length,
          );

          set((state) => {
            const updatedSeats = { ...state.seats };
            row.seats.forEach((seatId, index) => {
              const seat = updatedSeats[seatId];
              if (!seat) return;
              updatedSeats[seatId] = {
                ...seat,
                position: positions[index],
              };
            });

            return {
              rows: {
                ...state.rows,
                [rowId]: {
                  ...state.rows[rowId],
                  start,
                  end,
                  curve: nextCurve,
                  position: {
                    x: (start.x + end.x) / 2,
                    y: (start.y + end.y) / 2,
                  },
                },
              },
              seats: updatedSeats,
            };
          });
        },

        removeRows: (rowIds) => {
          const currentRows = get().rows;
          const currentSeats = get().seats;
          recordHistory();
          const rows = { ...currentRows };
          const seats = { ...currentSeats };
          const seatsToRemove: SeatId[] = [];

          rowIds.forEach((rowId) => {
            const row = currentRows[rowId];
            if (row) {
              row.seats.forEach((seatId) => {
                delete seats[seatId];
                seatsToRemove.push(seatId);
              });
              delete rows[rowId];
            }
          });

          set({
            rows,
            seats,
            selectedIds: get().selectedIds.filter(
              (id) =>
                !rowIds.includes(id as RowId) &&
                !seatsToRemove.includes(id as SeatId),
            ),
          });
        },

        addMultipleRows: (rowConfigs, basePosition, spacing = 50) => {
          recordHistory();
          const rowIds: RowId[] = [];
          const newRows: Record<RowId, Row> = {};
          const newSeats: Record<SeatId, Seat> = {};

          rowConfigs.forEach((config, index) => {
            const rowId = generateId("row") as RowId;
            const seatIds: SeatId[] = [];
            const yPosition = basePosition.y + index * spacing;

            for (let i = 0; i < config.seatCount; i++) {
              const seatId = generateId("seat") as SeatId;
              seatIds.push(seatId);
              newSeats[seatId] = {
                id: seatId,
                label: `${i + 1}`,
                position: { x: basePosition.x + i * 35, y: yPosition },
                type: "seat",
                status: "available",
                rowId,
                sectionId: config.sectionId,
              };
            }

            newRows[rowId] = {
              id: rowId,
              label: config.label,
              position: { x: basePosition.x, y: yPosition },
              seats: seatIds,
              curve: 0,
              start: { x: basePosition.x, y: yPosition },
              end: {
                x: basePosition.x + Math.max(1, config.seatCount - 1) * 35,
                y: yPosition,
              },
              sectionId: config.sectionId,
            };

            rowIds.push(rowId);
          });

          set((state) => ({
            rows: { ...state.rows, ...newRows },
            seats: { ...state.seats, ...newSeats },
          }));

          return rowIds;
        },

        updateRowLabel: (rowId, label) => {
          recordHistory();
          set((state) => ({
            rows: { ...state.rows, [rowId]: { ...state.rows[rowId], label } },
          }));
        },

        updateRowSection: (rowId, sectionId) => {
          const row = get().rows[rowId];
          if (!row) return;
          recordHistory();

          set((state) => {
            const updatedSeats = { ...state.seats };
            row.seats.forEach((seatId) => {
              if (updatedSeats[seatId]) {
                updatedSeats[seatId] = {
                  ...updatedSeats[seatId],
                  sectionId,
                };
              }
            });

            return {
              rows: {
                ...state.rows,
                [rowId]: {
                  ...state.rows[rowId],
                  sectionId,
                },
              },
              seats: updatedSeats,
            };
          });
        },

        addSection: (
          label: string,
          color: string,
          sectionNumber: number,
          price?: number,
        ) => {
          recordHistory();
          const sectionId = generateId("section") as SectionId;
          const section: Section = {
            id: sectionId,
            label,
            color,
            sectionNumber,
            price,
          };
          set((state) => ({
            sections: { ...state.sections, [sectionId]: section },
          }));
          return sectionId;
        },

        removeSection: (sectionId: SectionId) => {
          recordHistory();
          const sections = { ...get().sections };
          delete sections[sectionId];
          set({
            sections,
            selectedIds: get().selectedIds.filter((id) => id !== sectionId),
          });
        },

        updateSection: (sectionId: SectionId, updates: Partial<Section>) => {
          recordHistory();
          set((state) => ({
            sections: {
              ...state.sections,
              [sectionId]: { ...state.sections[sectionId], ...updates },
            },
          }));
        },

        // Seat actions
        updateSeatLabel: (seatId, label) => {
          recordHistory();
          set((state) => ({
            seats: {
              ...state.seats,
              [seatId]: { ...state.seats[seatId], label },
            },
          }));
        },

        updateSeatType: (seatId, type) => {
          recordHistory();
          set((state) => ({
            seats: {
              ...state.seats,
              [seatId]: { ...state.seats[seatId], type },
            },
          }));
        },

        updateSeatSection: (seatId, sectionId) => {
          recordHistory();
          set((state) => ({
            seats: {
              ...state.seats,
              [seatId]: { ...state.seats[seatId], sectionId },
            },
          }));
        },

        removeSeat: (seatId) => {
          const seat = get().seats[seatId];
          if (!seat) return;

          const seats = { ...get().seats };
          delete seats[seatId];

          // Also remove from parent row if applicable
          if (seat.rowId) {
            const row = get().rows[seat.rowId];
            if (row) {
              const rowId = seat.rowId;
              const updatedRow = {
                ...row,
                seats: row.seats.filter((id) => id !== seatId),
              };
              set((state) => ({
                rows: { ...state.rows, [rowId]: updatedRow },
                seats,
                selectedIds: state.selectedIds.filter((id) => id !== seatId),
              }));
              return;
            }
          }

          set({
            seats,
            selectedIds: get().selectedIds.filter((id) => id !== seatId),
          });
        },

        removeSeats: (seatIds) => {
          const currentSeats = get().seats;
          const seats = { ...currentSeats };
          const currentRows = { ...get().rows };
          const updatedRows: Record<RowId, Row> = {};

          seatIds.forEach((seatId) => {
            const seat = currentSeats[seatId];
            if (seat) {
              delete seats[seatId];
              if (seat.rowId && currentRows[seat.rowId]) {
                if (!updatedRows[seat.rowId]) {
                  updatedRows[seat.rowId] = { ...currentRows[seat.rowId] };
                }
                updatedRows[seat.rowId].seats = updatedRows[
                  seat.rowId
                ].seats.filter((id) => id !== seatId);
              }
            }
          });

          set((state) => ({
            rows: { ...state.rows, ...updatedRows },
            seats,
            selectedIds: state.selectedIds.filter(
              (id) => !seatIds.includes(id as SeatId),
            ),
          }));
        },

        // Area actions
        addArea: (
          label,
          position,
          size,
          color = "#e5e7eb",
          shape: AreaShape = "rectangle",
          opacity = 0.8,
          lineConfig?: LineConfig,
        ) => {
          recordHistory();
          const areaId = generateId("area") as AreaId;

          set((state) => ({
            areas: {
              ...state.areas,
              [areaId]: {
                id: areaId,
                label,
                position,
                size,
                color,
                shape,
                opacity,
                rotation: 0,
                zIndex: 0,
                lineConfig,
              },
            },
          }));

          return areaId;
        },

        removeArea: (areaId) => {
          recordHistory();
          const areas = { ...get().areas };
          delete areas[areaId];

          set({
            areas,
            selectedIds: get().selectedIds.filter((id) => id !== areaId),
          });
        },

        updateAreaLabel: (areaId, label) => {
          recordHistory();
          set((state) => ({
            areas: {
              ...state.areas,
              [areaId]: { ...state.areas[areaId], label },
            },
          }));
        },

        updateArea: (areaId, updates) => {
          recordHistory();
          set((state) => ({
            areas: {
              ...state.areas,
              [areaId]: { ...state.areas[areaId], ...updates },
            },
          }));
        },

        // Table actions
        addTable: (label, position, shape, size, seatCount) => {
          recordHistory();
          const tableId = generateId("table") as TableId;
          const seatIds: SeatId[] = [];
          const seats: Record<SeatId, Seat> = {};

          if (shape === "round") {
            const radius = Math.max(size.width, size.height) / 2;
            for (let i = 0; i < seatCount; i++) {
              const angle = (i / seatCount) * 2 * Math.PI - Math.PI / 2;
              const seatId = generateId("seat") as SeatId;
              seatIds.push(seatId);
              seats[seatId] = {
                id: seatId,
                label: `${i + 1}`,
                position: {
                  x:
                    position.x +
                    size.width / 2 +
                    Math.cos(angle) * (radius + 25),
                  y:
                    position.y +
                    size.height / 2 +
                    Math.sin(angle) * (radius + 25),
                },
                type: "seat",
                status: "available",
                tableId,
              };
            }
          } else {
            // Rectangular table - place seats around the perimeter
            const { width, height } = size;
            const offset = 30; // Distance from table edge to seat center

            // Calculate available space on each edge (minus corners)
            const topEdge = width;
            const bottomEdge = width;
            const leftEdge = height;
            const rightEdge = height;
            const totalPerimeter = topEdge + bottomEdge + leftEdge + rightEdge;

            // Distribute seats proportionally
            const topCount = Math.max(
              1,
              Math.round((topEdge / totalPerimeter) * seatCount),
            );
            const bottomCount = Math.max(
              1,
              Math.round((bottomEdge / totalPerimeter) * seatCount),
            );
            const sideCount = Math.max(
              1,
              Math.floor(
                (((leftEdge + rightEdge) / totalPerimeter) * seatCount) / 2,
              ),
            );
            const leftCount = sideCount;
            const rightCount = seatCount - topCount - bottomCount - leftCount;

            let seatIndex = 0;

            // Top edge seats (left to right)
            for (let i = 0; i < topCount && seatIndex < seatCount; i++) {
              const x = position.x + (width / (topCount + 1)) * (i + 1);
              const y = position.y - offset;
              const seatId = generateId("seat") as SeatId;
              seatIds.push(seatId);
              seats[seatId] = {
                id: seatId,
                label: `${seatIndex + 1}`,
                position: { x, y },
                type: "seat",
                status: "available",
                tableId,
              };
              seatIndex++;
            }

            // Right edge seats (top to bottom)
            for (let i = 0; i < rightCount && seatIndex < seatCount; i++) {
              const x = position.x + width + offset;
              const y = position.y + (height / (rightCount + 1)) * (i + 1);
              const seatId = generateId("seat") as SeatId;
              seatIds.push(seatId);
              seats[seatId] = {
                id: seatId,
                label: `${seatIndex + 1}`,
                position: { x, y },
                type: "seat",
                status: "available",
                tableId,
              };
              seatIndex++;
            }

            // Bottom edge seats (left to right)
            for (let i = 0; i < bottomCount && seatIndex < seatCount; i++) {
              const x = position.x + (width / (bottomCount + 1)) * (i + 1);
              const y = position.y + height + offset;
              const seatId = generateId("seat") as SeatId;
              seatIds.push(seatId);
              seats[seatId] = {
                id: seatId,
                label: `${seatIndex + 1}`,
                position: { x, y },
                type: "seat",
                status: "available",
                tableId,
              };
              seatIndex++;
            }

            // Left edge seats (top to bottom)
            for (let i = 0; i < leftCount && seatIndex < seatCount; i++) {
              const x = position.x - offset;
              const y = position.y + (height / (leftCount + 1)) * (i + 1);
              const seatId = generateId("seat") as SeatId;
              seatIds.push(seatId);
              seats[seatId] = {
                id: seatId,
                label: `${seatIndex + 1}`,
                position: { x, y },
                type: "seat",
                status: "available",
                tableId,
              };
              seatIndex++;
            }
          }

          set((state) => ({
            tables: {
              ...state.tables,
              [tableId]: {
                id: tableId,
                label,
                position,
                shape,
                size,
                seats: seatIds,
              },
            },
            seats: { ...state.seats, ...seats },
          }));

          return tableId;
        },

        removeTable: (tableId) => {
          recordHistory();
          const table = get().tables[tableId];
          if (!table) return;

          const seats = { ...get().seats };
          table.seats.forEach((seatId) => {
            delete seats[seatId];
          });

          const tables = { ...get().tables };
          delete tables[tableId];

          set({
            tables,
            seats,
            selectedIds: get().selectedIds.filter(
              (id) => id !== tableId && !table.seats.includes(id as SeatId),
            ),
          });
        },

        updateTableLabel: (tableId, label) => {
          recordHistory();
          set((state) => ({
            tables: {
              ...state.tables,
              [tableId]: { ...state.tables[tableId], label },
            },
          }));
        },

        updateTable: (tableId, updates) => {
          recordHistory();
          set((state) => ({
            tables: {
              ...state.tables,
              [tableId]: { ...state.tables[tableId], ...updates },
            },
          }));
        },

        // Structure actions
        addStructure: (
          label: string,
          type: Structure["type"],
          position: { x: number; y: number },
          size = { width: 120, height: 80 },
          color = "#6b7280",
        ) => {
          recordHistory();
          const structureId = generateId("structure") as StructureId;
          const defaultSizes = {
            stage: { width: 200, height: 80 },
            bar: { width: 120, height: 60 },
            entrance: { width: 80, height: 60 },
            exit: { width: 80, height: 60 },
            custom: { width: 100, height: 60 },
          };

          const defaultColors = {
            stage: "#dc2626",
            bar: "#facc15",
            entrance: "#16a34a",
            exit: "#f97316",
            custom: "#6b7280",
          };

          const structure: Structure = {
            id: structureId,
            label,
            type,
            position,
            size: size || defaultSizes[type],
            color: color || defaultColors[type],
          };

          set((state) => ({
            structures: { ...state.structures, [structureId]: structure },
          }));
          return structureId;
        },

        removeStructure: (structureId) => {
          recordHistory();
          const structures = { ...get().structures };
          delete structures[structureId];
          set({
            structures,
            selectedIds: get().selectedIds.filter((id) => id !== structureId),
          });
        },

        updateStructureLabel: (structureId, label) => {
          recordHistory();
          set((state) => ({
            structures: {
              ...state.structures,
              [structureId]: { ...state.structures[structureId], label },
            },
          }));
        },

        updateStructure: (structureId, updates) => {
          recordHistory();
          set((state) => ({
            structures: {
              ...state.structures,
              [structureId]: { ...state.structures[structureId], ...updates },
            },
          }));
        },

        moveStructure: (structureId, delta) => {
          set((state) => ({
            structures: {
              ...state.structures,
              [structureId]: {
                ...state.structures[structureId],
                position: {
                  x: state.structures[structureId].position.x + delta.x,
                  y: state.structures[structureId].position.y + delta.y,
                },
              },
            },
          }));
        },

        // Resize actions
        resizeArea: (areaId, newSize) => {
          set((state) => ({
            areas: {
              ...state.areas,
              [areaId]: { ...state.areas[areaId], size: newSize },
            },
          }));
        },

        resizeTable: (tableId, newSize) => {
          set((state) => ({
            tables: {
              ...state.tables,
              [tableId]: { ...state.tables[tableId], size: newSize },
            },
          }));
        },

        resizeStructure: (structureId, newSize) => {
          set((state) => ({
            structures: {
              ...state.structures,
              [structureId]: {
                ...state.structures[structureId],
                size: newSize,
              },
            },
          }));
        },

        // Rotate actions
        rotateArea: (areaId, degrees) => {
          set((state) => ({
            areas: {
              ...state.areas,
              [areaId]: {
                ...state.areas[areaId],
                rotation: (state.areas[areaId].rotation || 0) + degrees,
              },
            },
          }));
        },

        rotateTable: (tableId, degrees) => {
          set((state) => ({
            tables: {
              ...state.tables,
              [tableId]: {
                ...state.tables[tableId],
                rotation: (state.tables[tableId].rotation || 0) + degrees,
              },
            },
          }));
        },

        rotateStructure: (structureId, degrees) => {
          set((state) => ({
            structures: {
              ...state.structures,
              [structureId]: {
                ...state.structures[structureId],
                rotation:
                  (state.structures[structureId].rotation || 0) + degrees,
              },
            },
          }));
        },

        // Opacity action (for areas)
        setAreaOpacity: (areaId, opacity) => {
          set((state) => ({
            areas: {
              ...state.areas,
              [areaId]: { ...state.areas[areaId], opacity },
            },
          }));
        },

        // Layer actions (zIndex)
        bringToFront: (elementIds) => {
          const state = get();
          const maxZ = Math.max(
            0,
            ...Object.values(state.areas).map((a) => a.zIndex || 0),
            ...Object.values(state.tables).map((t) => t.zIndex || 0),
            ...Object.values(state.structures).map((s) => s.zIndex || 0),
            ...Object.values(state.rows).map((r) => r.zIndex || 0),
          );
          set((state) => {
            const updates: Partial<typeof state> = {};
            elementIds.forEach((id) => {
              if (id.startsWith("area_") && state.areas[id]) {
                if (!updates.areas) updates.areas = { ...state.areas };
                updates.areas[id] = { ...state.areas[id], zIndex: maxZ + 1 };
              } else if (id.startsWith("table_") && state.tables[id]) {
                if (!updates.tables) updates.tables = { ...state.tables };
                updates.tables[id] = { ...state.tables[id], zIndex: maxZ + 1 };
              } else if (id.startsWith("structure_") && state.structures[id]) {
                if (!updates.structures)
                  updates.structures = { ...state.structures };
                updates.structures[id] = {
                  ...state.structures[id],
                  zIndex: maxZ + 1,
                };
              } else if (id.startsWith("row_") && state.rows[id]) {
                if (!updates.rows) updates.rows = { ...state.rows };
                updates.rows[id] = { ...state.rows[id], zIndex: maxZ + 1 };
              }
            });
            return updates;
          });
        },

        sendToBack: (elementIds) => {
          const state = get();
          const minZ = Math.min(
            0,
            ...Object.values(state.areas).map((a) => a.zIndex || 0),
            ...Object.values(state.tables).map((t) => t.zIndex || 0),
            ...Object.values(state.structures).map((s) => s.zIndex || 0),
            ...Object.values(state.rows).map((r) => r.zIndex || 0),
          );
          set((state) => {
            const updates: Partial<typeof state> = {};
            elementIds.forEach((id) => {
              if (id.startsWith("area_") && state.areas[id]) {
                if (!updates.areas) updates.areas = { ...state.areas };
                updates.areas[id] = { ...state.areas[id], zIndex: minZ - 1 };
              } else if (id.startsWith("table_") && state.tables[id]) {
                if (!updates.tables) updates.tables = { ...state.tables };
                updates.tables[id] = { ...state.tables[id], zIndex: minZ - 1 };
              } else if (id.startsWith("structure_") && state.structures[id]) {
                if (!updates.structures)
                  updates.structures = { ...state.structures };
                updates.structures[id] = {
                  ...state.structures[id],
                  zIndex: minZ - 1,
                };
              } else if (id.startsWith("row_") && state.rows[id]) {
                if (!updates.rows) updates.rows = { ...state.rows };
                updates.rows[id] = { ...state.rows[id], zIndex: minZ - 1 };
              }
            });
            return updates;
          });
        },

        bringForward: (elementIds) => {
          set((state) => {
            const updates: Partial<typeof state> = {};
            elementIds.forEach((id) => {
              if (id.startsWith("area_") && state.areas[id]) {
                if (!updates.areas) updates.areas = { ...state.areas };
                updates.areas[id] = {
                  ...state.areas[id],
                  zIndex: (state.areas[id].zIndex || 0) + 1,
                };
              } else if (id.startsWith("table_") && state.tables[id]) {
                if (!updates.tables) updates.tables = { ...state.tables };
                updates.tables[id] = {
                  ...state.tables[id],
                  zIndex: (state.tables[id].zIndex || 0) + 1,
                };
              } else if (id.startsWith("structure_") && state.structures[id]) {
                if (!updates.structures)
                  updates.structures = { ...state.structures };
                updates.structures[id] = {
                  ...state.structures[id],
                  zIndex: (state.structures[id].zIndex || 0) + 1,
                };
              } else if (id.startsWith("row_") && state.rows[id]) {
                if (!updates.rows) updates.rows = { ...state.rows };
                updates.rows[id] = {
                  ...state.rows[id],
                  zIndex: (state.rows[id].zIndex || 0) + 1,
                };
              }
            });
            return updates;
          });
        },

        sendBackward: (elementIds) => {
          set((state) => {
            const updates: Partial<typeof state> = {};
            elementIds.forEach((id) => {
              if (id.startsWith("area_") && state.areas[id]) {
                if (!updates.areas) updates.areas = { ...state.areas };
                updates.areas[id] = {
                  ...state.areas[id],
                  zIndex: (state.areas[id].zIndex || 0) - 1,
                };
              } else if (id.startsWith("table_") && state.tables[id]) {
                if (!updates.tables) updates.tables = { ...state.tables };
                updates.tables[id] = {
                  ...state.tables[id],
                  zIndex: (state.tables[id].zIndex || 0) - 1,
                };
              } else if (id.startsWith("structure_") && state.structures[id]) {
                if (!updates.structures)
                  updates.structures = { ...state.structures };
                updates.structures[id] = {
                  ...state.structures[id],
                  zIndex: (state.structures[id].zIndex || 0) - 1,
                };
              } else if (id.startsWith("row_") && state.rows[id]) {
                if (!updates.rows) updates.rows = { ...state.rows };
                updates.rows[id] = {
                  ...state.rows[id],
                  zIndex: (state.rows[id].zIndex || 0) - 1,
                };
              }
            });
            return updates;
          });
        },

        // Move actions
        moveRow: (rowId, delta) => {
          const row = get().rows[rowId];
          if (!row) return;

          const { start, end } = inferRowEndpoints(row, get().seats);
          const nextStart = { x: start.x + delta.x, y: start.y + delta.y };
          const nextEnd = { x: end.x + delta.x, y: end.y + delta.y };
          const nextCurve = row.curve ?? 0;
          const positions = computeCurvedRowSeatPositions(
            nextStart,
            nextEnd,
            nextCurve,
            row.seats.length,
          );

          set((state) => ({
            rows: {
              ...state.rows,
              [rowId]: {
                ...state.rows[rowId],
                start: nextStart,
                end: nextEnd,
                curve: nextCurve,
                position: {
                  x: (nextStart.x + nextEnd.x) / 2,
                  y: (nextStart.y + nextEnd.y) / 2,
                },
              },
            },
            seats: row.seats.reduce(
              (acc, seatId, index) => {
                const seat = acc[seatId];
                if (!seat) return acc;
                acc[seatId] = {
                  ...seat,
                  position: positions[index],
                };
                return acc;
              },
              { ...state.seats },
            ),
          }));
        },

        moveArea: (areaId, delta) => {
          set((state) => ({
            areas: {
              ...state.areas,
              [areaId]: {
                ...state.areas[areaId],
                position: {
                  x: state.areas[areaId].position.x + delta.x,
                  y: state.areas[areaId].position.y + delta.y,
                },
              },
            },
          }));
        },

        moveTable: (tableId, delta) => {
          const table = get().tables[tableId];
          if (!table) return;

          const seats = { ...get().seats };
          table.seats.forEach((seatId) => {
            const seat = seats[seatId];
            if (seat) {
              seats[seatId] = {
                ...seat,
                position: {
                  x: seat.position.x + delta.x,
                  y: seat.position.y + delta.y,
                },
              };
            }
          });

          set((state) => ({
            tables: {
              ...state.tables,
              [tableId]: {
                ...state.tables[tableId],
                position: {
                  x: state.tables[tableId].position.x + delta.x,
                  y: state.tables[tableId].position.y + delta.y,
                },
              },
            },
            seats,
          }));
        },

        moveSeat: (seatId, delta) => {
          set((state) => ({
            seats: {
              ...state.seats,
              [seatId]: {
                ...state.seats[seatId],
                position: {
                  x: state.seats[seatId].position.x + delta.x,
                  y: state.seats[seatId].position.y + delta.y,
                },
              },
            },
          }));
        },

        // Selection
        selectElement: (id, multi = false) => {
          if (multi) {
            set((state) => ({
              selectedIds: state.selectedIds.includes(id)
                ? state.selectedIds.filter((existingId) => existingId !== id)
                : [...state.selectedIds, id],
            }));
          } else {
            set({ selectedIds: [id] });
          }
        },

        deselectElement: (id) => {
          set((state) => ({
            selectedIds: state.selectedIds.filter(
              (existingId) => existingId !== id,
            ),
          }));
        },

        clearSelection: () => {
          set({ selectedIds: [] });
        },

        selectAll: () => {
          const state = get();
          const allIds: ElementId[] = [
            ...Object.keys(state.rows),
            ...Object.keys(state.areas),
            ...Object.keys(state.tables),
            ...Object.keys(state.structures),
            ...Object.keys(state.seats),
          ];
          set({ selectedIds: allIds });
        },

        // Bulk operations
        deleteSelected: () => {
          const { selectedIds } = get();
          if (selectedIds.length === 0) return;
          recordHistory();
          isHistorySuspended = true;

          try {
            selectedIds.forEach((id) => {
              if (id.startsWith("row_")) {
                get().removeRow(id as RowId);
              } else if (id.startsWith("area_")) {
                get().removeArea(id as AreaId);
              } else if (id.startsWith("table_")) {
                get().removeTable(id as TableId);
              } else if (id.startsWith("structure_")) {
                get().removeStructure(id as StructureId);
              }
            });
          } finally {
            isHistorySuspended = false;
          }

          // Remove individual seats that weren't part of a row/table
          const state = get();
          const remainingSelectedSeats = state.selectedIds.filter((id) => {
            if (!id.startsWith("seat_")) return false;
            const seat = state.seats[id as SeatId];
            return seat && !seat.rowId && !seat.tableId;
          });

          if (remainingSelectedSeats.length > 0) {
            const seats = { ...state.seats };
            remainingSelectedSeats.forEach((seatId) => {
              delete seats[seatId as SeatId];
            });

            set({
              seats,
              selectedIds: [],
            });
          }
        },

        updateSelectedLabels: (pattern) => {
          const { selectedIds, seats, rows, areas, tables, structures } = get();
          let counter = 1;

          selectedIds.forEach((id) => {
            if (id.startsWith("seat_") && seats[id]) {
              const label = pattern
                .replace(/\{n\}/g, String(counter))
                .replace(/\{N\}/g, String(counter).padStart(2, "0"));
              get().updateSeatLabel(id as SeatId, label);
              counter++;
            } else if (id.startsWith("row_") && rows[id]) {
              const label = pattern
                .replace(/\{n\}/g, String(counter))
                .replace(/\{N\}/g, String(counter).padStart(2, "0"));
              get().updateRowLabel(id as RowId, label);
              counter++;
            } else if (id.startsWith("area_") && areas[id]) {
              const label = pattern
                .replace(/\{n\}/g, String(counter))
                .replace(/\{N\}/g, String(counter).padStart(2, "0"));
              get().updateAreaLabel(id as AreaId, label);
              counter++;
            } else if (id.startsWith("table_") && tables[id]) {
              const label = pattern
                .replace(/\{n\}/g, String(counter))
                .replace(/\{N\}/g, String(counter).padStart(2, "0"));
              get().updateTableLabel(id as TableId, label);
              counter++;
            } else if (id.startsWith("structure_") && structures[id]) {
              const label = pattern
                .replace(/\{n\}/g, String(counter))
                .replace(/\{N\}/g, String(counter).padStart(2, "0"));
              get().updateStructureLabel(id as StructureId, label);
              counter++;
            }
          });
        },

        // View
        setZoom: (zoom) => {
          set({ zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)) });
        },

        setPan: (pan) => {
          set({ pan });
        },

        zoomIn: () => {
          const newZoom = Math.min(MAX_ZOOM, get().zoom + ZOOM_STEP);
          set({ zoom: newZoom });
        },

        zoomOut: () => {
          const newZoom = Math.max(MIN_ZOOM, get().zoom - ZOOM_STEP);
          set({ zoom: newZoom });
        },

        resetView: () => {
          set({ zoom: DEFAULT_ZOOM, pan: { x: 0, y: 0 } });
        },

        setActiveTool: (tool) => {
          set({ activeTool: tool });
        },

        undo: () => {
          if (historyPast.length === 0) return;

          const previous = historyPast[historyPast.length - 1];
          historyPast = historyPast.slice(0, -1);
          historyFuture = [
            createHistorySnapshot(get()),
            ...historyFuture,
          ].slice(0, HISTORY_LIMIT);

          set({
            name: previous.name,
            rows: previous.rows,
            seats: previous.seats,
            areas: previous.areas,
            tables: previous.tables,
            structures: previous.structures,
            sections: previous.sections,
            selectedIds: previous.selectedIds,
          });
        },

        redo: () => {
          if (historyFuture.length === 0) return;

          const next = historyFuture[0];
          historyFuture = historyFuture.slice(1);
          historyPast = [...historyPast, createHistorySnapshot(get())].slice(
            -HISTORY_LIMIT,
          );

          set({
            name: next.name,
            rows: next.rows,
            seats: next.seats,
            areas: next.areas,
            tables: next.tables,
            structures: next.structures,
            sections: next.sections,
            selectedIds: next.selectedIds,
          });
        },

        // Import/Export
        exportMap: () => {
          const state = get();
          const exportData = {
            name: state.name,
            rows: state.rows,
            seats: state.seats,
            areas: state.areas,
            tables: state.tables,
            structures: state.structures,
            sections: state.sections,
          };
          return JSON.stringify(exportData, null, 2);
        },

        importMap: (json) => {
          try {
            historyPast = [];
            historyFuture = [];
            const data = JSON.parse(json);
            set({
              name: data.name || "Imported Map",
              rows: data.rows || {},
              seats: data.seats || {},
              areas: data.areas || {},
              tables: data.tables || {},
              structures: data.structures || {},
              sections: data.sections || {},
              selectedIds: [],
            });
          } catch (error) {
            console.error("Failed to import map:", error);
            throw new Error("Invalid map data");
          }
        },

        resetMap: () => {
          historyPast = [];
          historyFuture = [];
          set({
            ...initialState,
            name: "Untitled Map",
          });
        },

        setMapName: (name) => {
          recordHistory();
          set({ name });
        },
      };
    },
    {
      name: "seatmap-storage",
      partialize: (state) => ({
        name: state.name,
        rows: state.rows,
        seats: state.seats,
        areas: state.areas,
        tables: state.tables,
        structures: state.structures,
        sections: state.sections,
      }),
    },
  ),
);
