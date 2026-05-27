import { SeriesGrid } from "@/widgets/series-grid";
import type { CategoryWithSeries } from "@/entities/series";

interface CategorySectionProps {
  category: CategoryWithSeries;
  index?: number;
  className?: string;
}

function HandArrow({ color }: { color: string }) {
  return (
    <svg width={50} height={22} viewBox="0 0 70 30" aria-hidden>
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

const ARROW_COLORS = [
  "hsl(var(--nb-pink))",
  "hsl(var(--nb-sage))",
  "hsl(var(--nb-sky))",
];

export function CategorySection({
  category,
  index = 0,
  className,
}: CategorySectionProps) {
  if (category.series_list.length === 0) return null;
  const arrowColor = ARROW_COLORS[index % ARROW_COLORS.length];

  return (
    <section className={className}>
      <div className="flex items-baseline gap-3 border-b-2 border-dashed border-nb-rule pb-3 mb-6">
        <HandArrow color={arrowColor} />
        <h2 className="font-hand text-3xl m-0 text-nb-ink">{category.name}</h2>
        <span className="font-hand2 text-base text-nb-ink-soft">
          {category.series_list.length}편의 시리즈
        </span>
      </div>
      <SeriesGrid seriesList={category.series_list} />
    </section>
  );
}
