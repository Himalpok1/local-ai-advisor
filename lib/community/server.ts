import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { speedReports } from "@/lib/db/schema";
import { aggregateReports, type CommunityStat } from "./reports";

const TTL_MS = 5 * 60 * 1000;
/** Newest approved reports read per query; far more than any chip has today. */
const ROW_LIMIT = 5000;
const memo = new Map<string, { at: number; value: CommunityStat[] }>();

/** Aggregated approved reports, for one chip or all chips. Cached briefly per process. */
export async function communityStats(chipKey?: string): Promise<CommunityStat[]> {
  const key = chipKey ?? "*";
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const approved = eq(speedReports.status, "approved");
  const rows = await getDb()
    .select({
      userId: speedReports.userId,
      hardwareId: speedReports.hardwareId,
      chipKey: speedReports.chipKey,
      modelId: speedReports.modelId,
      quant: speedReports.quant,
      runtimeId: speedReports.runtimeId,
      backend: speedReports.backend,
      contextTokens: speedReports.contextTokens,
      promptTokens: speedReports.promptTokens,
      outputTokens: speedReports.outputTokens,
      generationTps: speedReports.generationTps,
      prefillTps: speedReports.prefillTps,
      createdAt: speedReports.createdAt,
    })
    .from(speedReports)
    .where(chipKey ? and(approved, eq(speedReports.chipKey, chipKey)) : approved)
    .orderBy(desc(speedReports.createdAt))
    .limit(ROW_LIMIT);
  const value = aggregateReports(rows);
  if (memo.size > 500) memo.clear();
  memo.set(key, { at: Date.now(), value });
  return value;
}

/** Drop cached stats after a report is added or moderated. */
export function invalidateCommunityStats() {
  memo.clear();
}
