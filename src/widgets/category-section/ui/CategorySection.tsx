import { SeriesGrid } from "@/widgets/series-grid";
import type { CategoryWithSeries } from "@/entities/series";

interface CategorySectionProps {
  category: CategoryWithSeries;
  className?: string;
}

export function CategorySection({ category, className }: CategorySectionProps) {
  if (category.series_list.length === 0) return null;

  return (
    <section className={className}>
      <h2 className="text-xl font-semibold tracking-tight mb-4">
        {category.name}
      </h2>
      <SeriesGrid seriesList={category.series_list} />
    </section>
  );
}
