"use client";

import { useState } from "react";

import Link from "next/link";

import {
  HOBBY_POSTS,
  NB_BODY,
  NB_HAND,
  NB_HAND2,
  accentVar,
  accentTint,
} from "@/shared/lib/design-data";
import { NbChip } from "@/shared/ui/notebook/NbChip";
import { Polaroid } from "@/shared/ui/notebook/Polaroid";
import { StickyNote } from "@/shared/ui/notebook/StickyNote";

export function HobbyListPage() {
  const [activeCat, setActiveCat] = useState<string>("all");
  const cats = ["all", "축구", "독서", "게임"];
  const filtered =
    activeCat === "all" ? HOBBY_POSTS : HOBBY_POSTS.filter((p) => p.cat === activeCat);

  return (
    <>
      <section style={{ padding: "48px 48px 16px", position: "relative" }}>
        <div style={{ position: "absolute", top: 36, right: 60 }}>
          <StickyNote color="var(--nb-memo)" rotate={-6} w={210}>
            취미 공책은
            <br />
            <em>물감이 많이 묻어있어요</em>
          </StickyNote>
        </div>
        <div style={{ fontFamily: NB_HAND2, fontSize: 22, color: "var(--nb-ink-soft)" }}>
          · chapter two ·
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
          취미 공책 <span style={{ color: "var(--nb-tape)" }}>16편</span>
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
          축구 칠판을 펴고, 게임 패드를 손에 쥐고, 끝까지 못 읽은 책에 또 한 장 책갈피를 꽂으며.
        </p>
      </section>

      <section
        style={{
          padding: "20px 48px 0",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontFamily: NB_HAND, fontSize: 22, color: "var(--nb-ink-soft)" }}>
          탭 →
        </span>
        {cats.map((c) => (
          <NbChip key={c} active={activeCat === c} onClick={() => setActiveCat(c)}>
            {c}
          </NbChip>
        ))}
        <span
          style={{
            marginLeft: "auto",
            fontFamily: NB_HAND2,
            fontSize: 16,
            color: "var(--nb-ink-soft)",
          }}
        >
          {filtered.length}편
        </span>
      </section>

      <section
        style={{
          padding: "40px 48px 48px",
          display: "flex",
          flexDirection: "column",
          gap: 60,
        }}
      >
        {filtered.map((p, i) => (
          <Link
            key={p.id}
            href={`/hobby/${p.slug}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <article
              style={{
                display: "grid",
                gridTemplateColumns: i % 2 === 0 ? "320px 1fr" : "1fr 320px",
                gap: 40,
                alignItems: "flex-start",
                position: "relative",
              }}
            >
              <div style={{ order: i % 2 === 0 ? 1 : 2, position: "relative" }}>
                <Polaroid
                  label={`photo · ${p.cover}`}
                  tint={accentTint(p.accent)}
                  rotate={i % 2 === 0 ? -3 : 2.4}
                  w={300}
                  caption={`${p.cat} · ${p.date}`}
                />
              </div>
              <div style={{ order: i % 2 === 0 ? 2 : 1, paddingTop: 18 }}>
                <div
                  style={{
                    fontFamily: NB_HAND2,
                    fontSize: 16,
                    color: "var(--nb-ink-soft)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ background: accentVar(p.accent), padding: "2px 8px" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    · {p.cat} · {p.readTime}
                  </span>
                </div>
                <h2
                  style={{
                    fontFamily: NB_HAND,
                    fontSize: 54,
                    lineHeight: 1,
                    margin: "10px 0 12px",
                    color: "var(--nb-ink)",
                  }}
                >
                  {p.title}
                </h2>
                <p
                  style={{
                    fontFamily: NB_BODY,
                    fontSize: 20,
                    lineHeight: 1.55,
                    color: "var(--nb-ink)",
                    margin: 0,
                  }}
                >
                  {p.excerpt}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    marginTop: 16,
                    fontFamily: NB_HAND2,
                    fontSize: 17,
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
                      fontSize: 22,
                      color: "var(--nb-memo)",
                    }}
                  >
                    읽어보기 →
                  </span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </section>
    </>
  );
}
