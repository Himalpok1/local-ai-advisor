/** Rig and saved-item helpers shared by the server actions and the client. */
import { decodeState, encodeState, resolveHardware, type AppState } from "@/lib/share";
import type { HardwareConfiguration } from "@/lib/schemas";

export const MAX_RIGS = 20;
export const MAX_SAVED_ITEMS = 200;

/** Pages whose state lives in the query string and can be bookmarked. */
export const SAVEABLE_PATHS = ["/evaluate", "/check", "/stack", "/compare/models", "/compare/hardware", "/hardware-for-model", "/hugging-face"] as const;

export interface RigDto {
  id: string;
  name: string;
  query: string;
  isDefault: boolean;
}

export interface SavedItemDto {
  id: string;
  label: string;
  path: string;
  query: string;
  createdAt: string;
}

/** Keep only the fields a rig owns (hardware, OS, workload). Returns undefined for unknown hardware. */
export function rigQuery(state: Pick<AppState, "hardwareId" | "custom" | "os" | "workload">): string | undefined {
  if (!resolveHardware(state)) return undefined;
  return encodeState({ hardwareId: state.hardwareId, custom: state.custom, os: state.os, workload: state.workload });
}

export interface DecodedRig {
  rig: RigDto;
  state: AppState;
  hardware: HardwareConfiguration;
}

/** Re-validate a stored rig; rigs whose hardware left the catalog are dropped. */
export function decodeRig(rig: RigDto): DecodedRig | undefined {
  const state = decodeState(new URLSearchParams(rig.query));
  const hardware = resolveHardware(state);
  return hardware ? { rig, state, hardware } : undefined;
}

/** Normalize a bookmarked query string (drops anything that isn't key=value pairs). */
export function normalizeQuery(query: string): string {
  return new URLSearchParams(query.startsWith("?") ? query.slice(1) : query).toString();
}

export const savedHref = (item: Pick<SavedItemDto, "path" | "query">) => (item.query ? `${item.path}?${item.query}` : item.path);
