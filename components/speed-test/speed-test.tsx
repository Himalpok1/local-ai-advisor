"use client";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight, Gauge, Loader2, Play, TriangleAlert } from "lucide-react";
import { MODEL_MAP } from "@/data";
import type { HardwareConfiguration } from "@/lib/schemas";
import { BenchmarkError, measureBandwidth, webgpuAvailable, type BandwidthResult } from "@/lib/webgpu-bandwidth";
import { ceilingTps, interpretBandwidth } from "@/lib/speed-test";
import { CHAT, canIRunHref, hardwareHref, rate } from "@/lib/can-i-run";
import { fmtTps, roundNice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button, buttonClass } from "@/components/ui/button";
import { ComfortBadge } from "@/components/advisor/comfort";
import { DetectHardware } from "@/components/advisor/detect-hardware";

/** Small → large, dense and MoE, so the ceiling column shows the spread. */
const SAMPLE_MODELS = ["qwen3.5-4b", "qwen3.5-9b", "gpt-oss-20b", "qwen3.6-35b-a3b", "qwen3.6-27b", "llama-3.3-70b"];

const bandwidthOf = (h: HardwareConfiguration) => (h.gpu ? h.gpu.bandwidthGBs : h.systemRamBandwidthGBs);

const noSubscribe = () => () => {};

export function SpeedTest() {
  const [hw, setHw] = useState<HardwareConfiguration>();
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BandwidthResult>();
  const [error, setError] = useState<string>();
  // The server can't know, so it (and hydration) assume support; the real answer follows on the client.
  const hasWebgpu = useSyncExternalStore(noSubscribe, webgpuAvailable, () => true);

  const start = async () => {
    setState("running");
    setProgress(0);
    setError(undefined);
    try {
      setResult(await measureBandwidth(setProgress));
      setState("done");
    } catch (e) {
      setError(e instanceof BenchmarkError ? e.message : "The benchmark failed. Close other GPU-heavy tabs and try again.");
      setState("error");
    }
  };

  const verdict = result && hw ? interpretBandwidth(result.gbps, bandwidthOf(hw)) : undefined;
  const models = useMemo(() => SAMPLE_MODELS.map((id) => MODEL_MAP.get(id)).filter((m) => !!m), []);
  const ratings = useMemo(() => (hw ? new Map(models.map((m) => [m.id, rate(m, hw, CHAT)])) : undefined), [hw, models]);

  return (
    <div className="space-y-6">
      <Card className="space-y-3 p-5 sm:p-6">
        <h2 className="font-semibold">1. Your computer (optional)</h2>
        <p className="text-sm text-muted-foreground">Tell us what it is to compare the result with its published memory bandwidth.</p>
        <DetectHardware onPick={setHw} selectedId={hw?.id} />
        {hw && (
          <p className="text-sm">
            Comparing with <strong>{hw.name}</strong> ({bandwidthOf(hw)} GB/s spec).
          </p>
        )}
      </Card>

      <Card className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">2. Measure memory bandwidth</h2>
            <p className="text-sm text-muted-foreground">Takes about 5 seconds and uses up to 512 MB of GPU memory. Nothing is downloaded or uploaded.</p>
          </div>
          <Button onClick={start} disabled={state === "running"}>
            {state === "running" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Play className="size-4" aria-hidden />}
            {state === "done" ? "Run again" : "Start test"}
          </Button>
        </div>

        {state === "running" && (
          <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(4, progress * 100)}%` }} />
          </div>
        )}

        {state === "error" && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-borderline/10 p-3 text-sm text-borderline">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {error}
          </p>
        )}
        {state === "idle" && !hasWebgpu && (
          <p className="text-sm text-muted-foreground">This browser doesn&apos;t expose WebGPU, so the test can&apos;t run here. Recent Chrome, Edge and Safari support it.</p>
        )}

        {result && state === "done" && (
          <div className="space-y-3" aria-live="polite">
            <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
              <p>
                <span className="text-4xl font-semibold tabular-nums">{roundNice(result.gbps)}</span>
                <span className="ml-1 text-lg text-muted-foreground">GB/s</span>
              </p>
              <p className="pb-1 text-sm text-muted-foreground">
                best run {roundNice(result.bestGbps)} GB/s · {result.bufferMB} MB buffer
                {result.adapter.vendor ? ` · ${result.adapter.vendor}${result.adapter.architecture ? ` ${result.adapter.architecture}` : ""}` : ""}
              </p>
            </div>
            {verdict && (
              <p
                className={cn(
                  "rounded-lg p-3 text-sm",
                  verdict.tone === "good" ? "bg-comfortable/10" : verdict.tone === "warn" ? "bg-acceptable/15" : "bg-borderline/10 text-borderline",
                )}
              >
                {verdict.text}
              </p>
            )}
          </div>
        )}
      </Card>

      {result && state === "done" && (
        <Card className="space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="font-semibold">3. What that means for local models</h2>
            <p className="text-sm text-muted-foreground">
              Each new token reads the model&apos;s active weights once, so <strong>bandwidth ÷ active weight size</strong> is a hard ceiling on generation
              speed at 4-bit. Real speeds land below it.
              {hw ? " The engine column is our estimate for your machine with a native runtime." : " Pick your computer above to add our engine's estimate."}
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border-2">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Model</th>
                  <th className="px-4 py-2 font-medium">Ceiling at {roundNice(result.gbps)} GB/s</th>
                  {hw && <th className="px-4 py-2 font-medium">Engine estimate for chat</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {models.map((m) => {
                  const r = ratings?.get(m.id);
                  return (
                    <tr key={m.id}>
                      <td className="px-4 py-2.5">
                        {hw ? (
                          <Link href={canIRunHref(m, hw)} className="font-medium hover:underline">
                            {m.name}
                          </Link>
                        ) : (
                          <span className="font-medium">{m.name}</span>
                        )}
                        {m.denseOrMoE === "moe" && <span className="block text-xs text-muted-foreground">MoE: reads {m.activeParameterCount}B per token</span>}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">≤ {roundNice(ceilingTps(result.gbps, m))} tok/s</td>
                      {hw && (
                        <td className="px-4 py-2.5">
                          {r && (
                            <span className="flex flex-wrap items-center gap-2">
                              <ComfortBadge level={r.level} size="sm" />
                              {r.memory.fits && r.performance ? <span className="tabular-nums text-muted-foreground">{fmtTps(r.performance.perStreamGenerationTps, r.performance.basis)}</span> : null}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-2">
            {hw ? (
              <>
                <Link href={hardwareHref(hw)} className={buttonClass("primary", "sm")}>
                  Everything {hw.name} can run <ArrowRight className="size-3.5" aria-hidden />
                </Link>
                <Link href={`/check?hw=${hw.id}`} className={buttonClass("outline", "sm")}>
                  <Gauge className="size-3.5" aria-hidden /> Full check for my workload
                </Link>
              </>
            ) : (
              <Link href="/check" className={buttonClass("primary", "sm")}>
                Check my computer <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
