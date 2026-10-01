import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { HARDWARE_MAP, MODEL_MAP, QUANTIZATIONS, RUNTIME_MAP } from "@/data";
import { MIN_REPORTS, type CommunityStat } from "@/lib/community/reports";
import { communityStats } from "@/lib/community/server";
import { roundNice } from "@/lib/format";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Community speed reports for local AI",
  description: "Real tokens-per-second numbers people measured for open models on their own Macs and PCs, and how they calibrate our estimates.",
  alternates: { canonical: "/community" },
};

const MAX_ROWS = 300;

export default async function CommunityPage() {
  let stats: CommunityStat[] | undefined;
  try {
    stats = await communityStats();
  } catch {
    stats = undefined;
  }
  const rows = stats?.slice(0, MAX_ROWS);
  const people = stats ? stats.reduce((n, s) => n + s.count, 0) : 0;
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Community speeds</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Real speeds people measured on their own machines. When {MIN_REPORTS} or more people report the same chip, model, quantization and engine, the
            median joins our verified benchmarks and calibrates the estimates on the evaluation page.
          </p>
        </div>
        <Link href="/community/submit" className={buttonClass("primary", "md", "self-start sm:self-auto")}>
          <Plus className="size-4" aria-hidden /> Report your speed
        </Link>
      </header>

      {!rows ? (
        <p role="alert" className="rounded-xl border p-6 text-sm text-muted-foreground">
          Community data is unavailable right now. Try again shortly.
        </p>
      ) : rows.length === 0 ? (
        <Card className="space-y-2 p-8 text-center">
          <Users className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <p className="font-medium">No reports yet</p>
          <p className="text-sm text-muted-foreground">Be the first: run llama-bench or Ollama with --verbose and share your numbers.</p>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {people} report{people === 1 ? "" : "s"} across {rows.length} setup{rows.length === 1 ? "" : "s"}. Each person counts once per setup (their latest report).
          </p>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Computer</th>
                  <th className="px-4 py-2 font-medium">Model</th>
                  <th className="px-4 py-2 font-medium">Setup</th>
                  <th className="px-4 py-2 font-medium">Generation</th>
                  <th className="px-4 py-2 font-medium">Prompt processing</th>
                  <th className="px-4 py-2 font-medium">Reports</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((s) => {
                  const hw = HARDWARE_MAP.get(s.hardwareIds[0]);
                  const model = MODEL_MAP.get(s.modelId);
                  return (
                    <tr key={s.key}>
                      <td className="px-4 py-2.5">{hw?.name ?? s.chipKey}</td>
                      <td className="px-4 py-2.5 font-medium">
                        {hw && model ? (
                          <Link href={`/evaluate?hw=${hw.id}&m=${model.id}&q=${s.quant}`} className="hover:underline">
                            {model.name}
                          </Link>
                        ) : (
                          (model?.name ?? s.modelId)
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {QUANTIZATIONS[s.quant]?.label ?? s.quant} · {RUNTIME_MAP.get(s.runtimeId)?.name ?? s.runtimeId} · {s.backend.toUpperCase()}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">≈{roundNice(s.medianGenerationTps)} tok/s</td>
                      <td className="px-4 py-2.5 tabular-nums">{s.medianPrefillTps ? `≈${roundNice(s.medianPrefillTps)} tok/s` : "—"}</td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {s.count}
                        {s.count >= MIN_REPORTS && <span className="ml-1.5 rounded bg-comfortable/15 px-1.5 py-0.5 text-xs text-comfortable">calibrating</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
