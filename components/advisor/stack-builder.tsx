"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { selectableModels, modelGroup, QUANTIZATIONS, RUNTIMES, TOOLS, getModel } from "@/data";
import type { QuantId, WorkloadProfileInput } from "@/lib/schemas";
import { COMFORT_RANK } from "@/lib/schemas/results";
import { bestQuantFor, evaluate, recommendModels, stackFor } from "@/lib/recommendations";
import { encodeState, resolveHardware, type AppState } from "@/lib/share";
import { useUrlSync } from "@/lib/use-url-state";
import { recHref } from "@/lib/links";
import { setupSteps } from "@/lib/setup";
import { USE_CASE_LIST, USE_CASES } from "@/lib/workloads/profiles";
import { REPO_SIZES } from "@/lib/workloads/resolve";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/form";
import { Disclosure } from "@/components/ui/disclosure";
import { HardwarePicker } from "./hardware-picker";
import { WorkloadDetails, defaultsForUseCase } from "./workload-form";
import { StackDiagram } from "./stack-diagram";
import { ComfortBadge, ConfidenceBadge, COMFORT_STYLE } from "./comfort";
import { ExplanationPanel } from "./explanation";
import { ShareButton } from "./share-button";
import { quantName } from "./recommendation-card";

export function StackBuilder({ initial }: { initial: AppState }) {
  const [state, setState] = useState<AppState>({ hardwareId: "mini-m4-pro-20c-64", ...initial });
  const hardware = resolveHardware(state);
  useUrlSync(encodeState(state));
  const setWorkload = (p: Partial<WorkloadProfileInput>) => setState((s) => ({ ...s, workload: { ...s.workload, ...p } }));

  const rec = useMemo(() => {
    if (!hardware) return undefined;
    if (state.modelId) {
      const base = { hardware, modelId: state.modelId, runtimeId: state.runtimeId, os: state.os, workload: state.workload };
      return state.quant && getModel(state.modelId).supportedQuantizations.includes(state.quant) ? evaluate({ ...base, quant: state.quant }) : bestQuantFor(base);
    }
    const r = recommendModels({ hardware, workload: state.workload, os: state.os, runtimeId: state.runtimeId });
    return r.picks.recommended ?? r.all[0];
  }, [hardware, state.modelId, state.quant, state.runtimeId, state.os, state.workload]);

  const repo = state.workload.repositorySize;
  const scale = USE_CASES[state.workload.useCase].isCoding && repo ? `${REPO_SIZES[repo].label.toLowerCase()}-scale ` : "";
  const blocked = !rec || COMFORT_RANK[rec.level] < COMFORT_RANK["technically-runs"];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <div>
          <p className="text-sm font-medium text-link">Build my local AI stack</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-4xl">From hardware to coding agent, one layer at a time</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">Choose your machine, what you’ll do and which tool you use. We pick the runtime, model and API that make the whole chain comfortable — and explain why.</p>
        </div>
        <div className="overflow-hidden rounded-2xl border-2 border-ink bg-muted">
          <Image
            src="/brand/illustration-local-stack.svg"
            width={1200}
            height={500}
            alt="Five connected parts of a local AI stack: hardware, runtime, model, local API, and AI tool"
            className="h-auto w-full"
            unoptimized
          />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hardware</CardTitle>
            </CardHeader>
            <CardContent>
              <HardwarePicker value={{ hardwareId: state.hardwareId, custom: state.custom, os: state.os }} onChange={(v) => setState((s) => ({ ...s, ...v }))} workload={state.workload} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workload & tool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Use case">
                  <Select ariaLabel="Use case" value={state.workload.useCase} onChange={(u) => setWorkload(defaultsForUseCase(u, state.workload))} options={USE_CASE_LIST.map((u) => ({ value: u.id, label: u.label, group: u.group }))} />
                </Field>
                <Field label="AI tool">
                  <Select ariaLabel="Tool" value={state.workload.toolId} onChange={(t) => setWorkload({ toolId: t })} options={TOOLS.map((t) => ({ value: t.id, label: t.name }))} />
                </Field>
              </div>
              <Disclosure summary="Project size, agents, other apps">
                <WorkloadDetails value={state.workload} onChange={setWorkload} />
              </Disclosure>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Override layers (optional)</CardTitle>
              <CardDescription>Leave on Auto to let the engine choose.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <Field label="Model">
                <Select ariaLabel="Model" value={state.modelId ?? "auto"} onChange={(m) => setState((s) => ({ ...s, modelId: m === "auto" ? undefined : m, quant: undefined }))} options={[{ value: "auto", label: "Auto (best fit)" }, ...selectableModels().map((m) => ({ value: m.id, label: m.name, group: modelGroup(m) }))]} />
              </Field>
              <Field label="Quantization">
                <Select
                  ariaLabel="Quantization"
                  value={state.quant ?? "auto"}
                  onChange={(q) => setState((s) => ({ ...s, quant: q === "auto" ? undefined : (q as QuantId) }))}
                  options={[{ value: "auto", label: "Auto" }, ...(state.modelId ? getModel(state.modelId).supportedQuantizations : []).map((q) => ({ value: q, label: QUANTIZATIONS[q].label }))]}
                />
              </Field>
              <Field label="Runtime">
                <Select ariaLabel="Runtime" value={state.runtimeId ?? "auto"} onChange={(r) => setState((s) => ({ ...s, runtimeId: r === "auto" ? undefined : r }))} options={[{ value: "auto", label: "Auto" }, ...RUNTIMES.map((r) => ({ value: r.id, label: r.name }))]} />
              </Field>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          {rec && (
            <>
              <Card className="overflow-hidden">
                <div className={cn("border-b-2 border-ink p-5", COMFORT_STYLE[rec.level].chip)}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <ComfortBadge level={rec.level} className="bg-card text-foreground" />
                    <ConfidenceBadge level={rec.confidence.level} />
                  </div>
                  <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
                    {blocked ? rec.headline : `${rec.headline.replace(` for ${USE_CASES[rec.useCase].phrase}`, "")} for ${scale}${USE_CASES[rec.useCase].phrase}`}
                  </h2>
                  <p className="mt-2 text-sm">{rec.verdict}</p>
                </div>
                <CardContent className="pt-5">
                  <StackDiagram layers={stackFor(rec)} order="bottom-up" />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ShareButton saveLabel={`Stack: ${rec.model.name} on ${rec.hardware.name}`} />
                    <Link href={recHref(rec, state.workload, state.custom, !!state.runtimeId)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border-2 bg-card px-3 text-sm font-medium hover:bg-muted">
                      Full analysis & what-if <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
              {!blocked && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Set it up</CardTitle>
                    <CardDescription>
                      {rec.model.name} — {quantName(rec)} on {rec.runtime.name}, used from {rec.tool.name}. Replace placeholders like &lt;model-name&gt; with the name your runtime shows.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {setupSteps(rec).map((s, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{s.title}</p>
                            {s.detail && <p className="text-muted-foreground">{s.detail}</p>}
                            {s.code && <pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-2 font-mono text-xs">{s.code}</pre>}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Why this stack?</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExplanationPanel rec={rec} showLists={false} />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
