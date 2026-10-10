import type { Metadata } from "next";
import Link from "next/link";
import { Rss } from "lucide-react";
import { OPEN_MODEL_ORGS, REFERENCE_RIGS, newOpenModels } from "@/lib/hf/new-models";
import { NewModelsList } from "@/components/new-models/list";

export const dynamic = "force-static";
export const revalidate = 21600;

export const metadata: Metadata = {
  title: "New open-weight models, rated for your hardware",
  description:
    "The latest open LLM releases from Qwen, Google, Meta, Mistral, DeepSeek, OpenAI and more, with eligible chat models rated for a 16 GB laptop, a 24 GB GPU, a 48 GB Mac and a 128 GB AI PC. Updated every few hours, with an RSS feed.",
  alternates: { canonical: "/new-models", types: { "application/rss+xml": "/new-models/feed.xml" } },
};

export default async function NewModelsPage() {
  const items = await newOpenModels();
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">New open models</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Fresh releases from {OPEN_MODEL_ORGS.length} labs that publish open weights, checked for conversational eligibility and, when supported, rated for general chat on{" "}
            {REFERENCE_RIGS.map((r) => r.label).join(", ").replace(/, ([^,]*)$/, " and $1")}.
          </p>
        </div>
        <Link href="/new-models/feed.xml" className="inline-flex items-center gap-1.5 self-start rounded-lg border-2 bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted sm:self-auto">
          <Rss className="size-4 text-orange-500" aria-hidden /> RSS feed
        </Link>
      </header>

      {items.length ? (
        <NewModelsList items={items} />
      ) : (
        <p role="alert" className="rounded-xl border-2 p-6 text-sm text-muted-foreground">
          Hugging Face didn’t respond. This list refreshes every few hours; try again shortly.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        We list each lab’s own text and vision-language repositories from the last four months and skip re-packaged copies (GGUF, AWQ, FP8 and similar).
        Specialized, base and unverified conversational models are not rated. Ratings assume a typical setup (Open WebUI, normal background apps); open any model to rate it for your exact machine. Licenses are as declared
        on the model card.
      </p>
    </div>
  );
}
