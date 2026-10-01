import Link from "next/link";
import Image from "next/image";
import { HARDWARE, MODELS } from "@/data";

const COLUMNS = [
  {
    title: "Get started",
    links: [
      { href: "/check", label: "Check my computer" },
      { href: "/can-i-run", label: "Can I run it?" },
      { href: "/learn", label: "Learn local AI" },
      { href: "/learn/first-model", label: "Run your first model" },
    ],
  },
  {
    title: "Tools",
    links: [
      { href: "/compare/models", label: "Compare models" },
      { href: "/hardware-for-model", label: "Hardware for a model" },
      { href: "/speed-test", label: "Speed test" },
      { href: "/new-models", label: "New models" },
      { href: "/hugging-face", label: "Any Hugging Face model" },
    ],
  },
  {
    title: "Data",
    links: [
      { href: "/models", label: "Models" },
      { href: "/hardware", label: "Computers" },
      { href: "/runtimes", label: "Runtimes" },
      { href: "/tools", label: "AI apps" },
      { href: "/methodology", label: "How we calculate" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-muted/30 sm:mt-28">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="space-y-3">
            <Image src="/brand/logo-horizontal.svg" width={272} height={64} alt="Local AI Advisor" className="h-9 w-auto dark:hidden" />
            <Image src="/brand/logo-horizontal-dark.svg" width={272} height={64} alt="Local AI Advisor" className="hidden h-9 w-auto dark:block" />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Find out which AI models run well on your own computer. {MODELS.length} models, {HARDWARE.length} computers, no sign-up needed.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-3">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground">{c.title}</p>
                <ul className="mt-3 space-y-1">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="inline-block py-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Local AI Advisor · Never sponsored.</p>
          <p>
            Speeds are estimates calibrated on public benchmarks. <Link href="/methodology" className="underline-offset-2 hover:underline">See how</Link>.
          </p>
        </div>
      </div>
    </footer>
  );
}
