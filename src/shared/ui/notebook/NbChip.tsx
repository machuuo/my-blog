import type { CSSProperties } from "react";

import { NB_HAND } from "@/shared/lib";

interface NbChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function NbChip({ active, onClick, children }: NbChipProps) {
  const style: CSSProperties = {
    fontFamily: NB_HAND,
    fontSize: 22,
    padding: "4px 14px",
    background: active ? "var(--nb-ink)" : "transparent",
    color: active ? "var(--nb-paper)" : "var(--nb-ink)",
    border: "2px solid var(--nb-ink)",
    borderRadius: 999,
    cursor: "pointer",
    transform: `rotate(${active ? 0 : -1}deg)`,
  };

  return (
    <button type="button" style={style} onClick={onClick} aria-pressed={active}>
      {children}
    </button>
  );
}
