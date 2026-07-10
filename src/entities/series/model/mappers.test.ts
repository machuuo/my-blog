import { describe, expect, it } from "vitest";

import { toSeries, toSeriesWithCount } from "./mappers";

const fullRow = {
  series_id: "s1",
  category_id: "c1",
  title: "FSD 연재",
  description: "레이어 이야기",
  thumbnail_url: "https://example.com/a.png",
  slug: "fsd",
  display_order: 2,
  published: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
};

describe("toSeries", () => {
  it("모든 컬럼이 채워진 로우를 도메인 타입으로 변환한다", () => {
    const series = toSeries(fullRow);

    expect(series).toEqual(fullRow);
  });

  it("description은 null일 때 빈 문자열로, thumbnail_url은 null을 그대로 유지한다", () => {
    const series = toSeries({ ...fullRow, description: null, thumbnail_url: null });

    expect(series.description).toBe("");
    expect(series.thumbnail_url).toBeNull();
  });

  it("display_order가 0이어도 falsy로 삼켜지지 않고 보존된다", () => {
    const series = toSeries({ ...fullRow, display_order: 0 });

    expect(series.display_order).toBe(0);
  });
});

describe("toSeriesWithCount", () => {
  it("post_count를 숫자로 담아 Series를 확장한다", () => {
    const series = toSeriesWithCount({ ...fullRow, post_count: 7 });

    expect(series.series_id).toBe("s1");
    expect(series.post_count).toBe(7);
  });

  // post_count null 케이스는 RPC 생성 타입이 non-null(count()는 NULL 미반환)이라 타입상 도달 불가.
  // 매퍼의 `?? 0` 런타임 가드는 보존하되, 그 정당성 재판정은 tierD-1에서 다룬다.

  it("post_count가 0이면 0을 그대로 유지한다", () => {
    const series = toSeriesWithCount({ ...fullRow, post_count: 0 });

    expect(series.post_count).toBe(0);
  });
});
