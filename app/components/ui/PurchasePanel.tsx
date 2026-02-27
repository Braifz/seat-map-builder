"use client";

import { useMemo } from "react";
import { CheckCircle2, ShoppingCart, Trash2 } from "lucide-react";
import { useSeatMapStore } from "../../store/seatMapStore";
import { useThemeColors } from "../../hooks/useThemeColors";

type PurchaseItem = {
  id: string;
  seatLabel: string;
  rowLabel?: string;
  sectionLabel?: string;
  price: number;
};

export function PurchasePanel() {
  const {
    appMode,
    seats,
    rows,
    sections,
    purchaseSelectedSeatIds,
    clearPurchaseSelection,
  } = useSeatMapStore();
  const { colors } = useThemeColors();

  const items = useMemo<PurchaseItem[]>(() => {
    return purchaseSelectedSeatIds.reduce<PurchaseItem[]>((acc, seatId) => {
      const seat = seats[seatId];
      if (!seat) return acc;

      const rowLabel = seat.rowId ? rows[seat.rowId]?.label : undefined;
      const section = seat.sectionId ? sections[seat.sectionId] : undefined;
      const price = seat.price ?? section?.price ?? 0;

      acc.push({
        id: seat.id,
        seatLabel: seat.label,
        rowLabel,
        sectionLabel: section?.label,
        price,
      });

      return acc;
    }, []);
  }, [purchaseSelectedSeatIds, rows, seats, sections]);

  const total = useMemo(
    () => items.reduce((acc, item) => acc + item.price, 0),
    [items],
  );

  if (appMode !== "purchase") {
    return null;
  }

  return (
    <aside className="fixed right-4 top-36 z-50 w-80 max-w-[calc(100vw-2rem)]">
      <div
        className={`${colors.bgPrimary} rounded-2xl border ${colors.border} shadow-lg p-4 space-y-4`}
      >
        <header className="flex items-center justify-between">
          <h2 className={`text-sm font-semibold ${colors.textPrimary}`}>
            Carrito de compra
          </h2>
          <div
            className={`text-xs ${colors.textMuted} flex items-center gap-1`}
          >
            <ShoppingCart size={14} />
            {items.length} seleccionados
          </div>
        </header>

        <div
          className={`max-h-64 overflow-y-auto rounded-xl border ${colors.borderSubtle} ${colors.bgSecondary}`}
        >
          {items.length === 0 ? (
            <p className={`text-sm ${colors.textMuted} px-3 py-4`}>
              Seleccioná asientos para simular la compra.
            </p>
          ) : (
            <ul className="divide-y divide-black/10 dark:divide-white/10">
              {items.map((item) => (
                <li key={item.id} className="px-3 py-2">
                  <div className={`text-sm font-medium ${colors.textPrimary}`}>
                    Asiento {item.seatLabel}
                    {item.rowLabel ? ` · ${item.rowLabel}` : ""}
                  </div>
                  <div className={`text-xs ${colors.textMuted}`}>
                    {item.sectionLabel ?? "Sin sección"}
                  </div>
                  <div className={`text-xs mt-1 ${colors.textSecondary}`}>
                    €{item.price.toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-sm ${colors.textSecondary}`}>Total</span>
            <span className={`text-base font-semibold ${colors.textPrimary}`}>
              €{total.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearPurchaseSelection}
              disabled={items.length === 0}
              className={`flex-1 px-3 py-2 rounded-xl text-sm border ${colors.borderSubtle} ${colors.textSecondary} ${colors.bgHover} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              <Trash2 size={14} />
              Limpiar
            </button>
            <button
              onClick={() => {}}
              disabled={items.length === 0}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium ${colors.selectedBg} ${colors.selectedText} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              <CheckCircle2 size={14} />
              Comprar
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
