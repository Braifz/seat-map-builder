"use client";

import { useThemeColors } from "../../hooks/useThemeColors";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const { colors } = useThemeColors();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4">
      <div
        className={`${colors.bgPrimary} w-full max-w-xl rounded-2xl border ${colors.border} p-6 shadow-2xl`}
      >
        <p
          className={`mb-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${colors.bgSecondary} ${colors.textSecondary}`}
        >
          Bienvenido a Seat Map Builder
        </p>
        <h2 className={`mb-3 text-2xl font-semibold ${colors.textPrimary}`}>
          Disena mapas de asientos en minutos
        </h2>
        <p className={`${colors.textSecondary} leading-relaxed`}>
          Seat Map Builder te permite crear y editar mapas para cine, teatro,
          estadios y eventos. Podes agregar filas, areas, mesas y estructuras,
          asignar secciones y luego simular el modo de compra.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-md border ${colors.border} px-4 py-2 text-sm font-medium ${colors.textPrimary} ${colors.bgHover} transition-colors`}
          >
            Empezar
          </button>
        </div>
      </div>
    </div>
  );
}
