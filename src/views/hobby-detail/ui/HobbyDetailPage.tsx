"use client";

import { useState } from "react";

import {
  HOBBY_POSTS,
  NB_BODY,
  NB_HAND,
  NB_HAND2,
  accentTint,
} from "@/shared/lib/design-data";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { HandCircle } from "@/shared/ui/notebook/HandCircle";
import { Polaroid } from "@/shared/ui/notebook/Polaroid";
import { StickyNote } from "@/shared/ui/notebook/StickyNote";
import { StripePlaceholder } from "@/shared/ui/notebook/StripePlaceholder";
import { WashiTape } from "@/shared/ui/notebook/WashiTape";

const PHOTOS = [
  { id: 1, label: "pre-match · 라인업", tint: "#BCCFA4", cap: "경기 시작 직전" },
  { id: 2, label: "내가 그린 칠판", tint: "#E3CB87", cap: "풀백이 들어오는 그 순간" },
  { id: 3, label: "관중석에서", tint: "#E6BAA9", cap: "두 번째 골이 만들어진 길" },
  { id: 4, label: "after the match", tint: "#C7DCE6", cap: "경기 후, 칠판을 다시 펴고" },
];

export function HobbyDetailPage({ slug }: { slug: string }) {
  const post = HOBBY_POSTS.find((p) => p.slug === slug) ?? HOBBY_POSTS[0];
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <>
      <section style={{ padding: "48px 48px 0", position: "relative" }}>
        <div style={{ fontFamily: NB_HAND2, fontSize: 18, color: "var(--nb-ink-soft)" }}>
          취미 공책 / {post.cat} · {post.date} · {post.readTime}
        </div>
        <h1
          style={{
            fontFamily: NB_HAND,
            fontSize: 124,
            lineHeight: 0.96,
            margin: "14px 0 14px",
            color: "var(--nb-ink)",
            position: "relative",
            display: "inline-block",
          }}
        >
          {post.title.split(",")[0]}
          {post.slug === "city-3241" ? <span style={{ position: "relative" }}>
              <HandCircle
                width={260}
                height={80}
                color="var(--nb-tape)"
                style={{ left: -18, top: -10 }}
              />
            </span> : null}
          {post.title.includes(",") ? <>
              ,<br />
              {post.title.split(",").slice(1).join(",").trim()}
            </> : null}
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
        <div style={{ position: "absolute", top: 40, right: 60 }}>
          <StickyNote color="var(--nb-memo)" rotate={6} w={200}>
            진짜 화살표가
            <br />
            <em>다섯 번 바뀌었어요</em>
          </StickyNote>
        </div>
      </section>

      <section
        style={{ padding: "36px 48px 0", display: "flex", justifyContent: "center" }}
      >
        <button
          type="button"
          onClick={() => setLightbox(0)}
          style={{
            position: "relative",
            maxWidth: 1000,
            width: "100%",
            background: "#FCF8EE",
            padding: 14,
            boxShadow: "6px 10px 24px rgba(40,28,18,0.14)",
            cursor: "zoom-in",
            border: "none",
          }}
        >
          <WashiTape
            color="var(--nb-tape)"
            rotate={-4}
            width={140}
            style={{ position: "absolute", top: -14, left: 100 }}
          />
          <div style={{ aspectRatio: "16/8" }}>
            <StripePlaceholder
              label="경기장 와이드 · 클릭해서 크게"
              family="notebook"
              tint={accentTint(post.accent)}
              ink="#1f2a18"
            />
          </div>
        </button>
      </section>

      <section
        style={{
          padding: "32px 48px 0",
          maxWidth: 900,
          margin: "0 auto",
          fontFamily: NB_BODY,
          fontSize: 22,
          lineHeight: 1.7,
          color: "var(--nb-ink)",
        }}
      >
        <p style={{ margin: 0 }}>
          맨시티의 빌드업을 처음 칠판에 그려본 건 작년 가을이었어요. 그땐 그냥{" "}
          <span style={{ background: "var(--nb-highlight)", padding: "0 4px" }}>
            &ldquo;풀백이 들어온다&rdquo;
          </span>
          라는 한 줄로 정리했지만, 다시 보니 그 한 줄이 너무 많은 걸 숨기고 있었습니다.
        </p>
        <p>
          오늘은 그래서 <em>네 가지 변형</em>을 따로 그렸어요. 각각의 그림 아래에 짧은 메모를 붙여두었습니다.
        </p>
      </section>

      <section style={{ padding: "32px 48px 48px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            borderBottom: "2px dashed var(--nb-rule)",
            paddingBottom: 10,
          }}
        >
          <h2 style={{ fontFamily: NB_HAND, fontSize: 42, margin: 0 }}>현장 사진</h2>
          <span style={{ fontFamily: NB_HAND2, fontSize: 18, color: "var(--nb-ink-soft)" }}>
            · from the stadium
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontFamily: NB_HAND,
              fontSize: 22,
              color: "var(--nb-ink-soft)",
            }}
          >
            ↓ 클릭하면 커져요
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 40,
            marginTop: 32,
            justifyItems: "center",
          }}
        >
          {PHOTOS.map((ph, i) => (
            <button
              key={ph.id}
              type="button"
              onClick={() => setLightbox(i)}
              style={{
                cursor: "zoom-in",
                border: "none",
                background: "transparent",
                padding: 0,
              }}
            >
              <Polaroid
                label={ph.label}
                tint={ph.tint}
                rotate={[-3, 2.5, -2, 3][i]}
                w={360}
                caption={ph.cap}
              />
            </button>
          ))}
        </div>
      </section>

      <Dialog
        open={lightbox !== null}
        onOpenChange={(open) => {
          if (!open) setLightbox(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          onClick={() => setLightbox(null)}
          className="gap-0 rounded-none ring-0"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            maxWidth: "none",
            transform: "none",
            background: "rgba(28,22,14,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
            padding: 40,
          }}
        >
          <DialogTitle className="sr-only">사진 확대 보기</DialogTitle>
          {lightbox !== null ? (
            <>
              <Polaroid
                label={PHOTOS[lightbox].label}
                tint={PHOTOS[lightbox].tint}
                rotate={-1}
                w={720}
                caption={`${PHOTOS[lightbox].cap} · 아무 곳이나 클릭`}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 30,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  color: "#F1E1A3",
                  fontFamily: NB_HAND,
                  fontSize: 24,
                }}
              >
                {lightbox + 1} / {PHOTOS.length}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
