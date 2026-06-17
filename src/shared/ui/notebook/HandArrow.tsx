interface HandArrowProps {
  width?: number;
  height?: number;
  color?: string;
  flip?: boolean;
}

export function HandArrow({
  width = 70,
  height = 30,
  color = "currentColor",
  flip = false,
}: HandArrowProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 70 30"
      style={{ transform: flip ? "scaleX(-1)" : "none" }}
    >
      <path
        d="M3 18 Q 25 2, 50 14 T 64 18"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M55 10 L 64 18 L 53 22"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
