import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug } from "@/entities/post/server";
import { PostDetailPage } from "@/views/post-detail";
import { BLOG_NAME } from "@/shared/lib/constants";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: "Not Found" };
  }

  return {
    title: `${post.title} | ${BLOG_NAME}`,
    description: post.description,
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return <PostDetailPage post={post} />;
}
