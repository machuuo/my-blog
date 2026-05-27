import { CategorySection } from "@/widgets/category-section";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import type { CategoryWithSeries } from "@/entities/series";

interface SeriesListPageProps {
  categories: CategoryWithSeries[];
}

function StickyNote({
  color,
  rotate = -2,
  width = 200,
  className,
  children,
}: {
  color: string;
  rotate?: number;
  width?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`font-hand text-lg leading-snug text-nb-ink p-4 ${className ?? ""}`}
      style={{
        width,
        backgroundColor: color,
        transform: `rotate(${rotate}deg)`,
        boxShadow: "4px 6px 14px rgba(0,0,0,0.12)",
      }}
    >
      {children}
    </div>
  );
}

export function SeriesListPage({ categories }: SeriesListPageProps) {
  const totalCount = categories.reduce(
    (sum, c) => sum + c.series_list.length,
    0,
  );
  const hasCategories = categories.some((c) => c.series_list.length > 0);

  const breadcrumbItems = [{ label: "홈", href: "/" }, { label: "시리즈" }];

  return (
    <main className="max-w-6xl mx-auto px-6 lg:px-12 pt-10 pb-8">
      <Breadcrumb items={breadcrumbItems} />

      <header className="relative mt-6 mb-10">
        <div className="hidden md:block absolute top-6 right-6">
          <StickyNote color="hsl(var(--nb-sky))" rotate={5} width={210}>
            여기는 시리즈 책장 ✏️
            <br />
            <span className="font-hand2 text-sm text-nb-ink-soft">
              꺼내 펼쳐 보세요
            </span>
          </StickyNote>
        </div>

        <div className="font-hand2 text-lg text-nb-ink-soft">· chapter list ·</div>
        <h1 className="font-hand font-normal text-nb-ink leading-[0.94] my-2 text-6xl sm:text-7xl lg:text-[8rem]">
          시리즈 <span className="text-nb-pink">{totalCount}편</span>
        </h1>
        <p className="font-serif italic text-lg lg:text-xl text-nb-ink-soft max-w-2xl leading-relaxed m-0">
          비슷한 주제의 글을 묶어둔 페이지들. 책장에서 한 권씩 꺼내듯 펼쳐보세요.
        </p>
      </header>

      {hasCategories ? (
        <div className="flex flex-col gap-14">
          {categories.map((category, idx) => (
            <CategorySection
              key={category.category_id}
              category={category}
              index={idx}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 font-hand text-3xl text-nb-ink-soft">
          아직 시리즈가 없어요.
        </div>
      )}
    </main>
  );
}
