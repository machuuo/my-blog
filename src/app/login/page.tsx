import { LoginForm } from "@/features/auth";

interface PageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { redirect } = await searchParams;

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">로그인</h1>
      <LoginForm redirectTo={redirect || "/write"} />
    </main>
  );
}
