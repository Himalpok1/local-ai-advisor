import type { Metadata } from "next";
import { EvaluationView } from "@/components/advisor/evaluation-view";
import { decodeState } from "@/lib/share";
import { getModel } from "@/data";

export const metadata: Metadata = {
  title: "Detailed evaluation",
  description: "Will this model + runtime + tool + hardware combination be comfortable for your workload? Full breakdown with what-if controls.",
};

export default async function EvaluatePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const state = decodeState(await searchParams);
  const modelId = state.modelId ?? "qwen3-coder-30b-a3b";
  const model = getModel(modelId);
  const quant = state.quant && model.supportedQuantizations.includes(state.quant) ? state.quant : model.supportedQuantizations.includes("q4") ? "q4" : model.supportedQuantizations[0];
  const initial = { ...state, hardwareId: state.hardwareId ?? "mbp-m4-pro-20c-48", modelId, quant };
  return <EvaluationView key={JSON.stringify(initial)} initial={initial} />;
}
