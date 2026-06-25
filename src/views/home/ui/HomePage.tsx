import Link from "next/link";
import {
  HOBBY_POSTS,
  TECH_POSTS,
  NB_BODY,
  NB_HAND,
  NB_HAND2,
  accentTint,
  type NbPost,
} from "@/shared/lib/design-data";
import { HandArrow } from "@/shared/ui/notebook/HandArrow";
import { StickyNote } from "@/shared/ui/notebook/StickyNote";
import { StripePlaceholder } from "@/shared/ui/notebook/StripePlaceholder";
import { WashiTape } from "@/shared/ui/notebook/WashiTape";

function postHref(p: NbPost, group: "tech" | "hobby") {
  return `/${group}/${p.slug}`;
}

function NbFeatureCard({
  p,
  big,
  tape,
  group,
}: {
  p: NbPost;
  big?: boolean;
  tape: "sage" | "pink" | "sky";
  group: "tech" | "hobby";
}) {
  const tapeColor =
    tape === "sage"
      ? "var(--nb-tape)"
      : tape === "pink"
        ? "var(--nb-memo)"
        : "var(--sky-1)";
  return (
    <Link
      href={postHref(p, group)}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <article style={{ position: "relative" }}>
        <WashiTape
          color={tapeColor}
          rotate={big ? -4 : 5}
          width={big ? 140 : 100}
          style={{ position: "absolute", top: -14, left: big ? 30 : 20 }}
        />
        <div
          style={{
            aspectRatio: "4/3",
            marginBottom: 14,
            background: "#FCF8EE",
            padding: 10,
            boxShadow: "4px 6px 14px rgba(40,28,18,0.10)",
          }}
        >
          <StripePlaceholder
            label={`photo · ${p.cover}`}
            family="notebook"
            tint={accentTint(p.accent)}
            ink="#3a2c1e"
          />
        </div>
        <div
          style={{
            fontFamily: NB_HAND2,
            fontSize: 16,
            color: "var(--nb-ink-soft)",
          }}
        >
          {p.cat} · {p.date}
        </div>
        <h3
          style={{
            fontFamily: NB_HAND,
            fontSize: big ? 42 : 32,
            lineHeight: 1.05,
            margin: "6px 0 8px",
            color: "var(--nb-ink)",
          }}
        >
          {p.title}
        </h3>
        <p
          style={{
            fontFamily: NB_BODY,
            fontSize: 16,
            lineHeight: 1.55,
            color: "var(--nb-ink-soft)",
            margin: 0,
          }}
        >
          {p.excerpt}
        </p>
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 12,
            fontFamily: NB_HAND2,
            fontSize: 16,
          }}
        >
          {p.tags.map((t) => (
            <span key={t} style={{ color: "var(--nb-ink-soft)" }}>
              #{t}
            </span>
          ))}
        </div>
      </article>
    </Link>
  );
}

function NbColumn({
  title,
  subtitle,
  posts,
  arrow,
  group,
}: {
  title: string;
  subtitle: string;
  posts: NbPost[];
  arrow: "sage" | "pink";
  group: "tech" | "hobby";
}) {
  const arrowColor = arrow === "sage" ? "var(--nb-tape)" : "var(--nb-memo)";
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          borderBottom: "2px dashed var(--nb-rule)",
          paddingBottom: 10,
        }}
      >
        <HandArrow width={50} color={arrowColor} />
        <h2 style={{ fontFamily: NB_HAND, fontSize: 40, margin: 0, color: "var(--nb-ink)" }}>
          {title}
        </h2>
        <span
          style={{
            fontFamily: NB_HAND2,
            fontSize: 18,
            color: "var(--nb-ink-soft)",
          }}
        >
          {subtitle}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 18 }}>
        {posts.map((p, i) => (
          <Link
            key={p.id}
            href={postHref(p, group)}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <article
              style={{
                display: "grid",
                gridTemplateColumns: "44px 1fr",
                gap: 12,
                alignItems: "start",
              }}
            >
              <div
                style={{
                  fontFamily: NB_HAND,
                  fontSize: 36,
                  color: arrowColor,
                  lineHeight: 1,
                }}
              >
                ·{String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: NB_HAND,
                    fontSize: 28,
                    margin: 0,
                    lineHeight: 1.1,
                    color: "var(--nb-ink)",
                  }}
                >
                  {p.title}
                </h3>
                <p
                  style={{
                    fontFamily: NB_BODY,
                    fontSize: 15,
                    lineHeight: 1.5,
                    color: "var(--nb-ink-soft)",
                    margin: "4px 0 6px",
                  }}
                >
                  {p.excerpt}
                </p>
                <div
                  style={{
                    fontFamily: NB_HAND2,
                    fontSize: 15,
                    color: "var(--nb-ink-soft)",
                  }}
                >
                  {p.date} · {p.readTime}
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function HomePage() {
  return (
    <>
      <section style={{ padding: "48px 48px 24px", position: "relative" }}>
        <div style={{ position: "absolute", top: 40, right: 80 }}>
          <StickyNote color="var(--nb-note)" rotate={6} w={200}>
            오늘의 메모
            <br />
            <span style={{ fontFamily: NB_HAND2, fontSize: 16 }}>
              2026년 5월, 비가 많이 오는 주말
            </span>
          </StickyNote>
        </div>
        <div
          style={{
            fontFamily: NB_HAND2,
            fontSize: 20,
            color: "var(--nb-ink-soft)",
            letterSpacing: 1,
          }}
        >
          ✦ 오늘의 한 페이지 ✦
        </div>
        <h1
          style={{
            fontFamily: NB_HAND,
            fontWeight: 400,
            fontSize: 156,
            lineHeight: 0.92,
            margin: "8px 0 12px",
            color: "var(--nb-ink)",
          }}
        >
          공부하고,
          <br />
          <span style={{ color: "var(--nb-memo)" }}>축구 보고,</span>
          <br />
          가끔 책 읽는 사람의
          <br />
          작은 노트.
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16 }}>
          <p
            style={{
              fontFamily: NB_BODY,
              fontStyle: "italic",
              fontSize: 22,
              color: "var(--nb-ink-soft)",
              maxWidth: 480,
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            FE와 AI를 공부하다가, 갑자기 축구 칠판을 펴고, 끝까지 못 읽은 책을 또 한 권 펼치는 사람의 매주 한 페이지.
          </p>
          <HandArrow width={90} color="var(--nb-ink-soft)" />
          <span style={{ fontFamily: NB_HAND, fontSize: 22, color: "var(--nb-ink-soft)" }}>
            왼쪽 페이지부터 →
          </span>
        </div>
      </section>

      <section style={{ padding: "32px 48px 0", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <h2
            style={{
              fontFamily: NB_HAND,
              fontSize: 48,
              margin: 0,
              color: "var(--nb-ink)",
              position: "relative",
            }}
          >
            오늘 꺼낸 페이지들
          </h2>
          <span style={{ fontFamily: NB_HAND2, fontSize: 20, color: "var(--nb-ink-soft)" }}>
            · today&apos;s reads
          </span>
          <HandArrow width={60} color="var(--nb-memo)" />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 1fr",
            gap: 36,
            marginTop: 36,
            alignItems: "start",
          }}
        >
          <NbFeatureCard p={TECH_POSTS[1]} big tape="sage" group="tech" />
          <NbFeatureCard p={HOBBY_POSTS[0]} tape="pink" group="hobby" />
          <NbFeatureCard p={HOBBY_POSTS[1]} tape="sky" group="hobby" />
        </div>
      </section>

      <section
        style={{
          padding: "56px 48px 0",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 56,
          position: "relative",
        }}
      >
        <NbColumn
          title="공부 페이지"
          subtitle="tech notes"
          arrow="pink"
          posts={TECH_POSTS.slice(0, 3)}
          group="tech"
        />
        <NbColumn
          title="주말 페이지"
          subtitle="off-pitch notes"
          arrow="sage"
          posts={HOBBY_POSTS.slice(0, 3)}
          group="hobby"
        />
        <div style={{ position: "absolute", top: 32, right: 48 }}>
          <StickyNote color="var(--nb-tape)" rotate={4} w={170}>
            축구도 결국
            <br />
            <em>그림 그리기</em>예요
          </StickyNote>
        </div>
      </section>

      <section style={{ padding: "64px 48px 24px", textAlign: "center", position: "relative" }}>
        <div
          style={{
            fontFamily: NB_HAND,
            fontSize: 64,
            lineHeight: 1.1,
            maxWidth: 880,
            margin: "0 auto",
            color: "var(--nb-ink)",
          }}
        >
          &ldquo;잘 정돈된 메모를 좋아하다 보니,
          <br />
          <span style={{ background: "var(--nb-highlight)", padding: "0 8px" }}>
            정돈된 척하는 메모도
          </span>
          <br />
          좋아하게 되었어요.&rdquo;
        </div>
        <div
          style={{
            fontFamily: NB_HAND2,
            fontSize: 18,
            color: "var(--nb-ink-soft)",
            marginTop: 16,
          }}
        >
          — from the about page
        </div>
      </section>
    </>
  );
}
