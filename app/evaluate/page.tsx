import type { Metadata } from "next";
import { GatedEvaluation } from "@/components/advisor/gated-views";
import { decodeState } from "@/lib/share";
import { getModel } from "@/data";

export const metadata: Metadata = {
  title: "Detailed evaluation",
  description: "Will this model + runtime + tool + hardware combination be comfortable for your workload? Full breakdown with what-if controls.",
  // Every combination of inputs is a URL here; the /can-i-run answer pages are the indexable versions.
  robots: { index: false, follow: true },
};

export default async function EvaluatePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const state = decodeState(await searchParams);
  const modelId = state.modelId ?? "qwen3-coder-30b-a3b";
  // Hugging Face imports (hf:…) are resolved in the browser; the view falls back to a supported quant.
  const model = modelId.startsWith("hf:") ? undefined : getModel(modelId);
  const quant = !model ? (state.quant ?? "q4") : state.quant && model.supportedQuantizations.includes(state.quant) ? state.quant : model.supportedQuantizations.includes("q4") ? "q4" : model.supportedQuantizations[0];
  const initial = { ...state, hardwareId: state.hardwareId ?? "mbp-m4-pro-20c-48", modelId, quant };
  return <GatedEvaluation key={JSON.stringify(initial)} initial={initial} />;
}
