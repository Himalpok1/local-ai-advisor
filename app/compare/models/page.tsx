import type { Metadata } from "next";
import { CompareModels, type ModelPick } from "@/components/advisor/compare-models";
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
    const [id, q] = entry.split(":");
    if (!MODEL_MAP.has(id) || MODEL_MAP.get(id)!.referenceOnly || picks.some((p) => p.id === id)) continue;
    const quant = QuantIdSchema.safeParse(q);
    picks.push({ id, quant: quant.success && MODEL_MAP.get(id)!.supportedQuantizations.includes(quant.data) ? quant.data : undefined });
  }
  return <CompareModels initial={{ ...state, modelId: undefined, quant: undefined }} initialModels={picks.slice(0, 8)} />;
}
