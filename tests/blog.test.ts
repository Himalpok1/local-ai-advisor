import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import { afterEach, describe, expect, it } from "vitest";
import { DRAFT_MARKER, FrontmatterSchema, POST_FILENAME, getAllPosts, loadPosts, parsePost, parsePostFilename, type Post } from "@/lib/blog";
import { RSS_LIMIT, SITE_URL, buildBlogRss } from "@/lib/blog-rss";
import sitemap from "@/app/sitemap";
import { buildPost, slugify } from "@/scripts/new-post.mjs";

const valid = {
  title: "Qwen ships a new 8B model",
  date: "2026-10-01",
  excerpt: "A small model that runs on a 16 GB laptop.",
  tags: ["local-llm", "new-models"],
  author: "Ray, Himal's AI assistant",
};

const source = (fm: Record<string, unknown>, body = "Hello **world**.\n\n## Sources\n\n- [A](https://example.com)\n") =>
  `---\n${Object.entries(fm)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join("\n")}\n---\n\n${body}`;

const post = (date: string, slug: string, title = slug): Post => ({ ...valid, title, date, slug, file: `${date}-${slug}.mdx`, content: "", readingMinutes: 1 });

describe("frontmatter schema", () => {
  it("accepts a complete, valid frontmatter", () => {
    expect(FrontmatterSchema.parse(valid)).toEqual(valid);
  });

  it.each([
    ["missing title", { ...valid, title: undefined }],
    ["empty title", { ...valid, title: "  " }],
    ["missing date", { ...valid, date: undefined }],
    ["non-ISO date", { ...valid, date: "10/01/2026" }],
    ["impossible date", { ...valid, date: "2026-02-30" }],
    ["excerpt over 160 chars", { ...valid, excerpt: "x".repeat(161) }],
    ["missing excerpt", { ...valid, excerpt: undefined }],
    ["tags not an array", { ...valid, tags: "local-llm" }],
    ["empty tags", { ...valid, tags: [] }],
    ["tag with spaces/caps", { ...valid, tags: ["Local LLM"] }],
    ["duplicate tags", { ...valid, tags: ["ai", "ai"] }],
    ["missing author", { ...valid, author: undefined }],
    ["unknown field (typo)", { ...valid, excerpts: "oops" }],
  ])("rejects %s", (_, fm) => {
    expect(FrontmatterSchema.safeParse(fm).success).toBe(false);
  });

  it("allows an excerpt of exactly 160 characters", () => {
    expect(FrontmatterSchema.safeParse({ ...valid, excerpt: "x".repeat(160) }).success).toBe(true);
  });
});

describe("filename convention", () => {
  it("parses YYYY-MM-DD-slug.mdx", () => {
    expect(parsePostFilename("2026-10-01-qwen-ships-a-new-8b-model.mdx")).toEqual({ date: "2026-10-01", slug: "qwen-ships-a-new-8b-model" });
  });

  it.each(["qwen.mdx", "2026-10-01-qwen.md", "2026-10-01-Qwen.mdx", "2026-10-01-qwen--8b.mdx", "2026-10-01-.mdx", "26-10-01-qwen.mdx", "2026-10-01_qwen.mdx"])(
    "rejects %s",
    (name) => {
      expect(() => parsePostFilename(name)).toThrow(/YYYY-MM-DD-slug\.mdx/);
    },
  );

  it("requires the frontmatter date to match the filename date", () => {
    expect(() => parsePost("2026-10-02-qwen.mdx", source(valid))).toThrow(/does not match the filename date/);
  });

  it("parses a full post and strips the frontmatter from the body", () => {
    const p = parsePost("2026-10-01-qwen.mdx", source(valid));
    expect(p).toMatchObject({ ...valid, slug: "qwen", file: "2026-10-01-qwen.mdx", readingMinutes: 1 });
    expect(p.content).not.toContain("---");
    expect(p.content).toContain("Hello **world**.");
  });

  it("keeps an unquoted YAML date as a string", () => {
    const raw = source(valid).replace('date: "2026-10-01"', "date: 2026-10-01");
    expect(parsePost("2026-10-01-qwen.mdx", raw).date).toBe("2026-10-01");
  });

  it("names the file and field in validation errors", () => {
    expect(() => parsePost("2026-10-01-qwen.mdx", source({ ...valid, excerpt: "x".repeat(200) }))).toThrow(/2026-10-01-qwen\.mdx[\s\S]*excerpt/);
  });

  it("rejects a file without frontmatter", () => {
    expect(() => parsePost("2026-10-01-qwen.mdx", "# Just markdown")).toThrow(/missing frontmatter/);
  });

  it("rejects unfinished scaffolder placeholders", () => {
    expect(() => parsePost("2026-10-01-qwen.mdx", source(valid, `${DRAFT_MARKER}: write this`))).toThrow(/TODO\(ray\)/);
  });
});

describe("loadPosts", () => {
  let dir = "";
  afterEach(() => dir && fs.rmSync(dir, { recursive: true, force: true }));
  const write = (name: string, fm: Record<string, unknown>) => fs.writeFileSync(path.join(dir, name), source(fm));

  it("sorts newest first and rejects duplicate slugs", () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-"));
    write("2026-09-01-older.mdx", { ...valid, date: "2026-09-01" });
    write("2026-10-01-newer.mdx", valid);
    expect(loadPosts(dir).map((p) => p.slug)).toEqual(["newer", "older"]);
    write("2026-10-02-older.mdx", { ...valid, date: "2026-10-02" });
    expect(() => loadPosts(dir)).toThrow(/slug "older" is used by both/);
  });

  it("returns no posts for a missing directory", () => {
    expect(loadPosts(path.join(os.tmpdir(), "does-not-exist-blog"))).toEqual([]);
  });
});

describe("new-post scaffolder", () => {
  it("slugifies titles into the filename convention", () => {
    expect(slugify("What’s New in Llama 4.1? (Explained)")).toBe("whats-new-in-llama-4-1-explained");
    expect(slugify("Café  --  Déjà vu")).toBe("cafe-deja-vu");
  });

  it("produces a filename that matches the convention and valid frontmatter", () => {
    const { filename, contents, slug } = buildPost("Gemma 4 on a MacBook Air", "2026-10-01");
    expect(filename).toBe("2026-10-01-gemma-4-on-a-macbook-air.mdx");
    expect(filename).toMatch(POST_FILENAME);
    expect(slug).toBe("gemma-4-on-a-macbook-air");
    // Frontmatter is valid; only the TODO(ray) markers keep it from publishing.
    expect(() => parsePost(filename, contents)).toThrow(/TODO\(ray\)/);
    const finished = contents.replaceAll(DRAFT_MARKER, "Done");
    const p = parsePost(filename, finished);
    expect(p.title).toBe("Gemma 4 on a MacBook Air");
    expect(p.author).toBe("Ray, Himal's AI assistant");
    expect(p.content.trimEnd()).toMatch(/## Sources\n\n- .+$/);
  });

  it("escapes quotes in titles", () => {
    const { filename, contents } = buildPost('The "small" model that could', "2026-10-01");
    expect(parsePost(filename, contents.replaceAll(DRAFT_MARKER, "Done")).title).toBe('The "small" model that could');
  });

  it("rejects bad input", () => {
    expect(() => buildPost("   ", "2026-10-01")).toThrow();
    expect(() => buildPost("!!!", "2026-10-01")).toThrow(/slug/);
    expect(() => buildPost("Title", "Oct 1")).toThrow(/YYYY-MM-DD/);
  });
});

describe("RSS feed", () => {
  it("lists the latest 20 posts, newest first, with escaped text", () => {
    const posts = Array.from({ length: 25 }, (_, i) => post(`2026-09-${String(30 - i).padStart(2, "0")}`, `post-${i}`, `Post ${i} <AT&T>`));
    const xml = buildBlogRss(posts);
    expect(xml.match(/<item>/g)).toHaveLength(RSS_LIMIT);
    expect(xml).toContain(`<link>${SITE_URL}/blog/post-0</link>`);
    expect(xml).toContain(`<link>${SITE_URL}/blog/post-19</link>`);
    expect(xml).not.toContain("/blog/post-20<");
    expect(xml.indexOf("post-0<")).toBeLessThan(xml.indexOf("post-1<"));
    expect(xml).toContain("Post 0 &lt;AT&amp;T&gt;");
    expect(xml).toContain(`<atom:link href="${SITE_URL}/rss.xml" rel="self"`);
    expect(xml).toContain("<pubDate>Wed, 30 Sep 2026 12:00:00 GMT</pubDate>");
    expect(xml).toContain("<category>local-llm</category>");
  });

  it("is a valid empty channel with no posts", () => {
    const xml = buildBlogRss([]);
    expect(xml).toContain("<channel>");
    expect(xml).not.toContain("<item>");
  });
});

describe("published content", () => {
  const posts = getAllPosts();

  it("has at least one post and every post is valid", () => {
    expect(posts.length).toBeGreaterThan(0);
  });

  it.each(posts.map((p) => [p.file, p] as const))("%s compiles as MDX and ends with a Sources section", async (_, p) => {
    await expect(compile(p.content, { remarkPlugins: [remarkGfm] })).resolves.toBeTruthy();
    expect(p.content).toMatch(/^## Sources$/m);
    expect(p.content.slice(p.content.search(/^## Sources$/m))).toMatch(/\]\(https?:\/\//);
  });

  it("includes every post in the sitemap, alongside the existing pages", () => {
    const urls = new Set(sitemap().map((e) => e.url));
    expect(urls.has(`${SITE_URL}/blog`)).toBe(true);
    for (const p of posts) expect(urls.has(`${SITE_URL}/blog/${p.slug}`)).toBe(true);
    for (const existing of ["", "/check", "/learn", "/methodology", "/new-models"]) expect(urls.has(`${SITE_URL}${existing}`)).toBe(true);
  });
});
