import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Cpu,
  HardDrive,
  Layers,
  Search,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  Scale,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HomeDemo } from "@/components/home/home-demo";
import { PopularRigsMatrix, type RigCategory } from "@/components/home/popular-rigs";
import { rigSummary } from "@/lib/can-i-run";
import { ComfortExplorer } from "@/components/home/comfort-explorer";
import { BENCHMARKS, HARDWARE, MODELS, RUNTIMES, TOOLS } from "@/data";

const TIERS = [
  {
    step: "01",
    title: "Can Load",
    badge: "Memory",
    text: "The model physically fits into usable RAM / VRAM without triggering an immediate out-of-memory crash.",
  },
  {
    step: "02",
    title: "Can Run",
    badge: "Compatibility",
    text: "Your runtime (llama.cpp, MLX, Ollama) supports the chip instructions, and your tool connects cleanly via local API.",
  },
  {
    step: "03",
    title: "Can Run Usably",
    badge: "Basic Speed",
    text: "Generation exceeds minimal conversational speeds (> 10 tok/s) so basic one-turn interactions don't feel agonizing.",
  },
  {
    step: "04",
    title: "Comfortable for Workload",
    badge: "Real-World Experience",
    text: "Leaves generous headroom for your OS and IDE. Prompt prefill is fast enough to make multi-turn coding agents feel instant.",
    primary: true,
  },
];

/** Machines shown in "Popular rigs"; their picks are computed by the engine. */
const POPULAR_RIGS: { id: string; category: RigCategory }[] = [
  { id: "mba-m4-10c-16", category: "apple" },
  { id: "mbp-m4-pro-20c-48", category: "apple" },
  { id: "studio-m4-max-40c-128", category: "apple" },
  { id: "pc-rtx-3060-12-32", category: "nvidia" },
  { id: "pc-rtx-5070-ti-32", category: "nvidia" },
  { id: "pc-rtx-4090-64", category: "nvidia" },
  { id: "laptop-core-ultra-258v-32", category: "apu" },
  { id: "strix-halo-395-128", category: "apu" },
  { id: "dgx-spark-128", category: "apu" },
];

export default function Home() {
  const rigs = POPULAR_RIGS.map(({ id, category }) => ({ ...rigSummary(HARDWARE.find((h) => h.id === id)!), category }));
  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/70 subtle-grid">
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-12">
          <div className="text-center space-y-6 lg:text-left">
            {/* Live Status Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-2xs backdrop-blur-md">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-foreground">Zero-Guesswork Local AI</span>
              <span className="text-border">|</span>
              <span>{HARDWARE.length} Hardware Profiles · {BENCHMARKS.length} Benchmarks</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-[4.25rem] text-foreground">
              Will local AI{" "}
              <span className="text-primary">actually run well</span> on your computer?
            </h1>

            {/* Subtitle */}
            <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed lg:mx-0">
              Don&apos;t guess if a model fits. We calculate real KV-cache headroom, agentic prompt prefill latency, and token speeds for your exact CPU, GPU, or Apple Silicon machine.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 lg:justify-start">
              <LinkButton href="/check" size="lg" variant="primary">
                <span>Check My Computer</span>
                <ArrowRight className="size-4" />
              </LinkButton>
              <LinkButton href="/hardware-for-model" size="lg" variant="outline">
                Find Hardware for a Model
              </LinkButton>
              <LinkButton href="/hugging-face" size="lg" variant="ghost">
                <Search className="size-4" /> Any HF Model
              </LinkButton>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-[#F7F7F5] shadow-sm">
            <Image
              src="/brand/editorial-capability-layers.webp"
              width={1536}
              height={1024}
              alt="A computer and four colored layers representing memory, compatibility, speed, and comfort"
              className="h-auto w-full"
              loading="eager"
              fetchPriority="high"
            />
          </div>
          </div>

          {/* Interactive Hardware & Model Simulator */}
          <div className="mx-auto mt-12 sm:mt-16 max-w-5xl">
            <HomeDemo />
          </div>
        </div>
      </section>

      {/* The "It Fits" Myth — Visual Reality Check */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            The Reality Check
          </p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-4xl text-foreground">
            &ldquo;It fits&rdquo; is the least useful metric in local AI
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Most calculators stop at static weights memory. But when a model consumes 98% of your RAM, your computer slows to a crawl. Here is the difference:
          </p>
        </div>

        {/* Side-by-side comparison */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* The Naive Way */}
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                <XCircle className="size-3.5" /> Naive Memory Check
              </span>
              <span className="text-xs font-medium text-muted-foreground">What other sites do</span>
            </div>
            <h3 className="text-xl font-bold text-foreground">
              &ldquo;Fits! 15.6 GB / 16 GB RAM used.&rdquo;
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Considers only raw weight file size on disk. Ignores dynamic KV cache expansion, OS system reserves, and multi-turn prompt processing.
            </p>
            <div className="rounded-xl border border-rose-500/20 bg-card/60 p-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold">
                <span>The Painful Result:</span>
              </div>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>0 MB free RAM left for VS Code, browser, or Docker</li>
                <li>OS begins heavy disk paging (SSD swap thrashing)</li>
                <li>Decode speed drops from 30 tok/s down to 1.2 tok/s</li>
                <li>Coding agents like Claude Code time out repeatedly</li>
              </ul>
            </div>
          </div>

          {/* The Local AI Advisor Way */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" /> Local AI Advisor Simulation
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 font-semibold">
                Calibrated Physics
              </span>
            </div>
            <h3 className="text-xl font-bold text-foreground">
              &ldquo;Comfortable for Agentic Coding&rdquo;
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Models usable memory after your OS and development environment, calculates exact KV cache growth for 8K–64K context, and predicts first-token latency.
            </p>
            <div className="rounded-xl border border-emerald-500/20 bg-card/60 p-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>The Actual Experience:</span>
              </div>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Protects 4–6 GB headroom for your IDE and multitasking</li>
                <li>Accurate KV cache reservation for long context windows</li>
                <li>Benchmark-calibrated token speeds (30–80 tok/s)</li>
                <li>Sub-second agent step latency without thermal throttling</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-xl overflow-hidden rounded-2xl border border-border/70 bg-card">
          <Image
            src="/brand/fit-check.gif"
            width={720}
            height={360}
            alt="Four fit checks progress from load through comfort"
            className="h-auto w-full motion-reduce:hidden"
            unoptimized
          />
          <Image
            src="/brand/fit-check-poster.png"
            width={720}
            height={360}
            alt="All four fit checks complete: comfortable"
            className="hidden h-auto w-full motion-reduce:block"
          />
        </div>
      </section>

      {/* The 4 Capability Tiers */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Evaluation Pipeline
          </p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            The Four Questions We Answer
          </h2>
          <p className="text-sm text-muted-foreground">
            We evaluate every combination across four progressive capability tiers. We rate the fourth one, because that is what you experience every single day.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((t) => (
            <div
              key={t.title}
              className={cn(
                "relative flex flex-col justify-between rounded-2xl border p-5 sm:p-6 transition-all",
                t.primary
                  ? "border-primary/60 bg-primary/5 ring-1 ring-primary/40 shadow-sm"
                  : "border-border/80 bg-card",
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-muted-foreground">{t.step}</span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      t.primary ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {t.badge}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold text-foreground">{t.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Rating Philosophy Explorer */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Comfort Scale
          </p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Transparent Rating Standards
          </h2>
          <p className="text-sm text-muted-foreground">
            We never hide evaluation behind an opaque numerical score. Click through the scale below to understand our qualitative comfort criteria and expectations.
          </p>
        </div>

        <div className="mt-8">
          <ComfortExplorer />
        </div>
      </section>

      {/* Popular Machines Showcase */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-10">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Popular Rigs
          </p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-4xl text-foreground">
            What runs on popular machines?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            The engine’s best picks for chat and agentic coding on the most widely used local AI machines.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-[#F7F7F5]">
          <Image
            src="/brand/editorial-model-choice.webp"
            width={1774}
            height={887}
            alt="A computer connected through a performance gauge to several model choices"
            className="h-auto w-full"
          />
        </div>
        </div>

        <div className="mt-10">
          <PopularRigsMatrix rigs={rigs} />
        </div>
      </section>

      {/* The 3 Core Architecture Pillars */}
      <section className="border-y border-border/70 bg-muted/20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center space-y-2 mb-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              Engineered for Realistic Physics
            </h2>
            <p className="text-sm text-muted-foreground">
              Why Local AI Advisor delivers recommendations you can actually trust.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-2xs space-y-3">
              <Image src="/brand/icon-compatibility.svg" width={44} height={44} alt="" className="size-11" />
              <h3 className="text-lg font-bold text-foreground">Tool- &amp; Agent-Aware</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                An agent like Claude Code, OpenCode, or Continue makes dozens of sequential calls with large repo contexts. A simple chat app makes one. We model prompt prefill latency and context growth specifically for each tool.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-2xs space-y-3">
              <Image src="/brand/icon-memory.svg" width={44} height={44} alt="" className="size-11" />
              <h3 className="text-lg font-bold text-foreground">System Headroom-Aware</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Your IDE, browser, Docker containers, and simulator need memory too. A model that leaves 1 GB of free RAM will cause constant swapping; one that leaves 12 GB guarantees a smooth, fluid desktop experience.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-2xs space-y-3">
              <Image src="/brand/icon-speed.svg" width={44} height={44} alt="" className="size-11" />
              <h3 className="text-lg font-bold text-foreground">Benchmark-Calibrated</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Generation and prompt processing speeds are calibrated against 76 verified llama.cpp scoreboards and MLX benchmark tables. Every measured number is labelled, and estimates are shown as honest ranges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tool Hub ("Start Where You Are") */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              All Tools &amp; Explorers
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              Start where you are
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose the workflow that matches what you already know.
            </p>
          </div>
          <Link
            href="/methodology"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:underline"
          >
            <span>Read full engine methodology</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ToolCard
            href="/can-i-run"
            icon={<Image src="/brand/icon-comfort.svg" width={40} height={40} alt="" className="size-10" />}
            tag="Instant Answers"
            title="Can my computer run it?"
            text={`Every open model on ${HARDWARE.length} Macs, GPUs and AI PCs: verdicts for chat, coding and agents, speeds, and exact download commands for Ollama, llama.cpp and LM Studio.`}
            className="sm:col-span-2"
          />
          <ToolCard
            href="/speed-test"
            icon={<Zap className="size-5" />}
            tag="Browser Benchmark"
            title="Test my GPU's speed"
            text="Measure your real memory bandwidth with WebGPU in five seconds, with no download, and see the speed ceiling it sets for popular models."
          />
          <ToolCard
            href="/new-models"
            icon={<Sparkles className="size-5" />}
            tag="Release Feed"
            title="What's new in open models"
            text="The latest releases from Qwen, Google, Meta, Mistral, DeepSeek and more, each rated for a laptop, a gaming GPU and a big Mac. With RSS."
          />
          <ToolCard
            href="/check"
            icon={<Image src="/brand/icon-hardware.svg" width={40} height={40} alt="" className="size-10" />}
            tag="6-Step Advisor"
            title="I don’t know which model"
            text="Answer plain-language questions about your machine and project; get instant fast, balanced, and flagship options."
          />
          <ToolCard
            href="/hardware-for-model"
            icon={<HardDrive className="size-5" />}
            tag="Reverse Finder"
            title="I know the model, not the hardware"
            text="Select a model, your favorite tool, and target experience to find the exact minimum and comfortable hardware required."
          />
          <ToolCard
            href="/hugging-face"
            icon={<Sparkles className="size-5" />}
            tag="Live Hub Parser"
            title="Check any Hugging Face model"
            text="Paste any HF model link — we parse config.json, GGUF quants, and KV architecture to rate it for your computer live."
          />
          <ToolCard
            href="/stack"
            icon={<Layers className="size-5" />}
            tag="Stack Builder"
            title="Build a complete local AI setup"
            text="Hardware → runtime → model → local API → coding agent, complete with copy-paste terminal setup instructions."
          />
          <ToolCard
            href="/compare/models"
            icon={<Scale className="size-5" />}
            tag="Model Comparison"
            title="Compare models on my machine"
            text="Put models side-by-side: memory footprints, headroom, decode tokens/sec, and agent step latency."
          />
          <ToolCard
            href="/compare/hardware"
            icon={<Cpu className="size-5" />}
            tag="Rig Comparison"
            title="Compare hardware for my workload"
            text="Mac mini vs MacBook Pro vs RTX desktop — evaluate real tradeoffs and bandwidth instead of synthetic hype."
          />
          <ToolCard
            href="/models"
            icon={<Image src="/brand/icon-model.svg" width={40} height={40} alt="" className="size-10" />}
            tag="Interactive Database"
            title={`Explore ${MODELS.length} curated models`}
            text="Filter by architecture, size, context, vision and license, including OSI open-source only."
          />
          <ToolCard
            href="/learn"
            icon={<BookOpen className="size-5" />}
            tag="Educational Center"
            title="Learn the concepts"
            text="Interactive visual calculators explaining KV cache growth, memory bandwidth limits, and quantization tradeoffs."
          />
        </div>

        {/* Database Stats Bar */}
        <div className="mt-10 rounded-2xl border border-border/70 bg-card p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-muted-foreground">
            <span>
              <strong className="text-foreground">{HARDWARE.length}</strong> Hardware Rigs
            </span>
            <span>·</span>
            <span>
              <strong className="text-foreground">{MODELS.length}</strong> Curated Models
            </span>
            <span>·</span>
            <span>
              <strong className="text-foreground">{RUNTIMES.length}</strong> Runtimes
            </span>
            <span>·</span>
            <span>
              <strong className="text-foreground">{TOOLS.length}</strong> AI Tools
            </span>
            <span>·</span>
            <span>
              <strong className="text-foreground">{BENCHMARKS.length}</strong> Calibrated Benchmarks
            </span>
          </div>
          <Link
            href="/methodology"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <span>Inspect Engine Math &amp; Sources</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function ToolCard({
  href,
  icon,
  tag,
  title,
  text,
  className,
}: {
  href: string;
  icon: React.ReactNode;
  tag: string;
  title: string;
  text: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("group", className)}>
      <Card className="flex h-full flex-col justify-between p-5 sm:p-6 transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-md group-hover:-translate-y-0.5">
        <div>
          <div className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              {icon}
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {tag}
            </span>
          </div>
          <h3 className="mt-4 text-base font-bold text-foreground flex items-center justify-between gap-1">
            <span>{title}</span>
            <ArrowRight className="size-4 text-primary opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
          </h3>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{text}</p>
        </div>
      </Card>
    </Link>
  );
}
