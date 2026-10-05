import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { HARDWARE, MODELS } from "@/data";
import {
  CHAT,
  CHAT_APPS_CLOSED,
  FEATURED_HARDWARE_IDS,
  WORKLOADS,
  blocked,
  canIRunHref,
  evaluateHref,
  hardwareBySlug,
  hardwareGroup,
  hardwareHref,
  hardwareSlug,
  memoryGap,
  memoryLine,
  modelBySlug,
  modelHref,
  rate,
  shortAnswer,
  usable,
} from "@/lib/can-i-run";
import { runCommands } from "@/lib/downloads";
import { recommendHardware, recommendModels } from "@/lib/recommendations";
import { COMFORT_RANK } from "@/lib/schemas/results";
import { fmtCtx, fmtGB, fmtSec, fmtUSD } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { ComfortBadge, COMFORT_STYLE } from "@/components/advisor/comfort";
import { RunCommands } from "@/components/advisor/run-commands";
import { OpennessBadge } from "@/components/explore/openness-badge";
import { Breadcrumbs, FaqJsonLd, Section, headroomOf, quantOf, speedOf } from "@/components/can-i-run/parts";
import { DoesNotFit } from "@/components/can-i-run/doesnt-fit";

type Props = { params: Promise<{ model: string; hardware: string }> };

/** Popular machines are built ahead of time; any other pair renders on first visit and is then cached. */
export function generateStaticParams() {
  const featured = HARDWARE.filter((h) => FEATURED_HARDWARE_IDS.includes(h.id));
  return MODELS.flatMap((m) => featured.map((h) => ({ model: m.id, hardware: hardwareSlug(h) })));
}

async function load(props: Props) {
  const { model: ms, hardware: hs } = await props.params;
  const model = modelBySlug(ms);
  const hardware = hardwareBySlug(hs);
  if (!model || !hardware) notFound();
  const results = WORKLOADS.map((preset) => ({ preset, rec: rate(model, hardware, preset) }));
  return { model, hardware, results, answer: shortAnswer(results) };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { model, hardware, results, answer } = await load(props);
  const chat = results[0].rec;
  const speed = speedOf(chat);
  const gap = memoryGap(chat);
  const description =
    chat.level === "does-not-fit"
      ? `No: ${model.name} needs about ${fmtGB(gap.neededGB)} but ${hardware.name} has about ${fmtGB(gap.availableGB)} free for AI. See smaller models that fit and the cheapest machines that run it.`
      : blocked(chat.level)
        ? `${answer.text}. See which models run well on ${hardware.name} and which machines support ${model.name}.`
        : `${answer.text}. About ${speed} for chat at ${quantOf(chat)}. Rated for chat, coding and agents, with setup commands.`;
  return {
    title: `Can ${hardware.name} run ${model.name}?`,
    description,
    alternates: { canonical: canIRunHref(model, hardware) },
  };
}

export default async function Page(props: Props) {
  const { model, hardware, results, answer } = await load(props);
  const chat = results[0].rec;
  // Commands use the most demanding workload that still works, so its context fits too.
  const forCommands = [...results].reverse().find((r) => usable(r.rec.level))?.rec ?? chat;
  const commands = blocked(chat.level)
    ? []
    : runCommands({ modelId: model.id, quant: forCommands.quant.id, contextTokens: forCommands.context.effective, apple: hardware.vendor === "apple" });

  const others = recommendModels({ hardware, workload: CHAT.workload })
    .all.filter((r) => r.model.id !== model.id && usable(r.level))
    .slice(0, 6);
  const closedApps = others.length
    ? []
    : recommendModels({ hardware, workload: CHAT_APPS_CLOSED.workload })
        .all.filter((r) => r.model.id !== model.id && COMFORT_RANK[r.level] >= COMFORT_RANK.borderline)
        .slice(0, 3);
  const cheaper = recommendHardware({ modelId: model.id, workload: CHAT.workload, target: "comfortable" })
    .meetsTarget.filter((r) => r.hardware.id !== hardware.id)
    .slice(0, 6);
  const siblings = HARDWARE.filter((h) => h.id !== hardware.id && h.chipKey === hardware.chipKey && hardwareGroup(h) === hardwareGroup(hardware));

  const style = COMFORT_STYLE[chat.level];
  const title = `Can ${hardware.name} run ${model.name}?`;

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6">
      <FaqJsonLd
        items={[
          {
            q: title,
            a: `${answer.text}. Rated by Local AI Advisor's engine at ${quantOf(chat)}${speedOf(chat) !== "—" ? `, about ${speedOf(chat)} for chat` : ""}.`,
          },
        ]}
      />
      <div>
        <Breadcrumbs items={[{ href: "/can-i-run", label: "Can I run it?" }, { href: modelHref(model), label: model.name }, { label: hardware.name }]} />
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-2 text-muted-foreground">
          {memoryLine(hardware)}
          {hardware.gpu ? ` · ${hardware.gpu.bandwidthGBs} GB/s memory bandwidth` : ""} · {model.name} has {model.parameterCount}B parameters
          {model.denseOrMoE === "moe" ? ` (${model.activeParameterCount}B active per token)` : ""}.
        </p>
      </div>

      <Card className={cn("overflow-hidden border-2", style.border)}>
        <div className={cn("p-6", style.bg)}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Short answer</p>
          <p className={cn("mt-1 text-2xl font-semibold tracking-tight", style.text)}>{answer.text}.</p>
          {!blocked(chat.level) && (
            <p className="mt-2 text-sm">
              Best quantization for chat: <strong>{quantOf(chat)}</strong> ({fmtGB(chat.memory.weightsGB)} of weights) on {chat.runtime.name}. Generation:{" "}
              <strong>{speedOf(chat)}</strong>, leaving about {headroomOf(chat)} free for your other apps.
            </p>
          )}
          {blocked(chat.level) && <p className="mt-2 text-sm">{chat.explanation.blockers[0] ?? chat.verdict}</p>}
        </div>
      </Card>

      {chat.level === "does-not-fit" && <DoesNotFit model={model} hardware={hardware} chat={chat} siblings={siblings} />}

      {results.every((r) => blocked(r.rec.level)) ? (
        <p className="text-sm text-muted-foreground">
          The same applies to every workload we rate (chat, coding questions, coding in a repository, agentic coding and long documents): they all need at least as much memory as
          chat.
        </p>
      ) : (
        <Section title="How it rates for each workload" intro="Same model and machine, different jobs. Agents and long documents send far bigger prompts than chat, so they need much more speed and memory.">
          <div className="overflow-x-auto rounded-xl border-2">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Workload</th>
                  <th className="px-4 py-2.5 font-medium">Verdict</th>
                  <th className="px-4 py-2.5 font-medium">Quant</th>
                  <th className="px-4 py-2.5 font-medium">Generation</th>
                  <th className="px-4 py-2.5 font-medium">First reply</th>
                  <th className="px-4 py-2.5 font-medium">Context</th>
                  <th className="px-4 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {results.map(({ preset, rec }) => (
                  <tr key={preset.key}>
                    <td className="px-4 py-3 font-medium">
                      {preset.label}
                      <span className="block text-xs font-normal text-muted-foreground">with {rec.tool.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <ComfortBadge level={rec.level} size="sm" />
                    </td>
                    <td className="px-4 py-3 tabular-nums">{blocked(rec.level) ? "—" : quantOf(rec)}</td>
                    <td className="px-4 py-3 tabular-nums">{speedOf(rec)}</td>
                    <td className="px-4 py-3 tabular-nums">{!blocked(rec.level) && rec.performance ? fmtSec(rec.performance.coldPromptSec) : "—"}</td>
                    <td className="px-4 py-3 tabular-nums">{blocked(rec.level) ? "—" : fmtCtx(rec.context.effective)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={evaluateHref(rec, preset)} className="inline-flex items-center gap-1 text-link hover:underline">
                        Details <ArrowRight className="size-3.5" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            {chat.performance?.basis === "measured"
              ? "Speeds come from measured benchmarks for this chip."
              : chat.performance?.basis === "calibrated"
                ? "Speeds are estimates calibrated against measured benchmarks on similar hardware."
                : "Speeds are bandwidth-based estimates; no direct benchmark exists for this pair."}{" "}
            “First reply” is the time to read the workload’s opening prompt.{" "}
            <Link href="/methodology" className="underline">
              How we calculate
            </Link>
          </p>
        </Section>
      )}

      {commands.length > 0 && (
        <Section
          title="Get it running"
          intro={`Copy-paste commands for the ${quantOf(forCommands)} build with a ${fmtCtx(forCommands.context.effective)} context. Ollama and llama.cpp download the file straight from Hugging Face.`}
        >
          <RunCommands commands={commands} />
        </Section>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Section title={`Other models for ${hardware.name}`} intro="The best-rated models for chat on this machine.">
          {others.length ? (
            <ul className="divide-y rounded-xl border-2">
              {others.map((r) => (
                <li key={r.model.id}>
                  <Link href={canIRunHref(r.model, hardware)} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{r.model.name}</span>
                      <span className="text-xs text-muted-foreground">{speedOf(r)}</span>
                    </span>
                    <ComfortBadge level={r.level} size="sm" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing runs well next to other apps on this machine.
              {closedApps.length > 0 && (
                <>
                  {" "}
                  With everything else closed, try{" "}
                  {closedApps.map((r, i) => (
                    <span key={r.model.id}>
                      {i > 0 && (i === closedApps.length - 1 ? " or " : ", ")}
                      <Link href={canIRunHref(r.model, hardware)} className="text-link hover:underline">
                        {r.model.name}
                      </Link>
                    </span>
                  ))}
                  ; expect it to feel tight.
                </>
              )}
            </p>
          )}
          <Link href={hardwareHref(hardware)} className={buttonClass("outline", "sm")}>
            Everything {hardware.name} can run <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </Section>

        <Section title={`Cheapest machines for ${model.name}`} intro="Hardware rated comfortable or better for chat, lowest price first.">
          {cheaper.length ? (
            <ul className="divide-y rounded-xl border-2">
              {cheaper.map((r) => (
                <li key={r.hardware.id}>
                  <Link href={canIRunHref(model, r.hardware)} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{r.hardware.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {fmtUSD(r.hardware.approxPriceUSD)} · {speedOf(r)}
                      </span>
                    </span>
                    <ComfortBadge level={r.level} size="sm" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No machine in our catalog runs it comfortably for chat.</p>
          )}
          {siblings.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Same chip, other memory:{" "}
              {siblings.map((h, i) => (
                <span key={h.id}>
                  {i > 0 && ", "}
                  <Link href={canIRunHref(model, h)} className="text-link hover:underline">
                    {h.systemRamGB} GB
                  </Link>
                </span>
              ))}
            </p>
          )}
        </Section>
      </div>

      <Card className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Different tool, context size or workload?</p>
          <p className="text-sm text-muted-foreground">These pages use typical settings. The full check models your exact setup.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OpennessBadge license={model.license} />
          <Link href={`/check?hw=${hardware.id}`} className={buttonClass("primary", "sm")}>
            Check my exact setup <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </Card>
    </div>
  );
}
