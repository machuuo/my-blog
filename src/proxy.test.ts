// @vitest-environment node
import { NextRequest } from "next/server";
import { config, proxy } from "./proxy";

function request(path: string, cookie?: string): NextRequest {
  const headers = cookie === undefined ? undefined : { cookie };
  return new NextRequest(new URL(path, "http://localhost"), { headers });
}

function redirectTarget(response: Response): URL | null {
  const location = response.headers.get("location");
  return location === null ? null : new URL(location);
}

describe("proxy", () => {
  it("redirects /write to /login with the original path when the session cookie is missing", () => {
    const target = redirectTarget(proxy(request("/write")));

    expect(target?.pathname).toBe("/login");
    expect(target?.searchParams.get("redirect")).toBe("/write");
  });

  it("keeps the nested path in the redirect parameter", () => {
    const target = redirectTarget(proxy(request("/write/my-post")));

    expect(target?.pathname).toBe("/login");
    expect(target?.searchParams.get("redirect")).toBe("/write/my-post");
  });

  it("lets the request through when the session cookie has a value", () => {
    const response = proxy(request("/write", "blog_session=token-value"));

    expect(redirectTarget(response)).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("treats an empty session cookie as missing", () => {
    const target = redirectTarget(proxy(request("/write", "blog_session=")));

    expect(target?.pathname).toBe("/login");
  });

  it("keeps the matcher and sets no runtime option", () => {
    expect(config).toStrictEqual({ matcher: ["/write/:path*"] });
  });

  it("runs under the node test environment", () => {
    expect(typeof window).toBe("undefined");
  });
});
