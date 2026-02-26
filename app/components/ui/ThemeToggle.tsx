"use client";

import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";
import { Tooltip } from "./Tooltip";
import { useThemeColors } from "../../hooks/useThemeColors";

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const { colors } = useThemeColors();

  return (
    <div className="fixed top-4 left-4 z-50">
      <Tooltip
        content={
          theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
        }
        position="bottom"
      >
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-full ${colors.bgPrimary} shadow-lg border ${colors.border} ${colors.textSecondary} ${colors.bgHover} hover:${colors.textPrimary} transition-all duration-150`}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </Tooltip>
    </div>
  );
}
