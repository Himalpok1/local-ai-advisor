"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, RotateCcw, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { selectableModels, modelGroup, BENCHMARKS, QUANTIZATIONS, RUNTIMES, TOOLS, getModel, getTool } from "@/data";
import type { HardwareConfiguration, QuantId, WorkloadProfileInput } from "@/lib/schemas";
import { COMFORT_LABEL, COMFORT_RANK, type Recommendation } from "@/lib/schemas/results";
import { contextSweep, describeChange, evaluate, rankRuntimes, stackFor, fitAcrossUseCases, whatIf, type EvaluateInput } from "@/lib/recommendations";
import { encodeState, resolveHardware, type AppState } from "@/lib/share";
import { useUrlSync } from "@/lib/use-url-state";
import { USE_CASE_LIST, USE_CASES } from "@/lib/workloads/profiles";
import { CONTEXT_STEPS, REPO_SIZES } from "@/lib/workloads/resolve";
import { DEV_ENV_LIST } from "@/lib/workloads/dev-env";
import { defaultOs, osLabel, SUPPORT_LABEL } from "@/lib/compatibility";
import { fmtCtx, fmtGB, fmtMinutes, fmtSec, fmtTps } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Segmented, Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { ComfortBadge, ComfortScale, ConfidenceBadge, COMFORT_STYLE } from "./comfort";
import { DimensionGauges } from "./gauges";
import { ExplanationPanel } from "./explanation";
import { MemoryBreakdownView } from "./memory-bar";
import { ContextTable } from "./context-table";
import { StackDiagram } from "./stack-diagram";
import { ShareButton } from "./share-button";
import { HardwarePicker, hardwareSpecLine } from "./hardware-picker";
import { workloadLabel } from "./workload-form";
import { quantName } from "./recommendation-card";
import { CommunitySpeedsCard, useCommunitySpeeds } from "@/components/community/community-speeds";

const MAIN_GAUGES = ["memory", "generation", "prefill", "context", "tool", "suitability"] as const;
const EXTRA_GAUGES = ["runtime", "concurrency", "stability"] as const;

export function EvaluationView({ initial }: { initial: Required<Pick<AppState, "modelId" | "quant">> & AppState }) {
  const [state, setState] = useState<AppState>(initial);
  const [editHardware, setEditHardware] = useState(false);
  const [lastChange, setLastChange] = useState<{ from: Recommendation; change: string } | null>(null);

  const hardware = resolveHardware(state) as HardwareConfiguration;
  const model = getModel(state.modelId!);
  const quant: QuantId = model.supportedQuantizations.includes(state.quant!) ? state.quant! : model.supportedQuantizations.includes("q4") ? "q4" : model.supportedQuantizations[0];
  const community = useCommunitySpeeds(state.hardwareId);
  // Setups that enough people measured join the verified benchmarks (curated rows still win direct matches).
  const benchmarks = useMemo(() => (community.benchmarks.length ? [...BENCHMARKS, ...community.benchmarks] : undefined), [community.benchmarks]);
  const input: EvaluateInput = useMemo(
    () => ({ hardware, modelId: model.id, quant, runtimeId: state.runtimeId, os: state.os, workload: state.workload, benchmarks }),
    [hardware, model.id, quant, state.runtimeId, state.os, state.workload, benchmarks],
  );
  const rec = useMemo(() => evaluate(input), [input]);
  const suggestions = useMemo(() => whatIf(input, rec), [input, rec]);
  const sweep = useMemo(() => contextSweep(input), [input]);
  const fit = useMemo(() => fitAcrossUseCases(input), [input]);
  useUrlSync(encodeState({ ...state, quant }));

  const update = (patch: Partial<AppState>, workloadPatch?: Partial<WorkloadProfileInput>, change?: string) => {
    setLastChange({ from: rec, change: change ?? "Settings changed" });
    setState((s) => ({ ...s, ...patch, workload: { ...s.workload, ...workloadPatch } }));
  };

  const os = state.os && hardware.os.includes(state.os) ? state.os : defaultOs(hardware);
  const runtimeOptions = useMemo(() => {
    const ok = new Set(rankRuntimes(hardware, os, model, quant, getTool(state.workload.toolId)).map((r) => r.runtime.id));
    return [
      { value: "auto", label: `Auto — best for this setup (${rec.runtime.name})` },
      ...RUNTIMES.map((r) => ({ value: r.id, label: ok.has(r.id) ? r.name : `${r.name} (not compatible here)` })),
    ];
  }, [hardware, os, model, quant, state.workload.toolId, rec.runtime.name]);

  const style = COMFORT_STYLE[rec.level];
  const blocked = rec.level === "unsupported" || rec.level === "does-not-fit";
  const ctxNow = rec.context.effective;
  const p = rec.performance;
  const changed = lastChange && (lastChange.from.level !== rec.level || Math.abs(lastChange.from.composite - rec.composite) > 0.05);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Outcome */}
      <section className={cn("rounded-2xl border p-6 sm:p-8", style.bg, style.border)}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-muted-foreground">Can I use this comfortably?</p>
            <h1 className={cn("mt-1 text-3xl font-semibold tracking-tight sm:text-4xl", style.text)}>{rec.headline}</h1>
            <p className="mt-3 text-base sm:text-lg">{rec.verdict}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ComfortBadge level={rec.level} size="lg" />
            {!blocked && <ComfortScale level={rec.level} />}
            <ConfidenceBadge level={rec.confidence.level} />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          <Chip label="Hardware" value={hardware.name} />
          <Chip label="Model" value={`${model.name} — ${quantName(rec)}`} />
          <Chip label="Runtime" value={`${rec.runtime.name}${state.runtimeId ? "" : " (auto)"}`} />
          <Chip label="Tool" value={rec.tool.name} />
          <Chip label="Workload" value={workloadLabel(state.workload)} />
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          <Tier ok={rec.tiers.canLoad} label="Can load" hint="Fits into usable memory" />
          <Tier ok={rec.tiers.canRun} label="Can run" hint="Runtime, hardware and tool work together" />
          <Tier ok={rec.tiers.canRunUsably} label="Can run usably" hint="Fast enough for basic interaction" />
          <Tier ok={rec.tiers.canRunComfortably} label={`Comfortable for ${USE_CASES[state.workload.useCase].phrase}`} hint="The rating that matters" strong />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <ShareButton saveLabel={`${model.name} on ${hardware.name}`} />
          <Link href={`/stack?${encodeState({ ...state, quant })}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-card px-3 text-sm font-medium hover:bg-muted">
            View as stack <ArrowRight className="size-4" />
          </Link>
          <Link href={`/check?${encodeState({ hardwareId: state.hardwareId, custom: state.custom, os: state.os, workload: state.workload })}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-card px-3 text-sm font-medium hover:bg-muted">
            Other models for this workload <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {changed && lastChange && (
        <div role="status" className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm shadow-sm">
          <Sparkles className="size-4 text-primary" />
          <span className="font-medium">{lastChange.change}:</span>
          <ComfortBadge level={lastChange.from.level} size="sm" />
          <ArrowRight className="size-4 text-muted-foreground" />
          <ComfortBadge level={rec.level} size="sm" />
          <span className="text-muted-foreground">{describeChange(lastChange.from, rec, COMFORT_RANK[rec.level] >= COMFORT_RANK[lastChange.from.level])}</span>
          <button className="ml-auto text-muted-foreground hover:text-foreground" aria-label="Dismiss" onClick={() => setLastChange(null)}>
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-8">
          {!blocked && (
            <section aria-labelledby="gauges">
              <h2 id="gauges" className="mb-3 text-lg font-semibold">
                Experience breakdown
              </h2>
              <DimensionGauges dims={rec.dimensions} keys={[...MAIN_GAUGES]} />
              <Disclosure summary="Runtime, concurrency and sustained-use factors" className="mt-3">
                <DimensionGauges dims={rec.dimensions} keys={[...EXTRA_GAUGES]} />
              </Disclosure>
            </section>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{blocked ? "Why this doesn't work" : `Why “${COMFORT_LABEL[rec.level]}”?`}</CardTitle>
            </CardHeader>
            <CardContent>
              <ExplanationPanel rec={rec} />
              {suggestions.some((s) => COMFORT_RANK[s.to] > COMFORT_RANK[rec.level]) && (
                <div className="mt-5 rounded-lg border border-primary/30 bg-accent/40 p-4 text-sm">
                  <p className="font-semibold">What would move this up?</p>
                  <ul className="mt-2 space-y-1">
                    {suggestions
                      .filter((s) => COMFORT_RANK[s.to] > COMFORT_RANK[rec.level])
                      .slice(0, 4)
                      .map((s) => (
                        <li key={s.id}>
                          Changing to <span className="font-medium">{s.label}</span> would move this setup into the <span className="font-medium">{COMFORT_LABEL[s.to]}</span> category. <span className="text-muted-foreground">{s.reason}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Memory</CardTitle>
              <CardDescription>
                Not all installed memory is available: the OS, your other apps and the tool come first.{" "}
                {hardware.memoryArchitecture === "discrete" ? "VRAM and system RAM are separate pools — spilled layers run at system-RAM speed." : hardware.memoryArchitecture === "unified" ? "Unified memory is one pool shared by CPU and GPU." : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemoryBreakdownView m={rec.memory} />
              {rec.memory.notes.length > 0 && (
                <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                  {rec.memory.notes.map((n) => (
                    <li key={n}>• {n}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {p && (
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  Performance estimate
                  <Badge tone={p.basis === "measured" ? "good" : p.basis === "calibrated" ? "primary" : "neutral"}>
                    {p.basis === "measured" ? "Based on verified benchmark" : p.basis === "calibrated" ? "Calibrated estimate" : "Estimated performance"}
                  </Badge>
                </CardTitle>
                <CardDescription>{p.basisExplanation} Ranges reflect estimation uncertainty.</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                  <Stat k="Generation, short context" v={fmtTps(p.generationTpsShort, p.basis)} />
                  <Stat k="Generation, typical context" v={fmtTps(p.generationTps, p.basis)} />
                  <Stat k="Generation, full context" v={fmtTps(p.generationTpsFullContext, p.basis)} />
                  {(state.workload.numberOfAgents ?? 1) * (state.workload.concurrentRequests ?? 1) > 1 && (
                    <>
                      <Stat k="Per stream (with concurrency)" v={fmtTps(p.perStreamGenerationTps, p.basis)} />
                      <Stat k="Aggregate throughput" v={fmtTps(p.aggregateGenerationTps, p.basis)} />
                    </>
                  )}
                  <Stat k="Prompt processing (prefill)" v={fmtTps(p.prefillTps, p.basis)} />
                  <Stat k="First (cold) prompt" v={fmtSec(p.coldPromptSec)} />
                  <Stat k="Time to first token (follow-up)" v={fmtSec(p.timeToFirstTokenSec)} />
                  <Stat k="Per turn / agent step" v={fmtSec(p.stepLatencySec)} />
                  <Stat k="Typical task" v={fmtMinutes(p.taskMinutes)} />
                  <Stat k="Model load time" v={fmtSec(p.loadTimeSec)} />
                  <Stat k="Backend" v={p.backend.toUpperCase()} />
                </dl>
                <p className="mt-4 text-xs text-muted-foreground">
                  Tokens/sec alone doesn’t describe the experience: an agent repeatedly ingests large prompts, so prompt processing and per-step latency matter as much as generation speed.
                </p>
              </CardContent>
            </Card>
          )}

          {state.hardwareId !== "custom" && !model.id.startsWith("hf:") && rec.tiers.canLoad && (
            <CommunitySpeedsCard
              stats={community.stats}
              modelId={model.id}
              chipName={hardware.name}
              reportHref={`/community/submit?${encodeState({ hardwareId: state.hardwareId, os, modelId: model.id, quant, runtimeId: rec.runtime.id, workload: state.workload })}`}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>What happens at different context sizes?</CardTitle>
              <CardDescription>Same hardware, model and workload — only the context window changes. Larger contexts grow the KV cache and slow generation.</CardDescription>
            </CardHeader>
            <CardContent>
              <ContextTable points={sweep} current={ctxNow} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Same setup, other workloads</CardTitle>
              <CardDescription>The same model on the same machine earns different ratings depending on what you do with it.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2">
                {fit.map((f) => (
                  <li key={f.label} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
                    <span>{f.label}</span>
                    <ComfortBadge level={f.level} size="sm" />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {!blocked && (
            <Card>
              <CardHeader>
                <CardTitle>Your local AI stack</CardTitle>
                <CardDescription>The tool never runs the model itself — it talks to a runtime through an API.</CardDescription>
              </CardHeader>
              <CardContent>
                <StackDiagram layers={stackFor(rec)} order="top-down" className="max-w-xl" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Connection: {rec.connection.path} — <span className="font-medium">{SUPPORT_LABEL[rec.connection.level]}</span>
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* What-if controls */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="size-4" /> What if…?
              </CardTitle>
              <CardDescription>Change anything — the rating recalculates instantly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Hardware">
                <button type="button" onClick={() => setEditHardware(!editHardware)} className="rounded-lg border bg-card px-3 py-2 text-left text-sm hover:bg-muted">
                  <span className="block font-medium">{hardware.name}</span>
                  <span className="block text-xs text-muted-foreground">{hardwareSpecLine(hardware)}</span>
                </button>
              </Field>
              <Field label="Model">
                <Select
                  ariaLabel="Model"
                  value={model.id}
                  onChange={(id) => {
                    const m = getModel(id);
                    update({ modelId: id, quant: m.supportedQuantizations.includes(quant) ? quant : m.supportedQuantizations.includes("q4") ? "q4" : m.supportedQuantizations[0] }, undefined, `Model → ${m.name}`);
                  }}
                  options={selectableModels().map((m) => ({ value: m.id, label: m.name, group: modelGroup(m) }))}
                />
              </Field>
              <Field label="Quantization">
                <Segmented ariaLabel="Quantization" size="sm" value={quant} onChange={(q) => update({ quant: q }, undefined, `${QUANTIZATIONS[quant].label} → ${QUANTIZATIONS[q].label}`)} options={model.supportedQuantizations.map((q) => ({ value: q, label: QUANTIZATIONS[q].label.split(" ")[0], hint: QUANTIZATIONS[q].description }))} />
              </Field>
              <Field label="Context window">
                <Segmented
                  ariaLabel="Context"
                  size="sm"
                  value={state.workload.desiredContextWindow ?? 0}
                  onChange={(c) => update({}, { desiredContextWindow: c || undefined }, `${fmtCtx(ctxNow)} → ${c ? fmtCtx(c) : "auto"} context`)}
                  options={[{ value: 0, label: "Auto" }, ...CONTEXT_STEPS.filter((c) => c >= 8192).map((c) => ({ value: c, label: fmtCtx(c) }))]}
                />
              </Field>
              <Field label="Use case">
                <Select ariaLabel="Use case" value={state.workload.useCase} onChange={(u) => update({}, { useCase: u, desiredContextWindow: state.workload.desiredContextWindow }, `Use case → ${USE_CASES[u].label}`)} options={USE_CASE_LIST.map((u) => ({ value: u.id, label: u.label, group: u.group }))} />
              </Field>
              <Field label="Tool">
                <Select ariaLabel="Tool" value={state.workload.toolId} onChange={(t) => update({}, { toolId: t }, `Tool → ${getTool(t).name}`)} options={TOOLS.map((t) => ({ value: t.id, label: t.name }))} />
              </Field>
              <Field label="Runtime">
                <Select ariaLabel="Runtime" value={state.runtimeId ?? "auto"} onChange={(r) => update({ runtimeId: r === "auto" ? undefined : r }, undefined, `Runtime → ${r === "auto" ? "auto" : RUNTIMES.find((x) => x.id === r)!.name}`)} options={runtimeOptions} />
              </Field>
              {hardware.os.length > 1 && (
                <Field label="Operating system">
                  <Segmented ariaLabel="OS" size="sm" value={os} onChange={(o) => update({ os: o }, undefined, `OS → ${osLabel(o)}`)} options={hardware.os.map((o) => ({ value: o, label: osLabel(o) }))} />
                </Field>
              )}
              {USE_CASES[state.workload.useCase].isCoding && (
                <Field label="Repository size">
                  <Select ariaLabel="Repository size" value={state.workload.repositorySize ?? "medium"} onChange={(r) => update({}, { repositorySize: r }, `Repository → ${REPO_SIZES[r].label}`)} options={Object.entries(REPO_SIZES).map(([k, v]) => ({ value: k as keyof typeof REPO_SIZES, label: `${v.label} (${v.lines})` }))} />
                </Field>
              )}
              <Field label="Other apps running">
                <Select ariaLabel="Development environment" value={state.workload.devEnv ?? "normal"} onChange={(d) => update({}, { devEnv: d }, `Dev environment → ${d}`)} options={DEV_ENV_LIST.filter((d) => d.preset !== "custom").map((d) => ({ value: d.preset, label: `${d.label} (${d.reserveGB} GB)` }))} />
              </Field>
              <Field label="Concurrent agents">
                <Segmented ariaLabel="Agents" size="sm" value={state.workload.numberOfAgents ?? 1} onChange={(a) => update({}, { numberOfAgents: a }, `${state.workload.numberOfAgents ?? 1} → ${a} agents`)} options={[1, 2, 3, 4].map((a) => ({ value: a, label: String(a) }))} />
              </Field>
              <Field label="KV cache">
                <Segmented ariaLabel="KV cache" size="sm" value={state.workload.kvCacheType ?? "f16"} onChange={(k) => update({}, { kvCacheType: k }, `KV cache → ${k.toUpperCase()}`)} options={[{ value: "f16", label: "FP16" }, { value: "q8", label: "Q8" }, { value: "q4", label: "Q4" }]} />
              </Field>
              <Button variant="ghost" size="sm" onClick={() => update({ ...initial }, initial.workload, "Reset")}>
                <RotateCcw className="size-4" /> Reset to original
              </Button>
            </CardContent>
          </Card>

          {suggestions.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Suggested changes</CardTitle>
                <CardDescription>Each tried on its own, all else equal.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestions.slice(0, 7).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      const patch = s.patch as { workload?: Partial<WorkloadProfileInput>; quant?: QuantId; modelId?: string; runtimeId?: string };
                      update({ ...(patch.quant && { quant: patch.quant }), ...(patch.modelId && { modelId: patch.modelId }), ...(patch.runtimeId && { runtimeId: patch.runtimeId }) }, patch.workload, s.change);
                    }}
                    className="w-full rounded-lg border p-3 text-left text-sm transition hover:border-primary/50 hover:bg-muted/50"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-medium">{s.change}</span>
                      <span className="flex items-center gap-1">
                        <span className={cn("size-2 rounded-full", COMFORT_STYLE[s.from].dot)} />
                        <ArrowRight className="size-3 text-muted-foreground" />
                        <span className={cn("text-xs font-semibold", COMFORT_STYLE[s.to].text)}>{COMFORT_LABEL[s.to]}</span>
                      </span>
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">{s.reason}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      {editHardware && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Change hardware" onClick={() => setEditHardware(false)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Change hardware</h2>
              <button aria-label="Close" onClick={() => setEditHardware(false)}>
                <X className="size-5" />
              </button>
            </div>
            <HardwarePicker value={{ hardwareId: state.hardwareId, custom: state.custom, os: state.os }} onChange={(v) => update({ hardwareId: v.hardwareId, custom: v.custom, os: v.os }, undefined, "Hardware changed")} workload={state.workload} />
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setEditHardware(false)}>Done</Button>
            </div>
          </div>
        </div>
      )}
      <p className="mt-10 text-xs text-muted-foreground">
        Estimates use memory {fmtGB(rec.memory.installedGB)} {hardware.memoryArchitecture} · data last verified 2026-09-30. See <Link className="underline" href="/methodology">methodology</Link>.
      </p>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </span>
  );
}

function Tier({ ok, label, hint, strong }: { ok: boolean; label: string; hint: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border bg-card px-3 py-2", strong && "ring-1 ring-primary/40")}>
      {ok ? <Check className="mt-0.5 size-4 shrink-0 text-comfortable" /> : <X className="mt-0.5 size-4 shrink-0 text-technical" />}
      <span>
        <span className={cn("block text-sm", strong ? "font-semibold" : "font-medium")}>{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed py-1">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium tabular-nums">{v}</dd>
    </div>
  );
}
