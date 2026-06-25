import type { CSSProperties } from "react";

interface WashiTapeProps {
  color?: string;
  width?: number;
  rotate?: number;
  style?: CSSProperties;
}

export function WashiTape({
  color = "var(--nb-memo)",
  width = 110,
  rotate = -8,
  style = {},
}: WashiTapeProps) {
  return (
    <div
      style={{
        width,
        height: 28,
        background: color,
        opacity: 0.85,
        transform: `rotate(${rotate}deg)`,
        backgroundImage:
          "repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 12px)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        ...style,
      }}
    />
  );
}
