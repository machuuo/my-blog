import { NB_BODY, NB_HAND, NB_HAND2 } from "@/shared/lib";
import { Polaroid, SectionHeader, StickyNote, WashiTape } from "@/shared/ui";

const colophon = [
  { k: "글씨체", v: "Caveat & Lora & Gowun" },
  { k: "도구", v: "Next.js · MDX · 손그림" },
  { k: "색깔", v: "크림, 더스티 핑크, 세이지" },
  { k: "서버", v: "서울의 작은 VPS" },
];

export function AboutPage() {
  return (
    <>
      <section style={{ padding: "48px 48px 24px", position: "relative" }}>
        <div style={{ fontFamily: NB_HAND2, fontSize: 22, color: "var(--nb-ink-soft)" }}>
          · about page ·
        </div>
        <h1
          style={{
            fontFamily: NB_HAND,
            fontSize: 156,
            lineHeight: 0.92,
            margin: "12px 0 12px",
            color: "var(--nb-ink)",
          }}
        >
          안녕하세요,
          <br />
          저는 <span style={{ color: "var(--nb-memo)" }}>여백</span>이에요.
        </h1>
        <p
          style={{
            fontFamily: NB_BODY,
            fontSize: 22,
            fontStyle: "italic",
            color: "var(--nb-ink-soft)",
            maxWidth: 720,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          평일엔 코드를 쓰고, 주말엔 축구 칠판을 다시 그리고, 가끔 책을 펴는 사람.
        </p>
      </section>

      <section
        style={{
          padding: "20px 48px 0",
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 56,
        }}
      >
        <div style={{ position: "relative" }}>
          <Polaroid
            label="self · 책상 위"
            tint="#E3CB87"
            rotate={-4}
            w={300}
            caption="자화상 대신, 책상 위"
          />
          <div style={{ position: "absolute", top: 280, left: -10 }}>
            <StickyNote color="var(--sky-1)" rotate={5} w={170}>
              가운데가 비어있는
              <br />
              <em>공책</em>이 가장
              <br />
              정확한 자기소개
            </StickyNote>
          </div>
        </div>
        <article style={{ fontFamily: NB_BODY, fontSize: 22, lineHeight: 1.75 }}>
          <p style={{ margin: 0 }}>
            <span
              style={{
                fontFamily: NB_HAND,
                fontSize: 80,
                float: "left",
                lineHeight: 0.85,
                padding: "4px 12px 0 0",
                color: "var(--nb-memo)",
              }}
            >
              안
            </span>
            녕하세요. 평일에는 프론트엔드 코드를 쓰고, 가끔은 작은 LLM 모델을 만지작거리며, 주말에는 축구 칠판을 다시 그리는 사람입니다. 잘 정돈된 메모를 좋아해서, 정돈된 척하는 메모도 좋아하게 되었어요.
          </p>
          <p>
            이 블로그의 이름 <em>&ldquo;산책 노트&rdquo;</em>는, 글이 산책처럼 짧고 가볍기를 바라는 마음으로 지었어요. 본문이 아니라,{" "}
            <span style={{ background: "var(--nb-highlight)", padding: "0 4px" }}>
              본문 옆 여백
            </span>
            에 끄적이는 메모를 위한 공간.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 28,
              marginTop: 28,
              paddingTop: 18,
              borderTop: "2px dashed var(--nb-rule)",
            }}
          >
            <div>
              <h3 style={{ fontFamily: NB_HAND, fontSize: 32, margin: "0 0 8px" }}>
                요즘 하는 것들
              </h3>
              <ul
                style={{
                  fontFamily: NB_BODY,
                  fontSize: 18,
                  lineHeight: 1.7,
                  paddingLeft: 0,
                  listStyle: "none",
                  margin: 0,
                }}
              >
                <li>○ React 19를 다시 읽는 중</li>
                <li>○ 작은 vector DB 만들기</li>
                <li>○ 토트넘 경기를 매주</li>
                <li>○ 사피엔스를 다시 펴봄</li>
              </ul>
            </div>
            <div>
              <h3 style={{ fontFamily: NB_HAND, fontSize: 32, margin: "0 0 8px" }}>
                여기 말고는
              </h3>
              <ul
                style={{
                  fontFamily: NB_BODY,
                  fontSize: 18,
                  lineHeight: 1.7,
                  paddingLeft: 0,
                  listStyle: "none",
                  margin: 0,
                }}
              >
                <li>→ github · @yeobaek</li>
                <li>→ rss · /feed.xml</li>
                <li>→ email · hello @ yeobaek.kr</li>
              </ul>
            </div>
          </div>
        </article>
      </section>

      <section style={{ padding: "56px 48px 48px" }}>
        <SectionHeader title="이 노트를 만든 것들" subtitle="· colophon" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
            marginTop: 24,
          }}
        >
          {colophon.map((c) => (
            <div
              key={c.k}
              style={{
                position: "relative",
                background: "#FCF8EE",
                padding: "16px 18px",
                boxShadow: "3px 5px 12px rgba(40,28,18,0.10)",
              }}
            >
              <WashiTape
                color="var(--nb-memo)"
                rotate={-6}
                width={70}
                style={{ position: "absolute", top: -10, left: 20 }}
              />
              <div style={{ fontFamily: NB_HAND2, fontSize: 16, color: "var(--nb-ink-soft)" }}>
                {c.k}
              </div>
              <div
                style={{
                  fontFamily: NB_HAND,
                  fontSize: 26,
                  marginTop: 4,
                  color: "var(--nb-ink)",
                }}
              >
                {c.v}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
