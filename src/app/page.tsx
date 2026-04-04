import { getAllCategories } from "@/entities/category/server";
import { getAllPublishedSeries } from "@/entities/series/server";
import { getUncategorizedPosts } from "@/entities/post/server";
import { HomePage } from "@/views/home";
import type { CategoryWithSeries } from "@/entities/series";

export const revalidate = 60;

export default async function Home() {
  const [categories, allSeries, uncategorizedPosts] = await Promise.all([
    getAllCategories(),
    getAllPublishedSeries(),
    getUncategorizedPosts(),
  ]);

  // category별로 series 그룹핑
  const categoriesWithSeries: CategoryWithSeries[] = categories.map((cat) => ({
    ...cat,
    series_list: allSeries.filter((s) => s.category_id === cat.category_id),
  }));

  return (
    <HomePage
      categories={categoriesWithSeries}
      uncategorizedPosts={uncategorizedPosts}
    />
  );
}
