import { HobbyDetailPage } from "@/views/hobby-detail";

export default function Page({ params }: { params: { slug: string } }) {
  return <HobbyDetailPage slug={params.slug} />;
}
