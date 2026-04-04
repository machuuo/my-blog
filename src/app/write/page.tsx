import { getAllCategories } from "@/entities/category/server";
import { getAllPublishedSeries } from "@/entities/series/server";
import { WritePage } from "@/views/write";

export default async function WriteNewPage() {
  const [categories, seriesList] = await Promise.all([
    getAllCategories(),
    getAllPublishedSeries(),
  ]);

  return <WritePage categories={categories} seriesList={seriesList} />;
}
