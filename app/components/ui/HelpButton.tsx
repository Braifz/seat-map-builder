"use client";

import {
  HelpCircle,
  X,
  MousePointer2,
  RectangleHorizontal,
  Rows3,
  Square,
  Minus,
  Circle,
  Building2,
  Hand,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Tooltip } from "./Tooltip";
import { useThemeColors } from "../../hooks/useThemeColors";

export function HelpButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { colors } = useThemeColors();

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Tooltip content="Help & Shortcuts">
          <button
            onClick={() => setIsModalOpen(true)}
            className={`p-3 rounded-full ${colors.bgPrimary} shadow-lg border ${colors.border} ${colors.textSecondary} ${colors.bgHover} hover:${colors.textPrimary} transition-all duration-150`}
          >
            <HelpCircle size={20} />
          </button>
        </Tooltip>
      </div>

      {isModalOpen && <HelpModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}

interface HelpModalProps {
  onClose: () => void;
}

function HelpModal({ onClose }: HelpModalProps) {
  const { colors } = useThemeColors();

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50">
      <div
        className={`${colors.bgPrimary} rounded-2xl shadow-2xl border ${colors.border} w-full max-w-2xl max-h-[80vh] overflow-hidden`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${colors.border}`}
        >
          <h2 className={`text-xl font-semibold ${colors.textPrimary}`}>
            Help & Shortcuts
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${colors.textSecondary} ${colors.bgHover} hover:${colors.textPrimary} transition-colors`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {/* Keyboard Shortcuts */}
          <section className="mb-6">
            <h3
              className={`text-sm font-medium ${colors.textSecondary} uppercase tracking-wider mb-3`}
            >
              Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <ShortcutItem
                keys={["Space"]}
                description="Hold for temporary pan"
              />
              <ShortcutItem
                keys={["Shift", "+ Click"]}
                description="Multi-select"
              />
              <ShortcutItem keys={["R"]} description="Rotate 90°" />
              <ShortcutItem keys={["Shift", "+ R"]} description="Rotate -90°" />
              <ShortcutItem
                keys={["Ctrl", "Shift", "]"]}
                description="Bring to front"
              />
              <ShortcutItem
                keys={["Ctrl", "Shift", "["]}
                description="Send to back"
              />
              <ShortcutItem
                keys={["Delete", "/", "Backspace"]}
                description="Open delete confirmation"
              />
              <ShortcutItem
                keys={["Ctrl/Cmd", "C"]}
                description="Copy selection"
              />
              <ShortcutItem
                keys={["Ctrl/Cmd", "V"]}
                description="Paste selection"
              />
              <ShortcutItem keys={["Ctrl", "Z"]} description="Undo" />
              <ShortcutItem keys={["Ctrl", "Shift", "Z"]} description="Redo" />
              <ShortcutItem keys={["Ctrl", "A"]} description="Select all" />
            </div>
          </section>

          {/* Tools */}
          <section className="mb-6">
            <h3
              className={`text-sm font-medium ${colors.textSecondary} uppercase tracking-wider mb-3`}
            >
              Tools
            </h3>
            <div className="space-y-2">
              <ToolItem
                icon={MousePointer2}
                name="Select"
                description="Select and move elements"
              />
              <ToolItem
                icon={RectangleHorizontal}
                name="Add Row"
                description="Create a row of seats"
              />
              <ToolItem
                icon={Rows3}
                name="Add Multiple Rows"
                description="Create multiple rows at once"
              />
              <ToolItem
                icon={Square}
                name="Add Area"
                description="Create a section/area"
              />
              <ToolItem
                icon={Minus}
                name="Add Line"
                description="Draw lines and paths"
              />
              <ToolItem
                icon={Circle}
                name="Add Table"
                description="Create round or rectangular tables"
              />
              <ToolItem
                icon={Building2}
                name="Add Structure"
                description="Add stage, bar, entrance, etc."
              />
              <ToolItem
                icon={Hand}
                name="Pan"
                description="Move around the canvas"
              />
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3
              className={`text-sm font-medium ${colors.textSecondary} uppercase tracking-wider mb-3`}
            >
              Tips
            </h3>
            <ul className={`space-y-2 text-sm ${colors.textPrimary}`}>
              <li className={`flex items-start gap-2 ${colors.textSecondary}`}>
                <span className={colors.textMuted}>•</span>
                Use the mouse wheel to zoom in/out
              </li>
              <li className={`flex items-start gap-2 ${colors.textSecondary}`}>
                <span className={colors.textMuted}>•</span>
                Hold Space and drag to pan around the canvas
              </li>
              <li className={`flex items-start gap-2 ${colors.textSecondary}`}>
                <span className={colors.textMuted}>•</span>
                Right-click on elements for more options
              </li>
              <li className={`flex items-start gap-2 ${colors.textSecondary}`}>
                <span className={colors.textMuted}>•</span>
                Use layers to control element stacking order
              </li>
              <li className={`flex items-start gap-2 ${colors.textSecondary}`}>
                <span className={colors.textMuted}>•</span>
                Export your work regularly to save progress
              </li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t ${colors.border} ${colors.bgSecondary} rounded-b-2xl`}
        >
          <p className={`text-xs ${colors.textMuted} text-center`}>
            Seat Map Builder — Create beautiful venue layouts
          </p>
        </div>
      </div>
    </div>
  );
}

function ShortcutItem({
  keys,
  description,
}: {
  keys: string[];
  description: string;
}) {
  const { colors } = useThemeColors();

  return (
    <div
      className={`flex flex-col items-start gap-2 py-2 px-3 ${colors.bgSecondary} rounded-lg`}
    >
      <span className={`text-sm ${colors.textPrimary}`}>{description}</span>
      <div className="flex flex-wrap items-center gap-1 max-w-full">
        {keys.map((key, index) => (
          <span key={index} className="flex items-center">
            <kbd
              className={`px-2 py-1 ${colors.bgPrimary} border ${colors.border} rounded text-xs ${colors.textPrimary}`}
            >
              {key}
            </kbd>
            {index < keys.length - 1 && (
              <span className={`mx-1 ${colors.textMuted}`}>+</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function ToolItem({
  icon: Icon,
  name,
  description,
}: {
  icon: LucideIcon;
  name: string;
  description: string;
}) {
  const { colors } = useThemeColors();

  return (
    <div
      className={`flex items-center gap-3 py-2 px-3 ${colors.bgSecondary} rounded-lg`}
    >
      <div
        className={`w-8 h-8 flex items-center justify-center ${colors.bgPrimary} rounded-lg border ${colors.border}`}
      >
        <Icon size={16} className={colors.textSecondary} />
      </div>
      <div>
        <div className={`text-sm font-medium ${colors.textPrimary}`}>
          {name}
        </div>
        <div className={`text-xs ${colors.textSecondary}`}>{description}</div>
      </div>
    </div>
  );
}
