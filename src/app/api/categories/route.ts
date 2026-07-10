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
    const { name, slug, display_order } = body;

    const supabase = createServerSupabaseClient();

    // 명시 타입 변수에 담아야 초과 속성 검사가 걸린다 (인라인 리터럴은 EPC를 건너뜀)
    const payload: TablesInsert<"categories"> = { name, slug, display_order: display_order ?? 0 };

    const { data, error } = await supabase
      .from("categories")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath("/");
    return NextResponse.json({ category: data }, { status: 201 });
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
    const { category_id, name, slug, display_order } = body;

    const supabase = createServerSupabaseClient();

    // 명시 타입 변수에 담아야 초과 속성 검사가 걸린다 (인라인 리터럴은 EPC를 건너뜀)
    const patch: TablesUpdate<"categories"> = { name, slug, display_order };

    const { data, error } = await supabase
      .from("categories")
      .update(patch)
      .eq("category_id", category_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath("/");
    return NextResponse.json({ category: data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { category_id } = await request.json();

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("category_id", category_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
