import type { HardwareConfiguration } from "@/lib/schemas";

/** "Desktop PC · GeForce RTX 4090 · 64 GB RAM" → "geforce-rtx-4090-64gb-ram". Unique across the catalog (tested). */
export function hardwareSlug(h: Pick<HardwareConfiguration, "name">): string {
  return h.name
    .toLowerCase()
    .replace(/^desktop pc · /, "")
    .replace(/(\d+)\s*gb/g, "$1gb")
    .replace(/×/g, "x")
    .replace(/\+/g, "-plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
