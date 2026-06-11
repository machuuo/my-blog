interface SquiggleProps {
  width?: number;
  color?: string;
}

export function Squiggle({ width = 200, color = "var(--nb-pink)" }: SquiggleProps) {
  return (
    <svg
      width={width}
      height="12"
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <path
        d="M2 8 Q 20 2, 40 8 T 80 8 T 120 8 T 160 8 T 198 8"
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
