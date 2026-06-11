import type { CSSProperties } from "react";

interface HandCircleProps {
  width?: number;
  height?: number;
  color?: string;
  style?: CSSProperties;
}

export function HandCircle({
  width = 140,
  height = 50,
  color = "var(--nb-pink)",
  style = {},
}: HandCircleProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 140 50"
      style={{ position: "absolute", pointerEvents: "none", ...style }}
    >
      <ellipse
        cx="70"
        cy="25"
        rx="62"
        ry="20"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        strokeDasharray="0"
        strokeLinecap="round"
      />
    </svg>
  );
}
