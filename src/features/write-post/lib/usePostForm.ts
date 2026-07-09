"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import type { Category } from "@/entities/category";
import type { Post } from "@/entities/post";
import type { SeriesWithCount } from "@/entities/series";
import { postJson } from "@/shared/api";
import { slugify } from "@/shared/lib";

interface UsePostFormProps {
  initialData?: Post;
  categories: Category[];
  seriesList: SeriesWithCount[];
}

interface UsePostFormReturn {
  title: string;
  setTitle: (value: string) => void;
  slug: string;
  setSlug: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  tags: string;
  setTags: (value: string) => void;
  content: string;
  setContent: (value: string) => void;
  published: boolean;
  setPublished: (value: boolean) => void;
  seriesId: string;
  setSeriesId: (value: string) => void;
  displayOrder: string;
  setDisplayOrder: (value: string) => void;
  saving: boolean;
  error: string;
  isEditing: boolean;
  selectedCategoryId: string;
  filteredSeries: SeriesWithCount[];
  handleCategoryChange: (categoryId: string) => void;
  handleTitleChange: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleDelete: () => Promise<void>;
}

export function usePostForm({
  initialData,
  seriesList,
}: UsePostFormProps): UsePostFormReturn {
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

  function handleCategoryChange(categoryId: string): void {
    setSelectedCategoryId(categoryId);
    setSeriesId("");
  }

  // title에서 slug 자동 생성 (새 글일 때만)
  function handleTitleChange(value: string): void {
    setTitle(value);
    if (!isEditing) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
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

      await postJson("/api/posts", body, isEditing ? "PUT" : "POST");

      router.push(`/posts/${slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류 발생");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!initialData || !confirm("정말 삭제하시겠습니까?")) return;

    setSaving(true);
    try {
      await postJson(
        "/api/posts",
        { post_id: initialData.post_id },
        "DELETE"
      );

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 중 오류 발생");
      setSaving(false);
    }
  }

  return {
    title,
    setTitle,
    slug,
    setSlug,
    description,
    setDescription,
    tags,
    setTags,
    content,
    setContent,
    published,
    setPublished,
    seriesId,
    setSeriesId,
    displayOrder,
    setDisplayOrder,
    saving,
    error,
    isEditing,
    selectedCategoryId,
    filteredSeries,
    handleCategoryChange,
    handleTitleChange,
    handleSubmit,
    handleDelete,
  };
}
