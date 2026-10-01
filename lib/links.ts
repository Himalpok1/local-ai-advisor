import type { OS, QuantId, WorkloadProfileInput } from "@/lib/schemas";
import { encodeState, type AppState } from "@/lib/share";
import type { Recommendation } from "@/lib/schemas/results";

export function evaluateHref(args: { hardwareId: string; custom?: AppState["custom"]; modelId: string; quant: QuantId; runtimeId?: string; os?: OS; workload: WorkloadProfileInput }) {
  return `/evaluate?${encodeState({ hardwareId: args.hardwareId, custom: args.custom, modelId: args.modelId, quant: args.quant, runtimeId: args.runtimeId, os: args.os, workload: args.workload })}`;
}

export function recHref(rec: Recommendation, workload: WorkloadProfileInput, custom?: AppState["custom"], pinRuntime = false) {
  return evaluateHref({ hardwareId: rec.hardware.id, custom, modelId: rec.model.id, quant: rec.quant.id, runtimeId: pinRuntime ? rec.runtime.id : undefined, workload });
}
