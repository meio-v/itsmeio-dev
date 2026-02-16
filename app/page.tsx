import { getAllPosts } from "@/lib/posts";
import { HomeClient } from "./_components/HomeClient";

export default function Home() {
  const posts = getAllPosts();
  return <HomeClient posts={posts} />;
}
