"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { MdxEditor } from "./MdxEditor";
import type { Post } from "@/entities/post";

interface PostFormProps {
  initialData?: Post;
}

export function PostForm({ initialData }: PostFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [tags, setTags] = useState(initialData?.tags.join(", ") ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [published, setPublished] = useState(initialData?.published ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // title에서 slug 자동 생성 (새 글일 때만)
  function handleTitleChange(value: string) {
    setTitle(value);
    if (!isEditing) {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setSlug(autoSlug);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const body = {
        ...(isEditing ? { id: initialData.id } : {}),
        slug,
        title,
        description,
        content,
        tags: tagArray,
        published,
      };

      const res = await fetch("/api/posts", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "저장 실패");
      }

      router.push(`/posts/${slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류 발생");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initialData || !confirm("정말 삭제하시겠습니까?")) return;

    setSaving(true);
    try {
      const res = await fetch("/api/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: initialData.id }),
      });

      if (!res.ok) throw new Error("삭제 실패");

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 중 오류 발생");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          제목
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="포스트 제목"
          required
          className="px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      {/* Slug */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          Slug (URL)
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="post-url-slug"
          required
          className="px-4 py-2 border border-border rounded-md bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
        <p className="text-xs text-muted-foreground">/posts/{slug || "..."}</p>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          설명
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="포스트에 대한 간단한 설명"
          className="px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          태그 (쉼표로 구분)
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="next.js, blog, react"
          className="px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      {/* Published */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="w-4 h-4"
        />
        <span className="text-sm">공개</span>
      </label>

      {/* MDX Editor */}
      <MdxEditor value={content} onChange={setContent} />

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 px-4 py-2 rounded-md">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving || !title || !slug}>
          {saving ? "저장 중..." : isEditing ? "수정" : "발행"}
        </Button>
        {isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            disabled={saving}
            className="text-red-500 hover:text-red-600 hover:border-red-500"
          >
            삭제
          </Button>
        )}
      </div>
    </form>
  );
}
