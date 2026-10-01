import "server-only";
import { cache } from "react";
import { loadHfModel } from "./fetch";
import { registerModel, HARDWARE_MAP } from "@/data";
import { bestQuantFor, candidateQuants } from "@/lib/recommendations";
import { COMFORT_LABEL } from "@/lib/schemas/results";
import type { WorkloadProfileInput } from "@/lib/schemas";

export const HF_DEFAULT_WORKLOAD: WorkloadProfileInput = { useCase: "coding-repo", toolId: "aider", repositorySize: "medium", priority: "balanced", devEnv: "normal" };

/** Share the same default workload and engine result across metadata, pages and images. */
export const hfSummary = cache(async (repo: string) => {
  const parsed = await loadHfModel(repo);
  registerModel(parsed.model);
  const hardware = HARDWARE_MAP.get("mbp-m4-pro-20c-48")!;
  const quants = candidateQuants(parsed.model.id);
  const rec = bestQuantFor({ hardware, modelId: parsed.model.id, workload: HF_DEFAULT_WORKLOAD }, quants.length ? quants : parsed.model.supportedQuantizations);
  return { parsed, rec, verdict: COMFORT_LABEL[rec.level] };
});
