import { TechDetailPage } from "@/views/tech-detail";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TechDetailPage slug={slug} />;
}
