"use client";

import { create } from "zustand";

type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("seatmap-theme") as Theme;
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "dark",
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem("seatmap-theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
      }
      return { theme: newTheme };
    }),
  setTheme: (theme) =>
    set(() => {
      if (typeof window !== "undefined") {
        localStorage.setItem("seatmap-theme", theme);
        document.documentElement.classList.toggle("dark", theme === "dark");
      }
      return { theme };
    }),
}));

// Initialize theme on client side
if (typeof window !== "undefined") {
  const theme = getInitialTheme();
  document.documentElement.classList.toggle("dark", theme === "dark");
  useThemeStore.setState({ theme });
}
