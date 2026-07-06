"use client";

import { useImagePasteUpload } from "../lib/useImagePasteUpload";

interface MdxEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MdxEditor({ value, onChange }: MdxEditorProps) {
  const { textareaRef, handlePaste } = useImagePasteUpload(value, onChange);

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
