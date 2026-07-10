"use client";

import { useState } from "react";

import {
  ALL_TAGS,
  NB_BODY,
  NB_HAND,
  NB_HAND2,
} from "@/shared/lib";
import { SectionHeader, StickyNote } from "@/shared/ui";

const ARCHIVE = [
  {
    m: "5월",
    items: [
      "React 19의 use() Hook",
      "맨시티의 3-2-4-1",
      "5월의 독서 노트",
      "작은 벡터 DB",
    ],
  },
  {
    m: "4월",
    items: [
      "CSS @container 쿼리",
      "Elden Ring DLC",
      "노스 런던 더비",
      "읽다 만 책에 대하여",
    ],
  },
  { m: "3월", items: ["Suspense 비동기 패턴", "주말의 책 한 권"] },
];

export function TagsPage() {
  const [hover, setHover] = useState<string | null>(null);
  const techTags = ALL_TAGS.filter((t) => t.kind === "tech");
  const hobbyTags = ALL_TAGS.filter((t) => t.kind === "hobby");
  const sizeFor = (c: number) => 22 + c * 5;

  return (
    <>
      <section style={{ padding: "48px 48px 0", position: "relative" }}>
        <div style={{ fontFamily: NB_HAND2, fontSize: 22, color: "var(--nb-ink-soft)" }}>
          · tag index ·
        </div>
        <h1
          style={{
            fontFamily: NB_HAND,
            fontSize: 144,
            lineHeight: 0.94,
            margin: "12px 0 8px",
          }}
        >
          태그 페이지
        </h1>
        <p
          style={{
            fontFamily: NB_BODY,
            fontSize: 22,
            fontStyle: "italic",
            color: "var(--nb-ink-soft)",
            maxWidth: 720,
            margin: 0,
            lineHeight: 1.45,
          }}
        >
          노트 페이지 마지막마다 끄적인 작은 단어들. 자주 쓴 단어는 크게, 가끔 쓴 단어는 작게.
        </p>
        <div style={{ position: "absolute", top: 40, right: 80 }}>
          <StickyNote color="var(--nb-note)" rotate={-5} w={190}>
            글자가 클수록
            <br />
            <em>자주 쓴 단어</em>예요
          </StickyNote>
        </div>
      </section>

      <section style={{ padding: "40px 48px 0" }}>
        <SectionHeader title="공부 태그" subtitle="· tech" titleColor="var(--nb-memo)" />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            gap: "18px 28px",
            marginTop: 24,
          }}
        >
          {techTags.map((t, i) => (
            <a
              key={t.name}
              href="#"
              onMouseEnter={() => setHover(t.name)}
              onMouseLeave={() => setHover(null)}
              style={{
                fontFamily: NB_HAND,
                fontSize: sizeFor(t.count),
                color: hover === t.name ? "var(--nb-memo)" : "var(--nb-ink)",
                textDecoration: "none",
                lineHeight: 1,
                transform: `rotate(${i % 2 === 0 ? -1.5 : 1.2}deg)`,
                display: "inline-block",
              }}
            >
              #{t.name}
              <sup
                style={{
                  fontFamily: NB_HAND2,
                  fontSize: 13,
                  color: "var(--nb-ink-soft)",
                  marginLeft: 4,
                }}
              >
                {t.count}
              </sup>
            </a>
          ))}
        </div>
      </section>

      <section style={{ padding: "40px 48px 0" }}>
        <SectionHeader title="취미 태그" subtitle="· hobby" titleColor="var(--nb-tape)" />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            gap: "18px 28px",
            marginTop: 24,
          }}
        >
          {hobbyTags.map((t, i) => (
            <a
              key={t.name}
              href="#"
              onMouseEnter={() => setHover(t.name)}
              onMouseLeave={() => setHover(null)}
              style={{
                fontFamily: NB_HAND,
                fontSize: sizeFor(t.count),
                color: hover === t.name ? "var(--nb-tape)" : "var(--nb-ink)",
                textDecoration: "none",
                lineHeight: 1,
                transform: `rotate(${i % 2 === 0 ? 1.2 : -1.5}deg)`,
                display: "inline-block",
              }}
            >
              #{t.name}
              <sup
                style={{
                  fontFamily: NB_HAND2,
                  fontSize: 13,
                  color: "var(--nb-ink-soft)",
                  marginLeft: 4,
                }}
              >
                {t.count}
              </sup>
            </a>
          ))}
        </div>
      </section>

      <section style={{ padding: "48px 48px 48px" }}>
        <SectionHeader title="달력으로 보기" subtitle="· archive · 2026" />
        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 16 }}>
          {ARCHIVE.map((mo, i) => (
            <div
              key={mo.m}
              style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr",
                gap: 28,
                padding: "16px 0",
                borderBottom: "1px dashed var(--nb-rule)",
              }}
            >
              <div
                style={{
                  fontFamily: NB_HAND,
                  fontSize: 44,
                  color: ["var(--nb-memo)", "var(--nb-tape)", "var(--sky-1)"][i],
                }}
              >
                {mo.m}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  fontFamily: NB_HAND,
                  fontSize: 24,
                  lineHeight: 1.5,
                }}
              >
                {mo.items.map((t) => (
                  <li key={t}>· {t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
