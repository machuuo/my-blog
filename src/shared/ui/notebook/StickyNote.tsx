import type { CSSProperties, ReactNode } from "react";
import { NB_HAND } from "@/shared/lib/design-data";

interface StickyNoteProps {
  children: ReactNode;
  color?: string;
  rotate?: number;
  w?: number;
  style?: CSSProperties;
}

export function StickyNote({
  children,
  color = "var(--nb-note)",
  rotate = -2,
  w = 220,
  style = {},
}: StickyNoteProps) {
  return (
    <div
      style={{
        width: w,
        padding: "16px 18px",
        background: color,
        transform: `rotate(${rotate}deg)`,
        fontFamily: NB_HAND,
        fontSize: 22,
        lineHeight: 1.3,
        color: "var(--nb-ink)",
        boxShadow: "4px 6px 14px rgba(0,0,0,0.12)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
