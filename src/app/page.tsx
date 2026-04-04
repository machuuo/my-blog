import { getAllPosts } from "@/entities/post/server";
import { HomePage } from "@/views/home";

export const revalidate = 60;

export default async function Home() {
  const posts = await getAllPosts();

  return <HomePage posts={posts} />;
}
