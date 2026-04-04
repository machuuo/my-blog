import { Library } from "lucide-react";
import { CategorySection } from "@/widgets/category-section";
import { PostList } from "@/widgets/post-list";
import { Separator } from "@/shared/ui/separator";
import { BLOG_DESCRIPTION } from "@/shared/lib/constants";
import type { CategoryWithSeries } from "@/entities/series";
import type { Post } from "@/entities/post";

interface HomePageProps {
  categories: CategoryWithSeries[];
  uncategorizedPosts: Post[];
}

export function HomePage({ categories, uncategorizedPosts }: HomePageProps) {
  const hasCategories = categories.some((c) => c.series_list.length > 0);

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <section className="mb-10">
        <p className="text-muted-foreground">{BLOG_DESCRIPTION}</p>
      </section>

      {hasCategories && (
        <section className="mb-10 rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Library className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">Series</h2>
          </div>
          <div className="flex flex-col gap-8">
            {categories.map((category) => (
              <CategorySection key={category.category_id} category={category} />
            ))}
          </div>
        </section>
      )}

      {uncategorizedPosts.length > 0 && (
        <section>
          {hasCategories && (
            <>
              <h2 className="text-lg font-semibold tracking-tight mb-4">Posts</h2>
              <Separator className="mb-4" />
            </>
          )}
          <PostList posts={uncategorizedPosts} />
        </section>
      )}

      {!hasCategories && uncategorizedPosts.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">아직 포스트가 없습니다.</p>
        </div>
      )}
    </main>
  );
}
