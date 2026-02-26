"use client";

import { useState, ReactNode } from "react";
import { useThemeColors } from "../../hooks/useThemeColors";

interface TooltipProps {
  children: ReactNode;
  content: string;
  delay?: number;
  position?: "top" | "bottom";
}

export function Tooltip({
  children,
  content,
  delay = 300,
  position = "top",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const { colors } = useThemeColors();

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const tooltipClasses =
    position === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : "top-full left-1/2 -translate-x-1/2 mt-2";

  const arrowClasses =
    position === "top"
      ? `top-full left-1/2 -translate-x-1/2 border-t-${colors.raw.bg}`
      : `bottom-full left-1/2 -translate-x-1/2 border-b-${colors.raw.bg}`;

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute ${tooltipClasses} px-2 py-1 ${colors.tooltipBg} ${colors.tooltipText} text-xs rounded-md whitespace-nowrap z-50 border ${colors.tooltipBorder}`}
          style={{ backgroundColor: colors.raw.bg, color: colors.raw.text }}
        >
          {content}
          <div
            className={`absolute border-4 border-transparent ${arrowClasses}`}
            style={
              position === "top"
                ? { borderTopColor: colors.raw.bg }
                : { borderBottomColor: colors.raw.bg }
            }
          />
        </div>
      )}
    </div>
  );
}
