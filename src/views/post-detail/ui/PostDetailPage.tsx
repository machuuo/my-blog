import { MDXRemote } from "next-mdx-remote/rsc";
import { Badge } from "@/shared/ui/badge";
import { Breadcrumb, type BreadcrumbItem } from "@/shared/ui/breadcrumb";
import { Separator } from "@/shared/ui/separator";
import { PostMeta } from "@/entities/post";
import type { PostWithSeries } from "@/entities/post";

interface PostDetailPageProps {
  post: PostWithSeries;
}

export function PostDetailPage({ post }: PostDetailPageProps) {
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "홈", href: "/" },
  ];

  if (post.category_name) {
    breadcrumbItems.push({ label: post.category_name });
  }

  if (post.series_title && post.series_slug) {
    breadcrumbItems.push({
      label: post.series_title,
      href: `/series/${post.series_slug}`,
    });
  }

  breadcrumbItems.push({ label: post.title });

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <Breadcrumb items={breadcrumbItems} />

      <article className="mt-6">
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
          <p className="text-muted-foreground mt-2">{post.description}</p>
          <PostMeta date={post.date} readingTime={post.readingTime} />
        </header>

        <Separator className="mb-8" />

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <MDXRemote source={post.content} />
        </div>
      </article>
    </main>
  );
}
