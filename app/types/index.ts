export type SeatId = string;
export type RowId = string;
export type AreaId = string;
export type TableId = string;
export type SectionId = string;
export type StructureId = string;
export type ElementId =
  | SeatId
  | RowId
  | AreaId
  | TableId
  | SectionId
  | StructureId;

export type Position = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type SeatType = "seat" | "wheelchair" | "companion" | "vip";
export type ElementStatus = "available" | "occupied" | "blocked";

export interface Seat {
  id: SeatId;
  label: string;
  position: Position;
  type: SeatType;
  status: ElementStatus;
  rowId?: RowId;
  tableId?: TableId;
  sectionId?: SectionId;
}

export interface Row {
  id: RowId;
  label: string;
  position: Position;
  seats: SeatId[];
  curve?: number;
  sectionId?: SectionId;
}

export interface Area {
  id: AreaId;
  label: string;
  position: Position;
  size: Size;
  color?: string;
}

export interface Section {
  id: SectionId;
  label: string;
  color: string;
  sectionNumber: number;
  price?: number;
}

export type TableShape = "round" | "rectangular";

export type StructureType = "stage" | "bar" | "entrance" | "exit" | "custom";

export interface Table {
  id: TableId;
  label: string;
  position: Position;
  shape: TableShape;
  size: Size;
  seats: SeatId[];
}

export interface Structure {
  id: StructureId;
  label: string;
  type: StructureType;
  position: Position;
  size: Size;
  color?: string;
}

export type ToolType =
  | "select"
  | "addRow"
  | "addMultipleRows"
  | "addArea"
  | "addTable"
  | "addStructure"
  | "pan";

export interface RowConfig {
  label: string;
  seatCount: number;
  sectionId?: SectionId;
}

export interface SeatMapState {
  name: string;
  rows: Record<RowId, Row>;
  seats: Record<SeatId, Seat>;
  areas: Record<AreaId, Area>;
  tables: Record<TableId, Table>;
  structures: Record<StructureId, Structure>;
  sections: Record<SectionId, Section>;
  selectedIds: ElementId[];
  zoom: number;
  pan: Position;
  activeTool: ToolType;
}

export interface SeatMapActions {
  // Row actions
  addRow: (
    label: string,
    seatCount: number,
    position?: Position,
    sectionId?: SectionId,
  ) => RowId;
  addMultipleRows: (
    rowConfigs: RowConfig[],
    basePosition: Position,
    spacing?: number,
  ) => RowId[];
  removeRow: (rowId: RowId) => void;
  removeRows: (rowIds: RowId[]) => void;
  updateRowLabel: (rowId: RowId, label: string) => void;

  // Section actions
  addSection: (
    label: string,
    color: string,
    sectionNumber: number,
    price?: number,
  ) => SectionId;
  removeSection: (sectionId: SectionId) => void;
  updateSection: (sectionId: SectionId, updates: Partial<Section>) => void;

  // Seat actions
  updateSeatLabel: (seatId: SeatId, label: string) => void;
  updateSeatType: (seatId: SeatId, type: SeatType) => void;
  removeSeat: (seatId: SeatId) => void;
  removeSeats: (seatIds: SeatId[]) => void;

  // Area actions
  addArea: (
    label: string,
    position: Position,
    size: Size,
    color?: string,
  ) => AreaId;
  removeArea: (areaId: AreaId) => void;
  updateAreaLabel: (areaId: AreaId, label: string) => void;

  // Table actions
  addTable: (
    label: string,
    position: Position,
    shape: TableShape,
    size: Size,
    seatCount: number,
  ) => TableId;
  removeTable: (tableId: TableId) => void;
  updateTableLabel: (tableId: TableId, label: string) => void;

  // Structure actions
  addStructure: (
    label: string,
    type: StructureType,
    position: Position,
    size?: Size,
    color?: string,
  ) => StructureId;
  removeStructure: (structureId: StructureId) => void;
  updateStructureLabel: (structureId: StructureId, label: string) => void;
  moveStructure: (structureId: StructureId, delta: Position) => void;

  // Move actions
  moveRow: (rowId: RowId, delta: Position) => void;
  moveArea: (areaId: AreaId, delta: Position) => void;
  moveTable: (tableId: TableId, delta: Position) => void;
  moveSeat: (seatId: SeatId, delta: Position) => void;

  // Selection
  selectElement: (id: ElementId, multi?: boolean) => void;
  deselectElement: (id: ElementId) => void;
  clearSelection: () => void;
  selectAll: () => void;

  // Bulk operations
  deleteSelected: () => void;
  updateSelectedLabels: (pattern: string) => void;

  // View
  setZoom: (zoom: number) => void;
  setPan: (pan: Position) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  setActiveTool: (tool: ToolType) => void;

  // Import/Export
  exportMap: () => string;
  importMap: (json: string) => void;
  resetMap: () => void;
  setMapName: (name: string) => void;
}

export type SeatMapStore = SeatMapState & SeatMapActions;
