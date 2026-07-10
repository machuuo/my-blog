import { describe, expect, it } from "vitest";

import { toCategory } from "./mappers";

const fullRow = {
  category_id: "c1",
  name: "프론트엔드",
  slug: "frontend",
  display_order: 2,
};

describe("toCategory", () => {
  it("로우를 도메인 타입으로 변환한다", () => {
    expect(toCategory(fullRow)).toEqual(fullRow);
  });

  it("display_order가 0이어도 falsy로 삼켜지지 않고 보존된다", () => {
    expect(toCategory({ ...fullRow, display_order: 0 }).display_order).toBe(0);
  });

  it("도메인 타입에 정의되지 않은 여분 컬럼은 결과에 새어나가지 않는다", () => {
    const result = toCategory({ ...fullRow, internal_memo: "비공개" } as never);

    expect(result).not.toHaveProperty("internal_memo");
  });
});
