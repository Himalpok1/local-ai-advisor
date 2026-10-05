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
      { href: "/blog", label: "Blog" },
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

const LEGAL_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t-2 border-ink bg-primary/25 sm:mt-28 dark:bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="space-y-3">
            <Image src="/brand/logo-horizontal.svg" width={272} height={64} alt="Local AI Advisor" className="h-9 w-auto dark:hidden" />
            <Image src="/brand/logo-horizontal-dark.svg" width={272} height={64} alt="Local AI Advisor" className="hidden h-9 w-auto dark:block" />
            <p className="max-w-xs text-sm leading-relaxed text-foreground/80">
              Find out which AI models run well on your own computer. {MODELS.length} models, {HARDWARE.length} computers, no sign-up needed.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-3">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <p className="inline-block rounded-full border-2 border-ink bg-card px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider text-foreground">{c.title}</p>
                <ul className="mt-3 space-y-1">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="inline-block py-1 text-sm font-medium text-foreground underline-offset-4 transition-colors hover:underline">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t-2 border-ink pt-6 text-xs text-foreground/80 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <p>© {new Date().getFullYear()} Local AI Advisor · Never sponsored.</p>
            <nav aria-label="Site information" className="flex flex-wrap gap-x-4 gap-y-1">
              {LEGAL_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="underline-offset-2 hover:text-foreground hover:underline">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <p>
            Speeds are estimates calibrated on public benchmarks. <Link href="/methodology" className="underline-offset-2 hover:underline">See how</Link>.
          </p>
        </div>
      </div>
    </footer>
  );
}
