"use client";

import { useCallback, useRef, type RefObject } from "react";

interface UseImagePasteUploadReturn {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => Promise<void>;
}

export function useImagePasteUpload(
  value: string,
  onChange: (value: string) => void
): UseImagePasteUploadReturn {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = useCallback(
    (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = value.slice(0, start);
      const after = value.slice(end);

      const newValue = before + text + after;
      onChange(newValue);

      // 커서 위치 복원
      requestAnimationFrame(() => {
        textarea.selectionStart = start + text.length;
        textarea.selectionEnd = start + text.length;
        textarea.focus();
      });
    },
    [value, onChange]
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const files = Array.from(e.clipboardData.files);
      const imageFile = files.find((f) => f.type.startsWith("image/"));

      if (!imageFile) return;

      e.preventDefault();

      // 업로드마다 고유 토큰으로 placeholder를 구분 (동시 붙여넣기 경합 방지)
      const placeholder = `![업로드 중...](uploading:${crypto.randomUUID()})`;
      insertAtCursor(`${placeholder}\n`);

      try {
        const formData = new FormData();
        formData.append("file", imageFile);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const { url } = await res.json();

        // 업로드 중... 텍스트를 실제 URL로 교체
        const textarea = textareaRef.current;
        if (textarea) {
          const currentValue = textarea.value;
          const newValue = currentValue.replace(
            placeholder,
            `![image](${url})`
          );
          onChange(newValue);
        }
      } catch {
        // 업로드 실패 시 placeholder 제거
        const textarea = textareaRef.current;
        if (textarea) {
          const currentValue = textarea.value;
          const newValue = currentValue.replace(`${placeholder}\n`, "");
          onChange(newValue);
        }
      }
    },
    [insertAtCursor, onChange]
  );

  return { textareaRef, handlePaste };
}
