import { SeriesCard } from "@/entities/series";
import type { SeriesWithCount } from "@/entities/series";

interface SeriesGridProps {
  seriesList: SeriesWithCount[];
  className?: string;
}

export function SeriesGrid({ seriesList, className }: SeriesGridProps) {
  if (seriesList.length === 0) return null;

  return (
    <div className={`grid gap-7 sm:grid-cols-2 ${className ?? ""}`}>
      {seriesList.map((series, idx) => (
        <SeriesCard key={series.series_id} series={series} index={idx} />
      ))}
    </div>
  );
}
