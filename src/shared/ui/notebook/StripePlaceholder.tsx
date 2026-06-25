"use client";

import { useId } from "react";

interface StripePlaceholderProps {
  label?: string;
  w?: number;
  h?: number;
  family?: "magazine" | "notebook";
  tint?: string;
  ink?: string;
  radius?: number;
}

export function StripePlaceholder({
  label,
  w = 800,
  h = 500,
  family = "notebook",
  tint = "#CFDDB6",
  ink = "#2b1f18",
  radius = 0,
}: StripePlaceholderProps) {
  const id = useId().replaceAll(':', "");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: "100%", display: "block", borderRadius: radius }}
    >
      <defs>
        <pattern
          id={`stripes-${id}`}
          width="18"
          height="18"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(35)"
        >
          <rect width="18" height="18" fill={tint} />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="18"
            stroke={ink}
            strokeOpacity="0.10"
            strokeWidth="2"
          />
        </pattern>
        {family === "notebook" ? <pattern id={`dots-${id}`} width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.9" fill={ink} fillOpacity="0.18" />
          </pattern> : null}
      </defs>
      <rect width={w} height={h} fill={`url(#stripes-${id})`} />
      {family === "notebook" ? <rect width={w} height={h} fill={`url(#dots-${id})`} /> : null}
      <rect
        x="1"
        y="1"
        width={w - 2}
        height={h - 2}
        fill="none"
        stroke={ink}
        strokeOpacity="0.25"
        strokeDasharray="6 8"
        strokeWidth="1.5"
      />
      <g>
        <rect
          x={w / 2 - 130}
          y={h / 2 - 22}
          width="260"
          height="44"
          fill={tint}
          stroke={ink}
          strokeOpacity="0.6"
        />
        <text
          x={w / 2}
          y={h / 2 + 6}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
          fontSize="14"
          textAnchor="middle"
          fill={ink}
          fillOpacity="0.85"
          letterSpacing="1"
        >
          {label || "image →"}
        </text>
      </g>
    </svg>
  );
}
