import Link from "next/link";
import { PostMeta } from "@/entities/post";
import { BLOG_DESCRIPTION } from "@/shared/lib/constants";
import type { CategoryWithSeries, SeriesWithCount } from "@/entities/series";
import type { Post } from "@/entities/post";

interface HomePageProps {
  categories: CategoryWithSeries[];
  uncategorizedPosts: Post[];
}

const TAPES = ["pink", "sage", "sky", "butter"] as const;
type Tape = (typeof TAPES)[number];

function tapeColor(tape: Tape): string {
  return `hsl(var(--nb-${tape}))`;
}

function pickTape(idx: number): Tape {
  return TAPES[idx % TAPES.length];
}

function HandArrow({
  width = 70,
  height = 30,
  color = "currentColor",
  flip = false,
}: {
  width?: number;
  height?: number;
  color?: string;
  flip?: boolean;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 70 30"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      aria-hidden
    >
      <path
        d="M3 18 Q 25 2, 50 14 T 64 18"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M55 10 L 64 18 L 53 22"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WashiTape({
  color,
  width = 110,
  rotate = -8,
  className,
  style,
}: {
  color: string;
  width?: number;
  rotate?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={`nb-washi rounded-sm ${className ?? ""}`}
      style={{
        width,
        height: 26,
        backgroundColor: color,
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
    />
  );
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
      className={`font-hand text-xl leading-snug text-nb-ink p-4 shadow-lg ${className ?? ""}`}
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

export function HomePage({ categories, uncategorizedPosts }: HomePageProps) {
  const totalSeries = categories.reduce(
    (acc, c) => acc + c.series_list.length,
    0,
  );
  const totalPosts =
    categories.reduce(
      (acc, c) => acc + c.series_list.reduce((s, x) => s + x.post_count, 0),
      0,
    ) + uncategorizedPosts.length;

  const featuredCategories = categories.filter((c) => c.series_list.length > 0);
  const leftColumn = featuredCategories[0];
  const rightColumn = featuredCategories[1];
  const leadSeries = leftColumn?.series_list[0];

  return (
    <main className="max-w-6xl mx-auto px-6 lg:px-12 pt-12 pb-8">
      {/* Hero — handwriting masthead */}
      <section className="relative pb-8">
        <div className="hidden md:block absolute top-6 right-6 lg:right-16">
          <StickyNote color="hsl(var(--nb-butter))" rotate={6} width={200}>
            오늘의 메모
            <br />
            <span className="font-hand2 text-sm text-nb-ink-soft">
              2026년 5월, 비가 많이 오는 주말
            </span>
          </StickyNote>
        </div>

        <div className="font-sans text-sm text-nb-ink-soft tracking-wide">
          ✦ 오늘의 한 페이지 ✦
        </div>
        <h1 className="font-hand font-normal text-nb-ink leading-[0.92] my-4 text-5xl sm:text-6xl lg:text-7xl xl:text-8xl">
          공부하고,
          <span className="text-nb-pink">축구 보고,</span>
          <br />
          가끔 책 읽는 사람의
          <br />
          작은 노트.
        </h1>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-6">
          <p className="font-serif italic text-lg lg:text-xl leading-relaxed text-nb-ink-soft max-w-xl m-0">
            {BLOG_DESCRIPTION}. 코드를 쓰던 손으로 다시 칠판을 그리고, 다 못
            읽은 책을 또 한 권 펼치는 사람의 매주 한 페이지.
          </p>
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <HandArrow width={80} color="hsl(var(--nb-ink-soft))" />
            <span className="font-sans text-sm text-nb-ink-soft whitespace-nowrap">
              아래로 →
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-6 font-sans text-sm">
          <span className="px-3 py-1 rounded-full border-2 border-nb-ink text-nb-ink">
            시리즈 {totalSeries}편
          </span>
          <span className="px-3 py-1 rounded-full border-2 border-nb-ink text-nb-ink">
            글 {totalPosts}편
          </span>
        </div>
      </section>

      {/* Today's picks — lead series */}
      {leadSeries && leftColumn && (
        <section className="pt-8">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="font-hand text-4xl lg:text-5xl m-0 text-nb-ink">
              오늘 꺼낸 페이지
            </h2>
            <span className="font-hand2 text-lg text-nb-ink-soft">
              · today&apos;s reads
            </span>
            <HandArrow width={56} color="hsl(var(--nb-pink))" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr] gap-8 lg:gap-10 mt-10 items-start">
            <FeatureCard
              series={leadSeries}
              category={leftColumn.name}
              big
              tape="sage"
            />
            {leftColumn.series_list.slice(1, 3).map((s, idx) => (
              <FeatureCard
                key={s.series_id}
                series={s}
                category={leftColumn.name}
                tape={pickTape(idx + 1)}
              />
            ))}
            {leftColumn.series_list.length < 2 && rightColumn && (
              <>
                {rightColumn.series_list.slice(0, 2).map((s, idx) => (
                  <FeatureCard
                    key={s.series_id}
                    series={s}
                    category={rightColumn.name}
                    tape={pickTape(idx + 1)}
                  />
                ))}
              </>
            )}
          </div>
        </section>
      )}

      {/* Two columns: categories */}
      {(leftColumn || rightColumn || uncategorizedPosts.length > 0) && (
        <section className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-14 mt-20">
          {leftColumn && (
            <CategoryColumn
              title={leftColumn.name}
              subtitle="study notes"
              arrow="pink"
              category={leftColumn}
            />
          )}
          {rightColumn ? (
            <CategoryColumn
              title={rightColumn.name}
              subtitle="weekend notes"
              arrow="sage"
              category={rightColumn}
            />
          ) : uncategorizedPosts.length > 0 ? (
            <UncategorizedColumn
              posts={uncategorizedPosts.slice(0, 4)}
              arrow="sage"
            />
          ) : null}

          <div className="hidden lg:block absolute -top-6 right-0">
            <StickyNote color="hsl(var(--nb-sage))" rotate={4} width={170}>
              축구도 결국
              <br />
              <em className="not-italic font-serif italic">그림 그리기</em>예요
            </StickyNote>
          </div>
        </section>
      )}

      {/* Pull quote with highlighter */}
      {/* <section className="text-center py-16 mt-12">
        <div className="font-sans text-xl sm:text-2xl lg:text-3xl leading-relaxed max-w-3xl mx-auto text-nb-ink">
          잘 정돈된 메모를 좋아하다 보니,
          <br />
          <span className="nb-highlight">정돈된 척하는 메모도</span>
          <br />
          좋아하게 되었어요.
        </div>
      </section> */}

      {!leftColumn && uncategorizedPosts.length === 0 && (
        <div className="text-center py-20">
          <p className="font-sans text-lg text-nb-ink-soft">
            아직 페이지가 비어있어요.
          </p>
        </div>
      )}
    </main>
  );
}

function FeatureCard({
  series,
  category,
  big = false,
  tape,
}: {
  series: SeriesWithCount;
  category: string;
  big?: boolean;
  tape: Tape;
}) {
  return (
    <Link href={`/series/${series.slug}`} className="group block relative">
      <WashiTape
        color={tapeColor(tape)}
        width={big ? 140 : 100}
        rotate={big ? -4 : 5}
        className="absolute -top-3 z-10"
        style={{ left: big ? 30 : 20 }}
      />
      <article>
        <div
          className="nb-paper-card mb-4 p-2 aspect-[4/3] overflow-hidden"
          style={{
            backgroundImage: series.thumbnail_url
              ? `url(${series.thumbnail_url})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {!series.thumbnail_url && (
            <div
              className="w-full h-full flex items-center justify-center font-sans text-2xl text-nb-ink-soft"
              style={{ backgroundColor: tapeColor(tape), opacity: 0.6 }}
            >
              {category}
            </div>
          )}
        </div>
        <div className="font-sans text-xs text-nb-ink-soft uppercase tracking-wide">
          {category} · {series.post_count}편
        </div>
        <h3
          className={`font-sans ${big ? "text-2xl" : "text-xl"} leading-snug m-0 my-2 text-nb-ink group-hover:text-nb-pink transition-colors`}
        >
          {series.title}
        </h3>
        <p className="font-serif text-base leading-relaxed text-nb-ink-soft m-0">
          {series.description}
        </p>
      </article>
    </Link>
  );
}

function CategoryColumn({
  title,
  subtitle,
  arrow,
  category,
}: {
  title: string;
  subtitle: string;
  arrow: "pink" | "sage";
  category: CategoryWithSeries;
}) {
  const arrowColor =
    arrow === "sage" ? "hsl(var(--nb-sage))" : "hsl(var(--nb-pink))";

  return (
    <div>
      <div className="flex items-baseline gap-3 border-b-2 border-dashed border-nb-rule pb-3">
        <HandArrow width={50} color={arrowColor} />
        <h2 className="font-sans text-xl lg:text-2xl m-0 text-nb-ink">
          {title}
        </h2>
        <span className="font-sans text-xs text-nb-ink-soft uppercase tracking-wide">
          {subtitle}
        </span>
      </div>
      <div className="flex flex-col gap-6 mt-6">
        {category.series_list.slice(0, 3).map((s, i) => (
          <SeriesRow
            key={s.series_id}
            href={`/series/${s.slug}`}
            index={i + 1}
            arrowColor={arrowColor}
            title={s.title}
            excerpt={s.description}
            meta={`${s.post_count}편`}
          />
        ))}
        {category.series_list.length > 3 && (
          <Link
            href="/series"
            className="font-sans text-sm text-nb-pink hover:text-nb-ink transition-colors self-end"
          >
            더 보기 →
          </Link>
        )}
      </div>
    </div>
  );
}

function UncategorizedColumn({
  posts,
  arrow,
}: {
  posts: Post[];
  arrow: "pink" | "sage";
}) {
  const arrowColor =
    arrow === "sage" ? "hsl(var(--nb-sage))" : "hsl(var(--nb-pink))";

  return (
    <div>
      <div className="flex items-baseline gap-3 border-b-2 border-dashed border-nb-rule pb-3">
        <HandArrow width={50} color={arrowColor} />
        <h2 className="font-sans text-xl lg:text-2xl m-0 text-nb-ink">
          최근 글
        </h2>
        <span className="font-sans text-xs text-nb-ink-soft uppercase tracking-wide">
          recent notes
        </span>
      </div>
      <div className="flex flex-col gap-6 mt-6">
        {posts.map((p, i) => (
          <SeriesRow
            key={p.post_id}
            href={`/posts/${p.slug}`}
            index={i + 1}
            arrowColor={arrowColor}
            title={p.title}
            excerpt={p.description}
            metaNode={<PostMeta date={p.date} readingTime={p.readingTime} />}
          />
        ))}
      </div>
    </div>
  );
}

function SeriesRow({
  href,
  index,
  arrowColor,
  title,
  excerpt,
  meta,
  metaNode,
}: {
  href: string;
  index: number;
  arrowColor: string;
  title: string;
  excerpt: string;
  meta?: string;
  metaNode?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group grid grid-cols-[3rem_1fr] gap-3 items-start"
    >
      <div
        className="font-sans text-xl leading-none tabular-nums"
        style={{ color: arrowColor }}
      >
        ·{String(index).padStart(2, "0")}
      </div>
      <div>
        <h3 className="font-sans text-base lg:text-lg leading-snug m-0 text-nb-ink group-hover:text-nb-pink transition-colors">
          {title}
        </h3>
        <p className="font-serif text-sm leading-relaxed text-nb-ink-soft m-0 mt-1 mb-1.5">
          {excerpt}
        </p>
        <div className="font-sans text-xs text-nb-ink-soft">
          {metaNode ?? meta}
        </div>
      </div>
    </Link>
  );
}
