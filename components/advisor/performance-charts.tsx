"use client";

import { useState } from "react";
import type { ContextPoint, Recommendation } from "@/lib/schemas/results";
import { fmtCtx, fmtTps } from "@/lib/format";
import { Segmented } from "@/components/ui/form";

type Metric = "generation" | "prompt" | "headroom";
const metrics = [
  { value: "generation" as const, label: "Generation" },
  { value: "prompt" as const, label: "First prompt" },
  { value: "headroom" as const, label: "Memory headroom" },
];
const units: Record<Metric, string> = { generation: "tok/s", prompt: "seconds", headroom: "GB" };
function value(p: ContextPoint, metric: Metric) {
  return metric === "generation" ? p.generationTps : metric === "prompt" ? p.coldPromptSec : p.headroomGB;
}

/** Uses only contextSweep results; unsupported/non-fitting points break the line. */
export function ContextChart({ points, current }: { points: ContextPoint[]; current: number }) {
  const [metric, setMetric] = useState<Metric>("generation");
  const valid = points.map((p) => p.supported && p.fits && p.level !== "unsupported" && Number.isFinite(value(p, metric)));
  const vals = points.filter((_, i) => valid[i]).map((p) => value(p, metric));
  const low = Math.min(0, ...vals);
  const high = Math.max(1, ...vals);
  const x = (i: number, width: number) => (width < 500 ? 45 : 70) + i * ((width < 500 ? width - 70 : width - 120) / Math.max(1, points.length - 1));
  const y = (v: number) => 220 - (v - low) / (high - low) * 180;
  return (
    <figure className="mb-6 space-y-3">
      <Segmented ariaLabel="Context chart metric" value={metric} onChange={setMetric} options={metrics} size="sm" />
      {[360, 680].map((width) => (
      <svg key={width} viewBox={`0 0 ${width} 280`} role="img" aria-label={`${metrics.find((m) => m.value === metric)!.label} prediction versus context size, in ${units[metric]}. Exact values and unavailable points are in the table below.`} className={`w-full rounded-lg border-2 bg-muted/20 ${width < 500 ? "sm:hidden" : "hidden sm:block"}`}>
        {[0, 0.5, 1].map((t) => {
          const v = low + t * (high - low);
          return <g key={t}><line x1={x(0, width)} x2={x(points.length - 1, width)} y1={y(v)} y2={y(v)} stroke="currentColor" opacity="0.15" /><text x={x(0, width) - 10} y={y(v) + 4} textAnchor="end" fontSize="13" fill="currentColor">{v.toFixed(v < 10 ? 1 : 0)}</text></g>;
        })}
        <text x={x(0, width)} y="24" fontSize="13" fill="currentColor">{units[metric]} · predicted</text>
        {points.map((p, i) => <g key={p.context}>
          {i > 0 && valid[i] && valid[i - 1] && <line x1={x(i - 1, width)} x2={x(i, width)} y1={y(value(points[i - 1], metric))} y2={y(value(p, metric))} stroke="var(--link)" strokeWidth="3" />}
          {valid[i] ? <circle cx={x(i, width)} cy={y(value(p, metric))} r={p.context === current ? 7 : 5} fill="var(--link)" stroke="currentColor" strokeWidth={p.context === current ? 2 : 0}><title>{`${fmtCtx(p.context)}: ${value(p, metric).toFixed(1)} ${units[metric]} · ${p.basis ?? "estimated"} prediction`}</title></circle> : <text x={x(i, width)} y="216" textAnchor="middle" fontSize="17" fill="currentColor"><title>{`${fmtCtx(p.context)}: ${p.supported ? "does not fit or runtime unsupported" : "beyond model limit"}`}</title>×</text>}
          <text x={x(i, width)} y="247" textAnchor="middle" fontSize="13" fill="currentColor">{fmtCtx(p.context)}</text>
        </g>)}
        <text x={width / 2} y="272" textAnchor="middle" fontSize="13" fill="currentColor">{width < 500 ? "Context tokens (doubling steps)" : "Context window (tokens; doubled at each step)"}</text>
      </svg>
      ))}
      <figcaption className="text-xs text-muted-foreground">Predictions for the selected model, runtime and workload. Generation is at 95% of the effective context window. × marks unavailable points; lines stop there. Speed ranges in the table are heuristic, not validated confidence intervals. Memory headroom and prompt latency are modeled estimates.</figcaption>
    </figure>
  );
}

export function HardwareComparisonChart({ recommendations }: { recommendations: Recommendation[] }) {
  const [metric, setMetric] = useState<"generation" | "prefill" | "headroom">("generation");
  const amount = (r: Recommendation) => metric === "generation" ? r.performance?.perStreamGenerationTps : metric === "prefill" ? r.performance?.prefillTps : r.memory.headroomGB;
  const max = Math.max(1, ...recommendations.map((r) => amount(r) ?? 0));
  return <figure className="my-5 rounded-xl border-2 bg-card p-4 sm:p-5">
    <h2 className="mb-3 font-semibold">Compare performance and memory</h2>
    <Segmented ariaLabel="Hardware comparison chart metric" value={metric} onChange={setMetric} options={[{ value: "generation", label: "Generation" }, { value: "prefill", label: "Prompt processing" }, { value: "headroom", label: "Memory headroom" }]} size="sm" />
    <ul className="mt-4 space-y-4" aria-label="Hardware chart values">
      {recommendations.map((r) => {
        const v = amount(r);
        const available = !!r.performance && r.memory.fits && Number.isFinite(v);
        return <li key={r.hardware.id}>
          <div className="mb-1 flex flex-wrap justify-between gap-x-4 text-sm"><span>{r.hardware.name}</span><strong>{available ? metric === "headroom" ? `${v!.toFixed(1)} GB` : fmtTps(v!, r.performance!.basis) : "Unavailable"}</strong></div>
          <div className="h-4 overflow-hidden rounded border bg-muted" aria-hidden="true"><div className="h-full bg-link" style={{ width: available ? `${Math.max(0, v!) / max * 100}%` : "0%" }} /></div>
          <p className="mt-1 text-xs text-muted-foreground">{available ? `${r.performance!.basis} prediction` : r.verdict}</p>
        </li>;
      })}
    </ul>
    <figcaption className="mt-4 text-xs text-muted-foreground">Bar lengths show predicted central values; speed labels show heuristic ±15% ranges with benchmarks or ±25% without. These are not measured speeds or validated confidence intervals. The detailed comparison table follows.</figcaption>
  </figure>;
}
