import Link from "next/link";
import { ArrowRight, Bot, Cpu, HardDrive, Layers, Search, Sparkles } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HomeDemo } from "@/components/home/home-demo";
import { BENCHMARKS, HARDWARE, MODELS, RUNTIMES, TOOLS } from "@/data";
import { COMFORT_DESCRIPTION, COMFORT_LABEL, COMFORT_LEVELS } from "@/lib/schemas/results";
import { ComfortBadge } from "@/components/advisor/comfort";

const TIERS = [
  { title: "Can load", text: "The model physically fits into usable RAM / VRAM / unified memory." },
  { title: "Can run", text: "Your runtime supports the hardware, and your tool can talk to it." },
  { title: "Can run usably", text: "Fast enough for basic interaction." },
  { title: "Comfortable for this workload", text: "Given your tool, project size, context, other apps and expectations — will it actually feel good?", primary: true },
];

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" /> Workload-aware local AI recommendations
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">Will local AI actually run well on your computer?</h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Choose your hardware, tools, and workload. We&apos;ll tell you which local AI models will actually be comfortable to use—not just which ones technically fit.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LinkButton href="/check" size="lg">
                Check My Computer <ArrowRight className="size-4" />
              </LinkButton>
              <LinkButton href="/hardware-for-model" size="lg" variant="outline">
                Find Hardware for a Model
              </LinkButton>
              <LinkButton href="/stack" size="lg" variant="ghost">
                Build My Local AI Setup
              </LinkButton>
            </div>
          </div>
          <div className="mx-auto mt-12 max-w-5xl">
            <HomeDemo />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">“It fits” is the least interesting answer</h2>
          <p className="mt-3 text-muted-foreground">Most calculators stop at memory. We separate four questions — and rate the last one, because that’s what you’ll feel every day.</p>
        </div>
        <ol className="mt-8 grid gap-4 md:grid-cols-4">
          {TIERS.map((t, i) => (
            <li key={t.title} className={t.primary ? "rounded-xl border-2 border-primary/50 bg-accent/40 p-5" : "rounded-xl border bg-card p-5"}>
              <span className="text-xs font-semibold text-muted-foreground">Level {i + 1}</span>
              <p className="mt-1 font-semibold">{t.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COMFORT_LEVELS.map((l) => (
            <div key={l} className="flex items-start gap-3 rounded-lg border bg-card p-3">
              <ComfortBadge level={l} size="sm" />
              <p className="text-xs text-muted-foreground">{COMFORT_DESCRIPTION[l]}</p>
            </div>
          ))}
        </div>
        <p className="sr-only">{COMFORT_LEVELS.map((l) => COMFORT_LABEL[l]).join(", ")}</p>
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-3">
          <Feature icon={<Bot className="size-5" />} title="Tool-aware" text="An agent like Claude Code, Codex or OpenCode makes dozens of sequential calls with large prompts. A chat app makes one. We model the difference." />
          <Feature icon={<Layers className="size-5" />} title="Headroom-aware" text="Your IDE, browser, Docker and simulator need memory too. A model that leaves 1 GB free is not the same as one that leaves 16 GB." />
          <Feature icon={<Cpu className="size-5" />} title="Honest about speed" text="Generation, prompt processing and time-to-first-token are estimated separately, calibrated with verified benchmarks, and labelled with confidence." />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">Start where you are</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Entry href="/check" icon={<Search className="size-5" />} title="I don’t know which model" text="Answer five plain-language questions; we pick models that will be comfortable — fast, balanced and quality options." />
          <Entry href="/hardware-for-model" icon={<HardDrive className="size-5" />} title="I know the model, not the hardware" text="Choose a model, tool and workload; see which machines meet a comfortable experience — not just load it." />
          <Entry href="/stack" icon={<Layers className="size-5" />} title="Give me a complete setup" text="Hardware → runtime → model → local API → coding agent, with setup steps." />
          <Entry href="/compare/models" icon={<Sparkles className="size-5" />} title="Compare models on my machine" text="Memory, headroom, generation, prompt processing and comfort side by side." />
          <Entry href="/compare/hardware" icon={<Cpu className="size-5" />} title="Compare machines for my workload" text="Mac mini vs MacBook Pro vs Mac Studio vs RTX PC — with tradeoffs, not a single winner." />
          <Entry href="/hugging-face" icon={<Search className="size-5" />} title="Check any Hugging Face model" text="Paste a model link — we read its real architecture and rate it for your machine, even if it came out today." />
          <Entry href="/learn" icon={<Bot className="size-5" />} title="Learn the concepts" text="Why “fits” doesn’t mean “fast”, and why a fast chat model isn’t necessarily a good coding agent." />
        </div>
        <p className="mt-10 text-sm text-muted-foreground">
          Database: {HARDWARE.length} hardware configurations · {MODELS.length} models · {RUNTIMES.length} runtimes · {TOOLS.length} AI tools · {BENCHMARKS.length} verified benchmark results.{" "}
          <Link href="/methodology" className="text-primary hover:underline">
            How we calculate →
          </Link>
        </p>
      </section>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div>
      <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">{icon}</span>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Entry({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <Link href={href} className="group">
      <Card className="h-full p-5 transition group-hover:border-primary/50 group-hover:shadow-sm">
        <span className="text-primary">{icon}</span>
        <p className="mt-3 flex items-center gap-1 font-semibold">
          {title} <ArrowRight className="size-4 opacity-0 transition group-hover:opacity-100" />
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
      </Card>
    </Link>
  );
}
