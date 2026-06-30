import type { CSSProperties } from "react";

import { NB_HAND } from "@/shared/lib/design-data";

import { StripePlaceholder } from "./StripePlaceholder";

interface PolaroidProps {
  label: string;
  tint?: string;
  rotate?: number;
  w?: number;
  caption?: string;
  style?: CSSProperties;
}

export function Polaroid({
  label,
  tint = "var(--green-1)",
  rotate = -3,
  w = 280,
  caption,
  style = {},
}: PolaroidProps) {
  return (
    <div
      style={{
        width: w,
        background: "#FCF8EE",
        padding: "14px 14px 36px",
        transform: `rotate(${rotate}deg)`,
        boxShadow: "6px 10px 22px rgba(40,28,18,0.18)",
        ...style,
      }}
    >
      <div style={{ aspectRatio: "1/1" }}>
        <StripePlaceholder
          label={label}
          family="notebook"
          tint={tint}
          ink="#3a2c1e"
        />
      </div>
      {caption ? <div
          style={{
            fontFamily: NB_HAND,
            fontSize: 18,
            color: "#3a2c1e",
            marginTop: 8,
            textAlign: "center",
          }}
        >
          {caption}
        </div> : null}
    </div>
  );
}
