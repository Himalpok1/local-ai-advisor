import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ModelFacts } from "@/components/advisor/hf-model-facts";
import { RecommendationCard } from "@/components/advisor/recommendation-card";
import { hfSummary } from "@/lib/hf/summary";
import { HfError } from "@/lib/hf/fetch";
import { normalizeRepo } from "@/lib/hf/parse";
import { POPULAR_HF_REPOS } from "@/lib/hf/popular";
import { OG_BASE } from "@/lib/og";

export const dynamic = "force-static";
export const revalidate = 21600;
type Props = { params: Promise<{ owner: string; model: string }> };

/** Seed popular pages without a build-time trending search. */
export function generateStaticParams() {
  return POPULAR_HF_REPOS.map((repo) => { const [owner, model] = repo.split("/"); return { owner, model }; });
}

async function repoFrom(props: Props) {
  const { owner, model } = await props.params;
  const repo = `${owner}/${model}`;
  if (normalizeRepo(repo) !== repo) notFound();
  return repo;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const repo = await repoFrom(props);
  try {
    const { parsed, verdict } = await hfSummary(repo);
    return {
      title: `${parsed.model.name}: ${parsed.model.parameterCount}B — ${verdict}`,
      description: `Estimated ${verdict.toLowerCase()} for repository coding on a MacBook Pro M4 Pro 48GB. Native context, weight sizes and capability signals from Hugging Face.`,
      alternates: { canonical: `/hf/${repo}` },
      openGraph: { type: "website", ...OG_BASE, url: `/hf/${repo}` },
    };
  } catch { return { title: repo, robots: { index: false }, alternates: { canonical: `/hf/${repo}` } }; }
}

export default async function Page(props: Props) {
  const repo = await repoFrom(props);
  let summary;
  try { summary = await hfSummary(repo); } catch (error) {
    if (error instanceof HfError && error.status === 404) notFound();
    return <main className="mx-auto max-w-4xl space-y-4 px-4 py-10"><h1>{repo}</h1><p role="alert">{error instanceof HfError ? error.message : "Hugging Face is temporarily unavailable. No rating could be verified."}</p><Link href={`/hugging-face?repo=${encodeURIComponent(repo)}`}>Retry interactive lookup</Link></main>;
  }
  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-10">
    <h1 className="text-3xl font-semibold">{summary.parsed.model.name} on local hardware</h1>
    <p>Estimated comfort for repository coding with Aider on a MacBook Pro M4 Pro 48GB.</p>
    <div className="grid gap-6 lg:grid-cols-2"><ModelFacts r={summary.parsed} /><RecommendationCard rec={summary.rec} workloadLabel="Repository coding with Aider" /></div>
    <Link className="text-link underline" href={`/hugging-face?repo=${encodeURIComponent(repo)}`}>Check with your hardware and workload</Link>
  </main>;
}
