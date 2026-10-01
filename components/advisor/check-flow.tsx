"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Pencil, Scale } from "lucide-react";
import type { HardwareConfiguration, WorkloadProfileInput } from "@/lib/schemas";
import { COMFORT_LABEL, COMFORT_RANK, type ComfortLevel } from "@/lib/schemas/results";
import { recommendModels } from "@/lib/recommendations";
import { encodeState, resolveHardware, type AppState } from "@/lib/share";
import { useUrlSync } from "@/lib/use-url-state";
import { recHref } from "@/lib/links";
import { USE_CASES } from "@/lib/workloads/profiles";
import { CONTEXT_STEPS } from "@/lib/workloads/resolve";
import { DEV_ENV_LIST } from "@/lib/workloads/dev-env";
import { getTool } from "@/data";
import { fmtCtx } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button, LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Segmented, Select } from "@/components/ui/form";
import { HardwarePicker, hardwareSpecLine } from "./hardware-picker";
import { AdvancedSettings, PriorityPicker, ToolPicker, UseCasePicker, WorkloadDetails, workloadLabel } from "./workload-form";
import { RecommendationCard } from "./recommendation-card";
import { ModelsTable } from "./models-table";
import { ComfortBadge, COMFORT_STYLE } from "./comfort";
import { PICK_TITLE, pickReason } from "./pick-reasons";
import { ShareButton } from "./share-button";

const STEPS = [
  { id: "hardware", title: "What computer do you own?", short: "Hardware" },
  { id: "usecase", title: "What do you want AI to do?", short: "Use case" },
  { id: "tool", title: "Which application or tool will you use?", short: "Tool" },
  { id: "workload", title: "How demanding is your workload?", short: "Workload" },
  { id: "priority", title: "What matters more?", short: "Priority" },
  { id: "advanced", title: "Advanced settings (optional)", short: "Advanced" },
] as const;

export function CheckFlow({ initial, startWithResults }: { initial: AppState; startWithResults: boolean }) {
  const [state, setState] = useState<AppState>({ ...initial, hardwareId: initial.hardwareId ?? "mbp-m4-pro-20c-24" });
  const [step, setStep] = useState<number>(startWithResults ? STEPS.length : 0);
  const mode = state.mode ?? "simple";
  const visibleSteps = mode === "advanced" ? STEPS : STEPS.filter((s) => s.id !== "advanced");
  const showResults = step >= visibleSteps.length;
  const hardware = resolveHardware(state);

  useUrlSync(showResults ? encodeState(state) : "");

  const setWorkload = (p: Partial<WorkloadProfileInput>) => setState((s) => ({ ...s, workload: { ...s.workload, ...p } }));
  const canNext = visibleSteps[step]?.id !== "hardware" || !!hardware;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {!showResults ? (
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-primary">What can my computer comfortably run?</p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{visibleSteps[step].title}</h1>
            </div>
            <Segmented
              ariaLabel="Mode"
              size="sm"
              value={mode}
              onChange={(m) => setState((s) => ({ ...s, mode: m }))}
              options={[
                { value: "simple", label: "Simple" },
                { value: "advanced", label: "Advanced" },
              ]}
            />
          </div>
          <ol className="mt-6 flex gap-1.5" aria-label="Progress">
            {visibleSteps.map((s, i) => (
              <li key={s.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => (i <= step || hardware) && setStep(i)}
                  className={cn("h-1.5 w-full rounded-full transition", i <= step ? "bg-primary" : "bg-border")}
                  aria-label={`Step ${i + 1}: ${s.short}`}
                  aria-current={i === step ? "step" : undefined}
                />
                <span className={cn("mt-1.5 hidden text-xs sm:block", i === step ? "font-medium text-foreground" : "text-muted-foreground")}>
                  {i + 1}. {s.short}
                </span>
              </li>
            ))}
          </ol>

          <Card className="mt-6 p-5 sm:p-6">
            {visibleSteps[step].id === "hardware" && (
              <HardwarePicker value={{ hardwareId: state.hardwareId, custom: state.custom, os: state.os }} onChange={(v) => setState((s) => ({ ...s, ...v }))} workload={state.workload} applyDefaultRig={!initial.hardwareId} />
            )}
            {visibleSteps[step].id === "usecase" && <UseCasePicker value={state.workload} onChange={setWorkload} />}
            {visibleSteps[step].id === "tool" && (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  The tool changes the recommendation: an agent like Claude Code or OpenCode makes dozens of sequential model calls with large prompts, while a chat app makes one call every few minutes. Tools never run the model — they connect to a runtime through an API.
                </p>
                <ToolPicker value={state.workload} onChange={setWorkload} />
              </>
            )}
            {visibleSteps[step].id === "workload" && <WorkloadDetails value={state.workload} onChange={setWorkload} simple={mode === "simple"} />}
            {visibleSteps[step].id === "priority" && (
              <>
                <p className="mb-4 text-sm text-muted-foreground">We won’t simply pick the largest model that fits — a smaller, faster model often gives a better experience, especially for agents.</p>
                <PriorityPicker value={state.workload} onChange={setWorkload} />
              </>
            )}
            {visibleSteps[step].id === "advanced" && <AdvancedSettings value={state.workload} onChange={setWorkload} />}
          </Card>

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            <div className="flex gap-2">
              {step >= 1 && step < visibleSteps.length - 1 && hardware && (
                <Button variant="outline" onClick={() => setStep(visibleSteps.length)}>
                  Skip to results
                </Button>
              )}
              <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
                {step === visibleSteps.length - 1 ? "Show recommendations" : "Next"} <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : hardware ? (
        <Results state={state} hardware={hardware} setState={setState} edit={(id) => setStep(visibleSteps.findIndex((s) => s.id === id))} />
      ) : null}
    </div>
  );
}

function Results({
  state,
  hardware,
  setState,
  edit,
}: {
  state: AppState;
  hardware: HardwareConfiguration;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  edit: (step: (typeof STEPS)[number]["id"]) => void;
}) {
  const res = useMemo(() => recommendModels({ hardware, workload: state.workload, os: state.os, runtimeId: state.runtimeId }), [hardware, state.workload, state.os, state.runtimeId]);
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const phrase = USE_CASES[state.workload.useCase].phrase;
  const tool = getTool(state.workload.toolId);
  const setWorkload = (p: Partial<WorkloadProfileInput>) => setState((s) => ({ ...s, workload: { ...s.workload, ...p } }));
  const href = (r: (typeof res.all)[number]) => recHref(r, state.workload, state.custom);
  const { recommended, fastest, quality, technicallyPossible } = res.picks;
  const usable = res.all.filter((r) => COMFORT_RANK[r.level] >= COMFORT_RANK.acceptable).length;
  const table = showAll ? res.all : res.all.filter((r) => r.level !== "unsupported" && r.level !== "does-not-fit");
  const compareHref = `/compare/models?${encodeState({ hardwareId: state.hardwareId, custom: state.custom, os: state.os, workload: state.workload })}&models=${[...selected].join(",")}`;

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-primary">Recommendations for your workload</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {recommended ? (
            <>
              {COMFORT_LABEL[recommended.level]} for {phrase}: <span className="text-primary">{recommended.model.name}</span>
            </>
          ) : (
            <>Nothing is comfortable for {phrase} on this machine</>
          )}
        </h1>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <EditChip label="Hardware" value={`${hardware.name}`} onClick={() => edit("hardware")} />
          <EditChip label="Workload" value={workloadLabel(state.workload)} onClick={() => edit("workload")} />
          <EditChip label="Tool" value={tool.name} onClick={() => edit("tool")} />
          <EditChip label="Priority" value={state.workload.priority ?? "balanced"} onClick={() => edit("priority")} />
          <ShareButton saveLabel={hardware ? `What ${hardware.name} runs for ${workloadLabel(state.workload)}` : undefined} />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {hardwareSpecLine(hardware)} · {res.all.length} models evaluated · {usable} usable for this workload ·{" "}
          {(["excellent", "comfortable", "acceptable", "borderline", "technically-runs"] as ComfortLevel[])
            .filter((l) => res.counts[l])
            .map((l) => `${res.counts[l]} ${COMFORT_LABEL[l].toLowerCase()}`)
            .join(", ")}
          {res.counts["does-not-fit"] ? `, ${res.counts["does-not-fit"]} don’t fit` : ""}.
        </p>
      </section>

      {/* Quick what-if */}
      <Card className="flex flex-wrap items-end gap-4 p-4">
        <Field label="Context" className="min-w-0">
          <Segmented ariaLabel="Context" size="sm" value={state.workload.desiredContextWindow ?? 0} onChange={(c) => setWorkload({ desiredContextWindow: c || undefined })} options={[{ value: 0, label: "Auto" }, ...CONTEXT_STEPS.filter((c) => c >= 8192).map((c) => ({ value: c, label: fmtCtx(c) }))]} />
        </Field>
        <Field label="Other apps">
          <Select ariaLabel="Other apps" value={state.workload.devEnv ?? "normal"} onChange={(d) => setWorkload({ devEnv: d })} options={DEV_ENV_LIST.filter((d) => d.preset !== "custom").map((d) => ({ value: d.preset, label: `${d.label} (${d.reserveGB} GB)` }))} />
        </Field>
        <Field label="Agents at once">
          <Segmented ariaLabel="Agents" size="sm" value={state.workload.numberOfAgents ?? 1} onChange={(a) => setWorkload({ numberOfAgents: a })} options={[1, 2, 3].map((a) => ({ value: a, label: String(a) }))} />
        </Field>
        <Field label="Priority">
          <Segmented ariaLabel="Priority" size="sm" value={state.workload.priority ?? "balanced"} onChange={(p) => setWorkload({ priority: p })} options={[{ value: "speed", label: "Speed" }, { value: "balanced", label: "Balanced" }, { value: "quality", label: "Quality" }]} />
        </Field>
      </Card>

      {recommended ? (
        <section className="grid gap-5 lg:grid-cols-3">
          <RecommendationCard rec={recommended} eyebrow={PICK_TITLE.recommended} reason={pickReason("recommended", recommended)} href={href(recommended)} workloadLabel={workloadLabel(state.workload)} className="ring-1 ring-primary/40" />
          {fastest && <RecommendationCard rec={fastest} eyebrow={PICK_TITLE.fastest} reason={pickReason("fastest", fastest)} href={href(fastest)} workloadLabel={workloadLabel(state.workload)} />}
          {quality && <RecommendationCard rec={quality} eyebrow={PICK_TITLE.quality} reason={pickReason("quality", quality)} href={href(quality)} workloadLabel={workloadLabel(state.workload)} />}
        </section>
      ) : (
        <Card className="p-6">
          <h2 className="font-semibold">No model reaches “Acceptable” for this workload here.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a smaller context, closing heavy apps, a lighter workload, or a tool with a smaller prompt footprint (e.g. Aider or Pi instead of a heavy IDE agent). Or see which hardware would be comfortable:
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <LinkButton href={`/hardware-for-model?${encodeState({ workload: state.workload, target: "comfortable", modelId: technicallyPossible[0]?.model.id ?? "qwen3-coder-30b-a3b" })}`}>Find hardware for this workload</LinkButton>
          </div>
        </Card>
      )}

      {technicallyPossible.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Technically possible — but not recommended for {phrase}</h2>
          <p className="mt-1 text-sm text-muted-foreground">These load and run, often with more parameters than the picks above, but the experience would be frustrating for this workload.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {technicallyPossible.map((r) => (
              <Link key={r.id} href={href(r)} className={cn("rounded-xl border p-4 transition hover:shadow-sm", COMFORT_STYLE[r.level].bg)}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{r.model.name}</p>
                  <ComfortBadge level={r.level} size="sm" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{pickReason("technical", r)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">All models on your machine, for this workload</h2>
            <p className="text-sm text-muted-foreground">Each model shown with its best quantization for this workload. Select models to compare side by side.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="size-4 accent-[var(--primary)]" /> Include models that don’t fit
            </label>
            {selected.size >= 2 && (
              <LinkButton href={compareHref} size="sm">
                <Scale className="size-4" /> Compare {selected.size}
              </LinkButton>
            )}
          </div>
        </div>
        <ModelsTable
          recs={table}
          hrefFor={href}
          selectable
          selected={selected}
          onToggle={(id) =>
            setSelected((s) => {
              const n = new Set(s);
              if (n.has(id)) n.delete(id);
              else if (n.size < 6) n.add(id);
              return n;
            })
          }
        />
      </section>
    </div>
  );
}

function EditChip({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1 hover:bg-muted">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
      <Pencil className="size-3 text-muted-foreground" />
    </button>
  );
}
