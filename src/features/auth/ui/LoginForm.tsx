"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { HttpError, postJson } from "@/shared/api";
import { Button } from "@/shared/ui/button";

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo = "/write" }: LoginFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await postJson("/api/auth", { password });
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      if (err instanceof HttpError) {
        setError("비밀번호가 올바르지 않습니다.");
      } else {
        setError("로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4 max-w-sm">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호를 입력하세요"
        className="px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        autoFocus
      />
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <Button type="submit" disabled={loading || !password}>
        {loading ? "로그인 중..." : "로그인"}
      </Button>
    </form>
  );
}
