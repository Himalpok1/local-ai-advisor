import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Compass, Cpu, HelpCircle, Laptop, ListChecks, Lock, MessageSquare, ShoppingCart, Sparkles, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeroChat } from "@/components/explainers/hero-chat";
import { LocalAiDiagram } from "@/components/explainers/local-ai-diagram";
import { SpeedFeel } from "@/components/explainers/speed-feel";
import { MemoryFill } from "@/components/explainers/memory-fill";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { PopularRigsMatrix, type RigCategory } from "@/components/home/popular-rigs";
import { LESSONS, TOTAL_MINUTES } from "@/components/learn/lessons";
import { TOOL_GROUPS } from "@/components/site/nav";
import { rigSummary } from "@/lib/can-i-run";
import { HARDWARE, MODELS } from "@/data";

/** Machines shown in "Popular computers"; their picks are computed by the engine. */
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

const HOW = [
  { icon: Laptop, title: "Tell us your computer", text: "Pick it from a list, or let us detect it for you. Mac, Windows PC or Linux." },
  { icon: MessageSquare, title: "Say what you want to do", text: "Chat, write, read long documents, code with an AI agent… each needs something different." },
  { icon: ListChecks, title: "Get models that feel good", text: "Ranked by how they’ll actually feel to use, with copy-paste install steps." },
];

const PATHS = [
  { href: "/check", icon: Compass, title: "I have a computer", text: "Find the best models for the machine you already own.", cta: "Check my computer" },
  { href: "/can-i-run", icon: HelpCircle, title: "I have a model in mind", text: "See if Llama, Qwen, Gemma or another model runs on your computer.", cta: "Can I run it?" },
  { href: "/hardware-for-model", icon: ShoppingCart, title: "I’m shopping for a computer", text: "Find what to buy to run the models you want, comfortably.", cta: "Find hardware" },
];

export default function Home() {
  const rigs = POPULAR_RIGS.map(({ id, category }) => ({ ...rigSummary(HARDWARE.find((h) => h.id === id)!), category }));
  const moreTools = TOOL_GROUPS.flatMap((g) => g.items).filter((t) => !["/check", "/can-i-run", "/hardware-for-model"].includes(t.href));

  return (
    <div className="space-y-20 sm:space-y-28">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="glow-primary pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] items-center gap-10 px-4 pb-4 pt-8 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:pt-20">
          <div className="text-center lg:text-left">
            <p className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-comfortable opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-comfortable" />
              </span>
              Free · no sign-up · {MODELS.length} models rated
            </p>
            <h1 className="mt-5 animate-fade-up text-[2.5rem] font-extrabold leading-[1.05] tracking-tight text-balance [animation-delay:80ms] sm:text-6xl lg:text-[4.25rem]">
              Your own ChatGPT, running on <span className="text-primary">your computer.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl animate-fade-up text-lg leading-relaxed text-muted-foreground text-pretty [animation-delay:160ms] lg:mx-0">
              Local AI is private, free and works offline. Tell us what computer you have and we’ll show you which AI models will run smoothly on it, and
              exactly how to install them.
            </p>
            <div className="mt-8 flex animate-fade-up flex-col items-center gap-3 [animation-delay:240ms] sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/check"
                className="group inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-7 text-lg font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition hover:brightness-110 active:scale-[0.98] sm:w-auto"
              >
                Check my computer <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/learn"
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card px-6 text-base font-semibold shadow-sm transition hover:bg-muted active:scale-[0.98] sm:w-auto"
              >
                <BookOpen className="size-5 text-primary" /> New to this? Start learning
              </Link>
            </div>
            <p className="mt-3 flex animate-fade-up items-center justify-center gap-1.5 text-sm text-muted-foreground [animation-delay:300ms] lg:justify-start">
              <Clock className="size-4" /> The check takes about a minute
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-lg animate-fade-up [animation-delay:200ms]">
            <HeroChat />
            <span className="absolute -left-6 top-16 hidden animate-float rounded-2xl border border-border/70 bg-card px-3 py-2 text-sm font-semibold shadow-lg lg:flex lg:items-center lg:gap-1.5">
              <Lock className="size-4 text-comfortable" /> Private
            </span>
            <span className="absolute -right-5 bottom-24 hidden animate-float rounded-2xl border border-border/70 bg-card px-3 py-2 text-sm font-semibold shadow-lg [animation-delay:1.5s] lg:flex lg:items-center lg:gap-1.5">
              <WifiOff className="size-4 text-primary" /> Works offline
            </span>
          </div>
        </div>
      </section>

      {/* What is local AI */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionHeading eyebrow="Local AI in 30 seconds" title="Three pieces, all on your computer">
          You download a free app and an AI model. The app runs the model on your own machine. No account, no cloud.
        </SectionHeading>
        <Reveal className="mt-8">
          <LocalAiDiagram />
        </Reveal>
        <Reveal className="mt-4 text-center">
          <Link href="/learn/what-is-local-ai" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary hover:underline">
            Lesson 1: What is local AI? <ArrowRight className="size-4" />
          </Link>
        </Reveal>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="How it works" title="Three questions. Honest answers.">
          We do the math for your exact computer, so you don’t have to learn it first.
        </SectionHeading>
        <Stagger as="ol" className="relative mt-10 grid gap-4 md:grid-cols-3 md:gap-6">
          {/* The line joining the steps on desktop. */}
          <span className="absolute left-[16%] right-[16%] top-8 hidden h-1 rounded-full flow-x opacity-40 md:block" aria-hidden />
          {HOW.map((s, i) => (
            <StaggerItem as="li" key={s.title} className="relative flex gap-4 rounded-3xl border border-border/70 bg-card p-5 shadow-sm md:flex-col md:items-center md:p-6 md:text-center">
              <span className="relative grid size-16 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                <s.icon className="size-7" />
                <span className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full border-2 border-card bg-foreground text-xs font-bold text-background">
                  {i + 1}
                </span>
              </span>
              <span>
                <span className="block text-lg font-bold">{s.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{s.text}</span>
              </span>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal className="mt-8 text-center">
          <Link
            href="/check"
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-foreground px-6 font-semibold text-background transition hover:opacity-90 active:scale-[0.98]"
          >
            Try it now <ArrowRight className="size-4" />
          </Link>
        </Reveal>
      </section>

      {/* Feel the speed */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1fr] lg:gap-14">
        <Reveal>
          <p className="text-sm font-semibold text-primary">Why your computer matters</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">The same AI can type like a snail, or faster than you read.</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Speed is measured in <strong className="text-foreground">tokens per second</strong> (a token is about ¾ of a word). Tap the speeds to feel the
            difference. Your computer decides which one you get.
          </p>
          <Link href="/learn/speed" className="mt-4 inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary hover:underline">
            Learn what decides the speed <ArrowRight className="size-4" />
          </Link>
        </Reveal>
        <Reveal delay={0.1}>
          <SpeedFeel />
        </Reveal>
      </section>

      {/* It fits ≠ it runs well */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:gap-14">
        <Reveal className="lg:order-2">
          <p className="text-sm font-semibold text-primary">Why we’re different</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">“It fits” doesn’t mean “it runs well”.</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Most calculators only check whether a model squeezes into memory. But your computer needs room to breathe too. We rate how a model will{" "}
            <strong className="text-foreground">feel</strong>, from “Technically runs” to “Excellent”.
          </p>
          <Link href="/learn/fits-vs-fast" className="mt-4 inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary hover:underline">
            See why in 3 minutes <ArrowRight className="size-4" />
          </Link>
        </Reveal>
        <Reveal delay={0.1} className="lg:order-1">
          <MemoryFill />
        </Reveal>
      </section>

      {/* Popular computers */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Popular computers" title="What runs on a computer like yours?">
          Our top picks for chatting and for coding on the machines people ask about most.
        </SectionHeading>
        <div className="mt-8">
          <PopularRigsMatrix rigs={rigs} />
        </div>
      </section>

      {/* Learn */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="overflow-hidden rounded-[2rem] bg-primary text-primary-foreground shadow-xl shadow-primary/20">
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                <BookOpen className="size-3.5" /> Free course
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">New to local AI? Learn it in {LESSONS.length} short lessons.</h2>
              <p className="mt-3 text-lg leading-relaxed opacity-90">
                Animated, jargon-free, about {TOTAL_MINUTES} minutes in total. Each lesson ends with a quick question so you know it clicked.
              </p>
              <Link
                href="/learn"
                className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-6 font-semibold text-primary shadow-lg transition hover:bg-white/90 active:scale-[0.98]"
              >
                Start learning <ArrowRight className="size-4" />
              </Link>
            </div>
            <ol className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 sm:-mx-10 sm:px-10 lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0">
              {LESSONS.slice(0, 6).map((l, i) => (
                <li key={l.slug} className="w-60 shrink-0 snap-start lg:w-auto">
                  <Link href={`/learn/${l.slug}`} className="flex h-full flex-col rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 transition hover:bg-white/15 active:scale-[0.98]">
                    <span className="grid size-8 place-items-center rounded-full bg-white text-sm font-bold text-primary">{i + 1}</span>
                    <span className="mt-3 font-bold leading-snug">{l.title}</span>
                    <span className="mt-1 text-xs opacity-80">{l.minutes} min</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </section>

      {/* Choose your path */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Where to start" title="Pick the one that sounds like you" />
        <Stagger className="mt-8 grid gap-4 md:grid-cols-3">
          {PATHS.map((p, i) => (
            <StaggerItem key={p.href}>
              <Link
                href={p.href}
                className={cn(
                  "group flex h-full flex-col rounded-3xl border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.99]",
                  i === 0 ? "border-primary/50 ring-1 ring-primary/20" : "border-border/70 hover:border-primary/40",
                )}
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <p.icon className="size-6" />
                </span>
                <span className="mt-4 text-xl font-bold">{p.title}</span>
                <span className="mt-1.5 flex-1 text-muted-foreground">{p.text}</span>
                <span className="mt-5 inline-flex items-center gap-1.5 font-semibold text-primary">
                  {p.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="mt-10 rounded-3xl border border-border/70 bg-muted/40 p-5 sm:p-6">
          <p className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-4 text-primary" /> More tools for when you’re ready
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {moreTools.map((t) => (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border/80 bg-card px-3.5 text-sm font-medium transition hover:border-primary/50 hover:text-primary active:scale-95"
                >
                  <t.icon className="size-4 text-muted-foreground" /> {t.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
            <Cpu className="mt-0.5 size-4 shrink-0" />
            Ratings come from a model of each computer’s memory and speed, calibrated against public benchmarks.{" "}
            <Link href="/methodology" className="font-medium text-foreground underline-offset-2 hover:underline">
              How we calculate
            </Link>
          </p>
        </Reveal>
      </section>
    </div>
  );
}

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {children && <p className="mt-3 text-lg leading-relaxed text-muted-foreground text-pretty">{children}</p>}
    </Reveal>
  );
}
