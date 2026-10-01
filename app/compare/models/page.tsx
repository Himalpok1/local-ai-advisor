import type { Metadata } from "next";
import type { ModelPick } from "@/components/advisor/compare-models";
import { GatedCompareModels } from "@/components/advisor/gated-views";
import { decodeState } from "@/lib/share";
import { MODEL_MAP } from "@/data";
import { QuantIdSchema } from "@/lib/schemas";

export const metadata: Metadata = {
  title: "Compare models for my hardware",
  description: "Compare local AI models on your own machine for your own workload: memory, headroom, generation, prompt processing, context and comfort rating.",
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const state = decodeState(params);
  const raw = [typeof params.models === "string" ? params.models : "", typeof params.m === "string" ? params.m : ""].join(",");
  const picks: ModelPick[] = [];
  for (const entry of raw.split(",").filter(Boolean)) {
    // "id" or "id:quant" — hf ids contain a colon themselves ("hf:owner/name").
    const cut = entry.lastIndexOf(":");
    const tail = cut > 0 ? entry.slice(cut + 1) : "";
    const [id, q] = QuantIdSchema.safeParse(tail).success ? [entry.slice(0, cut), tail] : [entry, undefined];
    if (picks.some((p) => p.id === id)) continue;
    const quant = QuantIdSchema.safeParse(q);
    if (/^hf:[A-Za-z0-9][\w.-]{0,95}\/[\w.-]{1,96}$/.test(id)) {
      picks.push({ id, quant: quant.success ? quant.data : undefined });
      continue;
    }
    if (!MODEL_MAP.has(id) || MODEL_MAP.get(id)!.referenceOnly) continue;
    picks.push({ id, quant: quant.success && MODEL_MAP.get(id)!.supportedQuantizations.includes(quant.data) ? quant.data : undefined });
  }
  return <GatedCompareModels initial={{ ...state, modelId: undefined, quant: undefined }} initialModels={picks.slice(0, 8)} />;
}
