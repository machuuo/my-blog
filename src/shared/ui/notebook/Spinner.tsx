"use client";

const SIZE_MAP = { sm: 16, md: 32, lg: 48 } as const;

interface SpinnerProps {
  size?: keyof typeof SIZE_MAP;
}

export function Spinner({ size = "md" }: SpinnerProps) {
  const px = SIZE_MAP[size];

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="로딩 중"
    >
      <circle cx="12" cy="12" r="10" stroke="var(--nb-rule)" strokeWidth="2.5" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="var(--nb-ink)"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="0.9s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}
