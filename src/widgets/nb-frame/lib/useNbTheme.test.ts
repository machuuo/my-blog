import { act, renderHook } from "@testing-library/react";
import { getServerSnapshot, useNbTheme } from "./useNbTheme";

describe("useNbTheme", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns 'light' by default when localStorage is empty", () => {
    const { result } = renderHook(() => useNbTheme());
    expect(result.current.theme).toBe("light");
  });

  it("persists theme to localStorage when setTheme is called", () => {
    const { result } = renderHook(() => useNbTheme());

    act(() => {
      result.current.setTheme("dark");
    });

    expect(localStorage.getItem("nb-theme")).toBe("dark");
    expect(result.current.theme).toBe("dark");
  });

  it("syncs theme when storage event is dispatched (cross-tab)", () => {
    const { result } = renderHook(() => useNbTheme());

    act(() => {
      localStorage.setItem("nb-theme", "dark");
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "nb-theme",
          newValue: "dark",
          oldValue: "light",
          storageArea: localStorage,
        }),
      );
    });

    expect(result.current.theme).toBe("dark");
  });

  it("toggles theme between light and dark", () => {
    const { result } = renderHook(() => useNbTheme());

    expect(result.current.theme).toBe("light");

    act(() => {
      result.current.toggle();
    });
    expect(result.current.theme).toBe("dark");

    act(() => {
      result.current.toggle();
    });
    expect(result.current.theme).toBe("light");
  });

  it("returns 'light' from server snapshot (SSR safe)", () => {
    expect(getServerSnapshot()).toBe("light");
  });

  it("keeps return object reference stable across re-renders when theme is unchanged", () => {
    const { result, rerender } = renderHook(() => useNbTheme());

    const first = result.current;
    rerender();
    const second = result.current;

    expect(second).toBe(first);
    expect(second.toggle).toBe(first.toggle);
    expect(second.setTheme).toBe(first.setTheme);
  });
});
