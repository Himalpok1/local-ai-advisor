import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { HARDWARE_MAP, MODEL_MAP, QUANTIZATIONS, RUNTIME_MAP } from "@/data";
import { getDb } from "@/lib/db";
import { speedReports } from "@/lib/db/schema";
import { isAdmin } from "@/lib/me/server";
import { Card } from "@/components/ui/card";
import { ModerateButtons } from "@/components/community/moderate-buttons";

export const metadata: Metadata = { title: "Review speed reports", robots: { index: false } };

/** Admin-only queue of reports that failed the plausibility checks (ADMIN_EMAILS). */
export default async function ReviewPage() {
  if (!(await isAdmin())) notFound();
  const pending = await getDb().select().from(speedReports).where(eq(speedReports.status, "pending")).orderBy(desc(speedReports.createdAt)).limit(200);
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Reports held for review</h1>
      {pending.length === 0 ? (
        <p className="text-muted-foreground">Nothing to review.</p>
      ) : (
        <ul className="space-y-3">
          {pending.map((r) => (
            <li key={r.id}>
              <Card className="space-y-2 p-4">
                <p className="font-medium">
                  {MODEL_MAP.get(r.modelId)?.name ?? r.modelId} · {QUANTIZATIONS[r.quant as keyof typeof QUANTIZATIONS]?.label ?? r.quant} on{" "}
                  {HARDWARE_MAP.get(r.hardwareId)?.name ?? r.hardwareId}
                </p>
                <p className="text-sm text-muted-foreground">
                  {RUNTIME_MAP.get(r.runtimeId)?.name ?? r.runtimeId} ({r.backend}, {r.os}) · generation {r.generationTps} tok/s
                  {r.prefillTps ? ` · prompt ${r.prefillTps} tok/s` : ""} · pp{r.promptTokens} tg{r.outputTokens} at depth {r.contextTokens} ·{" "}
                  {r.createdAt.toISOString().slice(0, 10)}
                </p>
                {r.flagReason && <p className="text-sm text-borderline">{r.flagReason}</p>}
                {r.notes && <p className="text-sm">“{r.notes}”</p>}
                <ModerateButtons id={r.id} />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
