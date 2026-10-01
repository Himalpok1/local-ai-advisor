import type { Recommendation } from "@/lib/schemas/results";
import { getUseCase } from "@/lib/workloads/profiles";
import { fmtGB, fmtSec, fmtTps } from "@/lib/format";

export type PickKind = "recommended" | "fastest" | "quality" | "technical";

export const PICK_TITLE: Record<PickKind, string> = {
  recommended: "Best fit for your workload",
  fastest: "Fast option",
  quality: "Quality-focused option",
  technical: "Technically possible",
};

/** One-sentence "why" for a pick, built from the engine's own numbers. */
export function pickReason(kind: PickKind, r: Recommendation): string {
  const phrase = getUseCase(r.useCase).phrase;
  const p = r.performance;
  const suit = r.dimensions.find((d) => d.key === "suitability");
  const speed = p ? fmtTps(p.perStreamGenerationTps, p.basis) : "";
  switch (kind) {
    case "recommended":
      return `${suit && suit.score >= 2.6 ? "Good capability for" : "Reasonable choice for"} ${phrase}, ${r.memory.headroomGB >= 1 ? `≈${fmtGB(r.memory.headroomGB)} memory headroom` : "tight memory"} and ${speed} with ${p ? fmtSec(p.stepLatencySec) : "—"} per turn.`;
    case "fastest":
      return `A lighter model that answers at ${speed}${r.tool.agenticLoopIntensity > 0.5 ? " — much better responsiveness across repeated agent loops" : ""}. Trades some capability for speed.`;
    case "quality":
      return `Higher model capability, but slower interactions (${speed}, ${p ? fmtSec(p.stepLatencySec) : "—"} per turn).`;
    case "technical":
      return `Fits, but not recommended for ${phrase}: ${(r.explanation.blockers[0] ?? r.explanation.warnings[0] ?? "").replace(/\.$/, "")}.`;
  }
}
