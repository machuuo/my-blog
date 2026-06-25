import { HobbyDetailPage } from "@/views/hobby-detail";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <HobbyDetailPage slug={slug} />;
}
