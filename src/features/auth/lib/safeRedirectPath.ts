const FALLBACK_PATH = "/write";

/**
 * 로그인 뒤 이동할 주소를 같은 사이트 안 경로로 제한한다.
 * 같은 출처로 해석돼도 경로가 `//` 로 시작하면 router.push 가 다시 해석할 때
 * 프로토콜 생략 주소(바깥 사이트)로 읽으므로 함께 거른다.
 */
export function toSafeRedirectPath(target: string, origin: string): string {
  if (target.trim() === "") {
    return FALLBACK_PATH;
  }

  let url: URL;
  try {
    url = new URL(target, origin);
  } catch {
    return FALLBACK_PATH;
  }

  if (url.origin !== origin) {
    return FALLBACK_PATH;
  }

  const path = `${url.pathname}${url.search}${url.hash}`;
  if (!path.startsWith("/") || path.startsWith("//")) {
    return FALLBACK_PATH;
  }

  return path;
}
