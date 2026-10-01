import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, BookOpen, Cpu, FileText, Gauge } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AgentStepsFigure, FitsFigure, MemoryPoolsFigure, MoeFigure, SpillFigure, TtftFigure } from "@/components/learn/figures";
import { Code, Example, GroupHeading, KeyConcept, Section, Takeaway } from "@/components/learn/prose";
import { KvCacheChart } from "@/components/learn/kv-cache-chart";
import { QuantCalculator } from "@/components/learn/quant-calculator";
import { WorkloadCompare } from "@/components/learn/workload-compare";
import { LearnToc, LearnTocMobile } from "@/components/learn/toc";

export const metadata: Metadata = {
  title: "Learn: local AI explained simply",
  description:
    "RAM vs VRAM, unified memory, quantization, context and KV cache, MoE, tokens per second, prompt processing, GGUF, MLX, CUDA and ROCm — explained in plain language, with live examples.",
};

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-12">
      <article className="min-w-0 max-w-4xl">
        {/* Hero */}
        <header>
          <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <BookOpen className="size-4" /> Learn
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Local AI, explained simply</h1>
          <p className="mt-4 max-w-prose text-lg leading-relaxed text-muted-foreground">
            The handful of ideas you need to understand why a model runs beautifully on one computer and crawls on another, and why the answer depends on
            what you actually want to do with it.
          </p>
        </header>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border/70 bg-[#F7F7F5]">
          <Image
            src="/brand/illustration-four-tiers.svg"
            width={1200}
            height={520}
            alt="Four levels of local AI fit: load, run, usable, and comfortable"
            className="h-auto w-full"
            unoptimized
          />
        </div>

        <div className="mt-6">
          <LearnTocMobile />
        </div>

        {/* Key concepts */}
        <div className="mt-10 space-y-8">
          <KeyConcept
            id="fits-is-not-fast"
            index={1}
            title="“Fits” does not mean “fast.”"
            lead={
              <>
                Most calculators only ask whether the model fits in memory. That is the <em>minimum</em>, not the goal. A model can fit and still make your
                computer miserable to use.
              </>
            }
          >
            <div className="space-y-3">
              <h3 className="font-semibold">1 · Fitting with no room to breathe</h3>
              <p>
                A model that uses 23 of your 24 GB technically fits. But your operating system, code editor, browser tabs and chat app need memory too. They
                get squeezed into compressed memory or swap, and the whole machine starts to stutter.
              </p>
              <FitsFigure />
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold">2 · Fitting in the wrong kind of memory</h3>
              <p>
                On a PC with a graphics card, a model that is slightly too large for <a href="#vram" className="text-primary hover:underline">VRAM</a>{" "}
                “spills” its extra layers into system RAM. It still runs, but the RAM part is roughly ten times slower to read, and every token waits for it.
              </p>
              <SpillFigure />
            </div>
            <Takeaway>
              That is why Local AI Advisor rates setups from <strong>Technically Runs</strong> to <strong>Excellent</strong> instead of a simple yes/no.
            </Takeaway>
          </KeyConcept>

          <KeyConcept
            id="chat-is-not-agent"
            index={2}
            title="“Fast chat” does not necessarily mean “good coding agent.”"
            lead={
              <>
                In chat you ask once and read the answer as it streams. A coding agent (OpenCode, Claude Code-style tools, Cline…) makes{" "}
                <strong>dozens of calls in a row</strong>, each with a large prompt full of files, tool definitions and history.
              </>
            }
          >
            <ul className="grid gap-3 sm:grid-cols-3">
              {[
                { t: "Big prompts", d: "Each step sends thousands of tokens the model must read first: that is prefill, not generation." },
                { t: "Waits compound", d: "A 60-second step is fine once. Thirty of them is half an hour of waiting." },
                { t: "Smaller can win", d: "A smaller or MoE model with fast steps often finishes the task sooner than a bigger, slower one." },
              ].map((x) => (
                <li key={x.t} className="rounded-lg border bg-card p-3 text-sm">
                  <p className="font-semibold">{x.t}</p>
                  <p className="mt-1 text-muted-foreground">{x.d}</p>
                </li>
              ))}
            </ul>
            <AgentStepsFigure />
            <WorkloadCompare />
          </KeyConcept>
        </div>

        <div className="mt-16 space-y-10">
          {/* ---------------- Memory ---------------- */}
          <GroupHeading id="memory" eyebrow="Part 1" title="Memory">
            Where the model lives while it runs, and how quickly it can be read.
          </GroupHeading>

          <Section id="ram" title="RAM" summary="Your computer’s main working memory, shared by the operating system and every app you have open.">
            <p>
              When a model runs on the CPU, or partly on it, its weights sit in RAM. RAM is plentiful and cheap but comparatively slow to read: typical desktop
              DDR5 delivers 60–100 GB/s.
            </p>
            <Example>
              <p>
                Generating each token means reading essentially the whole model once. A 10 GB model on 80 GB/s RAM tops out around 8 tokens per second, no
                matter how fast the CPU is.
              </p>
            </Example>
            <Takeaway>For local AI, memory bandwidth usually matters more than raw compute.</Takeaway>
          </Section>

          <Section id="vram" title="VRAM" summary="Memory soldered onto a graphics card. Small, expensive and very fast.">
            <p>
              A modern GPU reads its VRAM at 500–1,800 GB/s, often 10× faster than system RAM. If the model, its{" "}
              <a href="#kv-cache" className="text-primary hover:underline">KV cache</a> and the runtime’s buffers all fit in VRAM, speed is great. If not, the
              overflow spills to RAM over the PCIe bus and speed drops sharply.
            </p>
            <Example>
              <p>
                An RTX 4090 has 24 GB of VRAM. A 20 GB model with a modest context fits entirely; a 30 GB model doesn’t, and runs several times slower even
                though the PC has 64 GB of RAM.
              </p>
            </Example>
            <MemoryPoolsFigure />
          </Section>

          <Section
            id="unified-memory"
            title="Unified memory"
            summary="One pool of fast memory shared by the CPU and GPU, as on Apple Silicon Macs, AMD Ryzen AI Max (Strix Halo) and NVIDIA DGX Spark."
          >
            <p>
              There is no separate VRAM to overflow, so these machines can run much larger models than a typical graphics card. Bandwidth sits in between: ~120
              GB/s on a base M4, ~270 GB/s on an M4 Pro, ~550 GB/s on an M4 Max, ~256 GB/s on Ryzen AI Max and ~273 GB/s on DGX Spark.
            </p>
            <p>
              The catch: the model shares that pool with everything else you run. And the GPU is not allowed to use all of it. On macOS the GPU’s{" "}
              <strong>wired-memory limit</strong> is about two-thirds of RAM on smaller Macs and about three-quarters on larger ones. Advanced users can raise it
              with <Code>sudo sysctl iogpu.wired_limit_mb=…</Code>, at the cost of leaving less for macOS and apps. On Ryzen AI Max the GPU share is set in the
              BIOS or driver.
            </p>
            <Example>
              <p>A 48 GB MacBook Pro lets the GPU use about 36 GB by default. A 34 GB model plus its KV cache may not fit on the GPU, even though 48 GB is installed.</p>
            </Example>
          </Section>

          {/* ---------------- Model size ---------------- */}
          <GroupHeading id="model-size" eyebrow="Part 2" title="Model size">
            What determines how much memory a model needs, and how much of it is read for every token.
          </GroupHeading>

          <Section id="parameters" title="Parameters" summary="The numbers a model learned during training. “27B” means 27 billion of them.">
            <p>
              More parameters generally means a more capable model, and a bigger, slower one. Memory needed ≈ parameters × bytes per parameter. At full
              16-bit precision that is 2 bytes each, so a 27B model needs ~54 GB before{" "}
              <a href="#quantization" className="text-primary hover:underline">quantization</a>.
            </p>
            <Example>
              <p>8B fits on almost anything with 16 GB. 27–32B is the sweet spot for 32–48 GB machines. 70B+ needs 64 GB or more to run comfortably.</p>
            </Example>
          </Section>

          <Section
            id="active-parameters"
            title="Active parameters"
            summary="How many parameters are actually used to produce each token. For ordinary (dense) models that is all of them."
          >
            <p>
              Generation speed is mostly set by how many bytes have to be read per token. Dense models read every parameter every time. Mixture-of-Experts
              models only read a small, changing subset, written like <Code>35B-A3B</Code>: 35B total, about 3B active.
            </p>
          </Section>

          <Section id="moe" title="Mixture of Experts (MoE)" summary="A model split into many “experts”; a router picks a few of them for each token.">
            <MoeFigure />
            <p>
              <strong>Memory follows total parameters, speed follows active parameters.</strong> A 35B-A3B MoE needs about as much memory as a 35B dense model,
              but generates tokens almost as fast as a 3B one. That makes MoE models a great match for unified-memory machines: lots of room, moderate bandwidth.
            </p>
            <Example>
              <p>
                On a 48 GB M4 Pro, Qwen3.6 27B (dense) generates around a dozen tokens per second; Qwen3.6 35B-A3B (MoE) is larger in memory yet several times
                faster. See it in the live comparison under <a href="#chat-is-not-agent" className="text-primary hover:underline">Key concept 2</a>.
              </p>
            </Example>
          </Section>

          <Section
            id="quantization"
            title="Quantization"
            summary="Storing each weight with fewer bits so the model is smaller and faster to read, with a little quality loss."
          >
            <p>
              Labels like <Code>Q4_K_M</Code> or “4-bit” describe the <strong>bits per weight</strong>. FP16/BF16 is full precision (16 bits). Q8 halves that
              with practically no loss. Q4 (≈4.8 bits including scales) is the usual sweet spot: roughly 30% of FP16’s size with a small quality loss. Q3 and
              below save more memory but start to hurt, especially for coding and smaller models. <strong>MXFP4</strong> is a 4-bit format some models (like
              gpt-oss) are released in natively, so it carries no extra loss.
            </p>
            <QuantCalculator />
            <Takeaway>Smaller quants are also faster: fewer bytes per token to read. A bigger model at Q4 usually beats a smaller model at Q8.</Takeaway>
          </Section>

          {/* ---------------- Context ---------------- */}
          <GroupHeading id="context-group" eyebrow="Part 3" title="Context">
            How much text the model can “see” at once, and what that costs.
          </GroupHeading>

          <Section
            id="context"
            title="Context window"
            summary="The amount of text, measured in tokens, the model can consider at once: your messages, its replies, files and tool output."
          >
            <p>
              A token is roughly ¾ of an English word, or about 4 characters of code. 8K tokens ≈ a long article; 32K ≈ a few dozen source files; 128K ≈ a
              short book. A model’s advertised maximum (say 256K) is not what you should run: every token of context costs memory and slows prompt processing.
            </p>
            <Example>
              <p>
                Casual chat rarely needs more than 8–16K. Coding agents re-send the system prompt, tool definitions, file contents and history every step, so
                they typically need 32–64K or more.
              </p>
            </Example>
          </Section>

          <Section
            id="kv-cache"
            title="KV cache"
            summary="The model’s short-term memory of the context so far: keys and values stored for every token, so it doesn’t re-read everything each step."
          >
            <p>
              The KV cache grows with context length and sits next to the weights, on the GPU. For classic models it grows in a straight line and can reach
              tens of gigabytes at long context. Newer hybrid designs (sliding-window or linear attention in some layers) grow much more slowly. Runtimes like
              llama.cpp can also store the cache at 8-bit (“Q8 KV”), roughly halving it with minor quality impact.
            </p>
            <KvCacheChart />
          </Section>

          {/* ---------------- Speed ---------------- */}
          <GroupHeading id="speed" eyebrow="Part 4" title="Speed">
            The three numbers that decide how responsive a model feels.
          </GroupHeading>

          <Section
            id="tokens-per-second"
            title="Tokens/sec (generation)"
            summary="How fast the model writes its answer, once it has started."
          >
            <p>
              Limited mostly by memory bandwidth ÷ bytes read per token (the active weights). As a rough guide for reading along: under 5 tok/s feels painful,
              10–20 is readable, 30+ feels fast, and agents benefit from 40+ because they generate lots of text you never read. Speed also drops as the
              context fills up.
            </p>
            <Example>
              <p>
                A 17 GB model on a 270 GB/s Mac has a theoretical ceiling around 16 tok/s; real-world efficiency puts it nearer 12. The same model at 1,000
                GB/s on a big GPU: 40–50 tok/s.
              </p>
            </Example>
          </Section>

          <Section
            id="prompt-processing"
            title="Prompt processing (prefill)"
            summary="How fast the model reads your input before it can start answering."
          >
            <p>
              Prefill processes many tokens in parallel, so it is limited by compute rather than bandwidth, and it is where GPUs differ the most. A discrete
              NVIDIA GPU may prefill thousands of tokens per second; a laptop chip might manage a few hundred.
            </p>
            <Example>
              <p>
                Pasting a 20,000-token file at 200 tok/s prefill means 100 seconds of silence before the first word. At 2,000 tok/s it is 10 seconds. For chat
                you rarely notice; for <a href="#chat-is-not-agent" className="text-primary hover:underline">coding agents</a> it often dominates.
              </p>
            </Example>
            <Takeaway>Runtimes reuse a cached prefix (the unchanged start of the conversation), so only new tokens are re-processed. That helps a lot.</Takeaway>
          </Section>

          <Section
            id="time-to-first-token"
            title="Time to first token (TTFT)"
            summary="How long you stare at a blank reply after pressing Enter."
          >
            <p>TTFT ≈ (model load time, first request only) + new prompt tokens ÷ prefill speed. It is the number that makes a tool feel snappy or sluggish.</p>
            <TtftFigure />
          </Section>

          {/* ---------------- Software ---------------- */}
          <GroupHeading id="software" eyebrow="Part 5" title="Formats & backends">
            The file format a model comes in, and the low-level software that drives your GPU.
          </GroupHeading>

          <div className="grid gap-4 sm:grid-cols-2">
            <SoftwareCard
              id="gguf"
              icon={<FileText className="size-4" />}
              title="GGUF"
              summary="The single-file model format used by llama.cpp, and therefore by Ollama, LM Studio, Jan and many others."
            >
              Runs almost everywhere: Mac, Windows, Linux, CPU or any GPU. Quantization names like <Code>Q4_K_M</Code> and <Code>Q8_0</Code> come from GGUF.
              The safe default.
            </SoftwareCard>
            <SoftwareCard
              id="mlx"
              icon={<FileText className="size-4" />}
              title="MLX"
              summary="Apple’s machine-learning framework and model format, built for Apple Silicon only."
            >
              Used by LM Studio’s MLX engine and <Code>mlx-lm</Code>. Often 10–30% faster than GGUF on a Mac, especially for prompt processing and MoE models.
              Models come as “4-bit”, “8-bit” etc.
            </SoftwareCard>
            <SoftwareCard
              id="cuda"
              icon={<Cpu className="size-4" />}
              title="CUDA"
              summary="NVIDIA’s GPU programming platform: the most mature and fastest-supported option."
            >
              Every runtime supports it first: llama.cpp, Ollama, LM Studio, vLLM, SGLang, ExLlama. If you have an NVIDIA card, things generally just work.
            </SoftwareCard>
            <SoftwareCard
              id="rocm"
              icon={<Gauge className="size-4" />}
              title="ROCm, Vulkan & Metal"
              summary="ROCm is AMD’s answer to CUDA. Vulkan and Metal are graphics APIs that also run AI."
            >
              ROCm works well on supported Radeon / Instinct cards and Linux, with patchier support elsewhere. <strong>Vulkan</strong> runs on almost any
              GPU (AMD, Intel, NVIDIA), is easy to set up and is sometimes even faster than ROCm for generation. <strong>Metal</strong> is what llama.cpp and
              MLX use on Macs.
            </SoftwareCard>
          </div>
        </div>

        {/* Next steps */}
        <Card className="mt-16 bg-linear-to-br from-accent/70 to-card p-6 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Put it to work</h2>
          <p className="mt-2 max-w-prose text-muted-foreground">
            Now you know what matters. Let the advisor do the arithmetic for your exact computer, tools and workload.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <LinkButton href="/check" size="lg">
              Check my computer <ArrowRight className="size-4" />
            </LinkButton>
            <LinkButton href="/hardware-for-model" variant="outline" size="lg">
              Find hardware for a model
            </LinkButton>
            <LinkButton href="/methodology" variant="ghost" size="lg">
              How we estimate
            </LinkButton>
          </div>
        </Card>
      </article>

      <aside className="hidden lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-6">
          <LearnToc />
        </div>
      </aside>
    </div>
  );
}

function SoftwareCard({
  id,
  icon,
  title,
  summary,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 rounded-xl border bg-card p-5">
      <h3 id={`${id}-title`} className="flex items-center gap-2 text-lg font-semibold">
        <span className="grid size-7 place-items-center rounded-md bg-accent text-accent-foreground">{icon}</span>
        <a href={`#${id}`} className="hover:underline">
          {title}
        </a>
      </h3>
      <p className="mt-2 font-medium leading-snug">{summary}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </section>
  );
}
