#!/usr/bin/env node
/**
 * Scaffold a blog post: npm run new-post -- "Post Title" [--date YYYY-MM-DD]
 *
 * Creates content/blog/YYYY-MM-DD-slug.mdx with valid frontmatter and starter
 * sections. Every TODO(ray) marker must be replaced before the post can build;
 * lib/blog.ts rejects posts that still contain one.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const AUTHOR = "Ray, Your Local AI Advisor";

/** "What's New in Llama 4?" → "whats-new-in-llama-4" */
export function slugify(title) {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

/** Today's date as YYYY-MM-DD in local time. */
export function today(now = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** The file name and contents for a new post. */
export function buildPost(title, date) {
  const cleanTitle = title.trim().replace(/\s+/g, " ");
  if (!cleanTitle) throw new Error("A title is required.");
  if (cleanTitle.length > 120) throw new Error("Title must be 120 characters or fewer.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Date must be YYYY-MM-DD, got "${date}".`);
  const slug = slugify(cleanTitle);
  if (!slug) throw new Error("The title needs at least one letter or digit to make a slug.");
  const filename = `${date}-${slug}.mdx`;
  const contents = `---
title: ${JSON.stringify(cleanTitle)}
date: "${date}"
excerpt: "TODO(ray): one plain-language sentence, 160 characters max, that tells a beginner why this matters."
tags: ["local-llm"]
author: ${JSON.stringify(AUTHOR)}
---

TODO(ray): open with the news or question in one or two sentences, then say who should care and why.

## What happened

TODO(ray): the facts, in plain words. Link each claim to a source listed below.

## What it means if you run AI on your own computer

TODO(ray): be concrete. Which hardware, which apps, what speed or memory to expect. Say clearly what local AI can't do here.

## Try it yourself

TODO(ray): the smallest practical next step. Link to a tool on this site, e.g. [check your computer](/check) or [can I run it?](/can-i-run).

## Sources

- TODO(ray): [Source title](https://example.com), publisher, date accessed
`;
  return { slug, filename, contents };
}

function main(argv) {
  const args = [...argv];
  let date = today();
  const dateFlag = args.indexOf("--date");
  if (dateFlag !== -1) {
    date = args[dateFlag + 1] ?? "";
    args.splice(dateFlag, 2);
  }
  const title = args.join(" ");
  if (!title.trim()) {
    console.error('Usage: npm run new-post -- "Post Title" [--date YYYY-MM-DD]');
    process.exit(1);
  }

  const { slug, filename, contents } = buildPost(title, date);
  const dir = path.join(process.cwd(), "content", "blog");
  fs.mkdirSync(dir, { recursive: true });
  const clash = fs.readdirSync(dir).find((f) => f.slice(11) === `${slug}.mdx`);
  if (clash) {
    console.error(`A post with the slug "${slug}" already exists: content/blog/${clash}. Pick a different title.`);
    process.exit(1);
  }
  const file = path.join(dir, filename);
  fs.writeFileSync(file, contents, { flag: "wx" });
  console.log(path.relative(process.cwd(), file));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
}
