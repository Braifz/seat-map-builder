import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  SeatMapStore,
  SeatId,
  RowId,
  AreaId,
  TableId,
  ElementId,
  Seat,
} from "../types";

const generateId = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const DEFAULT_ZOOM = 1;
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

const initialState = {
  name: "Untitled Map",
  rows: {},
  seats: {},
  areas: {},
  tables: {},
  selectedIds: [],
  zoom: DEFAULT_ZOOM,
  pan: { x: 0, y: 0 },
  activeTool: "select" as const,
};

export const useSeatMapStore = create<SeatMapStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Row actions
      addRow: (label, seatCount, position = { x: 100, y: 100 }) => {
        const rowId = generateId("row") as RowId;
        const seatIds: SeatId[] = [];
        const seats: Record<SeatId, Seat> = {};

        for (let i = 0; i < seatCount; i++) {
          const seatId = generateId("seat") as SeatId;
          seatIds.push(seatId);
          seats[seatId] = {
            id: seatId,
            label: `${i + 1}`,
            position: { x: position.x + i * 35, y: position.y },
            type: "seat",
            status: "available",
            rowId,
          };
        }

        set((state) => ({
          rows: {
            ...state.rows,
            [rowId]: { id: rowId, label, position, seats: seatIds },
          },
          seats: { ...state.seats, ...seats },
        }));

        return rowId;
      },

      removeRow: (rowId) => {
        const row = get().rows[rowId];
        if (!row) return;

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

      updateRowLabel: (rowId, label) => {
        set((state) => ({
          rows: { ...state.rows, [rowId]: { ...state.rows[rowId], label } },
        }));
      },

      // Seat actions
      updateSeatLabel: (seatId, label) => {
        set((state) => ({
          seats: {
            ...state.seats,
            [seatId]: { ...state.seats[seatId], label },
          },
        }));
      },

      updateSeatType: (seatId, type) => {
        set((state) => ({
          seats: { ...state.seats, [seatId]: { ...state.seats[seatId], type } },
        }));
      },

      // Area actions
      addArea: (label, position, size, color = "#e5e7eb") => {
        const areaId = generateId("area") as AreaId;

        set((state) => ({
          areas: {
            ...state.areas,
            [areaId]: { id: areaId, label, position, size, color },
          },
        }));

        return areaId;
      },

      removeArea: (areaId) => {
        const areas = { ...get().areas };
        delete areas[areaId];

        set({
          areas,
          selectedIds: get().selectedIds.filter((id) => id !== areaId),
        });
      },

      updateAreaLabel: (areaId, label) => {
        set((state) => ({
          areas: {
            ...state.areas,
            [areaId]: { ...state.areas[areaId], label },
          },
        }));
      },

      // Table actions
      addTable: (label, position, shape, size, seatCount) => {
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
                  position.x + size.width / 2 + Math.cos(angle) * (radius + 25),
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
          const cols = Math.ceil(Math.sqrt(seatCount));
          for (let i = 0; i < seatCount; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const seatId = generateId("seat") as SeatId;
            seatIds.push(seatId);
            seats[seatId] = {
              id: seatId,
              label: `${i + 1}`,
              position: {
                x: position.x + 10 + col * 35,
                y: position.y + 10 + row * 35,
              },
              type: "seat",
              status: "available",
              tableId,
            };
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
        set((state) => ({
          tables: {
            ...state.tables,
            [tableId]: { ...state.tables[tableId], label },
          },
        }));
      },

      // Move actions
      moveRow: (rowId, delta) => {
        const row = get().rows[rowId];
        if (!row) return;

        const seats = { ...get().seats };
        row.seats.forEach((seatId) => {
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
          rows: {
            ...state.rows,
            [rowId]: {
              ...state.rows[rowId],
              position: {
                x: state.rows[rowId].position.x + delta.x,
                y: state.rows[rowId].position.y + delta.y,
              },
            },
          },
          seats,
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
          ...Object.keys(state.seats),
        ];
        set({ selectedIds: allIds });
      },

      // Bulk operations
      deleteSelected: () => {
        const { selectedIds } = get();

        selectedIds.forEach((id) => {
          if (id.startsWith("row_")) {
            get().removeRow(id as RowId);
          } else if (id.startsWith("area_")) {
            get().removeArea(id as AreaId);
          } else if (id.startsWith("table_")) {
            get().removeTable(id as TableId);
          }
        });

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
        const { selectedIds, seats, rows, areas, tables } = get();
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

      // Import/Export
      exportMap: () => {
        const state = get();
        const exportData = {
          name: state.name,
          rows: state.rows,
          seats: state.seats,
          areas: state.areas,
          tables: state.tables,
        };
        return JSON.stringify(exportData, null, 2);
      },

      importMap: (json) => {
        try {
          const data = JSON.parse(json);
          set({
            name: data.name || "Imported Map",
            rows: data.rows || {},
            seats: data.seats || {},
            areas: data.areas || {},
            tables: data.tables || {},
            selectedIds: [],
          });
        } catch (error) {
          console.error("Failed to import map:", error);
          throw new Error("Invalid map data");
        }
      },

      resetMap: () => {
        set({
          ...initialState,
          name: "Untitled Map",
        });
      },

      setMapName: (name) => {
        set({ name });
      },
    }),
    {
      name: "seatmap-storage",
      partialize: (state) => ({
        name: state.name,
        rows: state.rows,
        seats: state.seats,
        areas: state.areas,
        tables: state.tables,
      }),
    },
  ),
);
