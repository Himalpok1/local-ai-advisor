import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";

/**
 * The blog: one MDX file per post in content/blog/, named YYYY-MM-DD-slug.mdx.
 * Everything here throws on bad input, so a malformed post fails `next build`
 * (and `npm test`) instead of shipping a broken page.
 */

export const BLOG_DIR = path.join(process.cwd(), "content", "blog");

/** `2026-10-01-my-post.mdx` → date `2026-10-01`, slug `my-post`. */
export const POST_FILENAME = /^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.mdx$/;

/** Left in by `npm run new-post`; a post still containing it is unfinished and cannot be published. */
export const DRAFT_MARKER = "TODO(ray)";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
  }, "is not a real calendar date");

export const FrontmatterSchema = z
  .object({
    title: z.string().trim().min(1, "is required").max(120, "must be 120 characters or fewer"),
    date: isoDate,
    excerpt: z.string().trim().min(1, "is required").max(160, "must be 160 characters or fewer"),
    tags: z
      .array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be lowercase-kebab-case, e.g. local-llm"))
      .min(1, "needs at least one tag")
      .max(6, "allows at most 6 tags")
      .refine((t) => new Set(t).size === t.length, "must not repeat"),
    author: z.string().trim().min(1, "is required"),
  })
  .strict();

export type Frontmatter = z.infer<typeof FrontmatterSchema>;

export interface Post extends Frontmatter {
  slug: string;
  /** Source file name, for error messages and tooling. */
  file: string;
  /** MDX body without the frontmatter. */
  content: string;
  readingMinutes: number;
}

/** Parse a post filename; throws if it doesn't follow YYYY-MM-DD-slug.mdx. */
export function parsePostFilename(file: string): { date: string; slug: string } {
  const m = POST_FILENAME.exec(file);
  if (!m) throw new Error(`content/blog/${file}: filename must be YYYY-MM-DD-slug.mdx (lowercase letters, digits and single hyphens)`);
  return { date: m[1], slug: m[2] };
}

/** Split `---\nyaml\n---\nbody` into its two halves. */
function splitFrontmatter(file: string, source: string): { data: unknown; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source.replace(/^﻿/, ""));
  if (!m) throw new Error(`content/blog/${file}: missing frontmatter block (--- ... ---) at the top of the file`);
  try {
    return { data: parseYaml(m[1]), body: m[2] };
  } catch (e) {
    throw new Error(`content/blog/${file}: frontmatter is not valid YAML: ${(e as Error).message}`);
  }
}

/** Validate one post's source. Pure (no file system), so it is easy to test. */
export function parsePost(file: string, source: string): Post {
  const { date, slug } = parsePostFilename(file);
  const { data, body } = splitFrontmatter(file, source);
  const result = FrontmatterSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join(".") || "frontmatter"} ${i.message}`).join("\n");
    throw new Error(`content/blog/${file}: invalid frontmatter\n${issues}`);
  }
  if (result.data.date !== date) {
    throw new Error(`content/blog/${file}: frontmatter date ${result.data.date} does not match the filename date ${date}`);
  }
  if (source.includes(DRAFT_MARKER)) {
    throw new Error(`content/blog/${file}: still contains ${DRAFT_MARKER} placeholders from the scaffolder; finish or remove them before publishing`);
  }
  const words = body.split(/\s+/).filter(Boolean).length;
  return { ...result.data, slug, file, content: body, readingMinutes: Math.max(1, Math.round(words / 220)) };
}

/** Load and validate every post in a directory, newest first. */
export function loadPosts(dir: string = BLOG_DIR): Post[] {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => !f.startsWith(".") && f.toLowerCase() !== "readme.md");
  const posts = files.map((f) => parsePost(f, fs.readFileSync(path.join(dir, f), "utf8")));
  const seen = new Map<string, string>();
  for (const p of posts) {
    const other = seen.get(p.slug);
    if (other) throw new Error(`content/blog: slug "${p.slug}" is used by both ${other} and ${p.file}; slugs must be unique`);
    seen.set(p.slug, p.file);
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date) || b.file.localeCompare(a.file));
}

/** Every published post, newest first. */
export function getAllPosts(): Post[] {
  return loadPosts();
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

/** "2026-10-01" → "October 1, 2026", independent of the server's time zone. */
export function formatPostDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
