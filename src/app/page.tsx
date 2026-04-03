import { getAllPosts } from "@/entities/post/server";
import { HomePage } from "@/views/home";

export default function Home() {
  const posts = getAllPosts();

  return <HomePage posts={posts} />;
}
