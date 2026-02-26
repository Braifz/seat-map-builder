"use client";

import { useMemo, useState } from "react";
import { useSeatMapStore } from "../../store/seatMapStore";
import { useThemeColors } from "../../hooks/useThemeColors";
import type {
  Row,
  Seat,
  Area,
  Table,
  Structure,
  Section,
  SeatType,
  AreaShape,
  TableShape,
  StructureType,
} from "../../types";

interface EditSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  rows: Record<string, Row>;
  seats: Record<string, Seat>;
  areas: Record<string, Area>;
  tables: Record<string, Table>;
  structures: Record<string, Structure>;
  sections: Record<string, Section>;
}

export function EditSelectionModal({
  isOpen,
  onClose,
  selectedIds,
  rows,
  seats,
  areas,
  tables,
  structures,
  sections,
}: EditSelectionModalProps) {
  const {
    updateRowLabel,
    updateRowSection,
    updateRowSeatPrice,
    updateRowCurve,
    updateRowSeatCount,
    updateSeatLabel,
    updateSeatType,
    updateSeatSection,
    updateSeatPrice,
    updateAreaLabel,
    updateArea,
    updateTableLabel,
    updateTable,
    updateStructureLabel,
    updateStructure,
    updateSelectedLabels,
    addSection,
  } = useSeatMapStore();
  const { colors } = useThemeColors();

  // Compute element info
  const elementInfo = useMemo(() => {
    if (selectedIds.length === 1) {
      const id = selectedIds[0];
      if (id.startsWith("row_") && rows[id]) {
        const rowSeats = rows[id].seats
          .map((seatId) => seats[seatId])
          .filter((seat): seat is Seat => Boolean(seat));
        const distinctSeatPrices = Array.from(
          new Set(rowSeats.map((seat) => seat.price)),
        );
        const rowSeatPrice =
          distinctSeatPrices.length === 1 ? distinctSeatPrices[0] : undefined;

        return {
          type: "row",
          label: rows[id].label,
          seatType: "seat" as SeatType,
          sectionId: rows[id].sectionId,
          seatPrice: rowSeatPrice,
          rowCurve: rows[id].curve ?? 0,
          rowSeatCount: rows[id].seats.length,
          width: 0,
          height: 0,
          areaShape: "rectangle" as AreaShape,
          areaColor: "#e5e7eb",
          areaOpacity: 0.8,
          tableShape: "round" as TableShape,
          structureType: "custom" as StructureType,
          structureColor: "#6b7280",
          lineType: "straight" as "straight" | "freehand",
          lineStrokeWidth: 2,
        };
      } else if (id.startsWith("seat_") && seats[id]) {
        return {
          type: "seat",
          label: seats[id].label,
          seatType: seats[id].type,
          sectionId: seats[id].sectionId,
          seatPrice: seats[id].price,
          rowCurve: 0,
          rowSeatCount: 0,
          width: 0,
          height: 0,
          areaShape: "rectangle" as AreaShape,
          areaColor: "#e5e7eb",
          areaOpacity: 0.8,
          tableShape: "round" as TableShape,
          structureType: "custom" as StructureType,
          structureColor: "#6b7280",
          lineType: "straight" as "straight" | "freehand",
          lineStrokeWidth: 2,
        };
      } else if (id.startsWith("area_") && areas[id]) {
        const area = areas[id];
        return {
          type: "area",
          label: area.label,
          seatType: "seat" as SeatType,
          sectionId: "",
          seatPrice: undefined,
          rowCurve: 0,
          rowSeatCount: 0,
          width: area.size.width,
          height: area.size.height,
          areaShape: area.shape || "rectangle",
          areaColor: area.color || "#e5e7eb",
          areaOpacity: area.opacity ?? 0.8,
          tableShape: "round" as TableShape,
          structureType: "custom" as StructureType,
          structureColor: "#6b7280",
          lineType: area.lineConfig?.lineType || "straight",
          lineStrokeWidth: area.lineConfig?.strokeWidth || 2,
        };
      } else if (id.startsWith("table_") && tables[id]) {
        const table = tables[id];
        return {
          type: "table",
          label: table.label,
          seatType: "seat" as SeatType,
          sectionId: "",
          seatPrice: undefined,
          rowCurve: 0,
          rowSeatCount: 0,
          width: table.size.width,
          height: table.size.height,
          areaShape: "rectangle" as AreaShape,
          areaColor: "#e5e7eb",
          areaOpacity: 0.8,
          tableShape: table.shape,
          structureType: "custom" as StructureType,
          structureColor: "#6b7280",
          lineType: "straight" as "straight" | "freehand",
          lineStrokeWidth: 2,
        };
      } else if (id.startsWith("structure_") && structures[id]) {
        const structure = structures[id];
        return {
          type: "structure",
          label: structure.label,
          seatType: "seat" as SeatType,
          sectionId: "",
          seatPrice: undefined,
          rowCurve: 0,
          rowSeatCount: 0,
          width: structure.size.width,
          height: structure.size.height,
          areaShape: "rectangle" as AreaShape,
          areaColor: "#e5e7eb",
          areaOpacity: 0.8,
          tableShape: "round" as TableShape,
          structureType: structure.type,
          structureColor: structure.color || "#6b7280",
          lineType: "straight" as "straight" | "freehand",
          lineStrokeWidth: 2,
        };
      }
    }
    return {
      type: "multiple",
      label: "",
      seatType: "seat" as SeatType,
      sectionId: "",
      seatPrice: undefined,
      rowCurve: 0,
      rowSeatCount: 0,
      width: 0,
      height: 0,
      areaShape: "rectangle" as AreaShape,
      areaColor: "#e5e7eb",
      areaOpacity: 0.8,
      tableShape: "round" as TableShape,
      structureType: "custom" as StructureType,
      structureColor: "#6b7280",
      lineType: "straight" as "straight" | "freehand",
      lineStrokeWidth: 2,
    };
  }, [selectedIds, rows, seats, areas, tables, structures]);

  const [label, setLabel] = useState(elementInfo.label);
  const [pattern, setPattern] = useState("{n}");
  const [seatType, setSeatType] = useState<SeatType>(elementInfo.seatType);
  const [sectionId, setSectionId] = useState<string>(
    elementInfo.sectionId || "",
  );
  const [rowCurve, setRowCurve] = useState(elementInfo.rowCurve);
  const [rowSeatCount, setRowSeatCount] = useState(elementInfo.rowSeatCount);
  const [seatPrice, setSeatPrice] = useState(
    elementInfo.seatPrice !== undefined ? String(elementInfo.seatPrice) : "",
  );
  const [width, setWidth] = useState(elementInfo.width);
  const [height, setHeight] = useState(elementInfo.height);
  const [areaShape, setAreaShape] = useState<AreaShape>(elementInfo.areaShape);
  const [areaColor, setAreaColor] = useState(elementInfo.areaColor);
  const [areaOpacity, setAreaOpacity] = useState(elementInfo.areaOpacity);
  const [tableShape, setTableShape] = useState<TableShape>(
    elementInfo.tableShape,
  );
  const [structureType, setStructureType] = useState<StructureType>(
    elementInfo.structureType,
  );
  const [structureColor, setStructureColor] = useState(
    elementInfo.structureColor,
  );
  const [lineType, setLineType] = useState<"straight" | "freehand">(
    elementInfo.lineType,
  );
  const [lineStrokeWidth, setLineStrokeWidth] = useState(
    elementInfo.lineStrokeWidth,
  );
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionColor, setNewSectionColor] = useState("#3b82f6");
  const [newSectionNumber, setNewSectionNumber] = useState("");
  const [newSectionPrice, setNewSectionPrice] = useState("");

  const elementType = elementInfo.type;
  const selectedSection =
    sectionId && sectionId !== "new" ? sections[sectionId] : undefined;
  const currentSection = elementInfo.sectionId
    ? sections[elementInfo.sectionId]
    : undefined;
  const hasSectionAssignableSelection = useMemo(
    () =>
      selectedIds.some((id) => id.startsWith("row_") || id.startsWith("seat_")),
    [selectedIds],
  );

  if (!isOpen) return null;

  const applySectionToSelection = (targetSectionId?: string) => {
    selectedIds.forEach((id) => {
      if (id.startsWith("row_")) {
        updateRowSection(id, targetSectionId);
      } else if (id.startsWith("seat_")) {
        updateSeatSection(id, targetSectionId);
      }
    });
  };

  const handleSave = () => {
    if (selectedIds.length === 1) {
      const id = selectedIds[0];
      if (elementType === "row") {
        updateRowLabel(id, label);
        updateRowCurve(id, rowCurve);
        updateRowSeatCount(id, rowSeatCount);
        const parsedRowSeatPrice =
          seatPrice.trim() === "" ? undefined : Number.parseFloat(seatPrice);
        updateRowSeatPrice(
          id,
          Number.isNaN(parsedRowSeatPrice as number)
            ? undefined
            : parsedRowSeatPrice,
        );
        if (sectionId !== "new") {
          updateRowSection(id, sectionId || undefined);
        }
      } else if (elementType === "seat") {
        updateSeatLabel(id, label);
        updateSeatType(id, seatType);
        const parsedSeatPrice =
          seatPrice.trim() === "" ? undefined : Number.parseFloat(seatPrice);
        updateSeatPrice(
          id,
          Number.isNaN(parsedSeatPrice as number) ? undefined : parsedSeatPrice,
        );
        if (sectionId !== "new") {
          updateSeatSection(id, sectionId || undefined);
        }
      } else if (elementType === "area") {
        updateAreaLabel(id, label);
        updateArea(id, {
          label,
          color: areaColor,
          shape: areaShape,
          opacity: areaOpacity,
          size: {
            width: Math.max(10, width),
            height: Math.max(10, height),
          },
          lineConfig:
            areaShape === "line"
              ? {
                  points: areas[id]?.lineConfig?.points || [
                    areas[id].position,
                    {
                      x: areas[id].position.x + Math.max(10, width),
                      y: areas[id].position.y + Math.max(10, height),
                    },
                  ],
                  lineType,
                  strokeWidth: Math.max(1, lineStrokeWidth),
                }
              : undefined,
        });
      } else if (elementType === "table") {
        updateTableLabel(id, label);
        updateTable(id, {
          label,
          shape: tableShape,
          size: {
            width: Math.max(40, width),
            height: Math.max(40, height),
          },
        });
      } else if (elementType === "structure") {
        updateStructureLabel(id, label);
        updateStructure(id, {
          label,
          type: structureType,
          color: structureColor,
          size: {
            width: Math.max(40, width),
            height: Math.max(40, height),
          },
        });
      }
    } else if (selectedIds.length > 1 && pattern) {
      updateSelectedLabels(pattern);
    }

    // Handle section assignment
    if (
      hasSectionAssignableSelection &&
      sectionId === "new" &&
      newSectionName
    ) {
      const createdSectionId = addSection(
        newSectionName,
        newSectionColor,
        parseInt(newSectionNumber) || 1,
        newSectionPrice ? parseFloat(newSectionPrice) : undefined,
      );
      applySectionToSelection(createdSectionId);
    } else if (hasSectionAssignableSelection && selectedIds.length > 1) {
      applySectionToSelection(sectionId || undefined);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className={`${colors.bgPrimary} rounded-lg shadow-xl w-full max-w-md p-6 border ${colors.border}`}
      >
        <h2 className={`text-xl font-semibold mb-4 ${colors.textPrimary}`}>
          Edit{" "}
          {selectedIds.length === 1
            ? elementType
            : `${selectedIds.length} items`}
        </h2>

        <div className="space-y-4">
          {selectedIds.length === 1 ? (
            <>
              <div>
                <label
                  className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                >
                  Label
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                />
              </div>

              {elementType === "seat" && (
                <>
                  <div>
                    <label
                      className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                    >
                      Seat Type
                    </label>
                    <select
                      value={seatType}
                      onChange={(e) => setSeatType(e.target.value as SeatType)}
                      className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                    >
                      <option value="seat">Standard Seat</option>
                      <option value="vip">VIP</option>
                      <option value="wheelchair">Wheelchair</option>
                      <option value="companion">Companion</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                    >
                      Price (€)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={seatPrice}
                      onChange={(e) => setSeatPrice(e.target.value)}
                      placeholder="Leave empty to use section price"
                      className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                    />
                  </div>
                </>
              )}

              {elementType === "row" && (
                <>
                  <div>
                    <label
                      className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                    >
                      Number of Seats
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={rowSeatCount}
                      onChange={(e) =>
                        setRowSeatCount(
                          Math.max(1, parseInt(e.target.value, 10) || 1),
                        )
                      }
                      className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                    >
                      Curvature: {rowCurve.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min={-1.5}
                      max={1.5}
                      step={0.05}
                      value={rowCurve}
                      onChange={(e) => setRowCurve(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                    >
                      Price per Seat (€)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={seatPrice}
                      onChange={(e) => setSeatPrice(e.target.value)}
                      placeholder="Leave empty to use section price"
                      className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                    />
                  </div>
                </>
              )}

              {elementType === "area" && (
                <>
                  <div>
                    <label
                      className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                    >
                      Shape
                    </label>
                    <select
                      value={areaShape}
                      onChange={(e) =>
                        setAreaShape(e.target.value as AreaShape)
                      }
                      className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                    >
                      <option value="rectangle">Rectangle</option>
                      <option value="square">Square</option>
                      <option value="circle">Circle</option>
                      <option value="oval">Oval</option>
                      <option value="line">Line</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                      >
                        Width
                      </label>
                      <input
                        type="number"
                        value={width}
                        onChange={(e) =>
                          setWidth(Math.max(10, parseInt(e.target.value) || 10))
                        }
                        className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                      >
                        Height
                      </label>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) =>
                          setHeight(
                            Math.max(10, parseInt(e.target.value) || 10),
                          )
                        }
                        className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                    >
                      Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={areaColor}
                        onChange={(e) => setAreaColor(e.target.value)}
                        className={`w-10 h-9 rounded cursor-pointer border ${colors.border}`}
                      />
                      <input
                        type="text"
                        value={areaColor}
                        onChange={(e) => setAreaColor(e.target.value)}
                        className={`flex-1 px-2 py-2 text-sm border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                    >
                      Opacity: {Math.round(areaOpacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={areaOpacity}
                      onChange={(e) =>
                        setAreaOpacity(parseFloat(e.target.value))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {areaShape === "line" && (
                    <>
                      <div>
                        <label
                          className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                        >
                          Line Type
                        </label>
                        <select
                          value={lineType}
                          onChange={(e) =>
                            setLineType(
                              e.target.value as "straight" | "freehand",
                            )
                          }
                          className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                        >
                          <option value="straight">Straight</option>
                          <option value="freehand">Freehand</option>
                        </select>
                      </div>
                      <div>
                        <label
                          className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                        >
                          Stroke Width
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={lineStrokeWidth}
                          onChange={(e) =>
                            setLineStrokeWidth(
                              Math.max(1, parseInt(e.target.value) || 1),
                            )
                          }
                          className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {elementType === "table" && (
                <>
                  <div>
                    <label
                      className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                    >
                      Shape
                    </label>
                    <select
                      value={tableShape}
                      onChange={(e) =>
                        setTableShape(e.target.value as TableShape)
                      }
                      className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                    >
                      <option value="round">Round</option>
                      <option value="rectangular">Rectangular</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                      >
                        Width
                      </label>
                      <input
                        type="number"
                        value={width}
                        onChange={(e) =>
                          setWidth(Math.max(40, parseInt(e.target.value) || 40))
                        }
                        className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                      >
                        Height
                      </label>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) =>
                          setHeight(
                            Math.max(40, parseInt(e.target.value) || 40),
                          )
                        }
                        className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                      />
                    </div>
                  </div>
                </>
              )}

              {elementType === "structure" && (
                <>
                  <div>
                    <label
                      className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                    >
                      Type
                    </label>
                    <select
                      value={structureType}
                      onChange={(e) =>
                        setStructureType(e.target.value as StructureType)
                      }
                      className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                    >
                      <option value="stage">Stage</option>
                      <option value="bar">Bar</option>
                      <option value="entrance">Entrance</option>
                      <option value="exit">Exit</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                      >
                        Width
                      </label>
                      <input
                        type="number"
                        value={width}
                        onChange={(e) =>
                          setWidth(Math.max(40, parseInt(e.target.value) || 40))
                        }
                        className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                      >
                        Height
                      </label>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) =>
                          setHeight(
                            Math.max(40, parseInt(e.target.value) || 40),
                          )
                        }
                        className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                    >
                      Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={structureColor}
                        onChange={(e) => setStructureColor(e.target.value)}
                        className={`w-10 h-9 rounded cursor-pointer border ${colors.border}`}
                      />
                      <input
                        type="text"
                        value={structureColor}
                        onChange={(e) => setStructureColor(e.target.value)}
                        className={`flex-1 px-2 py-2 text-sm border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div>
              <label
                className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
              >
                Label Pattern (use {"{n}"} or {"{N}"} for numbering)
              </label>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="e.g., A-{'{n}'}, Row {'{N}'}"
                className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
              />
              <p className={`text-xs ${colors.textMuted} mt-1`}>
                {"{n}"} = 1, 2, 3... | {"{N}"} = 01, 02, 03...
              </p>
            </div>
          )}

          {/* Section Assignment (only for rows and seats) */}
          {hasSectionAssignableSelection && (
            <div>
              <label
                className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
              >
                Section
              </label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
              >
                <option value="">No Section</option>
                {Object.values(sections).map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.label} (#{section.sectionNumber})
                  </option>
                ))}
                <option value="new">+ Create New Section</option>
              </select>

              {sectionId === "new" && (
                <div
                  className={`mt-3 space-y-3 p-3 ${colors.bgSecondary} rounded-md`}
                >
                  <input
                    type="text"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    placeholder="Section Name"
                    className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                      >
                        Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newSectionColor}
                          onChange={(e) => setNewSectionColor(e.target.value)}
                          className={`w-10 h-9 rounded cursor-pointer border ${colors.border}`}
                        />
                        <input
                          type="text"
                          value={newSectionColor}
                          onChange={(e) => setNewSectionColor(e.target.value)}
                          className={`flex-1 px-2 py-2 text-sm border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                      >
                        Section #
                      </label>
                      <input
                        type="number"
                        value={newSectionNumber}
                        onChange={(e) => setNewSectionNumber(e.target.value)}
                        placeholder="1"
                        className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium ${colors.textSecondary} mb-1`}
                    >
                      Price ($)
                    </label>
                    <input
                      type="number"
                      value={newSectionPrice}
                      onChange={(e) => setNewSectionPrice(e.target.value)}
                      placeholder="25.00"
                      className={`w-full px-3 py-2 border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.textPrimary} ${colors.bgPrimary}`}
                    />
                  </div>
                </div>
              )}

              {sectionId !== "new" && (selectedSection || currentSection) && (
                <div className={`mt-3 p-3 rounded-md border ${colors.border}`}>
                  <p className={`text-xs ${colors.textMuted} mb-2`}>
                    Section details
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full border"
                        style={{
                          backgroundColor:
                            selectedSection?.color || currentSection?.color,
                        }}
                      />
                      <span className={`text-sm ${colors.textPrimary}`}>
                        {selectedSection?.label || currentSection?.label}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-medium ${colors.textPrimary}`}
                    >
                      {(selectedSection?.price ?? currentSection?.price) !==
                      undefined
                        ? `€${selectedSection?.price ?? currentSection?.price}`
                        : "No price"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2 border ${colors.border} rounded-md ${colors.textPrimary} ${colors.bgHover} transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
