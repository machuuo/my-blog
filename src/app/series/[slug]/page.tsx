import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSeriesBySlug } from "@/entities/series/server";
import { getPostsBySeries } from "@/entities/post/server";
import { getAllCategories } from "@/entities/category/server";
import { SeriesDetailPage } from "@/views/series-detail";
import { BLOG_NAME } from "@/shared/lib/constants";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);

  if (!series) {
    return { title: "Not Found" };
  }

  return {
    title: `${series.title} | ${BLOG_NAME}`,
    description: series.description,
  };
}

export default async function SeriesPage({ params }: PageProps) {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);

  if (!series) {
    notFound();
  }

  const [posts, categories] = await Promise.all([
    getPostsBySeries(series.series_id),
    getAllCategories(),
  ]);

  const category = categories.find(
    (c) => c.category_id === series.category_id
  );

  return (
    <SeriesDetailPage
      series={series}
      posts={posts}
      categoryName={category?.name}
    />
  );
}
