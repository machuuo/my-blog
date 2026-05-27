import { MDXRemote } from "next-mdx-remote/rsc";
import { Breadcrumb, type BreadcrumbItem } from "@/shared/ui/breadcrumb";
import { PostMeta } from "@/entities/post";
import type { PostWithSeries } from "@/entities/post";

interface PostDetailPageProps {
  post: PostWithSeries;
}

export function PostDetailPage({ post }: PostDetailPageProps) {
  const breadcrumbItems: BreadcrumbItem[] = [{ label: "홈", href: "/" }];

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
    <main className="max-w-3xl mx-auto px-6 lg:px-10 pt-10 pb-8">
      <Breadcrumb items={breadcrumbItems} />

      <article className="mt-8">
        <header className="mb-10">
          <div className="flex flex-wrap items-baseline gap-2 font-hand2 text-base text-nb-ink-soft">
            {post.category_name && (
              <>
                <span className="text-nb-pink">●</span>
                <span>{post.category_name}</span>
                <span>·</span>
              </>
            )}
            <span>essay no. {(post.post_id ?? "").toString().slice(-2) || "01"}</span>
          </div>

          <h1 className="font-hand font-normal text-nb-ink leading-[0.96] my-4 text-5xl sm:text-6xl lg:text-7xl">
            {post.title}
          </h1>

          {post.description && (
            <p className="font-serif italic text-xl lg:text-2xl text-nb-ink-soft leading-relaxed m-0">
              {post.description}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <PostMeta date={post.date} readingTime={post.readingTime} />
            {post.tags.length > 0 && (
              <>
                <span className="text-nb-pink font-hand2">·</span>
                <div className="flex flex-wrap gap-2 font-hand2 text-sm text-nb-ink-soft">
                  {post.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="border-b-2 border-dashed border-nb-rule mt-8" />
        </header>

        <div className="prose prose-nb max-w-none">
          <MDXRemote source={post.content} />
        </div>
      </article>
    </main>
  );
}
