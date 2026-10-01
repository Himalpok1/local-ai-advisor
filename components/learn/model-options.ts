import { MODELS } from "@/data";
import { fmtParams } from "@/lib/format";
import type { Model } from "@/lib/schemas";

export function modelLabel(m: Model): string {
  const moe = m.denseOrMoE === "moe" ? ` · MoE, ${fmtParams(m.activeParameterCount)} active` : "";
  return `${m.name} (${fmtParams(m.parameterCount)}${moe})`;
}

/** Select options for all user-facing models, grouped by organization. */
export const MODEL_OPTIONS = MODELS.map((m) => ({ value: m.id, label: modelLabel(m), group: m.organization }));
