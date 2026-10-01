"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Pencil, Scale, SlidersHorizontal, Sparkles } from "lucide-react";
import type { HardwareConfiguration, WorkloadProfileInput } from "@/lib/schemas";
import { COMFORT_RANK } from "@/lib/schemas/results";
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
  { id: "hardware", title: "What computer do you have?", short: "Computer", hint: "Tap “Detect my computer”, or pick the closest match. You can change it later." },
  { id: "usecase", title: "What do you want the AI to do?", short: "Use", hint: "Pick the closest one. Different jobs need very different amounts of speed and memory." },
  { id: "tool", title: "Which app will you use?", short: "App", hint: "Not sure? Keep the suggestion. Coding agents send much bigger prompts than chat apps, which changes the answer." },
  { id: "workload", title: "A few details", short: "Details", hint: "Rough answers are fine. These decide how much memory to keep free for everything else." },
  { id: "priority", title: "What matters more to you?", short: "Priority", hint: "A smaller, faster model often feels better than the biggest one that fits." },
  { id: "advanced", title: "Advanced settings (optional)", short: "Advanced", hint: "Only change these if you know you need to." },
] as const;

export function CheckFlow({ initial, startWithResults }: { initial: AppState; startWithResults: boolean }) {
  const [state, setState] = useState<AppState>({ ...initial, hardwareId: initial.hardwareId ?? "mbp-m4-pro-20c-24" });
  const [step, setStep] = useState<number>(startWithResults ? STEPS.length : 0);
  const [dir, setDir] = useState<1 | -1>(1);
  const reduce = useReducedMotion();
  const mode = state.mode ?? "simple";
  const visibleSteps = mode === "advanced" ? STEPS : STEPS.filter((s) => s.id !== "advanced");
  const showResults = step >= visibleSteps.length;
  const hardware = resolveHardware(state);

  useUrlSync(showResults ? encodeState(state) : "");

  const setWorkload = (p: Partial<WorkloadProfileInput>) => setState((s) => ({ ...s, workload: { ...s.workload, ...p } }));
  const canNext = visibleSteps[step]?.id !== "hardware" || !!hardware;

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };
  const current = visibleSteps[step];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      {!showResults ? (
        <div className="mx-auto max-w-4xl pb-28 lg:pb-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-primary">
              Step {step + 1} of {visibleSteps.length}
            </p>
            <button
              type="button"
              onClick={() => setState((s) => ({ ...s, mode: mode === "advanced" ? "simple" : "advanced" }))}
              aria-pressed={mode === "advanced"}
              className={cn(
                "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition",
                mode === "advanced" ? "border-primary/50 bg-primary/10 text-primary" : "border-border/80 text-muted-foreground hover:text-foreground",
              )}
            >
              <SlidersHorizontal className="size-3.5" /> Advanced {mode === "advanced" ? "on" : "off"}
            </button>
          </div>
          <ol className="mt-3 flex gap-1.5" aria-label="Progress">
            {visibleSteps.map((s, i) => (
              <li key={s.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => (i <= step || hardware) && go(i)}
                  className="group block w-full cursor-pointer py-1.5"
                  aria-label={`Step ${i + 1}: ${s.short}`}
                  aria-current={i === step ? "step" : undefined}
                >
                  <span className="block h-1.5 overflow-hidden rounded-full bg-border">
                    <motion.span
                      className="block h-full rounded-full bg-primary"
                      initial={false}
                      animate={{ width: i <= step ? "100%" : "0%" }}
                      transition={{ duration: reduce ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </span>
                  <span className={cn("mt-1.5 hidden text-xs sm:block", i === step ? "font-semibold text-foreground" : "text-muted-foreground group-hover:text-foreground")}>{s.short}</span>
                </button>
              </li>
            ))}
          </ol>

          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={current.id}
              custom={dir}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -40, transition: { duration: 0.15 } }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-balance sm:text-4xl">{current.title}</h1>
              <p className="mt-2 flex items-start gap-2 text-base text-muted-foreground">
                <Sparkles className="mt-1 size-4 shrink-0 text-primary" />
                {current.hint}
              </p>

              <Card className="mt-6 rounded-3xl p-4 sm:p-6">
                {current.id === "hardware" && (
                  <HardwarePicker value={{ hardwareId: state.hardwareId, custom: state.custom, os: state.os }} onChange={(v) => setState((s) => ({ ...s, ...v }))} workload={state.workload} applyDefaultRig={!initial.hardwareId} />
                )}
                {current.id === "usecase" && <UseCasePicker value={state.workload} onChange={setWorkload} />}
                {current.id === "tool" && <ToolPicker value={state.workload} onChange={setWorkload} />}
                {current.id === "workload" && <WorkloadDetails value={state.workload} onChange={setWorkload} simple={mode === "simple"} />}
                {current.id === "priority" && <PriorityPicker value={state.workload} onChange={setWorkload} />}
                {current.id === "advanced" && <AdvancedSettings value={state.workload} onChange={setWorkload} />}
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* On phones the actions stick above the tab bar, always within thumb reach. */}
          <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-lg lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <div className="mx-auto flex max-w-4xl items-center gap-2">
              <Button variant="ghost" size="lg" onClick={() => go(Math.max(0, step - 1))} disabled={step === 0} className="px-3 sm:px-5">
                <ArrowLeft className="size-4" /> Back
              </Button>
              <div className="ml-auto flex items-center gap-2">
                {step >= 1 && step < visibleSteps.length - 1 && hardware && (
                  <Button variant="outline" size="lg" onClick={() => go(visibleSteps.length)} className="hidden sm:inline-flex">
                    Skip to results
                  </Button>
                )}
                <Button size="lg" onClick={() => go(step + 1)} disabled={!canNext} className="min-w-36 shadow-lg shadow-primary/20">
                  {step === visibleSteps.length - 1 ? "See my results" : "Next"} <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
            {step >= 1 && step < visibleSteps.length - 1 && hardware && (
              <button type="button" onClick={() => go(visibleSteps.length)} className="mt-1 w-full cursor-pointer text-center text-xs font-medium text-muted-foreground sm:hidden">
                Skip to results
              </button>
            )}
          </div>
        </div>
      ) : hardware ? (
        <Results state={state} hardware={hardware} setState={setState} edit={(id) => go(visibleSteps.findIndex((s) => s.id === id))} />
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
      <section className="animate-fade-up">
        <p className="text-sm font-semibold text-primary">Your results</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-balance sm:text-4xl">
          {recommended ? (
            <>
              Our pick for {phrase}: <span className="text-primary">{recommended.model.name}</span>
            </>
          ) : (
            <>Nothing runs comfortably for {phrase} on this computer</>
          )}
        </h1>
        <p className="mt-3 max-w-3xl text-base text-muted-foreground">
          We checked {res.all.length} models on your <strong className="text-foreground">{hardware.name}</strong> ({hardwareSpecLine(hardware)}).{" "}
          <strong className="text-foreground">{usable}</strong> will run well enough for {phrase}
          {res.counts["does-not-fit"] ? `, and ${res.counts["does-not-fit"]} are too big to fit` : ""}.
        </p>
        <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 text-sm sm:mx-0 sm:flex-wrap sm:px-0">
          <EditChip label="Computer" value={`${hardware.name}`} onClick={() => edit("hardware")} />
          <EditChip label="Use" value={workloadLabel(state.workload)} onClick={() => edit("usecase")} />
          <EditChip label="App" value={tool.name} onClick={() => edit("tool")} />
          <EditChip label="Priority" value={state.workload.priority ?? "balanced"} onClick={() => edit("priority")} />
          <ShareButton saveLabel={hardware ? `What ${hardware.name} runs for ${workloadLabel(state.workload)}` : undefined} />
        </div>
      </section>

      {recommended ? (
        <section className="grid gap-5 lg:grid-cols-3">
          <RecommendationCard rec={recommended} eyebrow={PICK_TITLE.recommended} reason={pickReason("recommended", recommended)} href={href(recommended)} workloadLabel={workloadLabel(state.workload)} className="shadow-lg shadow-primary/10 ring-2 ring-primary/40" />
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

      {/* Quick what-if */}
      <details className="group rounded-3xl border border-border/70 bg-card">
        <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 px-5 text-base font-semibold">
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="size-5 text-primary" /> Fine-tune these results
          </span>
          <span className="hidden text-sm font-normal text-muted-foreground group-open:hidden sm:inline">Context, other apps, priority</span>
        </summary>
        <div className="flex flex-wrap items-end gap-4 border-t border-border/60 p-5">
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
      </div>
      </details>

      {technicallyPossible.length > 0 && (
        <section>
          <h2 className="text-xl font-bold tracking-tight">Bigger models that would frustrate you</h2>
          <p className="mt-1 text-sm text-muted-foreground">These load and run, but they’d feel slow or leave your computer short of memory for {phrase}.</p>
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
            <h2 className="text-xl font-bold tracking-tight">Every model we checked</h2>
            <p className="text-sm text-muted-foreground">Best version of each for what you want to do. Tick two or more to compare them side by side.</p>
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
    <button type="button" onClick={onClick} className="inline-flex min-h-10 max-w-[18rem] shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border bg-card px-3 py-1.5 transition hover:bg-muted active:scale-[0.98]">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
      <Pencil className="size-3 text-muted-foreground" />
    </button>
  );
}
