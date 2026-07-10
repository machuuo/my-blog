import type { Metadata } from "next";

import { getAllCategories } from "@/entities/category/server";
import type { CategoryWithSeries } from "@/entities/series";
import { getAllPublishedSeries } from "@/entities/series/server";
import { BLOG_NAME } from "@/shared/lib";
import { SeriesListPage } from "@/views/series-list";

export const revalidate = 60;

export const metadata: Metadata = {
  title: `Series | ${BLOG_NAME}`,
  description: "전체 시리즈 목록",
};

export default async function SeriesPage() {
  const [categories, allSeries] = await Promise.all([
    getAllCategories(),
    getAllPublishedSeries(),
  ]);

  const categoriesWithSeries: CategoryWithSeries[] = categories.map((cat) => ({
    ...cat,
    series_list: allSeries.filter((s) => s.category_id === cat.category_id),
  }));

  return <SeriesListPage categories={categoriesWithSeries} />;
}
