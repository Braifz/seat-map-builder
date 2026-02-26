"use client";

import { useThemeStore } from "../store/themeStore";

export function useThemeColors() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return {
    isDark,
    colors: {
      // Backgrounds
      bgPrimary: isDark ? "bg-[#1e1e1e]" : "bg-white",
      bgSecondary: isDark ? "bg-[#252525]" : "bg-gray-50",
      bgHover: isDark ? "hover:bg-[#2d2d2d]" : "hover:bg-gray-100",
      bgActive: isDark ? "bg-[#4a4a4a]" : "bg-gray-200",
      bgCanvas: isDark ? "bg-[#121212]" : "bg-gray-100",
      bgPage: isDark ? "bg-[#0f0f0f]" : "bg-gray-50",

      // Text
      textPrimary: isDark ? "text-[#e3e3e3]" : "text-gray-900",
      textSecondary: isDark ? "text-[#a0a0a0]" : "text-gray-600",
      textMuted: isDark ? "text-[#737373]" : "text-gray-500",

      // Borders
      border: isDark ? "border-[#2d2d2d]" : "border-gray-200",
      borderSubtle: isDark ? "border-[#3a3a3a]" : "border-gray-300",

      // Tooltips
      tooltipBg: isDark ? "bg-[#1e1e1e]" : "bg-gray-800",
      tooltipText: isDark ? "text-[#e3e3e3]" : "text-white",
      tooltipBorder: isDark ? "border-[#3a3a3a]" : "border-gray-700",

      // Danger
      dangerText: isDark ? "text-red-400" : "text-red-600",
      dangerHover: isDark ? "hover:bg-red-900/20" : "hover:bg-red-50",

      // Selected buttons/toggles - purple in dark mode, blue in light mode
      selectedBg: isDark ? "bg-blue-600" : "bg-blue-50",
      selectedBorder: isDark ? "border-blue-600" : "border-blue-500",
      selectedText: isDark ? "text-white" : "text-blue-700",

      // Raw values for inline styles
      raw: {
        bg: isDark ? "#1e1e1e" : "#ffffff",
        text: isDark ? "#e3e3e3" : "#171717",
        border: isDark ? "#2d2d2d" : "#e5e5e5",
        hover: isDark ? "#2d2d2d" : "#f5f5f5",
        muted: isDark ? "#a0a0a0" : "#737373",
      },
    },
  };
}
