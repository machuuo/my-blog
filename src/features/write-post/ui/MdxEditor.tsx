"use client";

import { useRef, useCallback } from "react";

interface MdxEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MdxEditor({ value, onChange }: MdxEditorProps) {
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

      // 업로드 중 표시
      insertAtCursor("![업로드 중...]()\n");

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
            "![업로드 중...]()",
            `![image](${url})`
          );
          onChange(newValue);
        }
      } catch {
        // 업로드 실패 시 placeholder 제거
        const textarea = textareaRef.current;
        if (textarea) {
          const currentValue = textarea.value;
          const newValue = currentValue.replace("![업로드 중...]()\n", "");
          onChange(newValue);
        }
      }
    },
    [insertAtCursor, onChange]
  );

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-muted-foreground">
        본문 (MDX)
      </label>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => void handlePaste(e)}
        placeholder="MDX 내용을 작성하세요. 이미지는 Ctrl+V로 붙여넣을 수 있습니다."
        className="w-full min-h-[500px] px-4 py-3 border border-border rounded-md bg-background text-foreground font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-foreground/20"
        spellCheck={false}
      />
      <p className="text-xs text-muted-foreground">
        이미지를 클립보드에서 Ctrl+V로 붙여넣으면 자동 업로드됩니다.
      </p>
    </div>
  );
}
