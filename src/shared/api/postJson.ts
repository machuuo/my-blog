import { HttpError } from "./HttpError";

export async function postJson<T>(
  url: string,
  body: unknown,
  method: "POST" | "PUT" | "DELETE" = "POST",
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => ({}))) as {
      error?: string;
    };
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- 빈 error 문자열("")도 기본 메시지로 폴백 의도
    throw new HttpError(res.status, errorBody.error || "요청 실패");
  }

  return (await res.json()) as T;
}
