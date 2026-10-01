import type { Metadata } from "next";
import { HfLookup } from "@/components/advisor/hf-lookup";
import { decodeState } from "@/lib/share";
import { normalizeRepo } from "@/lib/hf/parse";

const baseMetadata: Metadata = {
  title: "Check any Hugging Face model",
  description: "Paste any Hugging Face model — we read its real architecture and tell you whether it will run comfortably on your hardware for your workload.",
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const params = await searchParams;
  const repo = typeof params.repo === "string" ? normalizeRepo(params.repo) : null;
  return { ...baseMetadata, alternates: { canonical: repo ? `/hf/${repo}` : "/hugging-face" }, ...(repo ? { openGraph: { images: [{ url: `/hf/${repo}/opengraph-image`, width: 1200, height: 630 }] } } : {}) };
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const repo = typeof params.repo === "string" ? normalizeRepo(params.repo) ?? undefined : undefined;
  const state = decodeState(params, { useCase: "coding-repo", toolId: "aider", repositorySize: "medium", priority: "balanced", devEnv: "normal" });
  return <HfLookup initialRepo={repo} initial={state} />;
}
