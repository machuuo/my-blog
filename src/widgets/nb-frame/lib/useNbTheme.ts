import { useCallback, useMemo, useSyncExternalStore } from "react";

export type NbTheme = "light" | "dark";

const STORAGE_KEY = "nb-theme";

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): NbTheme {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function getServerSnapshot(): NbTheme {
  return "light";
}

function writeTheme(next: NbTheme): void {
  try {
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: STORAGE_KEY,
        newValue: next,
        storageArea: localStorage,
      }),
    );
  } catch {
    // silent fallback — private mode 등
  }
}

export interface UseNbThemeResult {
  theme: NbTheme;
  setTheme: (next: NbTheme) => void;
  toggle: () => void;
}

export function useNbTheme(): UseNbThemeResult {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    writeTheme(theme === "dark" ? "light" : "dark");
  }, [theme]);

  return useMemo(
    () => ({
      theme,
      setTheme: writeTheme,
      toggle,
    }),
    [theme, toggle],
  );
}
