import { create } from "zustand";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "chaintrace-theme";

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

interface ThemeState {
  theme: ThemeMode;
  initialized: boolean;
  initializeTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "light",
  initialized: false,
  initializeTheme: () => {
    if (typeof window === "undefined") {
      set({ initialized: true });
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    const theme: ThemeMode = stored === "dark" ? "dark" : "light";
    applyTheme(theme);
    set({ theme, initialized: true });
  },
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
    applyTheme(theme);
    set({ theme });
  }
}));

