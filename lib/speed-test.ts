import { QUANTIZATIONS } from "@/data/quantizations";
import type { Model } from "@/lib/schemas";
import { weightsGB } from "@/lib/memory";

/**
 * Generation ceiling at a measured bandwidth: every token reads the active
 * weights once, so tokens/s can't exceed bandwidth ÷ active weight bytes.
 * Real runtimes land below this line (attention, KV cache reads, overhead).
 */
export function ceilingTps(gbps: number, model: Model): number {
  const quant = QUANTIZATIONS[model.supportedQuantizations.includes("q4") ? "q4" : model.supportedQuantizations[0]];
  const totalBytes = weightsGB(model, quant, "gguf") * 1024 ** 3;
  const activeBytes = totalBytes * (model.activeParameterCount / model.parameterCount);
  return (gbps * 1e9) / activeBytes;
}

export type BandwidthVerdict = { tone: "good" | "warn" | "bad"; text: string };

/** Compare a browser measurement with the machine's published peak bandwidth. */
export function interpretBandwidth(measuredGbps: number, specGbps?: number): BandwidthVerdict | undefined {
  if (!specGbps) return undefined;
  const pct = Math.round((measuredGbps / specGbps) * 100);
  if (pct >= 55)
    return { tone: "good", text: `${pct}% of the ${specGbps} GB/s spec. Your GPU's memory is performing normally; native runtimes such as llama.cpp and MLX usually get closer to the spec than a browser can.` };
  if (pct >= 30)
    return { tone: "warn", text: `${pct}% of the ${specGbps} GB/s spec. That's lower than usual: check you're plugged in, not in Low Power Mode, and that other GPU-heavy apps are closed.` };
  return {
    tone: "bad",
    text: `Only ${pct}% of the ${specGbps} GB/s spec. The browser may be using a different (integrated) GPU, or the machine is power-limited. Results for this machine won't match our estimates until that's fixed.`,
  };
}
