import { LoginForm } from "@/features/auth";

interface PageProps {
  // 같은 키가 두 번 오면(?redirect=a&redirect=b) Next 가 배열로 넘긴다.
  searchParams: Promise<{ redirect?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { redirect } = await searchParams;
  const redirectTo = typeof redirect === "string" && redirect !== "" ? redirect : "/write";

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">로그인</h1>
      <LoginForm redirectTo={redirectTo} />
    </main>
  );
}
