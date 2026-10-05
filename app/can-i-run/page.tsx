import type { Metadata } from "next";
import Link from "next/link";
import { HARDWARE } from "@/data";
import { CHAT, FEATURED_HARDWARE_IDS, catalogModels, hardwareGroup, hardwareHref, hardwareSlug, memoryLine, modelHref, rate, usable } from "@/lib/can-i-run";
import { fmtCtx, fmtParams } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { OpennessBadge } from "@/components/explore/openness-badge";
import { CanIRunPicker } from "@/components/can-i-run/picker";
import { Section } from "@/components/can-i-run/parts";

export const metadata: Metadata = {
  title: "Can I run it? Open LLMs on every popular computer",
  description:
    "Pick an open-weight model and your Mac, GPU or AI PC to see whether it runs well for chat, coding and agents, how fast it generates, and the exact commands to download it.",
  alternates: { canonical: "/can-i-run" },
};

export default function CanIRunIndex() {
  const models = catalogModels();
  const featured = HARDWARE.filter((h) => FEATURED_HARDWARE_IDS.includes(h.id));
  const counts = new Map(featured.map((h) => [h.id, models.filter((m) => usable(rate(m, h, CHAT).level)).length]));

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Can I run it?</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {models.length} open models × {HARDWARE.length} machines. Every answer comes from the same engine as the full check: memory, speed and context for
          real workloads, not just “does the file fit”.
        </p>
      </header>

      <Card className="p-5 sm:p-6">
        <CanIRunPicker
          models={models.map((m) => ({ value: m.id, label: m.name, group: m.organization }))}
          hardware={HARDWARE.map((h) => ({ value: hardwareSlug(h), label: h.name, group: hardwareGroup(h) }))}
        />
      </Card>

      <Section title="Popular machines" intro="How many catalog models each one runs acceptably or better for chat.">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((h) => (
            <li key={h.id}>
              <Link href={hardwareHref(h)} className="flex h-full flex-col rounded-xl border-2 bg-card p-4 transition hover:border-ink hover:bg-muted/40">
                <span className="font-medium">{h.name}</span>
                <span className="text-sm text-muted-foreground">{memoryLine(h)}</span>
                <span className="mt-2 text-sm">
                  <strong>{counts.get(h.id)}</strong> of {models.length} models run well
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Models" intro="Every open model we rate, newest first. Each page lists every machine with its verdict.">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((m) => (
            <li key={m.id}>
              <Link href={modelHref(m)} className="flex h-full flex-col gap-1 rounded-xl border-2 bg-card p-4 transition hover:border-ink hover:bg-muted/40">
                <span className="font-medium">{m.name}</span>
                <span className="text-sm text-muted-foreground">
                  {m.organization} · {fmtParams(m.parameterCount)}
                  {m.denseOrMoE === "moe" ? ` (${fmtParams(m.activeParameterCount)} active)` : ""} · {fmtCtx(m.contextWindow)} context
                </span>
                <OpennessBadge license={m.license} className="mt-1 self-start" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
