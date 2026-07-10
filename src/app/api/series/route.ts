import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "@/shared/lib/auth";
import type { TablesInsert, TablesUpdate } from "@/shared/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { category_id, title, description, thumbnail_url, slug, display_order, published } = body;

    const supabase = createServerSupabaseClient();

    // 명시 타입 변수에 담아야 초과 속성 검사가 걸린다 (인라인 리터럴은 EPC를 건너뜀)
    const payload: TablesInsert<"series"> = {
      category_id,
      title,
      description: description ?? "",
      thumbnail_url: thumbnail_url ?? null,
      slug,
      display_order: display_order ?? 0,
      published: published ?? false,
    };

    const { data, error } = await supabase
      .from("series")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath("/");
    revalidatePath(`/series/${slug}`);
    return NextResponse.json({ series: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { series_id, category_id, title, description, thumbnail_url, slug, display_order, published } = body;

    const supabase = createServerSupabaseClient();

    // 명시 타입 변수에 담아야 초과 속성 검사가 걸린다 (인라인 리터럴은 EPC를 건너뜀)
    const patch: TablesUpdate<"series"> = {
      category_id,
      title,
      description,
      thumbnail_url,
      slug,
      display_order,
      published,
    };

    const { data, error } = await supabase
      .from("series")
      .update(patch)
      .eq("series_id", series_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath("/");
    revalidatePath(`/series/${slug}`);
    return NextResponse.json({ series: data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { series_id } = await request.json();

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from("series")
      .delete()
      .eq("series_id", series_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
