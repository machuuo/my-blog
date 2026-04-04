import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "blog_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24시간

function signToken(payload: string, secret: string): string {
  // 간단한 HMAC 대체: secret + payload를 base64로 인코딩
  const data = `${payload}.${secret}`;
  return Buffer.from(data).toString("base64url");
}

function verifyToken(token: string, secret: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    return decoded.endsWith(`.${secret}`);
  } catch {
    return false;
  }
}

export function createSessionToken(): string {
  const secret = process.env.SESSION_SECRET!;
  const payload = `admin:${Date.now()}`;
  return signToken(payload, secret);
}

export function verifySessionToken(token: string): boolean {
  const secret = process.env.SESSION_SECRET!;
  return verifyToken(token, secret);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

export function getSessionCookieConfig(token: string) {
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  };
}

export const SESSION_COOKIE = SESSION_COOKIE_NAME;
