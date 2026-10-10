import type { Metadata } from "next";
import { ArrowRight, ChevronRight, Info } from "lucide-react";
import { PROVIDERS, RUNTIMES, TOOLS } from "@/data";
import type { AITool, SupportLevel } from "@/lib/schemas";
import { SUPPORT_LABEL, apiLabel, toolConnection } from "@/lib/compatibility";
import { fmtCtx, fmtTokens } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Callout, ExplorePage, ExploreSectionBlock } from "@/components/explore/explore-nav";
import { SUPPORT_CELL, SUPPORT_SHORT, SupportBadge } from "@/components/explore/badges";
import { ExternalA, SourceLink } from "@/components/explore/source-link";

export const metadata: Metadata = {
  title: "AI tools",
  description:
    "Claude Code, Codex CLI, OpenCode, Cline, Continue, Open WebUI and more: how each AI tool connects to local runtimes, and how demanding its workload is.",
  alternates: { canonical: "/tools" },
};

const CATEGORY_LABEL: Record<AITool["category"], string> = {
  "coding-agent": "Coding agent",
  "ide-agent": "IDE agent",
  "ide-assistant": "IDE assistant",
  "chat-ui": "Chat UI",
  "runtime-app": "Runtime app",
  api: "Direct API",
  automation: "Automation",
};
const PATTERN_LABEL: Record<AITool["interactionPattern"], string> = {
  conversational: "Conversational",
  "inline-assist": "Inline assist",
  "agentic-loop": "Agentic loop",
  batch: "Batch",
  server: "Server / API",
};
const INTENSITY_LABEL: Record<AITool["toolCallingIntensity"], string> = { none: "None", light: "Light", heavy: "Heavy" };

const LEVELS: SupportLevel[] = ["official", "community", "bridge", "experimental", "unsupported"];

const LAYERS = [
  { title: "AI tool", body: "The app you use (Claude Code, Cline, Open WebUI…). It builds prompts and tool calls but never runs the model." },
  { title: "Provider / API", body: "The protocol between tool and runtime: OpenAI-compatible, Anthropic-compatible or Ollama API." },
  { title: "Runtime", body: "The inference server (Ollama, llama.cpp, LM Studio, MLX-LM, vLLM…) that loads and executes the model." },
  { title: "Model", body: "The open weights at a chosen quantization and format (GGUF, MLX, safetensors)." },
  { title: "Hardware", body: "Your GPU / unified memory and its bandwidth, which set the speed limits for everything above." },
];

export default function ToolsPage() {
  const named = TOOLS.filter((t) => !t.generic);
  const generic = TOOLS.filter((t) => t.generic);
  return (
    <ExplorePage
      current="tools"
      title="AI tools"
      intro="Coding agents, IDE assistants and chat apps are clients: they connect to a local runtime through an API and shape how heavy your workload is."
    >
      <ExploreSectionBlock id="layers" title="Five components in your local AI stack" description="Each hop has to be compatible. The advisor checks every one of them.">
        <ol className="grid gap-2 md:grid-cols-5">
          {LAYERS.map((l, i) => (
            <li key={l.title} className="relative flex">
              <Card className="flex w-full flex-col gap-1 p-4">
                <span className="text-xs font-medium text-link">{i + 1}</span>
                <span className="font-semibold">{l.title}</span>
                <span className="text-xs text-muted-foreground">{l.body}</span>
              </Card>
              {i < LAYERS.length - 1 && (
                <ChevronRight className="absolute top-1/2 -right-2.5 z-10 hidden size-5 -translate-y-1/2 rounded-full bg-background text-muted-foreground md:block" aria-hidden />
              )}
            </li>
          ))}
        </ol>
        <Callout className="mt-4" icon={<Info className="size-4" />}>
          <strong>Tools never perform inference.</strong> Picking Claude Code or Cline does not change what your hardware can run — but it does change the
          workload: big system prompts, many sequential calls per task and heavy tool use all demand faster prompt processing and more context.
        </Callout>
      </ExploreSectionBlock>

      <ExploreSectionBlock
        id="matrix"
        title="Tool × runtime compatibility"
        description="The best connection path from each tool to each runtime, computed from the tool's documented connections and the APIs each runtime exposes. Hover a cell for the full path."
      >
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <caption className="sr-only">Connection level from each AI tool (rows) to each runtime (columns)</caption>
              <thead className="border-b-2 bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="sticky left-0 z-10 bg-muted px-3 py-2.5 text-left font-medium">
                    Tool
                  </th>
                  {RUNTIMES.map((rt) => (
                    <th key={rt.id} scope="col" className="px-2 py-2.5 text-center font-medium">
                      {rt.name.replace(/ \(.*\)/, "")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {[...named, ...generic].map((tool, idx) => (
                  <tr key={tool.id} className={cn("hover:bg-muted/30", idx === named.length && "border-t-2")}>
                    <th scope="row" className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium whitespace-nowrap">
                      <a href={`#tool-${tool.id}`} className="hover:underline">
                        {tool.name}
                      </a>
                      {tool.generic && <span className="ml-1.5 text-xs font-normal text-muted-foreground">generic</span>}
                    </th>
                    {RUNTIMES.map((rt) => {
                      const c = toolConnection(tool, rt);
                      return (
                        <td key={rt.id} className="px-1 py-1.5 text-center">
                          <span
                            title={`${SUPPORT_LABEL[c.level]}: ${c.path}${c.note ? ` — ${c.note}` : ""}`}
                            className={cn("inline-block min-w-20 rounded px-1.5 py-1 text-xs font-medium", SUPPORT_CELL[c.level])}
                          >
                            <span aria-hidden>{SUPPORT_SHORT[c.level]}</span>
                            <span className="sr-only">{SUPPORT_LABEL[c.level]}</span>
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Legend:</span>
          {LEVELS.map((l) => (
            <span key={l} className={cn("rounded px-1.5 py-0.5 font-medium", SUPPORT_CELL[l])}>
              {SUPPORT_LABEL[l]}
            </span>
          ))}
        </div>
        <p className="mt-2 max-w-3xl text-xs text-muted-foreground">
          “Requires bridge” means the tool only speaks the Anthropic API and the runtime only the OpenAI-compatible one, so a translating proxy such as
          LiteLLM sits in between. “Community-supported” paths work and are documented by the runtime or community, but not by the tool’s vendor.
        </p>
      </ExploreSectionBlock>

      <ExploreSectionBlock id="apis" title="The API layer" description="Every runtime exposes one or more of these protocols; every tool speaks at least one.">
        <ul className="grid gap-4 md:grid-cols-3">
          {PROVIDERS.map((p) => (
            <li key={p.id}>
              <Card className="flex h-full flex-col">
                <CardHeader>
                  <CardTitle>{p.name}</CardTitle>
                  <CardDescription>{p.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground">
                    Exposed by: {RUNTIMES.filter((r) => r.apis.includes(p.id)).map((r) => r.name.replace(/ \(.*\)/, "")).join(", ")}
                  </p>
                  <SourceLink source={p.source} />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </ExploreSectionBlock>

      <ExploreSectionBlock id="tools" title="All tools" description="Prompt sizes and calls per task are approximate, editorial characterizations of typical sessions — not measurements.">
        <ul className="grid gap-5 lg:grid-cols-2">
          {[...named, ...generic].map((t) => (
            <li key={t.id} id={`tool-${t.id}`} className="scroll-mt-20">
              <ToolCard tool={t} />
            </li>
          ))}
        </ul>
      </ExploreSectionBlock>
    </ExplorePage>
  );
}

function ToolCard({ tool }: { tool: AITool }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{tool.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{tool.vendor}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="primary">{CATEGORY_LABEL[tool.category]}</Badge>
            <Badge>{PATTERN_LABEL[tool.interactionPattern]}</Badge>
            {tool.nativeLocalSupport && <Badge tone="good">Built-in local support</Badge>}
          </div>
        </div>
        <CardDescription>{tool.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
          <Item label="Base prompt">{tool.basePromptTokens > 0 ? `≈${fmtTokens(tool.basePromptTokens)}` : "None"}</Item>
          <Item label="Calls per task">≈{tool.callsPerTask}</Item>
          <Item label="Min. context">{fmtCtx(tool.minContext)} tokens</Item>
          <Item label="Tool calling">{INTENSITY_LABEL[tool.toolCallingIntensity]}</Item>
        </dl>

        <div>
          <h4 className="text-xs font-medium text-muted-foreground">Connections</h4>
          <ul className="mt-2 flex flex-col gap-2">
            {tool.connections.map((c, i) => (
              <li key={i} className="rounded-lg border-2 p-2.5 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{apiLabel(c.api)}</span>
                  <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
                  <span className="text-muted-foreground">
                    {c.runtimes ? c.runtimes.map((id) => RUNTIMES.find((r) => r.id === id)?.name ?? id).join(", ") : "any runtime exposing it"}
                  </span>
                  <SupportBadge level={c.level} className="ml-auto" />
                </div>
                {c.note && <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto flex flex-col gap-1.5 border-t-2 pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <ExternalA href={tool.documentationURL}>Documentation</ExternalA>
            <span className="text-muted-foreground">last verified {tool.lastVerified}</span>
          </div>
          <SourceLink source={tool.source} />
          {tool.source.note && <p className="text-muted-foreground">{tool.source.note}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{children}</dd>
    </div>
  );
}
