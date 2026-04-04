import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "blog_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /write 경로만 보호
  if (pathname.startsWith("/write")) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      // 인증되지 않은 경우 로그인 페이지로 리다이렉트
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 토큰 검증 (middleware에서는 간단하게 존재 여부만 확인)
    // 실제 검증은 API Route에서 수행
  }

  // /api/posts, /api/upload는 Route Handler 내부에서 쿠키 검증
  return NextResponse.next();
}

export const config = {
  matcher: ["/write/:path*"],
};
