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
  structures: {},
  sections: {},
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
      addRow: (
        label,
        seatCount,
        position = { x: 100, y: 100 },
        sectionId?: SectionId,
      ) => {
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
            sectionId,
          };
        }

        set((state) => ({
          rows: {
            ...state.rows,
            [rowId]: { id: rowId, label, position, seats: seatIds, sectionId },
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

      removeRows: (rowIds) => {
        const currentRows = get().rows;
        const currentSeats = get().seats;
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
        set((state) => ({
          rows: { ...state.rows, [rowId]: { ...state.rows[rowId], label } },
        }));
      },

      addSection: (
        label: string,
        color: string,
        sectionNumber: number,
        price?: number,
      ) => {
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
        const sections = { ...get().sections };
        delete sections[sectionId];
        set({
          sections,
          selectedIds: get().selectedIds.filter((id) => id !== sectionId),
        });
      },

      updateSection: (sectionId: SectionId, updates: Partial<Section>) => {
        set((state) => ({
          sections: {
            ...state.sections,
            [sectionId]: { ...state.sections[sectionId], ...updates },
          },
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

      // Structure actions
      addStructure: (label, type, position, size, color) => {
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
        const structures = { ...get().structures };
        delete structures[structureId];
        set({
          structures,
          selectedIds: get().selectedIds.filter((id) => id !== structureId),
        });
      },

      updateStructureLabel: (structureId, label) => {
        set((state) => ({
          structures: {
            ...state.structures,
            [structureId]: { ...state.structures[structureId], label },
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
          ...Object.keys(state.structures),
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
          } else if (id.startsWith("structure_")) {
            get().removeStructure(id as StructureId);
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
        structures: state.structures,
        sections: state.sections,
      }),
    },
  ),
);
