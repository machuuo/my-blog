"use client";

import { useState } from "react";

import Link from "next/link";

import {
  TECH_POSTS,
  NB_BODY,
  NB_HAND,
  NB_HAND2,
  NB_MONO,
  accentTint,
  type NbPost,
} from "@/shared/lib";
import {
  HandArrow,
  HandCircle,
  Polaroid,
  SectionHeader,
  StickyNote,
  StripePlaceholder,
  WashiTape,
} from "@/shared/ui";

const CODE_SNIPPET = `function Profile({ userPromise }) {
  // use()는 promise를 unwrap합니다
  const user = use(userPromise);
  return <h1>{user.name}</h1>;
}`;

const TAPE_COLOR: Record<"sage" | "pink" | "sky", string> = {
  sage: "var(--nb-tape)",
  pink: "var(--nb-memo)",
  sky: "var(--sky-1)",
};

function RelatedCard({ p, tape }: { p: NbPost; tape: "pink" | "sage" | "sky" }) {
  const tapeColor = TAPE_COLOR[tape];
  return (
    <Link
      href={`/tech/${p.slug}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <article style={{ position: "relative" }}>
        <WashiTape
          color={tapeColor}
          rotate={5}
          width={100}
          style={{ position: "absolute", top: -14, left: 20 }}
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
        <div style={{ fontFamily: NB_HAND2, fontSize: 16, color: "var(--nb-ink-soft)" }}>
          {p.cat} · {p.date}
        </div>
        <h3
          style={{
            fontFamily: NB_HAND,
            fontSize: 32,
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
      </article>
    </Link>
  );
}

export function TechDetailPage({ slug }: { slug: string }) {
  const post = TECH_POSTS.find((p) => p.slug === slug) ?? TECH_POSTS[0];
  const [copied, setCopied] = useState(false);
  const copy = () => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- navigator.clipboard는 비-HTTPS/구형 브라우저에서 undefined (DOM 타입이 non-null로 거짓 선언). ?. 방어 유지
    navigator.clipboard?.writeText(CODE_SNIPPET).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  const related = TECH_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <section style={{ padding: "48px 48px 0", position: "relative" }}>
        <div
          style={{
            fontFamily: NB_HAND2,
            fontSize: 18,
            color: "var(--nb-ink-soft)",
            letterSpacing: 1,
          }}
        >
          공부 공책 / {post.cat} · {post.date} · {post.readTime}
        </div>
        <h1
          style={{
            fontFamily: NB_HAND,
            fontWeight: 400,
            fontSize: 116,
            lineHeight: 0.96,
            margin: "16px 0 14px",
            color: "var(--nb-ink)",
            position: "relative",
          }}
        >
          {post.title.split(",")[0]}
          {post.slug === "react-19-use-hook" ? <span style={{ position: "relative", display: "inline-block" }}>
              <HandCircle
                width={170}
                height={70}
                color="var(--nb-memo)"
                style={{ left: -14, top: -12 }}
              />
            </span> : null}
        </h1>
        <p
          style={{
            fontFamily: NB_BODY,
            fontSize: 24,
            fontStyle: "italic",
            color: "var(--nb-ink-soft)",
            maxWidth: 880,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {post.excerpt}
        </p>
        <div style={{ position: "absolute", top: 48, right: 60 }}>
          <StickyNote color="var(--nb-note)" rotate={4} w={200}>
            ⚠️ 이건 정답이 아니에요.
            <br />
            <span style={{ fontFamily: NB_HAND2, fontSize: 16 }}>
              그저 제가 그린 그림이에요
            </span>
          </StickyNote>
        </div>
      </section>

      <section style={{ padding: "36px 48px 12px" }}>
        <div
          style={{
            position: "relative",
            maxWidth: 1020,
            margin: "0 auto",
            background: "#FCF8EE",
            padding: 18,
            boxShadow: "6px 10px 24px rgba(40,28,18,0.12)",
          }}
        >
          <WashiTape
            color="var(--nb-memo)"
            rotate={-4}
            width={130}
            style={{ position: "absolute", top: -14, left: 80 }}
          />
          <WashiTape
            color="var(--nb-tape)"
            rotate={6}
            width={130}
            style={{ position: "absolute", top: -14, right: 80 }}
          />
          <div style={{ aspectRatio: "16/8" }}>
            <StripePlaceholder
              label={`hero sketch · ${post.titleEn}`}
              family="notebook"
              tint={accentTint(post.accent)}
              ink="#1f1410"
            />
          </div>
          <div
            style={{
              fontFamily: NB_HAND,
              fontSize: 22,
              color: "var(--nb-ink-soft)",
              textAlign: "center",
              marginTop: 10,
            }}
          >
            ↑ 처음 그림. 화살표가 너무 많아서 다시 그렸어요.
          </div>
        </div>
      </section>

      <section
        style={{
          padding: "32px 48px 16px",
          display: "grid",
          gridTemplateColumns: "230px 1fr 230px",
          gap: 36,
        }}
      >
        <aside>
          <div
            style={{
              position: "sticky",
              top: 160,
              fontFamily: NB_HAND,
              fontSize: 24,
              color: "var(--nb-ink)",
              lineHeight: 1.4,
            }}
          >
            <div
              style={{
                fontFamily: NB_HAND2,
                fontSize: 16,
                color: "var(--nb-ink-soft)",
                borderBottom: "2px dashed var(--nb-rule)",
                paddingBottom: 8,
                marginBottom: 8,
              }}
            >
              목차 · index
            </div>
            <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {["시작하기 전에", "use()는 무엇인가", "그림 다시 그리기", "함정 두 가지", "정리"].map(
                (t, i) => (
                  <li
                    key={t}
                    style={{
                      marginBottom: 6,
                      color: i === 2 ? "var(--nb-memo)" : "var(--nb-ink)",
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: NB_HAND2,
                        fontSize: 14,
                        color: "var(--nb-ink-soft)",
                        marginRight: 8,
                      }}
                    >
                      0{i + 1}
                    </span>
                    {t}
                    {i === 2 ? <span style={{ position: "absolute", right: -6, top: 2 }}>
                        <HandArrow width={26} height={22} color="var(--nb-memo)" />
                      </span> : null}
                  </li>
                ),
              )}
            </ol>
          </div>
        </aside>

        <article
          style={{
            fontFamily: NB_BODY,
            fontSize: 20,
            lineHeight: 1.75,
            color: "var(--nb-ink)",
          }}
        >
          <p style={{ margin: 0 }}>
            처음 use()를 봤을 때, 솔직히 또 새로운 hook 하나가 추가되었다는 인상이었습니다. 그런데 며칠을 들여 직접 그림을 그려보니, 이 친구는 단순히 hook 하나가 아니라 React가 비동기를 다루는 방식을 살짝 바꾼 결과물이라는 걸 알게 됐어요.
          </p>
          <p>
            그래서 이 글은 결론이 아니라{" "}
            <span style={{ background: "var(--nb-highlight)", padding: "0 4px" }}>
              제가 그려본 그림
            </span>
            입니다. 손글씨로 노트를 정리하는 마음으로 적었어요. 정답이 아니라는 점, 가장 먼저 말씀드릴게요.
          </p>

          <div
            style={{
              position: "relative",
              margin: "28px 0",
              background: "#1F1813",
              color: "#F1E7D6",
              padding: "20px 22px",
              boxShadow: "5px 7px 16px rgba(0,0,0,0.18)",
            }}
          >
            <WashiTape
              color="var(--nb-note)"
              rotate={-6}
              width={100}
              style={{ position: "absolute", top: -12, left: 60 }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <span style={{ fontFamily: NB_HAND2, fontSize: 15, color: "#C7B89A" }}>
                UseExample.tsx
              </span>
              <button
                type="button"
                onClick={copy}
                style={{
                  background: copied ? "var(--nb-memo)" : "transparent",
                  color: copied ? "#1F1813" : "#F1E7D6",
                  border: `1.5px dashed ${copied ? "var(--nb-memo)" : "#C7B89A"}`,
                  padding: "4px 12px",
                  fontFamily: NB_HAND,
                  fontSize: 18,
                  cursor: "pointer",
                  borderRadius: 6,
                }}
              >
                {copied ? "✓ 복사됨" : "복사"}
              </button>
            </div>
            <pre
              style={{
                margin: 0,
                fontFamily: NB_MONO,
                fontSize: 14,
                lineHeight: 1.7,
                whiteSpace: "pre",
              }}
            >
              {CODE_SNIPPET}
            </pre>
          </div>

          <p>
            <em>여기서 중요한 한 가지.</em> use()는 Suspense의 바깥에서도 쓸 수 있다는 점. 처음엔 이게 좀 어색했어요. &ldquo;그럼 그건 그냥 await 아닌가?&rdquo;라고 생각했거든요. 그런데 다시 그림을 그려보니, 그건 await과는 좀 달랐어요. 글의 후반부에서 그 차이를 정리할게요.
          </p>

          <blockquote
            style={{
              margin: "28px 0",
              padding: "14px 20px",
              background: "var(--nb-highlight)",
              borderLeft: "4px solid var(--nb-memo)",
              fontFamily: NB_HAND,
              fontSize: 28,
              lineHeight: 1.35,
            }}
          >
            &ldquo;그림을 다시 그리는 행위는, 코드를 다시 읽는 가장 좋은 방법이에요.&rdquo;
          </blockquote>

          <p>
            제가 그린 두 번째 그림은 첫 번째와 거의 비슷한데, 화살표가 두 개 줄었어요. 그게 use()의 본질이라고 생각합니다.{" "}
            <strong style={{ background: "var(--nb-highlight)", padding: "0 4px" }}>
              &lsquo;덜 그린다.&rsquo;
            </strong>{" "}
            단순한 말이지만, 그게 핵심이었어요.
          </p>
        </article>

        <aside style={{ paddingTop: 12 }}>
          <div
            style={{
              position: "sticky",
              top: 160,
              display: "flex",
              flexDirection: "column",
              gap: 28,
            }}
          >
            <StickyNote color="var(--nb-tape)" rotate={-3} w={210}>
              여기, 헷갈렸던 부분.
              <br />
              <span style={{ fontFamily: NB_BODY, fontSize: 15, fontStyle: "italic" }}>
                use()가 conditional 안에서도 된다는 거.
              </span>
            </StickyNote>
            <div style={{ position: "relative" }}>
              <WashiTape
                color="var(--sky-1)"
                rotate={4}
                width={110}
                style={{ position: "absolute", top: -14, left: 30 }}
              />
              <Polaroid
                label="hand sketch · suspense tree"
                tint="#E3CB87"
                rotate={3}
                w={210}
                caption="실제 손그림 (찍은 사진)"
              />
            </div>
          </div>
        </aside>
      </section>

      <section style={{ padding: "48px 48px 48px" }}>
        <SectionHeader title="이어 읽기" subtitle="· next pages" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 28,
            marginTop: 24,
          }}
        >
          {related.map((p, i) => (
            <RelatedCard key={p.id} p={p} tape={(["pink", "sage", "sky"] as const)[i % 3]} />
          ))}
        </div>
      </section>
    </>
  );
}
