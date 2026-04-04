import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/shared/lib/auth";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 파일명 생성: 원본명-랜덤6자.확장자
    const ext = file.name.split(".").pop() ?? "png";
    const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9가-힣-_]/g, "_");
    const random = Math.random().toString(36).substring(2, 8);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const filePath = `${year}/${month}/${baseName}-${random}.${ext}`;

    const supabase = createServerSupabaseClient();

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from("images")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
