"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { HARDWARE_MAP, QUANTIZATIONS, RUNTIME_MAP } from "@/data";
import type { Benchmark } from "@/lib/schemas";
import { MIN_REPORTS, type CommunityStat } from "@/lib/community/reports";
import { roundNice } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";

export interface CommunitySpeeds {
  stats: CommunityStat[];
  benchmarks: Benchmark[];
}

const EMPTY: CommunitySpeeds = { stats: [], benchmarks: [] };
const cache = new Map<string, CommunitySpeeds>();

/** Community measurements for a catalog machine's chip (custom hardware has none). */
export function useCommunitySpeeds(hardwareId: string | undefined): CommunitySpeeds {
  const valid = !!hardwareId && HARDWARE_MAP.has(hardwareId);
  const [loaded, setLoaded] = useState<{ id: string; value: CommunitySpeeds }>();
  useEffect(() => {
    if (!valid || cache.has(hardwareId)) return;
    let live = true;
    fetch(`/api/community/speeds?hw=${encodeURIComponent(hardwareId)}`)
      .then((r) => (r.ok ? r.json() : EMPTY))
      .then((value: CommunitySpeeds) => {
        cache.set(hardwareId, value);
        if (live) setLoaded({ id: hardwareId, value });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [hardwareId, valid]);
  if (!valid) return EMPTY;
  return cache.get(hardwareId) ?? (loaded?.id === hardwareId ? loaded.value : EMPTY);
}

/** What people measured for this model on this chip, plus the call to report your own. */
export function CommunitySpeedsCard({ stats, modelId, chipName, reportHref }: { stats: CommunityStat[]; modelId: string; chipName: string; reportHref: string }) {
  const rows = stats.filter((s) => s.modelId === modelId);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-4 text-primary" aria-hidden /> Community measurements
        </CardTitle>
        <CardDescription>
          {rows.length
            ? `Real speeds people measured for this model on ${chipName}. Once ${MIN_REPORTS} people report the same setup, the median calibrates the estimate above.`
            : `Nobody has reported this model on ${chipName} yet. Measured it yourself? Your numbers improve the estimates for everyone with this chip.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.length > 0 && (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Setup</th>
                  <th className="px-3 py-2 font-medium">Generation</th>
                  <th className="px-3 py-2 font-medium">Prompt processing</th>
                  <th className="px-3 py-2 font-medium">Reports</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((s) => (
                  <tr key={s.key}>
                    <td className="px-3 py-2">
                      {QUANTIZATIONS[s.quant]?.label ?? s.quant} · {RUNTIME_MAP.get(s.runtimeId)?.name ?? s.runtimeId}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      ≈{roundNice(s.medianGenerationTps)} tok/s
                      {s.count > 1 && s.maxGenerationTps > s.minGenerationTps && (
                        <span className="block text-xs text-muted-foreground">
                          {roundNice(s.minGenerationTps)}–{roundNice(s.maxGenerationTps)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{s.medianPrefillTps ? `≈${roundNice(s.medianPrefillTps)} tok/s` : "—"}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {s.count}
                      {s.count >= MIN_REPORTS && <span className="ml-1.5 rounded bg-comfortable/15 px-1.5 py-0.5 text-xs text-comfortable">calibrating</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Link href={reportHref} className={buttonClass("outline", "sm")}>
          Report your speed
        </Link>
      </CardContent>
    </Card>
  );
}
