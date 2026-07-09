import type { CategoryWithSeries } from "@/entities/series";
import { Breadcrumb } from "@/shared/ui";
import { CategorySection } from "@/widgets/category-section";

interface SeriesListPageProps {
  categories: CategoryWithSeries[];
}

export function SeriesListPage({ categories }: SeriesListPageProps) {
  const totalCount = categories.reduce(
    (sum, c) => sum + c.series_list.length,
    0,
  );
  const hasCategories = totalCount > 0;

  const breadcrumbItems = [
    { label: "홈", href: "/" },
    { label: "Series" },
  ];

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <Breadcrumb items={breadcrumbItems} />

      <header className="mt-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Series</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {totalCount}개의 시리즈
        </p>
      </header>

      {hasCategories ? (
        <div className="flex flex-col gap-8">
          {categories.map((category) => (
            <CategorySection key={category.category_id} category={category} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">아직 시리즈가 없습니다.</p>
        </div>
      )}
    </main>
  );
}
