import { PostList } from "@/widgets/post-list";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import type { Series } from "@/entities/series";
import type { Post } from "@/entities/post";

interface SeriesDetailPageProps {
  series: Series;
  posts: Post[];
}

export function SeriesDetailPage({ series, posts }: SeriesDetailPageProps) {
  const breadcrumbItems = [
    { label: "홈", href: "/" },
    { label: "시리즈", href: "/series" },
    { label: series.title },
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 lg:px-12 pt-10 pb-8">
      <Breadcrumb items={breadcrumbItems} />

      <header className="mt-6 mb-10 relative">
        <div className="font-hand2 text-lg text-nb-ink-soft">
          · 시리즈 · {posts.length}편 ·
        </div>
        <h1 className="font-hand font-normal text-nb-ink leading-[0.96] my-2 text-5xl sm:text-6xl lg:text-7xl">
          {series.title}
        </h1>
        {series.description && (
          <p className="font-serif italic text-lg lg:text-xl text-nb-ink-soft max-w-2xl leading-relaxed m-0 mt-3">
            {series.description}
          </p>
        )}
        <div className="border-b-2 border-dashed border-nb-rule mt-6" />
      </header>

      <PostList posts={posts} />
    </main>
  );
}
