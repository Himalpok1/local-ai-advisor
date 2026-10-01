import { evaluate } from "@mdx-js/mdx";
import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { isValidElement, type ReactNode } from "react";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";

/** Plain text of a heading's children, for its anchor id. */
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

const anchorId = (children: ReactNode) =>
  textOf(children)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const components: MDXComponents = {
  h2: ({ children }) => <h2 id={anchorId(children)}>{children}</h2>,
  h3: ({ children }) => <h3 id={anchorId(children)}>{children}</h3>,
  a: ({ href = "", children }) =>
    href.startsWith("/") || href.startsWith("#") ? (
      <Link href={href}>{children}</Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  table: ({ children }) => (
    <div className="blog-table">
      <table>{children}</table>
    </div>
  ),
};

/** Compile and render a post body. Runs at build time; a syntax error fails the build. */
export async function MdxContent({ source }: { source: string }) {
  const { default: Content } = await evaluate(source, { ...runtime, remarkPlugins: [remarkGfm] });
  return <Content components={components} />;
}
