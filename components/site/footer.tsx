import Link from "next/link";
import Image from "next/image";
import { Sparkles, ExternalLink, Cpu, Database } from "lucide-react";
import { HARDWARE, MODELS, BENCHMARKS } from "@/data";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/70 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 md:grid-cols-5">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <Image src="/brand/logo-horizontal.svg" width={272} height={64} alt="Local AI Advisor" className="h-10 w-auto dark:hidden" />
              <Image src="/brand/logo-horizontal-dark.svg" width={272} height={64} alt="Local AI Advisor" className="hidden h-10 w-auto dark:block" />
            </div>
            <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
              Real-world simulation of local LLM performance. We model KV-cache expansion, OS/IDE memory reservations, agentic multi-turn latency, and benchmark calibrations so you know what actually runs well.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-2.5 py-1 font-medium">
                <Cpu className="size-3 text-primary" /> {HARDWARE.length} Hardware Rigs
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-2.5 py-1 font-medium">
                <Database className="size-3 text-primary" /> {MODELS.length} Models
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-2.5 py-1 font-medium">
                <Sparkles className="size-3 text-primary" /> {BENCHMARKS.length} Benchmarks
              </span>
            </div>
          </div>

          {/* Tools & Wizards */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Interactive Tools</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link className="text-muted-foreground hover:text-foreground transition" href="/check">
                  Check My Computer
                </Link>
              </li>
              <li>
                <Link className="text-muted-foreground hover:text-foreground transition" href="/can-i-run">
                  Can I Run It?
                </Link>
              </li>
              <li>
                <Link className="text-muted-foreground hover:text-foreground transition" href="/speed-test">
                  Browser Speed Test
                </Link>
              </li>
              <li>
                <Link className="text-muted-foreground hover:text-foreground transition" href="/community">
                  Community Speeds
                </Link>
              </li>
              <li>
                <Link className="text-muted-foreground hover:text-foreground transition" href="/new-models">
                  New Open Models
                </Link>
              </li>
              <li>
                <Link className="text-muted-foreground hover:text-foreground transition" href="/hardware-for-model">
                  Find Hardware for a Model
                </Link>
              </li>
              <li>
                <Link className="text-muted-foreground hover:text-foreground transition" href="/hugging-face">
                  Any Hugging Face Model
                </Link>
              </li>
              <li>
                <Link className="text-muted-foreground hover:text-foreground transition" href="/stack">
                  Build Local AI Stack
                </Link>
              </li>
              <li>
                <Link className="text-muted-foreground hover:text-foreground transition" href="/compare/models">
                  Compare Models
                </Link>
              </li>
              <li>
                <Link className="text-muted-foreground hover:text-foreground transition" href="/compare/hardware">
                  Compare Hardware
                </Link>
              </li>
            </ul>
          </div>

          {/* Catalog & Data */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Databases &amp; Matrix</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link className="text-muted-foreground hover:text-foreground transition" href="/models">
                  Model Catalog
                </Link>
              </li>
              <li>
                <Link className="text-muted-foreground hover:text-foreground transition" href="/hardware">
                  Hardware Specs &amp; Bandwidths
                </Link>
              </li>
              <li>
                <Link className="text-muted-foreground hover:text-foreground transition" href="/runtimes">
                  Runtimes (llama.cpp, MLX, etc.)
                </Link>
              </li>
              <li>
                <Link className="text-muted-foreground hover:text-foreground transition" href="/tools">
                  AI Tools Compatibility Matrix
                </Link>
              </li>
            </ul>
          </div>

          {/* Methodology & Learning */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Trust &amp; Knowledge</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link className="text-muted-foreground hover:text-foreground transition" href="/methodology">
                  How We Calculate
                </Link>
              </li>
              <li>
                <Link className="text-muted-foreground hover:text-foreground transition" href="/learn">
                  Core Concepts &amp; Figures
                </Link>
              </li>
              <li>
                <a
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
                  href="https://github.com/ggml-org/llama.cpp"
                  target="_blank"
                  rel="noreferrer"
                >
                  llama.cpp Scoreboards <ExternalLink className="size-3" />
                </a>
              </li>
              <li>
                <a
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
                  href="https://huggingface.co"
                  target="_blank"
                  rel="noreferrer"
                >
                  Hugging Face Hub <ExternalLink className="size-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright / disclaimer */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Local AI Advisor. Verified benchmarks and technical models are cited with sources.
          </p>
          <p>
            Never sponsored. Derived purely from architectural physics and open calibration.
          </p>
        </div>
      </div>
    </footer>
  );
}
