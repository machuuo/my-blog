import { toSafeRedirectPath } from "./safeRedirectPath";

const ORIGIN = "https://blog.test";
const FALLBACK = "/write";

describe("toSafeRedirectPath", () => {
  describe("keeps same-site paths", () => {
    it.each([
      ["/write", "/write"],
      ["/write/my-post?x=1#h", "/write/my-post?x=1#h"],
      ["https://blog.test/write", "/write"],
      ["/%2F%2Fevil.test", "/%2F%2Fevil.test"],
    ])("%s → %s", (target, expected) => {
      expect(toSafeRedirectPath(target, ORIGIN)).toBe(expected);
    });
  });

  describe("falls back to /write when the target leaves the site", () => {
    it.each([
      "https://evil.test/phish",
      "//evil.test",
      "/\\evil.test",
      "/\t/evil.test",
      "/\n/evil.test",
      "javascript:alert(1)",
      "https://blog.test:8443/admin",
    ])("%j", (target) => {
      expect(toSafeRedirectPath(target, ORIGIN)).toBe(FALLBACK);
    });
  });

  describe("falls back to /write when a same-origin result would be read as another site", () => {
    it.each([
      "https://blog.test//evil.test",
      "https://blog.test/\\evil.test",
      "/.//evil.test",
      "/x/..//evil.test",
      ".//evil.test",
      "/.\\\\evil.test",
      "/write/../\\evil.test",
      "/%2e//evil.test",
      "/write/%2E%2e//evil.test",
    ])("%j", (target) => {
      expect(toSafeRedirectPath(target, ORIGIN)).toBe(FALLBACK);
    });
  });

  describe("falls back to /write for empty, blank, unparseable and non-path results", () => {
    it.each(["", " ", "\t", "http://[", "blob:https://blog.test/x"])("%j", (target) => {
      expect(toSafeRedirectPath(target, ORIGIN)).toBe(FALLBACK);
    });
  });

  it("returns a value that router.push resolves back to this site for every input above", () => {
    const inputs = [
      "/write",
      "/write/my-post?x=1#h",
      "https://evil.test/phish",
      "//evil.test",
      "/\\evil.test",
      "/\t/evil.test",
      "/\n/evil.test",
      "javascript:alert(1)",
      "",
      "https://blog.test/write",
      "/%2F%2Fevil.test",
      "https://blog.test:8443/admin",
      "https://blog.test//evil.test",
      "https://blog.test/\\evil.test",
      "/.//evil.test",
      "/x/..//evil.test",
      ".//evil.test",
      "/.\\\\evil.test",
      "/write/../\\evil.test",
      "/%2e//evil.test",
      "/write/%2E%2e//evil.test",
      " ",
      "\t",
      "http://[",
      "blob:https://blog.test/x",
    ];

    for (const target of inputs) {
      const result = toSafeRedirectPath(target, ORIGIN);
      const resolved = new URL(result, `${ORIGIN}/login?redirect=x`);

      expect({ target, origin: resolved.origin }).toEqual({ target, origin: ORIGIN });
      expect({ target, leadingSlash: result.startsWith("/") && !result.startsWith("//") }).toEqual({
        target,
        leadingSlash: true,
      });
    }
  });
});
