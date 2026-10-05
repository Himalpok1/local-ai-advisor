import type { Metadata } from "next";
import { BookOpen, Clock } from "lucide-react";
import { APPLE_CHIPS, BENCHMARKS, HARDWARE, MODEL_MAP } from "@/data";
import type { CompatibilityRule } from "@/lib/schemas";
import { COMFORT_DESCRIPTION, COMFORT_LEVELS, type DimensionKey } from "@/lib/schemas/results";
import { BACKEND_LABEL, COMPATIBILITY_RULES } from "@/lib/compatibility";
import { USE_CASE_LIST, importanceLabel } from "@/lib/workloads/profiles";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ComfortBadge } from "@/components/advisor/comfort";
import { Callout, ExplorePage, ExploreSectionBlock } from "@/components/explore/explore-nav";
import { ExternalA } from "@/components/explore/source-link";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How Local AI Advisor decides whether a model runs comfortably: the 17-step evaluation pipeline, comfort levels, per-use-case weights, performance and memory models, confidence rules and the verified benchmark data behind it.",
  alternates: { canonical: "/methodology" },
};

const PIPELINE: { step: string; detail: string }[] = [
  { step: "Validate hardware support", detail: "Is the operating system supported by the machine, and is there a usable GPU?" },
  { step: "Validate runtime support", detail: "Does the runtime ship for this OS and have a backend (Metal, CUDA, ROCm, Vulkan, SYCL or CPU) for this GPU?" },
  { step: "Validate tool → API → runtime", detail: "Can the AI tool reach the runtime over an API it speaks — directly, or through a bridge?" },
  { step: "Estimate usable RAM / VRAM", detail: "Unified memory is capped by the GPU wired-memory limit; discrete GPUs use VRAM first, system RAM second." },
  { step: "Reserve OS / dev-env memory", detail: "Memory for the OS, your IDE, browsers, containers and the tool itself is set aside before the model gets any." },
  { step: "Weights", detail: "Model size at the chosen quantization and format, using published file sizes where available." },
  { step: "Runtime overhead", detail: "Compute buffers and fixed runtime overhead, growing with batch size, context and parallel streams." },
  { step: "KV / context memory", detail: "Per-token KV cache × context × streams, honouring sliding-window and hybrid attention and KV quantization." },
  { step: "Determine memory headroom", detail: "What is left after everything above — too little headroom means swapping, crashes or a sluggish machine." },
  { step: "Estimate prompt processing", detail: "Prefill speed (compute bound) and how long cold prompts and follow-up steps take to ingest." },
  { step: "Estimate generation", detail: "Decode speed (bandwidth bound) at short, typical and full context." },
  { step: "Apply workload requirements", detail: "Compare speeds, latencies, context and headroom against the thresholds of your use case." },
  { step: "Apply concurrency", detail: "Parallel requests and agents slow each stream depending on how well the runtime batches." },
  { step: "Model suitability", detail: "Editorial capability tiers, tool-calling reliability and vision support versus what the use case needs." },
  { step: "Confidence", detail: "How much of the estimate rests on measurements versus specifications and assumptions." },
  { step: "Comfort classification", detail: "Weighted dimensions are combined; weak critical dimensions cap the overall rating." },
  { step: "Human-readable explanation", detail: "Positives, warnings, bottlenecks and why the rating is not one level higher." },
];

const DIMENSIONS: { key: DimensionKey; label: string }[] = [
  { key: "memory", label: "Memory" },
  { key: "generation", label: "Generation" },
  { key: "prefill", label: "Prompt processing" },
  { key: "context", label: "Context" },
  { key: "runtime", label: "Runtime" },
  { key: "tool", label: "Tool compat." },
  { key: "suitability", label: "Suitability" },
  { key: "concurrency", label: "Concurrency" },
  { key: "stability", label: "Sustained use" },
];

const IMPORTANCE_STYLE: Record<ReturnType<typeof importanceLabel>, string> = {
  low: "text-muted-foreground",
  medium: "text-foreground",
  high: "bg-accent text-accent-foreground",
  "very-high": "bg-primary/20 text-accent-foreground font-semibold",
  critical: "bg-primary text-primary-foreground font-semibold",
};

const LAYER_LABEL: Record<CompatibilityRule["layer"], string> = {
  "hardware-runtime": "Hardware ↔ runtime",
  "runtime-model": "Runtime ↔ model",
  "tool-runtime": "Tool ↔ runtime",
  "model-usecase": "Model ↔ use case",
};
const SEVERITY_TONE = { blocker: "bad", warning: "warn", info: "neutral" } as const;

function chipName(chipKey: string): string {
  if (chipKey.startsWith("apple-")) {
    const c = APPLE_CHIPS[chipKey.slice(6)];
    if (c) return `Apple ${c.name}`;
  }
  const h = HARDWARE.find((x) => x.chipKey === chipKey);
  return h?.gpu?.name ?? h?.cpu.name ?? chipKey;
}

const TOC = [
  ["pipeline", "How the engine works"],
  ["comfort", "Comfort levels"],
  ["weights", "Weights per use case"],
  ["performance", "Performance model"],
  ["memory", "Memory model"],
  ["confidence", "Confidence"],
  ["compatibility", "Compatibility rules"],
  ["benchmarks", "Benchmark data"],
  ["freshness", "Data freshness"],
] as const;

export default function MethodologyPage() {
  const benchmarks = [...BENCHMARKS].sort((a, b) => chipName(a.chipKey).localeCompare(chipName(b.chipKey)) || b.generationTps - a.generationTps);
  return (
    <ExplorePage
      current="methodology"
      title="Methodology"
      intro="How the advisor turns your hardware, tool and workload into a comfort rating — and where every number comes from."
    >
      <p className="text-sm text-muted-foreground">The catalog stores vendor-documented practical context. Live Hugging Face imports show native context plus any RoPE-extended window, and rate against native context; quality past native may degrade, so long-context ratings there are optimistic.</p>
      <nav aria-label="On this page" className="-mt-4">
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
          {TOC.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="text-link hover:underline">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <ExploreSectionBlock
        id="pipeline"
        title="How the engine works"
        description="Every evaluation of a (hardware, model, quantization, runtime, tool, workload) combination runs the same 17-step pipeline. Nothing is pre-labelled: recommendation status is always derived, never stored."
      >
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PIPELINE.map((p, i) => (
            <li key={p.step} className="flex gap-3 rounded-xl border-2 bg-card p-3.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{i + 1}</span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{p.step}</span>
                <span className="text-xs text-muted-foreground">{p.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </ExploreSectionBlock>

      <ExploreSectionBlock
        id="comfort"
        title="Comfort levels"
        description="The advisor answers “will it be comfortable?”, not just “does it load?”. The same model on the same machine can be Excellent for chat and Borderline for agentic coding."
      >
        <ul className="grid gap-2 md:grid-cols-2">
          {COMFORT_LEVELS.map((l) => (
            <li key={l} className="flex flex-col gap-2 rounded-xl border-2 bg-card p-3.5 sm:flex-row sm:items-center sm:gap-4">
              <ComfortBadge level={l} size="sm" className="w-fit sm:w-40 sm:justify-start" />
              <span className="text-sm text-muted-foreground">{COMFORT_DESCRIPTION[l]}</span>
            </li>
          ))}
        </ul>
      </ExploreSectionBlock>

      <ExploreSectionBlock
        id="weights"
        title="Weights differ per use case"
        description={
          <>
            Each use case weights the nine dimensions differently, and sets its own generation-speed ladder. Speeds are per-stream decode tokens/second
            needed for <span className="text-excellent">Excellent</span> / <span className="text-comfortable">Comfortable</span> / Acceptable /{" "}
            <span className="text-borderline">Borderline</span>.
          </>
        }
      >
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-xs">
              <caption className="sr-only">Dimension importance and generation-speed thresholds per use case</caption>
              <thead className="border-b-2 bg-muted/60 text-muted-foreground">
                <tr>
                  <th scope="col" className="sticky left-0 z-10 bg-muted px-3 py-2.5 text-left font-medium">
                    Use case
                  </th>
                  {DIMENSIONS.map((d) => (
                    <th key={d.key} scope="col" className="px-2 py-2.5 text-center font-medium">
                      {d.label}
                    </th>
                  ))}
                  <th scope="col" className="border-l-2 px-3 py-2.5 text-center font-medium">
                    Generation tok/s
                    <span className="block font-normal">Exc. / Comf. / Acc. / Bord.</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {USE_CASE_LIST.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <th scope="row" className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium whitespace-nowrap">
                      {u.label}
                      <span className="block font-normal text-muted-foreground">{u.group}</span>
                    </th>
                    {DIMENSIONS.map((d) => {
                      const w = u.weights[d.key];
                      const label = importanceLabel(w);
                      const critical = u.critical.includes(d.key);
                      return (
                        <td key={d.key} className="px-1.5 py-2 text-center">
                          {w <= 0 ? (
                            <span role="img" className="text-muted-foreground/60" aria-label="Not considered">
                              —
                            </span>
                          ) : (
                            <span
                              className={cn("inline-block rounded px-1.5 py-0.5 whitespace-nowrap", IMPORTANCE_STYLE[label])}
                              title={critical ? "Critical: a weak score here caps the overall rating" : undefined}
                            >
                              {label.replace("-", " ")}
                              {critical && (
                                <>
                                  <span aria-hidden>*</span>
                                  <span className="sr-only"> (caps the rating)</span>
                                </>
                              )}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="border-l-2 px-3 py-2 text-center tabular-nums whitespace-nowrap">{u.thresholds.genTps.join(" / ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="mt-2 text-xs text-muted-foreground">
          * Dimensions marked with an asterisk cap the overall rating when they are weak — a model can’t be Comfortable for agentic coding if prompt
          processing is poor, however fast it generates.
        </p>
      </ExploreSectionBlock>

      <ExploreSectionBlock id="performance" title="Performance model">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5 text-sm">
            <h3 className="font-semibold">Generation (decode) is bandwidth bound</h3>
            <p className="mt-1.5 text-muted-foreground">
              Every new token reads the model’s <em>active</em> weights plus the KV cache from memory. Tokens/second ≈ effective bandwidth ÷ bytes read
              per token. Mixture-of-experts models read only their active experts, which is why a 30B-A3B model generates far faster than a dense 30B.
              Speed drops as the context fills because the KV cache must be read too.
            </p>
          </Card>
          <Card className="p-5 text-sm">
            <h3 className="font-semibold">Prompt processing (prefill) is compute bound</h3>
            <p className="mt-1.5 text-muted-foreground">
              Ingesting a prompt costs roughly 2 × active parameters FLOPs per token, plus attention cost that grows with context. GPU TFLOPS and the
              runtime’s kernel efficiency set the pace. This dominates agentic tools that resend large system prompts, files and tool output every step;
              prompt-cache reuse in the runtime reduces it.
            </p>
          </Card>
          <Card className="p-5 text-sm md:col-span-2">
            <h3 className="font-semibold">Calibration and the basis of every number</h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-3">
              <li className="rounded-lg bg-muted/60 p-3">
                <Badge tone="good">Measured</Badge>
                <p className="mt-1.5 text-muted-foreground">A verified benchmark exists for this exact chip, model and quantization. Shown as “≈N tok/s”.</p>
              </li>
              <li className="rounded-lg bg-muted/60 p-3">
                <Badge tone="primary">Calibrated</Badge>
                <p className="mt-1.5 text-muted-foreground">
                  Estimated from specs, then corrected using verified benchmarks of other models on the same chip. Shown as a ±15% range.
                </p>
              </li>
              <li className="rounded-lg bg-muted/60 p-3">
                <Badge tone="warn">Estimated</Badge>
                <p className="mt-1.5 text-muted-foreground">
                  No benchmark applies — derived from bandwidth, compute and runtime efficiency. Shown as a ±25% range.
                </p>
              </li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              Ranges are deliberate: we never show a falsely precise number for an estimate, and never invent a “measured” value.
            </p>
          </Card>
        </div>
      </ExploreSectionBlock>

      <ExploreSectionBlock id="memory" title="Memory model">
        <Card className="p-5 text-sm">
          <ul className="grid gap-3 text-muted-foreground md:grid-cols-2 [&_strong]:text-foreground">
            <li>
              <strong>Peak memory</strong> = weights + KV cache + runtime overhead + vision encoder (if images are used), plus memory reserved for the OS,
              your development environment and the AI tool.
            </li>
            <li>
              <strong>Weights</strong> use published GGUF file sizes when available; otherwise parameters × effective bits per weight (including scales)
              for GGUF, MLX or safetensors.
            </li>
            <li>
              <strong>KV cache</strong> = 2 × layers × KV heads × head dim × bytes, per token of context and per parallel stream. Sliding-window and hybrid
              linear-attention models only keep a full cache on some layers; KV quantization (Q8 / Q4) shrinks it where the runtime supports it.
            </li>
            <li>
              <strong>Unified memory</strong> is one pool with a GPU wired-memory cap (≈⅔–¾ of RAM on macOS by default, adjustable).
              <strong> Discrete GPUs</strong> have VRAM and system RAM as separate pools; weights that spill out of VRAM run at system-RAM speed and slow
              decode sharply.
            </li>
          </ul>
        </Card>
      </ExploreSectionBlock>

      <ExploreSectionBlock id="confidence" title="Confidence" description="Each result carries a High / Medium / Low confidence, starting from its performance basis and adjusted for known sources of uncertainty.">
        <Card className="p-5 text-sm">
          <ul className="grid gap-2 text-muted-foreground sm:grid-cols-2 [&_strong]:text-foreground">
            <li>
              <strong>Starting point:</strong> measured (highest) → calibrated → estimated (lowest).
            </li>
            <li>
              <strong>Lower</strong> when the runtime backend is experimental.
            </li>
            <li>
              <strong>Lower</strong> for long contexts (over 32K), where performance is extrapolated.
            </li>
            <li>
              <strong>Lower</strong> with partial GPU offload, which is hard to predict precisely.
            </li>
            <li>
              <strong>Lower</strong> for unmeasured MoE and hybrid/sliding-attention models, whose speed varies more between runtimes.
            </li>
            <li>
              <strong>Lower</strong> when hardware or model specs come from low-confidence sources, or prefill gains rely on vendor claims (e.g. new GPU
              matrix accelerators).
            </li>
          </ul>
          <p className="mt-3 text-muted-foreground">Compatibility and memory-fit results are deterministic rules and are always high confidence.</p>
        </Card>
      </ExploreSectionBlock>

      <ExploreSectionBlock id="compatibility" title="Compatibility rules" description="Blockers make a combination Unsupported; warnings lower the rating or add caveats.">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">Compatibility rules</caption>
              <thead className="border-b-2 bg-muted/60 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Layer
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Rule
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Severity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {COMPATIBILITY_RULES.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{LAYER_LABEL[r.layer]}</td>
                    <td className="px-4 py-2.5">{r.description}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={SEVERITY_TONE[r.severity]} className="capitalize">
                        {r.severity}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </ExploreSectionBlock>

      <ExploreSectionBlock
        id="benchmarks"
        title="Benchmark data"
        description="Verified public llama.cpp results transcribed from the sources linked below. pp = prompt processing (prefill), tg = text generation. They anchor the performance model as calibration points."
      >
        <Callout icon={<BookOpen className="size-4" />} className="mb-4">
          Results are <strong>build-dependent</strong>: the same chip can speed up substantially between llama.cpp releases (DGX Spark roughly doubled
          between builds). Treat them as reference points, not guarantees for your setup.
        </Callout>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <caption className="sr-only">Verified benchmark results ({benchmarks.length} rows)</caption>
              <thead className="border-b-2 bg-muted/60 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2.5 font-medium">Chip</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Model</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Quant</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Backend</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">pp / tg tokens</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Prefill tok/s</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Generation tok/s</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Source</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {benchmarks.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2 whitespace-nowrap">{chipName(b.chipKey)}</td>
                    <td className="px-3 py-2">{MODEL_MAP.get(b.modelId)?.name ?? b.modelId}</td>
                    <td className="px-3 py-2 text-xs">{b.quantLabel}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{BACKEND_LABEL[b.backend] ?? b.backend}</td>
                    <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                      {b.promptTokens} / {b.outputTokens}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{b.prefillTps ? b.prefillTps.toFixed(1) : "—"}</td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">{b.generationTps.toFixed(1)}</td>
                    <td className="px-3 py-2 text-xs">
                      <ExternalA href={b.source.url}>
                        <span className="block max-w-[16rem] truncate" title={b.source.title}>
                          {b.source.title ?? "Source"}
                        </span>
                      </ExternalA>
                    </td>
                    <td className="px-3 py-2 tabular-nums">{b.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </ExploreSectionBlock>

      <ExploreSectionBlock id="freshness" title="Data freshness">
        <Callout icon={<Clock className="size-4" />}>
          Every hardware configuration, model, runtime, tool, API and benchmark carries a <strong>source URL</strong>, a <strong>last-verified date</strong>{" "}
          and a <strong>confidence</strong> level (high / medium / low), shown next to it throughout the site. The local-AI landscape moves fast — new models,
          runtime releases and API features land every few weeks, and runtime updates can change speeds noticeably. If something looks out of date,
          check the linked source; it is the ground truth.
        </Callout>
      </ExploreSectionBlock>
    </ExplorePage>
  );
}
