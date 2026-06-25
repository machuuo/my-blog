import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/shared/lib/auth";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

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
      .insert({ slug, title, description, content, tags, published, series_id: series_id || null, display_order: display_order ?? null })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath("/");
    revalidatePath(`/posts/${slug}`);

    return NextResponse.json({ post: data }, { status: 201 });
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
    const { post_id, slug, title, description, content, tags, published, series_id, display_order } = body;

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("posts")
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
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
