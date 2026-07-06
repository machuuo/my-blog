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

  it("strips leading and trailing hyphens produced from boundary whitespace", () => {
    // 앞뒤 공백이 하이픈으로 치환된 뒤, 경계 하이픈을 제거해 깔끔한 slug를 만든다.
    expect(slugify("  hi  ")).toBe("hi");
  });
});
