import { slugify } from "./slugify";

describe("slugify", () => {
  it("converts uppercase and spaces to lowercase hyphenated form", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("preserves Korean characters", () => {
    expect(slugify("리액트 훅")).toBe("리액트-훅");
  });

  it("removes special characters", () => {
    expect(slugify("a@b#c!")).toBe("abc");
  });

  it("collapses consecutive spaces or hyphens into a single hyphen", () => {
    expect(slugify("a   b")).toBe("a-b");
    expect(slugify("a---b")).toBe("a-b");
  });

  it("trims leading and trailing whitespace (converted to hyphens first, so trim leaves them)", () => {
    // 원본 로직 순서: 공백 치환(-)이 trim()보다 먼저 실행되므로
    // 앞뒤 공백은 하이픈으로 바뀐 뒤 trim으로는 제거되지 않는다 (원본 동작 보존).
    expect(slugify("  hi  ")).toBe("-hi-");
  });
});
