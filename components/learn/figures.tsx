/**
 * Small static illustrations for /learn. Plain divs/SVG, token colours only,
 * so they follow light/dark mode. Numbers are illustrative and labelled so.
 */
import { Cpu, MemoryStick, MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { FigureCaption } from "./prose";

const STRIPES = "bg-[repeating-linear-gradient(135deg,var(--c-technical)_0_6px,color-mix(in_oklch,var(--c-technical)_55%,transparent)_6px_12px)]";

function Segment({ gb, scale, className, label }: { gb: number; scale: number; className: string; label: string }) {
  return (
    <div
      className={cn("flex h-full items-center justify-center overflow-hidden whitespace-nowrap px-1 text-[11px] font-medium", className)}
      style={{ width: `${(gb / scale) * 100}%` }}
      title={`${label}: ${gb} GB`}
    >
      <span className="truncate">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fits ≠ fast: 23 of 24 GB                                             */
/* ------------------------------------------------------------------ */

export function FitsFigure() {
  const scale = 32;
  const installed = 24;
  const marker = `${(installed / scale) * 100}%`;
  const rows = [
    {
      label: "What a “does it fit?” check sees",
      verdict: "Fits ✓",
      verdictClass: "text-comfortable",
      segments: [{ gb: 23, label: "Model 23 GB", className: "bg-primary/70 text-primary-foreground" }],
    },
    {
      label: "What your computer actually runs",
      verdict: "8 GB over → swap, stutter",
      verdictClass: "text-technical",
      segments: [
        { gb: 23, label: "Model 23 GB", className: "bg-primary/70 text-primary-foreground" },
        { gb: 1, label: "", className: "bg-muted-foreground/30" },
        { gb: 8, label: "OS + IDE + browser 9 GB", className: cn(STRIPES, "text-white") },
      ],
    },
  ];
  return (
    <figure className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="space-y-5">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="font-medium">{r.label}</span>
              <span className={cn("text-xs font-semibold", r.verdictClass)}>{r.verdict}</span>
            </div>
            <div className="relative">
              <div className="flex h-8 overflow-hidden rounded-md bg-muted">
                {r.segments.map((s, i) => (
                  <Segment key={i} gb={s.gb} scale={scale} className={s.className} label={s.label} />
                ))}
              </div>
              <div className="pointer-events-none absolute -bottom-1 -top-1 w-0.5 bg-foreground" style={{ left: marker }} aria-hidden />
            </div>
          </div>
        ))}
        <div className="relative h-4 text-[11px] text-muted-foreground" aria-hidden>
          {[0, 8, 16, 24, 32].map((t) => (
            <span key={t} className={cn("absolute -translate-x-1/2", t === 24 && "font-semibold text-foreground")} style={{ left: `${(t / scale) * 100}%` }}>
              {t === 24 ? "24 GB installed" : `${t}`}
            </span>
          ))}
        </div>
      </div>
      <FigureCaption>
        A 24 GB machine running a 23 GB model. The model alone fits, but macOS/Windows, your editor and a browser also need room. The overflow goes to compressed
        memory or swap, and everything gets sluggish.
      </FigureCaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* VRAM spill                                                          */
/* ------------------------------------------------------------------ */

/** Theoretical decode ceiling when a fraction of the weights is read from system RAM. */
function spillTps(modelGB: number, spill: number, vramBW: number, ramBW: number) {
  const sec = (modelGB * (1 - spill)) / vramBW + (modelGB * spill) / ramBW;
  return 1 / sec;
}

export function SpillFigure() {
  const modelGB = 20;
  const vram = 1000;
  const ram = 80;
  const rows = [0, 0.1, 0.25, 0.5].map((s) => ({ spill: s, tps: spillTps(modelGB, s, vram, ram) }));
  const max = rows[0].tps;
  return (
    <figure className="rounded-xl border bg-card p-4 sm:p-5">
      <p className="mb-3 text-sm font-medium">Generation speed ceiling vs. how much of the model spilled out of VRAM</p>
      <div className="space-y-2.5" role="list">
        {rows.map((r) => (
          <div key={r.spill} role="listitem" className="grid grid-cols-[6.5rem_1fr_4.5rem] items-center gap-3 text-sm">
            <span className="text-muted-foreground">{r.spill === 0 ? "All in VRAM" : `${Math.round(r.spill * 100)}% in RAM`}</span>
            <div className="h-5 rounded bg-muted">
              <div
                className={cn("h-full rounded", r.spill === 0 ? "bg-comfortable/80" : r.spill <= 0.1 ? "bg-acceptable/80" : "bg-technical/70")}
                style={{ width: `${Math.max(2, (r.tps / max) * 100)}%` }}
              />
            </div>
            <span className="text-right font-mono text-xs tabular-nums">≈{Math.round(r.tps)} tok/s</span>
          </div>
        ))}
      </div>
      <FigureCaption>
        Illustrative upper bounds for a 20 GB model on a GPU with ~1,000 GB/s VRAM and a PC with ~80 GB/s dual-channel DDR5. Moving just a quarter of the
        model to system RAM cuts the ceiling by roughly {Math.round(max / rows[2].tps)}×.
      </FigureCaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Agent compounding                                                   */
/* ------------------------------------------------------------------ */

export function AgentStepsFigure() {
  const step = { promptTokens: 5000, outputTokens: 300, calls: 30 };
  const models = [
    { name: "Bigger dense model", gen: 12, prefill: 110 },
    { name: "Smaller / MoE model", gen: 70, prefill: 650 },
  ].map((m) => {
    const pre = step.promptTokens / m.prefill;
    const gen = step.outputTokens / m.gen;
    return { ...m, pre, genSec: gen, total: pre + gen, task: ((pre + gen) * step.calls) / 60 };
  });
  const max = Math.max(...models.map((m) => m.total));
  return (
    <figure className="rounded-xl border bg-card p-4 sm:p-5">
      <p className="text-sm font-medium">One agent step = read the prompt (prefill) + write the reply (generation)</p>
      <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-primary/75" /> Prefill of {step.promptTokens.toLocaleString("en-US")} new tokens
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-primary/30" /> Generating {step.outputTokens} tokens
        </span>
      </div>
      <div className="mt-4 space-y-4">
        {models.map((m) => (
          <div key={m.name}>
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="font-medium">{m.name}</span>
              <span className="text-xs text-muted-foreground">
                {m.gen} tok/s generation · {m.prefill} tok/s prefill
              </span>
            </div>
            <div className="flex h-6 w-full overflow-hidden rounded bg-muted" aria-label={`${Math.round(m.total)} seconds per step`}>
              <div className="h-full bg-primary/75" style={{ width: `${(m.pre / max) * 100}%` }} title={`Prefill ≈${Math.round(m.pre)} s`} />
              <div className="h-full bg-primary/30" style={{ width: `${(m.genSec / max) * 100}%` }} title={`Generation ≈${Math.round(m.genSec)} s`} />
            </div>
            <div className="mt-1 flex justify-between text-xs tabular-nums">
              <span className="text-muted-foreground">≈{Math.round(m.total)} s per step</span>
              <span className="font-semibold">
                × {step.calls} steps ≈ {Math.round(m.task)} min per task
              </span>
            </div>
          </div>
        ))}
      </div>
      <FigureCaption>Illustrative numbers in the range of a 48 GB laptop. In chat you wait once; an agent makes you wait every step.</FigureCaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Memory pools                                                        */
/* ------------------------------------------------------------------ */

function Pool({ title, size, className, children }: { title: string; size: string; className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("rounded-lg border p-3", className)}>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{title}</span>
        <span className="font-mono text-xs text-muted-foreground">{size}</span>
      </div>
      {children}
    </div>
  );
}

export function MemoryPoolsFigure() {
  return (
    <figure className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border bg-card p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <MonitorSmartphone className="size-4 text-muted-foreground" /> PC with a graphics card
        </p>
        <div className="space-y-2">
          <Pool title="VRAM (on the GPU)" size="e.g. 16 GB · ~1,000 GB/s" className="bg-comfortable/10">
            <p className="mt-1 text-xs text-muted-foreground">Fast. The model should live here.</p>
          </Pool>
          <div className="text-center text-xs text-muted-foreground">⇅ PCIe — a narrow bridge</div>
          <Pool title="System RAM" size="e.g. 32 GB · ~80 GB/s" className="bg-muted">
            <p className="mt-1 text-xs text-muted-foreground">OS, apps, and any model layers that didn’t fit in VRAM.</p>
          </Pool>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Cpu className="size-4 text-muted-foreground" /> Unified memory (one pool)
        </p>
        <Pool title="Unified memory" size="e.g. 48 GB · ~270 GB/s" className="bg-accent/60">
          <div className="mt-2 flex h-7 overflow-hidden rounded text-[11px] font-medium">
            <div className="flex w-3/4 items-center justify-center bg-primary/65 text-primary-foreground">GPU may use ≈75%</div>
            <div className="flex w-1/4 items-center justify-center bg-muted-foreground/25">OS & apps</div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            CPU and GPU share it. No copying, no spill cliff, but the OS and your apps compete for the same space.
          </p>
        </Pool>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MemoryStick className="size-3.5" /> Apple Silicon, AMD Ryzen AI Max, NVIDIA DGX Spark
        </p>
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Mixture of Experts                                                  */
/* ------------------------------------------------------------------ */

export function MoeFigure() {
  const experts = 16;
  const active = new Set([3, 10]);
  return (
    <figure className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex shrink-0 flex-col items-center gap-1 text-xs text-muted-foreground">
          <span className="rounded-md border bg-muted px-2 py-1 font-mono text-foreground">“def”</span>
          <span>one token</span>
          <span aria-hidden>→ router →</span>
        </div>
        <div className="grid grid-cols-8 gap-1.5" aria-label={`${active.size} of ${experts} experts active for this token`}>
          {Array.from({ length: experts }, (_, i) => (
            <div
              key={i}
              className={cn(
                "grid size-8 place-items-center rounded-md border text-[10px] font-medium sm:size-9",
                active.has(i) ? "border-primary bg-primary/70 text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              E{i + 1}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <p className="rounded-lg bg-muted px-3 py-2">
          <span className="font-semibold">Memory</span> must hold <span className="font-semibold">all 16</span> experts → sized by total parameters.
        </p>
        <p className="rounded-lg bg-accent/70 px-3 py-2">
          <span className="font-semibold">Speed</span> depends on the <span className="font-semibold">2 used</span> per token → roughly active parameters.
        </p>
      </div>
      <FigureCaption>Simplified. Real MoE models have dozens to hundreds of experts per layer and pick a different few at every layer, for every token.</FigureCaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Time to first token                                                 */
/* ------------------------------------------------------------------ */

export function TtftFigure() {
  const parts = [
    { label: "Load model (first request only)", sec: 6, className: "bg-muted-foreground/30" },
    { label: "Prefill: read your prompt", sec: 8, className: "bg-primary/75" },
    { label: "Stream the answer", sec: 10, className: "bg-primary/30" },
  ];
  const total = parts.reduce((s, p) => s + p.sec, 0);
  const ttft = parts[0].sec + parts[1].sec;
  return (
    <figure className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="relative">
        <div className="flex h-8 overflow-hidden rounded-md">
          {parts.map((p) => (
            <div key={p.label} className={cn("h-full", p.className)} style={{ width: `${(p.sec / total) * 100}%` }} title={`${p.label}: ${p.sec} s`} />
          ))}
        </div>
        <div className="absolute -bottom-1 -top-1 w-0.5 bg-foreground" style={{ left: `${(ttft / total) * 100}%` }} aria-hidden />
      </div>
      <div className="relative mt-2 h-4 text-xs">
        <span className="absolute left-0 text-muted-foreground">Enter</span>
        <span className="absolute -translate-x-1/2 whitespace-nowrap font-semibold" style={{ left: `${(ttft / total) * 100}%` }}>
          ↑ first token
        </span>
        <span className="absolute right-0 text-muted-foreground">done</span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-sm", p.className)} />
            {p.label}
          </li>
        ))}
      </ul>
      <FigureCaption>Illustrative. Everything left of the marker is “time to first token”: you see nothing until it is over.</FigureCaption>
    </figure>
  );
}
