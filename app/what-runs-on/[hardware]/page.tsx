import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { HARDWARE } from "@/data";
import { AGENT, CHAT, blocked, canIRunHref, catalogModels, hardwareBySlug, hardwareHref, hardwareSlug, memoryLine, rate, usable } from "@/lib/can-i-run";
import { licenseOpenness } from "@/lib/hf/licenses";
import { COMFORT_LABEL, COMFORT_RANK, type ComfortLevel } from "@/lib/schemas/results";
import { fmtUSD } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { ComfortBadge } from "@/components/advisor/comfort";
import { OpennessBadge } from "@/components/explore/openness-badge";
import { Breadcrumbs, FaqJsonLd, Section, quantOf, speedOf } from "@/components/can-i-run/parts";

type Props = { params: Promise<{ hardware: string }> };

export function generateStaticParams() {
  return HARDWARE.map((h) => ({ hardware: hardwareSlug(h) }));
}

async function load(props: Props) {
  const hardware = hardwareBySlug((await props.params).hardware);
  if (!hardware) notFound();
  const rows = catalogModels()
    .map((model) => ({ model, chat: rate(model, hardware, CHAT), agent: rate(model, hardware, AGENT) }))
    .sort((a, b) => COMFORT_RANK[b.chat.level] - COMFORT_RANK[a.chat.level] || b.chat.rankValue - a.chat.rankValue);
  return { hardware, rows };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { hardware, rows } = await load(props);
  const good = rows.filter((r) => usable(r.chat.level));
  return {
    title: `What LLMs can ${hardware.name} run?`,
    description: `${good.length} open models run well for chat on the ${hardware.name} (${memoryLine(hardware)}).${good[0] ? ` Top pick: ${good[0].model.name} at ${speedOf(good[0].chat)}.` : ""} Ratings for chat and agentic coding, with speeds and download commands.`,
    alternates: { canonical: hardwareHref(hardware) },
  };
}

const GROUPS: { title: string; levels: ComfortLevel[]; intro: string }[] = [
  { title: "Runs well", levels: ["excellent", "comfortable"], intro: "Fast enough and with memory to spare for everyday chat." },
  { title: "Usable with compromises", levels: ["acceptable"], intro: "Works, but you'll notice slower replies or tight memory." },
  { title: "Loads, but not recommended", levels: ["borderline", "technically-runs"], intro: "Technically runs. Expect a frustrating experience." },
  { title: "Doesn't fit or isn't supported", levels: ["does-not-fit", "unsupported"], intro: "Not enough usable memory, or the runtime can't run it here." },
];

export default async function Page(props: Props) {
  const { hardware, rows } = await load(props);
  const good = rows.filter((r) => usable(r.chat.level));
  const agentGood = rows.filter((r) => usable(r.agent.level)).sort((a, b) => b.agent.rankValue - a.agent.rankValue);
  const openGood = good.filter((r) => licenseOpenness(r.model.license) === "open-source");

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <FaqJsonLd
        items={[
          {
            q: `What LLMs can ${hardware.name} run?`,
            a: good.length
              ? `${good.length} of ${rows.length} open models we rate run acceptably or better for chat, led by ${good
                  .slice(0, 3)
                  .map((r) => r.model.name)
                  .join(", ")}.`
              : `None of the ${rows.length} models we rate run acceptably for chat on this machine.`,
          },
        ]}
      />
      <div>
        <Breadcrumbs items={[{ href: "/can-i-run", label: "Can I run it?" }, { label: hardware.name }]} />
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">What LLMs can {hardware.name} run?</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          {memoryLine(hardware)}
          {hardware.gpu ? `, ${hardware.gpu.bandwidthGBs} GB/s memory bandwidth` : ""}
          {hardware.approxPriceUSD ? `, about ${fmtUSD(hardware.approxPriceUSD)}` : ""}. Every open model in our catalog, rated by the engine for chat and for agentic coding.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Best for chat", r: good[0], rec: good[0]?.chat },
          { label: "Best for agentic coding", r: agentGood[0], rec: agentGood[0]?.agent },
          { label: "Best open-source (OSI) pick", r: openGood[0], rec: openGood[0]?.chat },
        ].map(({ label, r, rec }) => (
          <Card key={label} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            {r && rec ? (
              <>
                <Link href={canIRunHref(r.model, hardware)} className="mt-1 block text-lg font-semibold hover:underline">
                  {r.model.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {COMFORT_LABEL[rec.level]} · {quantOf(rec)} · {speedOf(rec)}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Nothing in our catalog is usable for this.</p>
            )}
          </Card>
        ))}
      </div>

      {GROUPS.map((g) => {
        const items = rows.filter((r) => g.levels.includes(r.chat.level));
        if (!items.length) return null;
        return (
          <Section key={g.title} title={`${g.title} (${items.length})`} intro={g.intro}>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="w-[36%] px-4 py-2 font-medium">Model</th>
                    <th className="px-4 py-2 font-medium">Chat</th>
                    <th className="px-4 py-2 font-medium">Agentic coding</th>
                    <th className="px-4 py-2 font-medium">Quant</th>
                    <th className="px-4 py-2 font-medium">Chat speed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((r) => (
                    <tr key={r.model.id} className="hover:bg-muted/40">
                      <td className="px-4 py-2.5">
                        <Link href={canIRunHref(r.model, hardware)} className="font-medium hover:underline">
                          {r.model.name}
                        </Link>
                        <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          {r.model.organization}
                          <OpennessBadge license={r.model.license} className="px-1.5 py-0 text-[11px]" />
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <ComfortBadge level={r.chat.level} size="sm" />
                      </td>
                      <td className="px-4 py-2.5">
                        <ComfortBadge level={r.agent.level} size="sm" />
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{blocked(r.chat.level) ? "—" : quantOf(r.chat)}</td>
                      <td className="px-4 py-2.5 tabular-nums">{speedOf(r.chat)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        );
      })}

      <Card className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Want a specific tool, context size or workload?</p>
          <p className="text-sm text-muted-foreground">The full check models your exact setup, including the apps you keep open.</p>
        </div>
        <Link href={`/check?hw=${hardware.id}`} className={buttonClass("primary", "sm")}>
          Check this machine in detail <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </Card>
    </div>
  );
}
