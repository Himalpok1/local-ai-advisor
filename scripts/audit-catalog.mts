/** Offline, deterministic review queue. Never mutates the catalog or verification dates. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { z } from "zod";
import { HARDWARE } from "../data/hardware";
import { BENCHMARKS } from "../data/benchmarks";
import { catalogAudit } from "../lib/catalog-audit";

const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const date = process.argv.find((s) => s.startsWith("--date="))?.slice(7) ?? today;
if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error("Pass a real --date=YYYY-MM-DD");
const file = process.argv.find((s) => s.startsWith("--discovery="))?.slice(12) ?? "research/catalog/device-discovery-2026-10-10.json";
const discovery = z.object({ source: z.string().url(), attribution: z.string(), devices: z.array(z.object({ id: z.string(), name: z.string(), family: z.string(), laptop: z.boolean() })) }).parse(JSON.parse(readFileSync(file, "utf8")));
const report = catalogAudit(HARDWARE, BENCHMARKS, discovery.devices, date);
const unmatched = report.discoveries.filter((d) => !d.possibleMatches.length);
const row = (s: string) => s.replaceAll("|", "\\|").replaceAll("\n", " ");
const body = [
  `# Catalog maintenance queue — ${date}`, "", `${report.configurations} configurations / ${report.chipFamilies} chip families; ${report.benchmarkedChipFamilies} chip families have published benchmark records.`,
  `${report.sourceReviewedConfigurations} configurations have field-level evidence. This is not a claim of empirical inference validation.`, "",
  `Discovery: ${discovery.source}`, discovery.attribution, "",
  `${unmatched.length} of ${report.discoveries.length} discovery names have no automatic name match. Possible matches require manual review of chip bin, VRAM and laptop/desktop identity; neither status establishes correctness.`, "",
  "## Devices to research", "", "| Discovery ID | Device | Family | Next step |", "| --- | --- | --- | --- |",
  ...unmatched.map((d) => `| ${row(d.id)} | ${row(d.name)} | ${row(d.family)} | Find primary specs, exact memory variant and supported runtime before adding |`), "",
  "## Possible matches to review", "", "| Discovery ID | Catalog IDs |", "| --- | --- |",
  ...report.discoveries.filter((d) => d.possibleMatches.length).map((d) => `| ${row(d.id)} | ${d.possibleMatches.join(", ")} |`), "",
  "## Existing evidence gaps", "", "| Catalog ID | Review item |", "| --- | --- |",
  ...report.issues.map((i) => `| ${i.id} | ${i.issue} |`), "",
  "Do not auto-import candidate specifications or copy grades. Do not update lastVerified unless the linked source was actually checked. See docs/catalog-maintenance.md.", "",
].join("\n");
mkdirSync("research/catalog", { recursive: true });
writeFileSync(`research/catalog/catalog-audit-${date}.md`, body);
writeFileSync(`research/catalog/catalog-audit-${date}.json`, JSON.stringify(report, null, 2) + "\n");
console.log(`Wrote research/catalog/catalog-audit-${date}.{md,json}: ${unmatched.length} discovery candidates; ${report.issues.length} evidence review items.`);
