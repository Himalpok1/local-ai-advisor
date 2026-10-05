import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Compass, Cpu, HelpCircle, Laptop, ListChecks, Lock, MessageSquare, ShoppingCart, Sparkles, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";
import { Eyebrow, Sticker, type StickerColor } from "@/components/art/sticker";
import { BurstBadge, ShapeField } from "@/components/art/shapes";
import { ChipMascot, LaptopArt, MemoryArt, TiersArt } from "@/components/art/illustrations";
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
import { JsonLd, siteGraph } from "@/components/seo/json-ld";

export const metadata: Metadata = { alternates: { canonical: "/" } };

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
      <JsonLd data={siteGraph({ models: MODELS.length, computers: HARDWARE.length })} />
      {/* Hero */}
      <section className="bg-grid relative overflow-hidden border-b-2 border-ink">
        <ShapeField
          items={[
            { shape: "star", className: "right-4 top-3 size-10 rotate-12 text-sticker-green lg:left-[47%] lg:right-auto lg:top-[7%] lg:size-14" },
            { shape: "sparkle", className: "right-[7%] top-[4%] hidden size-12 text-primary sm:block" },
            { shape: "pinwheel", className: "bottom-[5%] left-[50%] hidden size-14 text-sticker-pink lg:block" },
            { shape: "clover", className: "bottom-[4%] right-[3%] size-12 -rotate-12 text-sticker-blue sm:size-16" },
            { shape: "star", className: "bottom-[6%] left-[38%] hidden size-10 text-sticker-orange xl:block" },
          ]}
        />
        <div className="relative mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] items-center gap-12 px-4 pb-28 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:pb-24 lg:pt-20">
          <div className="text-center lg:text-left">
            <Sticker color="white" rotate={-2} className="animate-fade-up text-xs sm:text-sm">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-sticker-green opacity-70" />
                <span className="relative inline-flex size-2.5 rounded-full border-[1.5px] border-ink bg-sticker-green" />
              </span>
              Free · no sign-up · {MODELS.length} models rated
            </Sticker>
            <h1 className="mt-6 animate-fade-up text-[2.6rem] font-extrabold leading-[1.02] tracking-tight text-balance [animation-delay:80ms] sm:text-6xl lg:text-[4.5rem]">
              Your own ChatGPT, running on <span className="marker marker-green">your computer.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl animate-fade-up text-lg leading-relaxed text-foreground/80 text-pretty [animation-delay:160ms] lg:mx-0">
              Local AI is private, free and works offline. Tell us what computer you have and we’ll show you which AI models will run smoothly on it, and
              exactly how to install them.
            </p>
            <div className="mt-8 flex animate-fade-up flex-col items-center gap-4 [animation-delay:240ms] sm:flex-row sm:justify-center lg:justify-start">
              <Link href="/check" className={cn(buttonClass("primary", "lg"), "group w-full sm:w-auto")}>
                Check my computer <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/learn" className={cn(buttonClass("outline", "lg"), "w-full sm:w-auto")}>
                <BookOpen className="size-5" /> New to this? Start learning
              </Link>
            </div>
            <p className="mt-4 flex animate-fade-up items-center justify-center gap-1.5 text-sm font-medium text-foreground/70 [animation-delay:300ms] lg:justify-start">
              <Clock className="size-4" /> The check takes about a minute
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-lg animate-fade-up [animation-delay:200ms]">
            <HeroChat />
            <Sticker color="green" rotate={-6} className="absolute -left-4 top-14 hidden animate-float lg:inline-flex">
              <Lock className="size-4" /> Private
            </Sticker>
            <Sticker color="pink" rotate={5} className="absolute -right-5 bottom-24 hidden animate-float [animation-delay:1.5s] lg:inline-flex">
              <WifiOff className="size-4" /> Works offline
            </Sticker>
            <BurstBadge className="absolute -bottom-[6.5rem] right-2 size-24 rotate-12 sm:right-6 sm:size-28" shapeClassName="text-sticker-orange">
              100%
              <br />
              free
            </BurstBadge>
          </div>
        </div>
      </section>

      {/* What is local AI */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionHeading eyebrow="Local AI in 30 seconds" color="green" title="Three pieces, all on your computer">
          You download a free app and an AI model. The app runs the model on your own machine. No account, no cloud.
        </SectionHeading>
        <Reveal className="mt-8">
          <LocalAiDiagram />
        </Reveal>
        <Reveal className="mt-6 text-center">
          <Link href="/learn/what-is-local-ai" className={buttonClass("outline", "md")}>
            Lesson 1: What is local AI? <ArrowRight className="size-4" />
          </Link>
        </Reveal>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="How it works" color="pink" title="Three questions. Honest answers.">
          We do the math for your exact computer, so you don’t have to learn it first.
        </SectionHeading>
        <Stagger as="ol" className="relative mt-12 grid gap-5 md:grid-cols-3 md:gap-6">
          {/* The line joining the steps on desktop. */}
          <span className="absolute left-[16%] right-[16%] top-10 hidden h-1 rounded-full flow-x opacity-40 md:block" aria-hidden />
          {HOW.map((s, i) => (
            <StaggerItem as="li" key={s.title} className="relative flex gap-4 rounded-2xl border-2 border-ink bg-card p-5 shadow-brutal md:flex-col md:items-center md:p-6 md:text-center">
              <span className={cn("relative grid size-16 shrink-0 place-items-center rounded-2xl border-2 border-ink text-on-fill shadow-brutal-sm", STEP_COLORS[i])}>
                <s.icon className="size-7" />
                <span className="absolute -right-3 -top-3 grid size-7 place-items-center rounded-full border-2 border-ink bg-card text-xs font-extrabold text-foreground">{i + 1}</span>
              </span>
              <span>
                <span className="block font-display text-xl font-extrabold">{s.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{s.text}</span>
              </span>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal className="mt-10 text-center">
          <Link href="/check" className={buttonClass("primary", "lg")}>
            Try it now <ArrowRight className="size-5" />
          </Link>
        </Reveal>
      </section>

      {/* Feel the speed */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1fr] lg:gap-14">
        <Reveal>
          <Eyebrow color="blue">Why your computer matters</Eyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">The same AI can type like a snail, or faster than you read.</h2>
          <p className="mt-4 text-lg leading-relaxed text-foreground/80">
            Speed is measured in <strong className="text-foreground">tokens per second</strong> (a token is about ¾ of a word). Tap the speeds to feel the
            difference. Your computer decides which one you get.
          </p>
          <Link href="/learn/speed" className={cn(buttonClass("outline", "md"), "mt-5")}>
            Learn what decides the speed <ArrowRight className="size-4" />
          </Link>
          <LaptopArt className="mt-8 hidden w-44 lg:block" />
        </Reveal>
        <Reveal delay={0.1}>
          <SpeedFeel />
        </Reveal>
      </section>

      {/* It fits ≠ it runs well */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:gap-14">
        <Reveal className="lg:order-2">
          <Eyebrow color="orange">Why we’re different</Eyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">“It fits” doesn’t mean “it runs well”.</h2>
          <p className="mt-4 text-lg leading-relaxed text-foreground/80">
            Most calculators only check whether a model squeezes into memory. But your computer needs room to breathe too. We rate how a model will{" "}
            <strong className="text-foreground">feel</strong>, from “Technically runs” to “Excellent”.
          </p>
          <Link href="/learn/fits-vs-fast" className={cn(buttonClass("outline", "md"), "mt-5")}>
            See why in 3 minutes <ArrowRight className="size-4" />
          </Link>
          <div className="mt-8 hidden items-end gap-4 lg:flex">
            <TiersArt className="w-40" />
            <MemoryArt className="w-40" />
          </div>
        </Reveal>
        <Reveal delay={0.1} className="lg:order-1">
          <MemoryFill />
        </Reveal>
      </section>

      {/* Popular computers */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Popular computers" color="yellow" title="What runs on a computer like yours?">
          Our top picks for chatting and for coding on the machines people ask about most.
        </SectionHeading>
        <div className="mt-10">
          <PopularRigsMatrix rigs={rigs} />
        </div>
      </section>

      {/* Learn */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="relative overflow-hidden rounded-2xl border-2 border-ink bg-sticker-blue text-on-fill shadow-brutal-xl">
          <ShapeField
            items={[
              { shape: "star", className: "-right-4 -top-4 size-20 text-primary" },
              { shape: "sparkle", className: "bottom-3 left-[44%] hidden size-10 text-sticker-pink lg:block" },
            ]}
          />
          <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <Eyebrow color="white">
                <BookOpen className="size-3.5" /> Free course
              </Eyebrow>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">New to local AI? Learn it in {LESSONS.length} short lessons.</h2>
              <p className="mt-3 text-lg leading-relaxed">
                Animated, jargon-free, about {TOTAL_MINUTES} minutes in total. Each lesson ends with a quick question so you know it clicked.
              </p>
              <Link href="/learn" className={cn(buttonClass("outline", "lg"), "mt-6")}>
                Start learning <ArrowRight className="size-5" />
              </Link>
            </div>
            <ol className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 py-2 sm:-mx-10 sm:px-10 lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0">
              {LESSONS.slice(0, 6).map((l, i) => (
                <li key={l.slug} className="w-60 shrink-0 snap-start lg:w-auto">
                  <Link href={`/learn/${l.slug}`} className="press flex h-full flex-col rounded-2xl border-2 border-ink bg-card p-4 text-foreground shadow-brutal-sm">
                    <span className="grid size-8 place-items-center rounded-full border-2 border-ink bg-primary text-sm font-extrabold text-on-fill">{i + 1}</span>
                    <span className="mt-3 font-bold leading-snug">{l.title}</span>
                    <span className="mt-1 text-xs text-muted-foreground">{l.minutes} min</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </section>

      {/* Choose your path */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Where to start" color="green" title="Pick the one that sounds like you" />
        <Stagger className="mt-10 grid gap-5 md:grid-cols-3">
          {PATHS.map((p, i) => (
            <StaggerItem key={p.href}>
              <Link href={p.href} className={cn("press group flex h-full flex-col rounded-2xl border-2 border-ink p-6 shadow-brutal", PATH_COLORS[i])}>
                <span className="grid size-12 place-items-center rounded-xl border-2 border-ink bg-card text-foreground">
                  <p.icon className="size-6" />
                </span>
                <span className="mt-4 font-display text-2xl font-extrabold">{p.title}</span>
                <span className="mt-1.5 flex-1 text-on-fill/85">{p.text}</span>
                <span className="mt-5 inline-flex items-center gap-1.5 font-bold">
                  {p.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="mt-12 rounded-2xl border-2 border-ink bg-card p-5 shadow-brutal sm:p-6">
          <div className="flex items-start gap-4">
            <ChipMascot className="hidden w-20 sm:block" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-display text-lg font-extrabold">
                <Sparkles className="size-5" /> More tools for when you’re ready
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {moreTools.map((t) => (
                  <li key={t.href}>
                    <Link
                      href={t.href}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-full border-2 border-ink bg-card px-3.5 text-sm font-bold transition hover:bg-primary hover:text-on-fill active:translate-y-px"
                    >
                      <t.icon className="size-4" /> {t.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                <Cpu className="mt-0.5 size-4 shrink-0" />
                <span>
                  Ratings come from a model of each computer’s memory and speed, calibrated against public benchmarks.{" "}
                  <Link href="/methodology" className="font-semibold text-link underline decoration-primary decoration-2 underline-offset-4 hover:bg-primary hover:text-on-fill">
                    How we calculate
                  </Link>
                </span>
              </p>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

const STEP_COLORS = ["bg-primary", "bg-sticker-pink", "bg-sticker-green"];
const PATH_COLORS = ["bg-primary text-on-fill", "bg-sticker-pink text-on-fill", "bg-sticker-green text-on-fill"];

function SectionHeading({ eyebrow, color, title, children }: { eyebrow: string; color: StickerColor; title: string; children?: React.ReactNode }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <Eyebrow color={color}>{eyebrow}</Eyebrow>
      <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {children && <p className="mt-3 text-lg leading-relaxed text-foreground/80 text-pretty">{children}</p>}
    </Reveal>
  );
}
