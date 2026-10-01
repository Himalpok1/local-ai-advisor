"use client";
import {
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  CircleHelp,
  Database,
  FileText,
  FolderGit2,
  Image as ImageIcon,
  MessageCircle,
  PenLine,
  Search,
  Server,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { TOOLS, getTool } from "@/data";
import type { UseCaseId, WorkloadProfileInput } from "@/lib/schemas";
import { USE_CASES, USE_CASE_LIST } from "@/lib/workloads/profiles";
import { AGENT_BEHAVIORS, CODING_STYLES, CONTEXT_STEPS, DOCUMENT_SIZES, REPO_SIZES } from "@/lib/workloads/resolve";
import { DEV_ENV_LIST } from "@/lib/workloads/dev-env";
import { fmtCtx } from "@/lib/format";
import { Field, NumberInput, OptionCard, Segmented, Select, Switch } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

export const USE_CASE_ICONS: Record<UseCaseId, React.ReactNode> = {
  "casual-chat": <MessageCircle className="size-5" />,
  "general-assistant": <Sparkles className="size-5" />,
  "coding-questions": <CircleHelp className="size-5" />,
  "coding-repo": <FolderGit2 className="size-5" />,
  "agentic-coding": <Bot className="size-5" />,
  reasoning: <Brain className="size-5" />,
  research: <Search className="size-5" />,
  "document-analysis": <FileText className="size-5" />,
  "long-doc-qa": <BookOpen className="size-5" />,
  writing: <PenLine className="size-5" />,
  vision: <ImageIcon className="size-5" />,
  "data-analysis": <BarChart3 className="size-5" />,
  rag: <Database className="size-5" />,
  "api-server": <Server className="size-5" />,
  "multi-agent": <Users className="size-5" />,
  "background-automation": <Workflow className="size-5" />,
};

type Patch = (p: Partial<WorkloadProfileInput>) => void;

/** Defaults applied when the use case changes so the form stays coherent. */
export function defaultsForUseCase(useCase: UseCaseId, current: WorkloadProfileInput): Partial<WorkloadProfileInput> {
  const p = USE_CASES[useCase];
  const tool = getTool(current.toolId);
  const patch: Partial<WorkloadProfileInput> = { useCase, desiredContextWindow: undefined };
  const codingTool = ["coding-agent", "ide-agent", "ide-assistant"].includes(tool.category);
  if (p.isCoding && !codingTool) patch.toolId = useCase === "coding-questions" ? "continue" : "opencode";
  if (!p.isCoding && codingTool) patch.toolId = useCase === "api-server" || useCase === "background-automation" ? "api-only" : "open-webui";
  if (useCase === "api-server") patch.toolId = "api-only";
  patch.devEnv = p.isCoding ? "normal" : useCase === "api-server" || useCase === "background-automation" ? "none" : "light";
  if (p.isCoding) {
    patch.repositorySize = current.repositorySize ?? "medium";
    patch.codingStyle = useCase === "agentic-coding" ? "agentic" : useCase === "coding-questions" ? "questions" : useCase === "coding-repo" ? "multi-file" : current.codingStyle;
  }
  if (["document-analysis", "long-doc-qa", "rag", "research"].includes(useCase)) patch.documentSize = useCase === "long-doc-qa" ? "long" : "medium";
  patch.concurrentRequests = p.defaultConcurrency;
  patch.numberOfAgents = useCase === "multi-agent" ? 3 : 1;
  patch.multimodalRequired = useCase === "vision" ? true : undefined;
  return patch;
}

export function UseCasePicker({ value, onChange }: { value: WorkloadProfileInput; onChange: Patch }) {
  const groups = [...new Set(USE_CASE_LIST.map((u) => u.group))];
  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g}</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASE_LIST.filter((u) => u.group === g).map((u) => (
              <OptionCard
                key={u.id}
                selected={value.useCase === u.id}
                onClick={() => onChange(defaultsForUseCase(u.id, value))}
                icon={USE_CASE_ICONS[u.id]}
                title={u.label}
                description={u.description}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const TOOL_CATEGORY_LABEL = {
  "coding-agent": "Coding agent",
  "ide-agent": "IDE agent",
  "ide-assistant": "IDE assistant",
  "chat-ui": "Chat UI",
  "runtime-app": "Desktop app",
  api: "API",
  automation: "Automation",
} as const;

export function ToolPicker({ value, onChange }: { value: WorkloadProfileInput; onChange: Patch }) {
  const isCoding = USE_CASES[value.useCase].isCoding;
  const order = (cat: string) => (isCoding ? ["coding-agent", "ide-agent", "ide-assistant", "chat-ui", "runtime-app", "api", "automation"] : ["chat-ui", "runtime-app", "api", "automation", "ide-assistant", "ide-agent", "coding-agent"]).indexOf(cat);
  const tools = [...TOOLS].sort((a, b) => order(a.category) - order(b.category));
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((t) => (
        <OptionCard
          key={t.id}
          selected={value.toolId === t.id}
          onClick={() => onChange({ toolId: t.id })}
          title={t.name}
          badge={<Badge tone={t.agenticLoopIntensity > 0.6 ? "primary" : "neutral"}>{TOOL_CATEGORY_LABEL[t.category]}</Badge>}
          description={t.agenticLoopIntensity > 0.6 ? `Agent loop · ~${t.callsPerTask} model calls per task · ~${Math.round(t.basePromptTokens / 1000)}K-token system prompt` : t.description.split(".")[0] + "."}
        />
      ))}
    </div>
  );
}

export function WorkloadDetails({ value, onChange, simple }: { value: WorkloadProfileInput; onChange: Patch; simple?: boolean }) {
  const p = USE_CASES[value.useCase];
  const tool = getTool(value.toolId);
  const agentic = tool.agenticLoopIntensity > 0.5 || value.useCase === "agentic-coding" || value.useCase === "multi-agent";
  const docs = ["document-analysis", "long-doc-qa", "rag", "research"].includes(value.useCase);
  return (
    <div className="space-y-6">
      {p.isCoding && (
        <>
          {!simple && (
            <Field label="Coding style">
              <Select
                ariaLabel="Coding style"
                value={value.codingStyle}
                onChange={(v) => onChange({ codingStyle: v })}
                options={Object.entries(CODING_STYLES).map(([k, v]) => ({ value: k as keyof typeof CODING_STYLES, label: v.label }))}
              />
            </Field>
          )}
          <Field label={simple ? "How large is your project?" : "Repository size"} hint="Repository size is a signal for retrieval and prompt-processing load — the whole repo never goes into the context.">
            <div className="grid gap-2 sm:grid-cols-5">
              {Object.entries(REPO_SIZES).map(([k, r]) => (
                <OptionCard key={k} selected={value.repositorySize === k} onClick={() => onChange({ repositorySize: k as keyof typeof REPO_SIZES })} title={r.label} description={r.lines} />
              ))}
            </div>
          </Field>
          {agentic && (
            <Field label="How does the agent behave?">
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {Object.entries(AGENT_BEHAVIORS).map(([k, b]) => (
                  <OptionCard key={k} selected={value.agentBehavior === k} onClick={() => onChange({ agentBehavior: k as keyof typeof AGENT_BEHAVIORS })} title={b.label} />
                ))}
              </div>
            </Field>
          )}
        </>
      )}
      {docs && (
        <Field label="How long are your documents?">
          <div className="grid gap-2 sm:grid-cols-4">
            {Object.entries(DOCUMENT_SIZES).map(([k, d]) => (
              <OptionCard key={k} selected={value.documentSize === k} onClick={() => onChange({ documentSize: k as keyof typeof DOCUMENT_SIZES })} title={d.label} description={`${d.hint} · ~${Math.round(d.tokens / 1000)}K tokens`} />
            ))}
          </div>
        </Field>
      )}
      {(value.useCase === "api-server" || value.useCase === "multi-agent") && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Concurrent requests">
            <NumberInput ariaLabel="Concurrent requests" value={value.concurrentRequests} onChange={(v) => onChange({ concurrentRequests: Math.max(1, Math.min(64, v ?? 1)) })} min={1} max={64} />
          </Field>
          <Field label="Agents running at once">
            <NumberInput ariaLabel="Agents" value={value.numberOfAgents} onChange={(v) => onChange({ numberOfAgents: Math.max(1, Math.min(16, v ?? 1)) })} min={1} max={16} />
          </Field>
        </div>
      )}
      <DevEnvPicker value={value} onChange={onChange} />
    </div>
  );
}

export function DevEnvPicker({ value, onChange }: { value: WorkloadProfileInput; onChange: Patch }) {
  const isCoding = USE_CASES[value.useCase].isCoding;
  return (
    <Field
      label={isCoding ? "What else do you normally run while coding?" : "What else is running on this machine?"}
      hint="This memory is subtracted before the model is considered. Very important on 16–32 GB machines."
    >
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {DEV_ENV_LIST.map((d) => (
          <OptionCard key={d.preset} selected={(value.devEnv ?? "normal") === d.preset} onClick={() => onChange({ devEnv: d.preset })} title={`${d.label}${d.preset !== "custom" ? ` · ${d.reserveGB} GB` : ""}`} description={d.description} />
        ))}
      </div>
      {value.devEnv === "custom" && (
        <NumberInput className="mt-2 max-w-48" ariaLabel="Custom other memory" value={value.customDevEnvGB ?? 8} onChange={(v) => onChange({ customDevEnvGB: v })} min={0} max={512} suffix="GB" />
      )}
    </Field>
  );
}

export function PriorityPicker({ value, onChange }: { value: WorkloadProfileInput; onChange: Patch }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <OptionCard selected={value.priority === "speed"} onClick={() => onChange({ priority: "speed" })} title="Speed" description="Snappy responses and fast agent loops; accept a smaller model." />
      <OptionCard selected={(value.priority ?? "balanced") === "balanced"} onClick={() => onChange({ priority: "balanced" })} title="Balanced" description="Good quality without frustrating waits." />
      <OptionCard selected={value.priority === "quality"} onClick={() => onChange({ priority: "quality" })} title="Quality" description="The most capable model that stays usable, even if slower." />
    </div>
  );
}

export function AdvancedSettings({ value, onChange }: { value: WorkloadProfileInput; onChange: Patch }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Context window" hint="Auto picks a size suited to your use case and tool.">
        <Select
          ariaLabel="Context window"
          value={String(value.desiredContextWindow ?? "auto")}
          onChange={(v) => onChange({ desiredContextWindow: v === "auto" ? undefined : Number(v) })}
          options={[{ value: "auto", label: "Auto" }, ...CONTEXT_STEPS.map((c) => ({ value: String(c), label: `${fmtCtx(c)} tokens` }))]}
        />
      </Field>
      <Field label="KV-cache precision" hint="Q8 roughly halves context memory with minimal quality loss.">
        <Segmented ariaLabel="KV cache" value={value.kvCacheType ?? "f16"} onChange={(v) => onChange({ kvCacheType: v })} options={[{ value: "f16", label: "FP16" }, { value: "q8", label: "Q8" }, { value: "q4", label: "Q4" }]} />
      </Field>
      <Field label="RAM reserved for OS" hint="Leave empty for an OS-specific default.">
        <NumberInput ariaLabel="OS reserve" value={value.osReserveGB} onChange={(v) => onChange({ osReserveGB: v })} min={0} max={64} suffix="GB" placeholder="auto" />
      </Field>
      <Field label="Prompt tokens per request" hint="Overrides the use-case estimate.">
        <NumberInput ariaLabel="Prompt tokens" value={value.expectedPromptTokens} onChange={(v) => onChange({ expectedPromptTokens: v })} min={1} suffix="tokens" placeholder="auto" />
      </Field>
      <Field label="Output tokens per response">
        <NumberInput ariaLabel="Output tokens" value={value.outputLength} onChange={(v) => onChange({ outputLength: v })} min={1} suffix="tokens" placeholder="auto" />
      </Field>
      <Field label="Batch size (prefill)">
        <NumberInput ariaLabel="Batch size" value={value.batchSize ?? 512} onChange={(v) => onChange({ batchSize: v })} min={64} max={8192} step={64} />
      </Field>
      <Field label="Concurrent requests">
        <NumberInput ariaLabel="Concurrent requests" value={value.concurrentRequests ?? 1} onChange={(v) => onChange({ concurrentRequests: Math.max(1, Math.min(64, v ?? 1)) })} min={1} max={64} />
      </Field>
      <Field label="Agents running at once">
        <NumberInput ariaLabel="Number of agents" value={value.numberOfAgents ?? 1} onChange={(v) => onChange({ numberOfAgents: Math.max(1, Math.min(16, v ?? 1)) })} min={1} max={16} />
      </Field>
      <Field label={`GPU offload: ${value.gpuOffload === undefined ? "auto" : `${Math.round(value.gpuOffload * 100)}%`}`} hint="Fraction of layers on the GPU. Auto = as much as fits.">
        <div className="flex items-center gap-3">
          <input type="range" aria-label="GPU offload" min={0} max={100} value={Math.round((value.gpuOffload ?? 1) * 100)} onChange={(e) => onChange({ gpuOffload: Number(e.target.value) / 100 })} className="w-full" />
          <button type="button" className="text-xs text-primary hover:underline" onClick={() => onChange({ gpuOffload: undefined })}>
            Auto
          </button>
        </div>
      </Field>
      <Field label="Session length">
        <Segmented ariaLabel="Session length" value={value.sessionLength ?? "medium"} onChange={(v) => onChange({ sessionLength: v })} options={[{ value: "short", label: "Short" }, { value: "medium", label: "Medium" }, { value: "long", label: "Long" }]} />
      </Field>
      <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-3 lg:flex-row lg:gap-8">
        <Switch checked={!!value.raiseGpuMemoryLimit} onChange={(v) => onChange({ raiseGpuMemoryLimit: v })} label="Raise GPU memory limit" hint="Unified memory: let the GPU use up to ~90% of RAM." />
        <Switch checked={!!value.batterySensitive} onChange={(v) => onChange({ batterySensitive: v })} label="Often on battery" hint="Laptops lose performance unplugged." />
        <Switch checked={!!value.multimodalRequired} onChange={(v) => onChange({ multimodalRequired: v })} label="Needs image input" hint="Only vision models qualify." />
      </div>
    </div>
  );
}

export function workloadLabel(w: WorkloadProfileInput): string {
  const p = USE_CASES[w.useCase];
  const parts = [p.label];
  if (p.isCoding && w.repositorySize) parts.push(`${REPO_SIZES[w.repositorySize].label.toLowerCase()} repository`);
  if (w.documentSize && ["document-analysis", "long-doc-qa", "rag", "research"].includes(w.useCase)) parts.push(`${DOCUMENT_SIZES[w.documentSize].label.toLowerCase()} documents`);
  if (w.desiredContextWindow) parts.push(`${fmtCtx(w.desiredContextWindow)} context`);
  const streams = (w.numberOfAgents ?? 1) * (w.concurrentRequests ?? 1);
  if (streams > 1) parts.push(`${streams} parallel streams`);
  return parts.join(" / ");
}
