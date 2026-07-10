import { describe, expect, it } from "vitest";

import { toPost, toPostWithSeries } from "./mappers";

const fullRow = {
  post_id: "p1",
  slug: "hello-world",
  title: "Hello World",
  description: "첫 글입니다",
  content: "본문",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
  tags: ["ts", "next"],
  published: true,
  series_id: "s1",
  display_order: 3,
};

describe("toPost", () => {
  it("모든 컬럼이 채워진 로우를 도메인 타입으로 변환하고 date는 created_at에서 가져온다", () => {
    const post = toPost(fullRow);

    expect(post.post_id).toBe("p1");
    expect(post.date).toBe("2026-01-01T00:00:00Z");
    expect(post.updated_at).toBe("2026-01-02T00:00:00Z");
    expect(post.tags).toEqual(["ts", "next"]);
    expect(post.published).toBe(true);
    expect(post.series_id).toBe("s1");
    expect(post.display_order).toBe(3);
  });

  it("nullable 컬럼은 각각 다른 폴백을 적용한다 (description은 빈 문자열, tags는 빈 배열, series_id/display_order는 null 유지)", () => {
    const post = toPost({
      ...fullRow,
      description: null,
      tags: null,
      series_id: null,
      display_order: null,
    });

    expect(post.description).toBe("");
    expect(post.tags).toEqual([]);
    expect(post.series_id).toBeNull();
    expect(post.display_order).toBeNull();
  });

  it("content가 null이어도 예외 없이 readingTime을 계산한다", () => {
    const post = toPost({ ...fullRow, content: null });

    expect(post.content).toBe("");
    expect(post.readingTime).toBe("0 min read");
  });

  it("display_order가 0이어도 falsy로 삼켜지지 않고 보존된다", () => {
    const post = toPost({ ...fullRow, display_order: 0 });

    expect(post.display_order).toBe(0);
  });
});

describe("toPostWithSeries", () => {
  it("series 조인이 성공하면 시리즈/카테고리 필드를 채운다", () => {
    const post = toPostWithSeries({
      ...fullRow,
      series: {
        title: "FSD 연재",
        slug: "fsd",
        categories: { name: "프론트엔드", slug: "frontend" },
      },
    });

    expect(post.series_title).toBe("FSD 연재");
    expect(post.series_slug).toBe("fsd");
    expect(post.category_name).toBe("프론트엔드");
    expect(post.category_slug).toBe("frontend");
  });

  it("series가 null인 미분류 글은 시리즈/카테고리 4개 필드가 모두 null이다", () => {
    const post = toPostWithSeries({ ...fullRow, series: null });

    expect(post.series_title).toBeNull();
    expect(post.series_slug).toBeNull();
    expect(post.category_name).toBeNull();
    expect(post.category_slug).toBeNull();
  });

  it("series는 있으나 categories 조인이 비면 카테고리 필드만 null이다", () => {
    const post = toPostWithSeries({
      ...fullRow,
      series: { title: "FSD 연재", slug: "fsd", categories: null },
    });

    expect(post.series_title).toBe("FSD 연재");
    expect(post.category_name).toBeNull();
    expect(post.category_slug).toBeNull();
  });
});
