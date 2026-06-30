import { LoginForm } from "@/features/auth";

interface PageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { redirect } = await searchParams;

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">로그인</h1>
      {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- 빈 redirect("")는 기본 경로로 폴백 의도 */}
      <LoginForm redirectTo={redirect || "/write"} />
    </main>
  );
}
