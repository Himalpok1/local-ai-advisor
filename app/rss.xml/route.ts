import { getAllPosts } from "@/lib/blog";
import { buildBlogRss } from "@/lib/blog-rss";

// Posts only change with a deploy, so the feed is built once at build time.
export const dynamic = "force-static";

export function GET() {
  return new Response(buildBlogRss(getAllPosts()), { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
