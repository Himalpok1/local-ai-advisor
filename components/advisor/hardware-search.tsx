"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { selectableModels, modelGroup, QUANTIZATIONS, RUNTIMES, getModel, getTool } from "@/data";
import type { ComfortTarget, QuantId, WorkloadProfileInput } from "@/lib/schemas";
import { COMFORT_LABEL, type Recommendation } from "@/lib/schemas/results";
import { TARGET_LEVEL, recommendHardware } from "@/lib/recommendations";
import { encodeState, type AppState } from "@/lib/share";
import { useUrlSync } from "@/lib/use-url-state";
import { recHref } from "@/lib/links";
import { USE_CASES } from "@/lib/workloads/profiles";
import { CONTEXT_STEPS } from "@/lib/workloads/resolve";
import { fmtCtx, fmtGB, fmtParams, fmtSec, fmtTps, fmtUSD } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, NumberInput, OptionCard, Segmented, Select } from "@/components/ui/form";
import { Disclosure } from "@/components/ui/disclosure";
import { Badge } from "@/components/ui/badge";
import { ComfortBadge } from "./comfort";
import { ToolPicker, UseCasePicker, WorkloadDetails, workloadLabel } from "./workload-form";
import { hardwareSpecLine } from "./hardware-picker";
import { ShareButton } from "./share-button";

const VENDORS = [
  { value: "apple", label: "Apple" },
  { value: "nvidia", label: "NVIDIA" },
  { value: "amd", label: "AMD" },
  { value: "intel", label: "Intel" },
];

export function HardwareSearch({ initial }: { initial: AppState }) {
  const [state, setState] = useState<AppState>({ target: "comfortable", ...initial, modelId: initial.modelId ?? "qwen3-coder-30b-a3b" });
  const [vendors, setVendors] = useState<string[]>([]);
  const model = getModel(state.modelId!);
  const target: ComfortTarget = state.target ?? "comfortable";
  useUrlSync(encodeState(state));
  const setWorkload = (p: Partial<WorkloadProfileInput>) => setState((s) => ({ ...s, workload: { ...s.workload, ...p } }));

  const res = useMemo(
    () => recommendHardware({ modelId: model.id, quant: state.quant, workload: state.workload, runtimeId: state.runtimeId, target, budgetUSD: state.budget, vendors }),
    [model.id, state.quant, state.workload, state.runtimeId, target, state.budget, vendors],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <p className="text-sm font-medium text-primary">What hardware do I need?</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Hardware that delivers the experience you want — not just loads the model</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">Pick the model and describe the workload. We rate every machine in the database for that exact workload and group them by whether they meet your target.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-5 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1 · Model</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                ariaLabel="Model"
                value={model.id}
                onChange={(id) => setState((s) => ({ ...s, modelId: id, quant: undefined }))}
                options={selectableModels().map((m) => ({ value: m.id, label: `${m.name} (${fmtParams(m.parameterCount)}${m.denseOrMoE === "moe" ? `, ${fmtParams(m.activeParameterCount)} active` : ""})`, group: modelGroup(m) }))}
              />
              <Field label="Quantization">
                <Segmented
                  ariaLabel="Quantization"
                  size="sm"
                  value={state.quant ?? ("auto" as QuantId | "auto")}
                  onChange={(q) => setState((s) => ({ ...s, quant: q === "auto" ? undefined : (q as QuantId) }))}
                  options={[{ value: "auto" as QuantId | "auto", label: "Best" }, ...model.supportedQuantizations.map((q) => ({ value: q as QuantId | "auto", label: QUANTIZATIONS[q].label.split(" ")[0] }))]}
                />
              </Field>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2 · Use case</CardTitle>
            </CardHeader>
            <CardContent>
              <Disclosure summary={USE_CASES[state.workload.useCase].label} defaultOpen={false}>
                <UseCasePicker value={state.workload} onChange={setWorkload} />
              </Disclosure>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">3 · Tool & runtime</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Disclosure summary={`Tool: ${getTool(state.workload.toolId).name}`}>
                <ToolPicker value={state.workload} onChange={setWorkload} />
              </Disclosure>
              <Field label="Runtime">
                <Select ariaLabel="Runtime" value={state.runtimeId ?? "auto"} onChange={(r) => setState((s) => ({ ...s, runtimeId: r === "auto" ? undefined : r }))} options={[{ value: "auto", label: "Best available on each machine" }, ...RUNTIMES.map((r) => ({ value: r.id, label: r.name }))]} />
              </Field>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">4 · Workload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Context">
                <Segmented ariaLabel="Context" size="sm" value={state.workload.desiredContextWindow ?? 0} onChange={(c) => setWorkload({ desiredContextWindow: c || undefined })} options={[{ value: 0, label: "Auto" }, ...CONTEXT_STEPS.filter((c) => c >= 8192).map((c) => ({ value: c, label: fmtCtx(c) }))]} />
              </Field>
              <Disclosure summary="Project size, agent behaviour, other apps">
                <WorkloadDetails value={state.workload} onChange={setWorkload} />
              </Disclosure>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">5 · Desired experience</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {(["usable", "comfortable", "excellent"] as ComfortTarget[]).map((t) => (
                <OptionCard
                  key={t}
                  selected={target === t}
                  onClick={() => setState((s) => ({ ...s, target: t }))}
                  title={t === "usable" ? "Minimum usable" : COMFORT_LABEL[TARGET_LEVEL[t]]}
                  description={t === "usable" ? "At least “Acceptable”: works, with compromises." : t === "comfortable" ? "A good everyday experience for this workload." : "Substantial headroom and highly responsive."}
                />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">6 · Budget & vendors (optional)</CardTitle>
              <CardDescription>Prices are approximate launch prices for the whole system.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <NumberInput ariaLabel="Budget" value={state.budget} onChange={(v) => setState((s) => ({ ...s, budget: v }))} min={100} suffix="USD max" placeholder="No limit" />
              <div className="flex flex-wrap gap-2">
                {VENDORS.map((v) => (
                  <label key={v.value} className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={vendors.includes(v.value)} onChange={() => setVendors((vs) => (vs.includes(v.value) ? vs.filter((x) => x !== v.value) : [...vs, v.value]))} />
                    {v.label}
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
            <div className="text-sm">
              <p className="font-medium">
                {model.name} · {workloadLabel(state.workload)}
              </p>
              <p className="text-muted-foreground">
                Target: {target === "usable" ? "minimum usable" : COMFORT_LABEL[TARGET_LEVEL[target]].toLowerCase()} · {res.meetsTarget.length} machines meet it
                {res.overBudget ? ` · ${res.overBudget} hidden by budget` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ShareButton saveLabel={`Hardware for ${model.name}`} />
            </div>
          </div>
          <Group title={`Meets your ${target === "usable" ? "minimum" : COMFORT_LABEL[TARGET_LEVEL[target]].toLowerCase()} target`} description="Cheapest first." recs={res.meetsTarget} workload={state.workload} empty="No machine in the database meets this target. Try a smaller model, shorter context or a lighter workload." highlight />
          {target !== "usable" && <Group title="Meets the acceptable target" description="Usable, with noticeable compromises for this workload." recs={res.meetsAcceptable} workload={state.workload} />}
          <Group title="Can run, but below your target" description="The model loads, but the experience falls short for this workload." recs={res.belowTarget} workload={state.workload} collapsed />
          <Group title="Cannot run" description="Not enough usable memory, or no compatible runtime." recs={res.cannotRun} workload={state.workload} collapsed />
        </div>
      </div>
    </div>
  );
}

function Group({ title, description, recs, workload, empty, highlight, collapsed }: { title: string; description: string; recs: Recommendation[]; workload: WorkloadProfileInput; empty?: string; highlight?: boolean; collapsed?: boolean }) {
  const [limit, setLimit] = useState(collapsed ? 0 : 9);
  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {title} <span className="text-muted-foreground">({recs.length})</span>
        </h2>
        {collapsed && recs.length > 0 && (
          <button className="text-sm text-primary hover:underline" onClick={() => setLimit(limit ? 0 : 60)}>
            {limit ? "Hide" : "Show"}
          </button>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      {recs.length === 0 && empty && <p className="mt-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{empty}</p>}
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {recs.slice(0, limit).map((r) => (
          <HardwareResult key={r.id} rec={r} workload={workload} highlight={highlight} />
        ))}
      </div>
      {recs.length > limit && limit > 0 && (
        <button className="mt-3 text-sm text-primary hover:underline" onClick={() => setLimit(limit + 12)}>
          Show more ({recs.length - limit} remaining)
        </button>
      )}
    </section>
  );
}

function HardwareResult({ rec, workload, highlight }: { rec: Recommendation; workload: WorkloadProfileInput; highlight?: boolean }) {
  const p = rec.performance;
  const blocked = rec.level === "unsupported" || rec.level === "does-not-fit";
  return (
    <Link href={recHref(rec, workload)} className={cn("flex flex-col rounded-xl border bg-card p-4 transition hover:border-primary/50 hover:shadow-sm", highlight && "ring-1 ring-comfortable/30")}>
      <ComfortBadge level={rec.level} size="sm" className="self-start" />
      <p className="mt-2 font-medium leading-tight">{rec.hardware.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hardwareSpecLine(rec.hardware)}</p>
      {!blocked && p ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Quant / runtime</dt>
          <dd className="text-right">
            {rec.quant.label.split(" ")[0]} · {rec.runtime.name}
          </dd>
          <dt className="text-muted-foreground">Generation</dt>
          <dd className="text-right">{fmtTps(p.perStreamGenerationTps, p.basis)}</dd>
          <dt className="text-muted-foreground">Per step</dt>
          <dd className="text-right">{fmtSec(p.stepLatencySec)}</dd>
          <dt className="text-muted-foreground">Headroom</dt>
          <dd className="text-right">{fmtGB(rec.memory.headroomGB)}</dd>
        </dl>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">{rec.explanation.blockers[0]}</p>
      )}
      <div className="mt-3 flex items-center justify-between pt-1 text-xs">
        <span className="font-medium">{fmtUSD(rec.hardware.approxPriceUSD)}</span>
        {p && <Badge tone={p.basis === "measured" ? "good" : "neutral"}>{p.basis === "measured" ? "Benchmarked" : p.basis === "calibrated" ? "Calibrated" : "Estimated"}</Badge>}
      </div>
    </Link>
  );
}
