import { useCallback, useMemo, useSyncExternalStore } from "react";

export type NbTheme = "light" | "dark";

const STORAGE_KEY = "nb-theme";

function subscribe(callback: () => void): () => void {
  const handler = (event: StorageEvent): void => {
    if (event.storageArea !== localStorage) return;
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    callback();
  };

  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("storage", handler);
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
