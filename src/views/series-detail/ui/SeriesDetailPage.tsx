import { PostList } from "@/widgets/post-list";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import type { Series } from "@/entities/series";
import type { Post } from "@/entities/post";

interface SeriesDetailPageProps {
  series: Series;
  posts: Post[];
}

export function SeriesDetailPage({
  series,
  posts,
}: SeriesDetailPageProps) {
  const breadcrumbItems = [
    { label: "홈", href: "/" },
    { label: "Series", href: "/series" },
    { label: series.title },
  ];

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <Breadcrumb items={breadcrumbItems} />

      <header className="mt-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{series.title}</h1>
        {series.description && (
          <p className="text-muted-foreground mt-2">{series.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-3">
          {posts.length}개의 포스트
        </p>
      </header>

      <PostList posts={posts} />
    </main>
  );
}
