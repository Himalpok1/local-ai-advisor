import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { HARDWARE, MODELS, QUANTIZATIONS } from "@/data";
import { AGENT, CHAT, blocked, canIRunHref, hardwareGroup, memoryLine, modelBySlug, modelHref, rate, usable } from "@/lib/can-i-run";
import { ggufFor, runCommands } from "@/lib/downloads";
import { COMFORT_RANK, type Recommendation } from "@/lib/schemas/results";
import { fmtCtx, fmtParams, fmtUSD } from "@/lib/format";
import { weightsGB } from "@/lib/memory";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { ComfortBadge } from "@/components/advisor/comfort";
import { RunCommands } from "@/components/advisor/run-commands";
import { OpennessBadge } from "@/components/explore/openness-badge";
import { SourceLink } from "@/components/explore/source-link";
import { Breadcrumbs, FaqJsonLd, Section, speedOf } from "@/components/can-i-run/parts";

type Props = { params: Promise<{ model: string }> };

export function generateStaticParams() {
  return MODELS.map((m) => ({ model: m.id }));
}

async function load(props: Props) {
  const model = modelBySlug((await props.params).model);
  if (!model) notFound();
  const rows = HARDWARE.map((h) => ({ hardware: h, chat: rate(model, h, CHAT), agent: rate(model, h, AGENT) }));
  return { model, rows };
}

/** Cheapest machine whose chat (or agent) rating reaches at least `min`. */
function cheapest(rows: { hardware: (typeof HARDWARE)[number]; chat: Recommendation; agent: Recommendation }[], key: "chat" | "agent", min: number) {
  return rows
    .filter((r) => COMFORT_RANK[r[key].level] >= min && r.hardware.approxPriceUSD)
    .sort((a, b) => a.hardware.approxPriceUSD! - b.hardware.approxPriceUSD!)[0];
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { model, rows } = await load(props);
  const n = rows.filter((r) => usable(r.chat.level)).length;
  return {
    title: `What hardware can run ${model.name}?`,
    description: `${model.name} rated on ${rows.length} Macs, GPUs and AI PCs: ${n} handle it well for chat. Speeds, memory, cheapest comfortable machine and ready-to-paste Ollama / llama.cpp commands.`,
    alternates: { canonical: modelHref(model) },
  };
}

export default async function Page(props: Props) {
  const { model, rows } = await load(props);
  const q4 = model.supportedQuantizations.includes("q4") ? "q4" : model.supportedQuantizations[0];
  const gguf = ggufFor(model.id, q4);
  const chatPick = cheapest(rows, "chat", COMFORT_RANK.comfortable);
  const agentPick = cheapest(rows, "agent", COMFORT_RANK.comfortable);
  const groups = [...new Set(rows.map((r) => hardwareGroup(r.hardware)))];
  const commands = runCommands({ modelId: model.id, quant: q4, contextTokens: 16384, apple: true });
  const usableCount = rows.filter((r) => usable(r.chat.level)).length;

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <FaqJsonLd
        items={[
          {
            q: `What hardware can run ${model.name}?`,
            a: `${usableCount} of the ${rows.length} machines we rate run ${model.name} acceptably or better for chat.${chatPick ? ` The cheapest comfortable option is the ${chatPick.hardware.name} (about ${fmtUSD(chatPick.hardware.approxPriceUSD)}).` : ""}`,
          },
        ]}
      />
      <div>
        <Breadcrumbs items={[{ href: "/can-i-run", label: "Can I run it?" }, { label: model.name }]} />
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">What hardware can run {model.name}?</h1>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone={model.denseOrMoE === "moe" ? "primary" : "neutral"}>
            {model.denseOrMoE === "moe" ? `MoE · ${fmtParams(model.activeParameterCount)} active` : "Dense"}
          </Badge>
          <Badge>{fmtParams(model.parameterCount)} parameters</Badge>
          <Badge>{fmtCtx(model.contextWindow)} context</Badge>
          {model.vision && <Badge tone="good">Vision</Badge>}
          <OpennessBadge license={model.license} />
          <Badge>{model.license}</Badge>
        </div>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          {usableCount} of {rows.length} machines in our catalog run it acceptably or better for chat. At {QUANTIZATIONS[q4].formatNames.gguf ?? q4}, the weights alone take{" "}
          {gguf ? `${gguf.sizeGB} GB to download` : `about ${Math.round(weightsGB(model, QUANTIZATIONS[q4], "gguf"))} GB`}; context and your other apps need room on top.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          { label: "Cheapest comfortable for chat", pick: chatPick },
          { label: "Cheapest comfortable for agentic coding", pick: agentPick },
        ].map(({ label, pick }) => (
          <Card key={label} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            {pick ? (
              <>
                <Link href={canIRunHref(model, pick.hardware)} className="mt-1 block text-lg font-semibold hover:underline">
                  {pick.hardware.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  About {fmtUSD(pick.hardware.approxPriceUSD)} · {memoryLine(pick.hardware)} · {speedOf(label.includes("agentic") ? pick.agent : pick.chat)}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">No machine in our catalog reaches “comfortable” for this.</p>
            )}
          </Card>
        ))}
      </div>

      {commands.length > 0 && (
        <Section title="Download and run it" intro="Verified Hugging Face builds. Pick the machine below for commands sized to its memory and context.">
          <RunCommands commands={commands} />
        </Section>
      )}

      <Section title="Every machine we rate" intro="Chat uses Open WebUI with short prompts; agentic coding uses OpenCode on a medium repository, which sends large prompts on every step.">
        {groups.map((g) => (
          <div key={g} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">{g}</h3>
            <div className="overflow-x-auto rounded-xl border-2">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="w-[38%] px-4 py-2 font-medium">Machine</th>
                    <th className="px-4 py-2 font-medium">Chat</th>
                    <th className="px-4 py-2 font-medium">Agentic coding</th>
                    <th className="px-4 py-2 font-medium">Chat speed</th>
                    <th className="px-4 py-2 text-right font-medium">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows
                    .filter((r) => hardwareGroup(r.hardware) === g)
                    .map((r) => (
                      <tr key={r.hardware.id} className="hover:bg-muted/40">
                        <td className="px-4 py-2.5">
                          <Link href={canIRunHref(model, r.hardware)} className="font-medium hover:underline">
                            {r.hardware.name}
                          </Link>
                          <span className="block text-xs text-muted-foreground">{memoryLine(r.hardware)}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <ComfortBadge level={r.chat.level} size="sm" />
                        </td>
                        <td className="px-4 py-2.5">
                          <ComfortBadge level={r.agent.level} size="sm" />
                        </td>
                        <td className="px-4 py-2.5 tabular-nums">{blocked(r.chat.level) ? "—" : speedOf(r.chat)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{fmtUSD(r.hardware.approxPriceUSD)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </Section>

      <Card className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <SourceLink source={model.source} compact />
        <div className="flex flex-wrap gap-2">
          <Link href={`/hardware-for-model?m=${model.id}`} className={buttonClass("outline", "sm")}>
            Filter by budget and target
          </Link>
          <Link href={`/compare/models?m=${model.id}`} className={buttonClass("primary", "sm")}>
            Compare with other models <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </Card>
    </div>
  );
}
