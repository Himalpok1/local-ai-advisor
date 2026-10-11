import type { Benchmark, HardwareConfiguration } from "./schemas";

export interface DiscoveryDevice { id: string; name: string; family: string; laptop: boolean }
const normalized = (s: string) => s.toLowerCase().replace(/\b(nvidia|amd|intel|geforce|radeon|graphics|generation|gpu|founders|edition)\b/g, "").replace(/[^a-z0-9]/g, "");

/** Name matches are suggestions only: memory variants and laptop power limits need review. */
export function catalogAudit(hardware: HardwareConfiguration[], benchmarks: Benchmark[], devices: DiscoveryDevice[], asOf: string) {
  const chipCount = new Set(hardware.map((h) => h.chipKey)).size;
  const verifiedChips = new Set(benchmarks.filter((b) => b.verified).map((b) => b.chipKey));
  const discoveries = devices.map((d) => ({ ...d,
    possibleMatches: hardware.filter((h) => {
      const laptop = h.formFactor === "laptop" || h.formFactor === "fanless-laptop";
      // Apple's catalog describes concrete machines; discovery names often describe generic chips.
      if (d.family === "apple") return h.vendor === "apple" && h.chipKey.replace(/^apple-/, "").startsWith(`${d.id}-`);
      return laptop === d.laptop && normalized(h.gpu?.name ?? h.cpu.name) === normalized(d.name);
    }).map((h) => h.id),
  }));
  return {
    asOf, configurations: hardware.length, chipFamilies: chipCount,
    sourceReviewedConfigurations: hardware.filter((h) => h.evidence?.length).length,
    benchmarkedChipFamilies: [...new Set(hardware.filter((h) => verifiedChips.has(h.chipKey)).map((h) => h.chipKey))].length,
    discoveries,
    issues: hardware.flatMap((h) => {
      const out: { id: string; issue: string }[] = [];
      if (!h.evidence?.length) out.push({ id: h.id, issue: "Missing field-level evidence (legacy record)" });
      if (h.approxPriceUSD && !h.evidence?.some((e) => e.fields.includes("approxPriceUSD") && e.kind === "vendor-spec")) out.push({ id: h.id, issue: "Indicative price lacks dated field-level evidence" });
      const age = (Date.parse(asOf) - Date.parse(h.source.lastVerified)) / 86400000;
      if (!Number.isFinite(age) || age < 0) out.push({ id: h.id, issue: "Invalid or future verification date" });
      else if (age > 90) out.push({ id: h.id, issue: "Source older than 90 days; review before refreshing date" });
      if (h.source.confidence === "low" || /assum|partially|secondary|widely cited/i.test(h.source.note ?? "")) out.push({ id: h.id, issue: "Source explicitly requires review" });
      return out;
    }),
  };
}
