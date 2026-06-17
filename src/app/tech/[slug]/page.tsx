import { TechDetailPage } from "@/views/tech-detail";

export default function Page({ params }: { params: { slug: string } }) {
  return <TechDetailPage slug={params.slug} />;
}
