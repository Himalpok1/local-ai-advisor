import "server-only";
import { registerModel } from "@/data";
import { loadHfModel } from "@/lib/hf/fetch";
import { newOpenModels, type NewModel } from "@/lib/hf/new-models";
import { bestQuantFor, candidateQuants } from "@/lib/recommendations";
import { COMFORT_RANK, type ComfortLevel } from "@/lib/schemas/results";
import type { DecodedRig } from "./shared";

/** Releases this recent can raise an alert. */
const ALERT_WINDOW_DAYS = 45;
/** Without a "last seen" time, only the last two weeks count as unread. */
const FIRST_VISIT_DAYS = 14;
/** Alerts rate every release on each rig, so cap the work per request. */
const MAX_RIGS = 6;

export interface RigFit {
  rigId: string;
  rigName: string;
  level: ComfortLevel;
  quantLabel: string;
  tps?: number;
}

export interface ModelAlert {
  item: NewModel;
  /** Opens the model rated on the best-fitting rig, with that rig's workload. */
  href: string;
  unread: boolean;
  /** Rigs where the model is at least acceptable for the rig's own workload, best first. */
  fits: RigFit[];
}

/**
 * New open models that run acceptably or better on at least one of the user's
 * rigs, rated for the workload saved with each rig. Uses the same cached Hub
 * data as /new-models, so it only rates models that page could read.
 */
export async function modelAlerts(rigs: DecodedRig[], seenAt: Date | null, now = Date.now()): Promise<ModelAlert[]> {
  if (!rigs.length) return [];
  const items = (await newOpenModels()).filter((m) => m.ratings && now - Date.parse(m.createdAt) < ALERT_WINDOW_DAYS * 86_400_000);
  const since = seenAt?.getTime() ?? now - FIRST_VISIT_DAYS * 86_400_000;
  const alerts: ModelAlert[] = [];
  for (const item of items) {
    let modelId: string;
    try {
      // Cached by loadHfModel: /new-models already imported every rated item.
      modelId = registerModel((await loadHfModel(item.repo)).model).id;
    } catch {
      continue;
    }
    const quants = candidateQuants(modelId).filter((q) => q !== "fp16");
    const fits: RigFit[] = [];
    const queries = new Map<string, string>();
    for (const { rig, state, hardware } of rigs.slice(0, MAX_RIGS)) {
      const rec = bestQuantFor({ hardware, modelId, workload: state.workload, os: state.os }, quants.length ? quants : undefined);
      if (COMFORT_RANK[rec.level] < COMFORT_RANK.acceptable) continue;
      fits.push({ rigId: rig.id, rigName: rig.name, level: rec.level, quantLabel: rec.quant.label, tps: rec.performance?.perStreamGenerationTps });
      queries.set(rig.id, rig.query);
    }
    if (!fits.length) continue;
    fits.sort((a, b) => COMFORT_RANK[b.level] - COMFORT_RANK[a.level]);
    alerts.push({
      item,
      href: `/hugging-face?repo=${encodeURIComponent(item.repo)}&${queries.get(fits[0].rigId)}`,
      unread: Date.parse(item.createdAt) > since,
      fits,
    });
  }
  return alerts;
}
