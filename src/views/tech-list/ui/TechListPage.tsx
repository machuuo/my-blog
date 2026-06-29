"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  TECH_POSTS,
  NB_BODY,
  NB_HAND,
  NB_HAND2,
  type NbPost,
} from "@/shared/lib/design-data";
import { NbChip } from "@/shared/ui/notebook/NbChip";
import { StickyNote } from "@/shared/ui/notebook/StickyNote";
import { WashiTape } from "@/shared/ui/notebook/WashiTape";

function NbIndexCard({ p, index }: { p: NbPost; index: number }) {
  const tapeColor = ["var(--nb-memo)", "var(--nb-tape)", "var(--sky-1)", "var(--nb-note)"][
    index % 4
  ];
  return (
    <Link
      href={`/tech/${p.slug}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <article
        style={{
          position: "relative",
          background: "#FCF8EE",
          padding: "22px 26px",
          boxShadow: "5px 7px 16px rgba(40,28,18,0.10)",
          transform: `rotate(${index % 2 === 0 ? -0.5 : 0.4}deg)`,
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 31px, rgba(45,33,23,0.10) 31px 32px), linear-gradient(to right, var(--nb-memo) 0 2px, transparent 2px 30px, transparent 30px), linear-gradient(#FCF8EE, #FCF8EE)`,
          backgroundSize: "100% 100%, 30px 100%, 100% 100%",
          paddingLeft: 42,
        }}
      >
        <WashiTape
          color={tapeColor}
          rotate={-5}
          width={90}
          style={{ position: "absolute", top: -14, left: 30 }}
        />
        <div
          style={{
            fontFamily: NB_HAND2,
            fontSize: 16,
            color: "var(--nb-ink-soft)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>· {p.cat} · {p.date}</span>
          <span>· {p.readTime} ·</span>
        </div>
        <h2
          style={{
            fontFamily: NB_HAND,
            fontSize: 36,
            lineHeight: 1.08,
            margin: "6px 0 10px",
            color: "var(--nb-ink)",
          }}
        >
          {p.title}
        </h2>
        <p
          style={{
            fontFamily: NB_BODY,
            fontSize: 16,
            lineHeight: 1.55,
            color: "var(--nb-ink)",
            margin: "0 0 12px",
          }}
        >
          {p.excerpt}
        </p>
        <div
          style={{
            display: "flex",
            gap: 10,
            fontFamily: NB_HAND2,
            fontSize: 16,
            color: "var(--nb-ink-soft)",
          }}
        >
          {p.tags.map((t) => (
            <span key={t}>#{t}</span>
          ))}
          <span
            style={{
              marginLeft: "auto",
              fontFamily: NB_HAND,
              fontSize: 20,
              color: "var(--nb-memo)",
            }}
          >
            읽어보기 →
          </span>
        </div>
      </article>
    </Link>
  );
}

export function TechListPage() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const allTags = useMemo(
    () => Array.from(new Set(TECH_POSTS.flatMap((p) => p.tags))),
    [],
  );
  const filtered = TECH_POSTS.filter((p) => {
    if (activeTag && !p.tags.includes(activeTag)) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(s) ||
        p.titleEn.toLowerCase().includes(s) ||
        p.tags.some((t) => t.includes(s))
      );
    }
    return true;
  });

  return (
    <>
      <section style={{ padding: "48px 48px 16px", position: "relative" }}>
        <div style={{ position: "absolute", top: 24, right: 60 }}>
          <StickyNote color="var(--sky-1)" rotate={5} w={210}>
            여기는 공부 공책 ✏️
            <br />
            FE와 AI가 섞여 있어요
          </StickyNote>
        </div>
        <div style={{ fontFamily: NB_HAND2, fontSize: 22, color: "var(--nb-ink-soft)" }}>
          · chapter one ·
        </div>
        <h1
          style={{
            fontFamily: NB_HAND,
            fontSize: 144,
            lineHeight: 0.94,
            margin: "8px 0 8px",
            color: "var(--nb-ink)",
          }}
        >
          공부 공책 <span style={{ color: "var(--nb-memo)" }}>22편</span>
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
          그림을 먼저 그리고, 코드를 그 다음에 쓰는 편이에요. 잘못 그린 그림이 가장 좋은 메모가 되곤 합니다.
        </p>
      </section>

      <section
        style={{
          padding: "24px 48px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontFamily: NB_HAND, fontSize: 22, color: "var(--nb-ink-soft)" }}>
          골라보기 →
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="찾는 글이…"
          style={{
            fontFamily: NB_HAND,
            fontSize: 20,
            background: "transparent",
            border: "none",
            borderBottom: "2px solid var(--nb-ink)",
            color: "var(--nb-ink)",
            width: 200,
            outline: "none",
            padding: "2px 4px",
          }}
        />
        <NbChip active={activeTag === null} onClick={() => setActiveTag(null)}>
          전부
        </NbChip>
        {allTags.map((t) => (
          <NbChip
            key={t}
            active={activeTag === t}
            onClick={() => setActiveTag(activeTag === t ? null : t)}
          >
            #{t}
          </NbChip>
        ))}
      </section>

      <section style={{ padding: "20px 48px 48px" }}>
        <div
          style={{
            fontFamily: NB_HAND2,
            fontSize: 16,
            color: "var(--nb-ink-soft)",
            marginBottom: 16,
          }}
        >
          {filtered.length}장의 카드
          {activeTag ? ` · #${activeTag}` : ""}
          {search ? ` · "${search}"` : ""}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 28 }}>
          {filtered.map((p, i) => (
            <NbIndexCard key={p.id} p={p} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}
