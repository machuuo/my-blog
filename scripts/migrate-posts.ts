/**
 * 기존 MDX 파일을 Supabase DB로 마이그레이션하는 일회성 스크립트
 *
 * 실행 방법:
 * npx tsx scripts/migrate-posts.ts
 *
 * 필요: .env.local에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 설정
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { createClient } from "@supabase/supabase-js";

// .env.local 파일에서 환경변수 읽기
import { config } from "dotenv";
config({ path: ".env.local" });

const POSTS_DIR = path.join(process.cwd(), "content/posts");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("환경변수가 설정되지 않았습니다. .env.local을 확인하세요.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function migrate() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error(`디렉토리가 없습니다: ${POSTS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx"));
  console.log(`${files.length}개의 MDX 파일을 발견했습니다.\n`);

  for (const filename of files) {
    const slug = filename.replace(/\.mdx$/, "");
    const filePath = path.join(POSTS_DIR, filename);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    const post = {
      slug,
      title: data.title || slug,
      description: data.description || "",
      content,
      tags: data.tags || [],
      published: data.published ?? true,
    };

    console.log(`마이그레이션: ${slug}`);
    console.log(`  - title: ${post.title}`);
    console.log(`  - tags: ${post.tags.join(", ")}`);
    console.log(`  - published: ${post.published}`);

    const { error } = await supabase.from("posts").upsert(
      {
        ...post,
      },
      { onConflict: "slug" }
    );

    if (error) {
      console.error(`  ❌ 실패: ${error.message}`);
    } else {
      console.log(`  ✅ 성공`);
    }
    console.log();
  }

  console.log("마이그레이션 완료!");
}

migrate().catch(console.error);
