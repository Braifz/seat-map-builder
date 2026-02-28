"use client";

import { Plus, Theater } from "lucide-react";
import type { MapTemplateId, MapTemplateMeta } from "../../lib/map-templates";
import { useThemeColors } from "../../hooks/useThemeColors";

interface NewMapModalProps {
  isOpen: boolean;
  templates: MapTemplateMeta[];
  onClose: () => void;
  onCreateEmpty: () => void;
  onSelectTemplate: (templateId: MapTemplateId) => void;
}

export function NewMapModal({
  isOpen,
  templates,
  onClose,
  onCreateEmpty,
  onSelectTemplate,
}: NewMapModalProps) {
  const { colors } = useThemeColors();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4">
      <div
        className={`${colors.bgPrimary} w-full max-w-2xl rounded-2xl border ${colors.border} p-6 shadow-2xl`}
      >
        <h2 className={`text-xl font-semibold ${colors.textPrimary}`}>
          Crear nuevo mapa
        </h2>
        <p className={`mt-2 text-sm ${colors.textSecondary}`}>
          Elegi si queres arrancar de cero o usar un boilerplate.
        </p>

        <button
          type="button"
          onClick={onCreateEmpty}
          className={`mt-5 w-full rounded-xl border ${colors.border} p-4 text-left transition-colors ${colors.bgHover}`}
        >
          <div className="flex items-center gap-2">
            <Plus size={18} className={colors.textPrimary} />
            <p className={`text-base font-medium ${colors.textPrimary}`}>
              Canvas vacio
            </p>
          </div>
          <p className={`mt-1 text-sm ${colors.textSecondary}`}>
            Empezar con un mapa limpio para disenar desde cero.
          </p>
        </button>

        <div className="mt-4 space-y-3">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelectTemplate(template.id)}
              className={`w-full rounded-xl border ${colors.border} p-4 text-left transition-colors ${colors.bgHover}`}
            >
              <div className="flex items-center gap-2">
                <span className={colors.textPrimary}>
                  <Theater size={18} />
                </span>
                <p className={`text-base font-medium ${colors.textPrimary}`}>
                  {template.title}
                </p>
              </div>
              <p className={`mt-1 text-sm ${colors.textSecondary}`}>
                {template.description}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-md border ${colors.border} px-4 py-2 text-sm font-medium ${colors.textPrimary} ${colors.bgHover} transition-colors`}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
