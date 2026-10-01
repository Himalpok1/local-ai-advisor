import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { formatPostDate, getAllPosts, getPost } from "@/lib/blog";

export const alt = "Local AI Advisor blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  const title = post?.title ?? "Local AI, in plain language";
  const logo = await readFile(path.join(process.cwd(), "public", "brand", "logo-mark-128.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: 72,
        background: "linear-gradient(135deg, #0d0f17 0%, #161a2e 60%, #241f4d 100%)",
        color: "#f1f3fb",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <img src={logoSrc} width={64} height={64} alt="" />
        <div style={{ display: "flex", fontSize: 32, fontWeight: 700 }}>Local AI Advisor</div>
        <div style={{ display: "flex", marginLeft: 8, padding: "6px 16px", borderRadius: 999, background: "rgba(129, 140, 248, 0.18)", color: "#a5b4fc", fontSize: 24 }}>
          Blog
        </div>
      </div>
      <div style={{ display: "flex", fontSize: title.length > 70 ? 54 : 66, fontWeight: 800, lineHeight: 1.12, letterSpacing: -1.5 }}>{title}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#a8afc7" }}>
        <div style={{ display: "flex" }}>{post ? `${formatPostDate(post.date)} · ${post.author}` : "iownchatgpt.com"}</div>
        <div style={{ display: "flex", color: "#a5b4fc" }}>iownchatgpt.com/blog</div>
      </div>
    </div>,
    size,
  );
}
