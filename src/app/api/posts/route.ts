import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { MissingEnvError } from "@/shared/lib";
import { isAuthenticated } from "@/shared/lib/auth";
import type { TablesInsert, TablesUpdate } from "@/shared/lib/supabase/database.types";
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

    // 명시 타입 변수에 담아야 초과 속성 검사가 걸린다 (인라인 리터럴은 EPC를 건너뜀)
    const payload: TablesInsert<"posts"> = {
      slug,
      title,
      description,
      content,
      tags,
      published,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- 빈 문자열 series_id도 null로 저장 의도 (?? 시 ""가 FK로 저장됨)
      series_id: series_id || null,
      display_order: display_order ?? null,
    };

    const { data, error } = await supabase
      .from("posts")
      .insert(payload)
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

    // 명시 타입 변수에 담아야 초과 속성 검사가 걸린다 (인라인 리터럴은 EPC를 건너뜀)
    const patch: TablesUpdate<"posts"> = {
      slug,
      title,
      description,
      content,
      tags,
      published,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- 빈 문자열 series_id도 null로 저장 의도 (?? 시 ""가 FK로 저장됨)
      series_id: series_id || null,
      display_order: display_order ?? null,
    };

    const { data, error } = await supabase
      .from("posts")
      .update(patch)
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
