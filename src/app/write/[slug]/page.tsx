import { notFound } from "next/navigation";
import { getPostBySlug } from "@/entities/post/server";
import { WritePage } from "@/views/write";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function WriteEditPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return <WritePage post={post} />;
}
