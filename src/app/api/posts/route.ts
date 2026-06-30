import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "@/shared/lib/auth";
import { MissingEnvError } from "@/shared/lib/env";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

function handleRouteError(scope: string, error: unknown): NextResponse {
  if (error instanceof MissingEnvError) {
    console.error(`[${scope}] Missing required env: ${error.key}`);
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, title, description, content, tags, published, series_id, display_order } = body;

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("posts")
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- 빈 문자열 series_id도 null로 저장 의도 (?? 시 ""가 FK로 저장됨)
      .insert({ slug, title, description, content, tags, published, series_id: series_id || null, display_order: display_order ?? null })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath("/");
    revalidatePath(`/posts/${slug}`);

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (error) {
    return handleRouteError("posts", error);
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { post_id, slug, title, description, content, tags, published, series_id, display_order } = body;

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("posts")
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- 빈 문자열 series_id도 null로 저장 의도 (?? 시 ""가 FK로 저장됨)
      .update({ slug, title, description, content, tags, published, series_id: series_id || null, display_order: display_order ?? null })
      .eq("post_id", post_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath("/");
    revalidatePath(`/posts/${slug}`);

    return NextResponse.json({ post: data });
  } catch (error) {
    return handleRouteError("posts", error);
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { post_id } = await request.json();

    const supabase = createServerSupabaseClient();

    const { error } = await supabase.from("posts").delete().eq("post_id", post_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError("posts", error);
  }
}
