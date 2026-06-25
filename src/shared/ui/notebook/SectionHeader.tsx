import { NB_HAND, NB_HAND2 } from "@/shared/lib/design-data";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 12,
        borderBottom: "2px dashed var(--nb-rule)",
        paddingBottom: 10,
      }}
    >
      <h2 style={{ fontFamily: NB_HAND, fontSize: 42, margin: 0, color: "var(--nb-ink)" }}>
        {title}
      </h2>
      {subtitle ? <span style={{ fontFamily: NB_HAND2, fontSize: 18, color: "var(--nb-ink-soft)" }}>
          {subtitle}
        </span> : null}
    </div>
  );
}
