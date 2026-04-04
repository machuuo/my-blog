import { notFound } from "next/navigation";
import { getPostBySlug } from "@/entities/post/server";
import { getAllCategories } from "@/entities/category/server";
import { getAllPublishedSeries } from "@/entities/series/server";
import { WritePage } from "@/views/write";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function WriteEditPage({ params }: PageProps) {
  const { slug } = await params;
  const [post, categories, seriesList] = await Promise.all([
    getPostBySlug(slug),
    getAllCategories(),
    getAllPublishedSeries(),
  ]);

  if (!post) {
    notFound();
  }

  return <WritePage post={post} categories={categories} seriesList={seriesList} />;
}
