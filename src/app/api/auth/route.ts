import { NextRequest, NextResponse } from "next/server";

import { createSessionToken, getSessionCookieConfig } from "@/shared/lib/auth";
import { MissingEnvError } from "@/shared/lib/env";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { password } = await request.json();

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const token = createSessionToken();
    const cookieConfig = getSessionCookieConfig(token);

    const response = NextResponse.json({ success: true });
    response.cookies.set(cookieConfig);

    return response;
  } catch (error) {
    if (error instanceof MissingEnvError) {
      console.error(`[auth] Missing required env: ${error.key}`);
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
