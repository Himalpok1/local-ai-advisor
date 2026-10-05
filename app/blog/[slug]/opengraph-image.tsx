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
    <div style={{ display: "flex", width: "100%", height: "100%", padding: 56, background: "#FDF8E7" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 48,
          background: "#FFFFFF",
          border: "6px solid #171410",
          borderRadius: 32,
          boxShadow: "14px 14px 0 #171410",
          color: "#171410",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <img src={logoSrc} width={64} height={64} alt="" />
          <div style={{ display: "flex", fontSize: 32, fontWeight: 800 }}>Local AI Advisor</div>
          <div style={{ display: "flex", marginLeft: 8, padding: "4px 18px", borderRadius: 999, background: "#2EE88C", border: "4px solid #171410", fontSize: 24, fontWeight: 800 }}>
            Blog
          </div>
        </div>
        <div style={{ display: "flex", fontSize: title.length > 70 ? 54 : 66, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1.5 }}>{title}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, fontWeight: 700 }}>
          <div style={{ display: "flex" }}>{post ? `${formatPostDate(post.date)} · ${post.author}` : "iownchatgpt.com"}</div>
          <div style={{ display: "flex" }}>iownchatgpt.com/blog</div>
        </div>
      </div>
    </div>,
    size,
  );
}
