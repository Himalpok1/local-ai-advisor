"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { HARDWARE, selectableModels, modelGroup, QUANTIZATIONS, TOOLS, getModel } from "@/data";
import type { QuantId, WorkloadProfileInput } from "@/lib/schemas";
import type { Recommendation } from "@/lib/schemas/results";
import { bestQuantFor, evaluate } from "@/lib/recommendations";
import { encodeState, type AppState } from "@/lib/share";
import { useUrlSync } from "@/lib/use-url-state";
import { recHref } from "@/lib/links";
import { USE_CASE_LIST } from "@/lib/workloads/profiles";
import { CONTEXT_STEPS } from "@/lib/workloads/resolve";
import { fmtCtx, fmtGB, fmtMinutes, fmtSec, fmtTps, fmtUSD } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Segmented, Select } from "@/components/ui/form";
import { ComfortBadge, ConfidenceBadge } from "./comfort";
import { defaultsForUseCase, workloadLabel } from "./workload-form";
import { hardwareSpecLine } from "./hardware-picker";
import { ShareButton } from "./share-button";
import { HardwareComparisonChart } from "./performance-charts";
import { CompareNav } from "./compare-nav";
import { quantName } from "./recommendation-card";

const DEFAULT_HW = ["mini-m4-pro-20c-64", "mbp-m5-max-40c-128", "studio-m3-ultra-80c-256", "pc-rtx-5090-64", "strix-halo-395-128"];

/** Strengths/weaknesses relative to the other machines — no single "winner". */
function tradeoffs(r: Recommendation, all: Recommendation[]): { pros: string[]; cons: string[] } {
  const ok = all.filter((x) => x.performance);
  const pros: string[] = [];
  const cons: string[] = [];
  if (!r.performance) return { pros, cons: [r.explanation.blockers[0] ?? r.verdict] };
  const max = (f: (x: Recommendation) => number) => Math.max(...ok.map(f));
  const min = (f: (x: Recommendation) => number) => Math.min(...ok.map(f));
  const gen = (x: Recommendation) => x.performance!.perStreamGenerationTps;
  const pp = (x: Recommendation) => x.performance!.prefillTps;
  const head = (x: Recommendation) => x.memory.headroomGB;
  const price = (x: Recommendation) => x.hardware.approxPriceUSD ?? Infinity;
  if (ok.length > 1) {
    if (gen(r) === max(gen)) pros.push("Fastest generation");
    if (pp(r) === max(pp)) pros.push("Fastest prompt processing");
    if (head(r) === max(head)) pros.push("Most memory headroom (room for bigger models or longer context)");
    if (price(r) === min(price) && Number.isFinite(price(r))) pros.push("Lowest price of this set");
    if (gen(r) === min(gen)) cons.push("Slowest generation of this set");
    if (pp(r) === min(pp)) cons.push("Slowest prompt processing — long prompts wait longest");
    if (head(r) === min(head)) cons.push("Least headroom");
  }
  if (r.hardware.formFactor === "laptop" || r.hardware.formFactor === "fanless-laptop") pros.push("Portable");
  if (r.hardware.memoryArchitecture === "discrete" && r.memory.gpuOffloadFraction < 0.999) cons.push("Model spills out of VRAM into system RAM");
  if (r.hardware.memoryArchitecture === "discrete" && r.memory.gpuOffloadFraction >= 0.999 && (r.memory.vramHeadroomGB ?? 0) < 4) cons.push("Little VRAM left for larger models");
  if (r.confidence.level === "low") cons.push("Performance estimate has low confidence");
  return { pros, cons };
}

export function CompareHardware({ initial, initialHardware }: { initial: AppState; initialHardware: string[] }) {
  const [state, setState] = useState<AppState>({ modelId: "qwen3-coder-30b-a3b", ...initial });
  const [hwIds, setHwIds] = useState<string[]>(initialHardware.length ? initialHardware : DEFAULT_HW);
  const model = getModel(state.modelId!);
  const setWorkload = (p: Partial<WorkloadProfileInput>) => setState((s) => ({ ...s, workload: { ...s.workload, ...p } }));
  useUrlSync(`${encodeState(state)}&hws=${hwIds.join(",")}`);

  const recs = useMemo(
    () =>
      hwIds.map((id) => {
        const hardware = HARDWARE.find((h) => h.id === id)!;
        const base = { hardware, modelId: model.id, runtimeId: state.runtimeId, workload: state.workload };
        return state.quant && model.supportedQuantizations.includes(state.quant) ? evaluate({ ...base, quant: state.quant }) : bestQuantFor(base, model.supportedQuantizations.filter((q) => q !== "q3" && q !== "fp16"));
      }),
    [hwIds, model, state.quant, state.runtimeId, state.workload],
  );

  const rows: { label: string; render: (r: Recommendation) => React.ReactNode }[] = [
    { label: "Comfort rating", render: (r) => <ComfortBadge level={r.level} size="sm" /> },
    { label: "Quantization · runtime", render: (r) => `${quantName(r)} · ${r.runtime.name}` },
    { label: "Memory needed", render: (r) => (r.memory.inferencePeakGB ? fmtGB(r.memory.inferencePeakGB) : "—") },
    { label: "Headroom", render: (r) => (r.memory.fits ? fmtGB(r.memory.headroomGB) : "doesn't fit") },
    { label: "Generation", render: (r) => (r.performance ? fmtTps(r.performance.perStreamGenerationTps, r.performance.basis) : "—") },
    { label: "Prompt processing", render: (r) => (r.performance ? fmtTps(r.performance.prefillTps, r.performance.basis) : "—") },
    { label: "First prompt", render: (r) => (r.performance ? fmtSec(r.performance.coldPromptSec) : "—") },
    { label: "Per turn / step", render: (r) => (r.performance ? fmtSec(r.performance.stepLatencySec) : "—") },
    { label: "Typical task", render: (r) => (r.performance ? fmtMinutes(r.performance.taskMinutes) : "—") },
    { label: "Max practical context", render: (r) => (r.context.maxPractical ? fmtCtx(r.context.maxPractical) : "—") },
    { label: "Confidence", render: (r) => (r.performance ? <ConfidenceBadge level={r.confidence.level} /> : "—") },
    { label: "Approx. price", render: (r) => fmtUSD(r.hardware.approxPriceUSD) },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <CompareNav />
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-4xl">Compare hardware for your workload</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">The same model and the same workload on different machines. There is no universal winner — each column lists what that machine does better and worse for this job.</p>

      <Card className="mt-6">
        <CardContent className="grid gap-4 pt-5 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Model">
            <Select ariaLabel="Model" value={model.id} onChange={(id) => setState((s) => ({ ...s, modelId: id, quant: undefined }))} options={selectableModels().map((m) => ({ value: m.id, label: m.name, group: modelGroup(m) }))} />
          </Field>
          <Field label="Quantization">
            <Select ariaLabel="Quantization" value={state.quant ?? "best"} onChange={(q) => setState((s) => ({ ...s, quant: q === "best" ? undefined : (q as QuantId) }))} options={[{ value: "best", label: "Best per machine" }, ...model.supportedQuantizations.map((q) => ({ value: q, label: QUANTIZATIONS[q].label }))]} />
          </Field>
          <Field label="Use case">
            <Select ariaLabel="Use case" value={state.workload.useCase} onChange={(u) => setWorkload(defaultsForUseCase(u, state.workload))} options={USE_CASE_LIST.map((u) => ({ value: u.id, label: u.label, group: u.group }))} />
          </Field>
          <Field label="Tool">
            <Select ariaLabel="Tool" value={state.workload.toolId} onChange={(t) => setWorkload({ toolId: t })} options={TOOLS.map((t) => ({ value: t.id, label: t.name }))} />
          </Field>
          <Field label="Context" className="md:col-span-2">
            <Segmented ariaLabel="Context" size="sm" value={state.workload.desiredContextWindow ?? 0} onChange={(c) => setWorkload({ desiredContextWindow: c || undefined })} options={[{ value: 0, label: "Auto" }, ...CONTEXT_STEPS.filter((c) => c >= 8192).map((c) => ({ value: c, label: fmtCtx(c) }))]} />
          </Field>
          <Field label="Add a machine" className="md:col-span-1">
            <Select
              ariaLabel="Add hardware"
              value={""}
              onChange={(id) => id && !hwIds.includes(id) && hwIds.length < 6 && setHwIds([...hwIds, id])}
              options={[{ value: "", label: "Choose hardware…", disabled: true }, ...HARDWARE.filter((h) => !hwIds.includes(h.id)).map((h) => ({ value: h.id, label: h.name, group: h.device }))]}
            />
          </Field>
          <div className="flex flex-wrap items-end justify-end gap-2">
            <ShareButton saveLabel={`Hardware comparison for ${model.name}`} />
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-muted-foreground">
        {model.name} · {workloadLabel(state.workload)}
      </p>
      <HardwareComparisonChart recommendations={recs} />
      <div className="mt-2 overflow-x-auto rounded-xl border-2 bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b-2 bg-muted/40">
              <th className="sticky left-0 w-44 bg-muted/40 py-3 pl-4 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Machine</th>
              {recs.map((r) => (
                <th key={r.hardware.id} className="min-w-48 px-3 py-3 text-left align-top font-medium">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={recHref(r, state.workload)} className="hover:text-link hover:underline">
                      {r.hardware.name}
                    </Link>
                    <button aria-label={`Remove ${r.hardware.name}`} className="rounded p-0.5 text-muted-foreground hover:bg-muted" onClick={() => setHwIds(hwIds.filter((x) => x !== r.hardware.id))}>
                      <X className="size-3.5" />
                    </button>
                  </div>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{hardwareSpecLine(r.hardware)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b-2 last:border-0">
                <th scope="row" className="sticky left-0 bg-card py-2 pl-4 text-left font-normal text-muted-foreground">
                  {row.label}
                </th>
                {recs.map((r) => (
                  <td key={r.hardware.id} className="px-3 py-2 tabular-nums">
                    {row.render(r)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row" className="sticky left-0 bg-card py-3 pl-4 text-left align-top font-normal text-muted-foreground">
                Tradeoffs
              </th>
              {recs.map((r) => {
                const t = tradeoffs(r, recs);
                return (
                  <td key={r.hardware.id} className="px-3 py-3 align-top text-xs">
                    <ul className="space-y-1">
                      {t.pros.map((p) => (
                        <li key={p} className="text-comfortable">+ {p}</li>
                      ))}
                      {t.cons.map((c) => (
                        <li key={c} className="text-borderline">− {c}</li>
                      ))}
                    </ul>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
