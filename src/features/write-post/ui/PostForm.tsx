"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { MdxEditor } from "./MdxEditor";
import type { Post } from "@/entities/post";
import type { Category } from "@/entities/category";
import type { SeriesWithCount } from "@/entities/series";

interface PostFormProps {
  initialData?: Post;
  categories: Category[];
  seriesList: SeriesWithCount[];
}

function submitLabel(saving: boolean, isEditing: boolean): string {
  if (saving) return "저장 중...";
  if (isEditing) return "수정";
  return "발행";
}

export function PostForm({ initialData, categories, seriesList }: PostFormProps) {
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
  const [seriesId, setSeriesId] = useState(initialData?.series_id ?? "");
  const [displayOrder, setDisplayOrder] = useState<string>(
    initialData?.display_order?.toString() ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // category_id로 필터된 series 목록
  const [selectedCategoryId, setSelectedCategoryId] = useState(() => {
    if (initialData?.series_id) {
      const s = seriesList.find((s) => s.series_id === initialData.series_id);
      return s?.category_id ?? "";
    }
    return "";
  });

  const filteredSeries = selectedCategoryId
    ? seriesList.filter((s) => s.category_id === selectedCategoryId)
    : seriesList;

  function handleCategoryChange(categoryId: string) {
    setSelectedCategoryId(categoryId);
    setSeriesId("");
  }

  // title에서 slug 자동 생성 (새 글일 때만)
  function handleTitleChange(value: string) {
    setTitle(value);
    if (!isEditing) {
      const autoSlug = value
        .toLowerCase()
        .replaceAll(/[^a-z0-9가-힣\s-]/g, "")
        .replaceAll(/\s+/g, "-")
        .replaceAll(/-+/g, "-")
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
        ...(isEditing ? { post_id: initialData.post_id } : {}),
        slug,
        title,
        description,
        content,
        tags: tagArray,
        published,
        series_id: seriesId || null,
        display_order: displayOrder ? Number(displayOrder) : null,
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
        body: JSON.stringify({ post_id: initialData.post_id }),
      });

      if (!res.ok) throw new Error("삭제 실패");

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 중 오류 발생");
      setSaving(false);
    }
  }

  const inputClassName =
    "px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20";

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
          className={inputClassName}
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
          className={`${inputClassName} font-mono text-sm`}
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
          className={inputClassName}
        />
      </div>

      {/* Series Selection */}
      {categories.length > 0 ? <div className="flex flex-col gap-4 p-4 border border-border rounded-md">
          <p className="text-sm font-medium text-muted-foreground">시리즈 (선택)</p>
          <div className="flex gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-xs text-muted-foreground">카테고리</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={inputClassName}
              >
                <option value="">전체</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-xs text-muted-foreground">시리즈</label>
              <select
                value={seriesId}
                onChange={(e) => setSeriesId(e.target.value)}
                className={inputClassName}
              >
                <option value="">없음</option>
                {filteredSeries.map((s) => (
                  <option key={s.series_id} value={s.series_id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {seriesId ? <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground">
                시리즈 내 순서
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                placeholder="0"
                min="0"
                className={`${inputClassName} w-32`}
              />
            </div> : null}
        </div> : null}

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
          className={inputClassName}
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
      {error ? <p className="text-sm text-red-500 bg-red-500/10 px-4 py-2 rounded-md">
          {error}
        </p> : null}

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving || !title || !slug}>
          {submitLabel(saving, isEditing)}
        </Button>
        {isEditing ? <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            disabled={saving}
            className="text-red-500 hover:text-red-600 hover:border-red-500"
          >
            삭제
          </Button> : null}
      </div>
    </form>
  );
}
