"use client";
import { ChipMascot } from "@/components/art/illustrations";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Eye, Brain, Search, Scale, RotateCcw } from "lucide-react";
import type { Model, ToolCallingLevel } from "@/lib/schemas";
import { fmtCtx, fmtGB, fmtParams } from "@/lib/format";
import { cn } from "@/lib/utils";
import { OPENNESS_LABEL, licenseOpenness, type Openness } from "@/lib/hf/licenses";
import { OpennessBadge } from "./openness-badge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Segmented, Select, Switch } from "@/components/ui/form";
import { TierDots } from "./badges";
import { SourceLink } from "./source-link";

export interface ModelRow {
  model: Model;
  /** Weights at the reference 4-bit quant (GGUF). */
  q4GB: number;
  /** Label of the reference 4-bit quant (e.g. "Q4_K_M" or "MXFP4"). */
  q4Label: string;
}

const TYPE_LABEL: Record<Model["modelType"], string> = {
  general: "General",
  chat: "Chat",
  coder: "Coder",
  reasoning: "Reasoning",
  vision: "Vision",
};

const USE_CASE_LABEL: Record<string, string> = {
  chat: "Chat",
  coding: "Coding",
  agentic: "Agentic",
  reasoning: "Reasoning",
  vision: "Vision",
  "long-context": "Long context",
  writing: "Writing",
  autocomplete: "Autocomplete",
};

const TOOL_CALLING_LABEL: Record<ToolCallingLevel, string> = { reliable: "Reliable", good: "Good", basic: "Basic", none: "None" };
const TOOL_CALLING_CLASS: Record<ToolCallingLevel, string> = {
  reliable: "text-comfortable",
  good: "text-excellent",
  basic: "text-borderline",
  none: "text-muted-foreground",
};

const CAPS: { key: keyof Model["capabilities"]; label: string }[] = [
  { key: "general", label: "General" },
  { key: "coding", label: "Coding" },
  { key: "reasoning", label: "Reasoning" },
  { key: "agentic", label: "Agentic" },
  { key: "longContext", label: "Long context" },
  { key: "writing", label: "Writing" },
];

const MEMORY_STEPS = [4, 6, 8, 12, 16, 20, 24, 32, 48, 64, 96, 128, 192, 256, 512];

type SortKey = "release" | "name" | "params" | "size" | "coding" | "context";
const SORTS: { value: SortKey; label: string }[] = [
  { value: "release", label: "Newest first" },
  { value: "name", label: "Name (A–Z)" },
  { value: "size", label: "Q4 size (smallest first)" },
  { value: "params", label: "Total parameters (largest first)" },
  { value: "coding", label: "Coding tier (highest first)" },
  { value: "context", label: "Context window (largest first)" },
];

export function ModelsExplorer({ rows }: { rows: ModelRow[] }) {
  const [query, setQuery] = useState("");
  const [org, setOrg] = useState("all");
  const [arch, setArch] = useState<"all" | "dense" | "moe">("all");
  const [visionOnly, setVisionOnly] = useState(false);
  const [kind, setKind] = useState("all");
  const [minCoding, setMinCoding] = useState("0");
  const [fitsOn, setFitsOn] = useState(false);
  const [fitsIdx, setFitsIdx] = useState(MEMORY_STEPS.indexOf(24));
  const [sort, setSort] = useState<SortKey>("release");
  const [openness, setOpenness] = useState<"all" | Openness>("all");

  const orgs = useMemo(() => [...new Set(rows.map((r) => r.model.organization))].sort(), [rows]);
  const useCases = useMemo(() => [...new Set(rows.flatMap((r) => r.model.useCases))].sort(), [rows]);
  const types = useMemo(() => [...new Set(rows.map((r) => r.model.modelType))], [rows]);
  const fitsGB = MEMORY_STEPS[fitsIdx];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = Number(minCoding);
    const out = rows.filter(({ model: m, q4GB }) => {
      if (q && ![m.name, m.family, m.organization, m.id, m.variant ?? ""].some((s) => s.toLowerCase().includes(q))) return false;
      if (org !== "all" && m.organization !== org) return false;
      if (arch !== "all" && m.denseOrMoE !== arch) return false;
      if (visionOnly && !m.vision) return false;
      if (kind.startsWith("type:") && m.modelType !== kind.slice(5)) return false;
      if (kind.startsWith("use:") && !m.useCases.includes(kind.slice(4))) return false;
      if (m.capabilities.coding < min) return false;
      if (fitsOn && q4GB > fitsGB) return false;
      if (openness !== "all" && licenseOpenness(m.license) !== openness) return false;
      return true;
    });
    const by: Record<SortKey, (a: ModelRow, b: ModelRow) => number> = {
      release: (a, b) => b.model.releaseDate.localeCompare(a.model.releaseDate) || a.model.name.localeCompare(b.model.name),
      name: (a, b) => a.model.name.localeCompare(b.model.name),
      size: (a, b) => a.q4GB - b.q4GB,
      params: (a, b) => b.model.parameterCount - a.model.parameterCount,
      coding: (a, b) => b.model.capabilities.coding - a.model.capabilities.coding || b.model.releaseDate.localeCompare(a.model.releaseDate),
      context: (a, b) => b.model.contextWindow - a.model.contextWindow,
    };
    return [...out].sort(by[sort]);
  }, [rows, query, org, arch, visionOnly, kind, minCoding, fitsOn, fitsGB, sort, openness]);

  const reset = () => {
    setQuery("");
    setOrg("all");
    setArch("all");
    setVisionOnly(false);
    setKind("all");
    setMinCoding("0");
    setFitsOn(false);
    setSort("release");
    setOpenness("all");
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-4 sm:p-5">
        <form role="search" aria-label="Filter models" onSubmit={(e) => e.preventDefault()} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Search" className="sm:col-span-2 lg:col-span-1">
            <div className="flex h-10 items-center gap-2 rounded-lg border-2 bg-card px-3 focus-within:outline-2 focus-within:outline-ring">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                type="search"
                aria-label="Search models by name, family or organization"
                placeholder="e.g. Qwen, gpt-oss, Gemma"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-full w-full min-w-0 bg-transparent text-sm outline-none"
              />
            </div>
          </Field>
          <Field label="Organization">
            <Select ariaLabel="Organization" value={org} onChange={setOrg} options={[{ value: "all", label: "All organizations" }, ...orgs.map((o) => ({ value: o, label: o }))]} />
          </Field>
          <Field label="Model type / use case">
            <Select
              ariaLabel="Model type or use case"
              value={kind}
              onChange={setKind}
              options={[
                { value: "all", label: "Any type or use case" },
                ...types.map((t) => ({ value: `type:${t}`, label: TYPE_LABEL[t], group: "Model type" })),
                ...useCases.map((u) => ({ value: `use:${u}`, label: USE_CASE_LABEL[u] ?? u, group: "Suited for" })),
              ]}
            />
          </Field>
          <Field label="Minimum coding tier" hint="Editorial assessment, 1–5">
            <Select
              ariaLabel="Minimum coding tier"
              value={minCoding}
              onChange={setMinCoding}
              options={[
                { value: "0", label: "Any" },
                { value: "3", label: "3+ (capable)" },
                { value: "3.5", label: "3.5+" },
                { value: "4", label: "4+ (strong)" },
                { value: "4.5", label: "4.5+ (top tier)" },
              ]}
            />
          </Field>
          <Field label="Architecture">
            <Segmented
              ariaLabel="Architecture"
              size="sm"
              value={arch}
              onChange={setArch}
              options={[
                { value: "all", label: "All" },
                { value: "dense", label: "Dense", hint: "Every parameter is read for every token" },
                { value: "moe", label: "MoE", hint: "Mixture of experts: only some parameters are active per token" },
              ]}
            />
          </Field>
          <Field label="Images">
            <Switch checked={visionOnly} onChange={setVisionOnly} label="Vision-capable only" />
          </Field>
          <Field label="License" hint="Open source = OSI-approved license on the weights">
            <Select
              ariaLabel="License openness"
              value={openness}
              onChange={setOpenness}
              options={[
                { value: "all", label: "Any license" },
                { value: "open-source", label: OPENNESS_LABEL["open-source"] },
                { value: "open-weights", label: OPENNESS_LABEL["open-weights"] },
              ]}
            />
          </Field>
          <Field label="Weights fit in memory" className="sm:col-span-2 lg:col-span-1" hint="Weights only, at 4-bit (MXFP4 where Q4 isn't published). Context and OS need extra room.">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 lg:flex-col lg:items-stretch lg:gap-2">
              <Switch checked={fitsOn} onChange={setFitsOn} label={fitsOn ? `≤ ${fitsGB} GB` : "Off"} />
              <input
                type="range"
                min={0}
                max={MEMORY_STEPS.length - 1}
                step={1}
                value={fitsIdx}
                disabled={!fitsOn}
                aria-label="Maximum weights size at Q4"
                aria-valuetext={`${fitsGB} GB`}
                onChange={(e) => setFitsIdx(Number(e.target.value))}
                className="w-full disabled:opacity-40"
              />
            </div>
          </Field>
        </form>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Showing <strong className="text-foreground">{filtered.length}</strong> of {rows.length} models
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="size-3.5" aria-hidden /> Reset
          </Button>
          <label htmlFor="model-sort" className="text-sm text-muted-foreground">
            Sort
          </label>
          <select
            id="model-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-8 rounded-lg border-2 bg-card px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center text-sm text-muted-foreground">
          <ChipMascot className="w-24" tone="fill-sticker-blue" />
          No models match these filters. Try loosening the memory limit or coding tier.</Card>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {filtered.map((r) => (
            <li key={r.model.id}>
              <ModelCard row={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ModelCard({ row }: { row: ModelRow }) {
  const m = row.model;
  const moe = m.denseOrMoE === "moe";
  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-2 p-5 pb-3">
        <div className="min-w-0">
          <h3 className="font-semibold leading-tight tracking-tight">{m.name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {m.organization} · {m.family}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={moe ? "primary" : "neutral"}>{moe ? "MoE" : "Dense"}</Badge>
          <Badge>{TYPE_LABEL[m.modelType]}</Badge>
          {m.vision && (
            <Badge tone="good">
              <Eye className="size-3" aria-hidden /> Vision
            </Badge>
          )}
          {m.thinking && (
            <Badge>
              <Brain className="size-3" aria-hidden /> Thinking
            </Badge>
          )}
          <OpennessBadge license={m.license} />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 text-sm sm:grid-cols-3">
        <Spec label="Parameters">
          {moe ? (
            <>
              {fmtParams(m.parameterCount)} <span className="text-muted-foreground">/ {fmtParams(m.activeParameterCount)} active</span>
            </>
          ) : (
            fmtParams(m.parameterCount)
          )}
        </Spec>
        <Spec label="Context window">{fmtCtx(m.contextWindow)} tokens</Spec>
        <Spec label={`Weights at ${row.q4Label}`}>{fmtGB(row.q4GB)}</Spec>
        <Spec label="Tool calling">
          <span className={cn("font-medium", TOOL_CALLING_CLASS[m.toolCalling])}>{TOOL_CALLING_LABEL[m.toolCalling]}</span>
        </Spec>
        <Spec label="License">
          <span className="break-words">{m.license}</span>
        </Spec>
        <Spec label="Released">{m.releaseDate}</Spec>
      </dl>

      <div className="mx-5 mt-4 rounded-lg bg-muted/60 p-3">
        <p className="text-xs font-medium text-muted-foreground">Capability tiers · editorial assessment, not benchmark scores</p>
        <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
          {CAPS.map((c) => (
            <li key={c.key} className="flex items-center justify-between gap-2 text-xs">
              <span>{c.label}</span>
              <TierDots value={m.capabilities[c.key]} label={`${c.label} tier`} />
            </li>
          ))}
        </ul>
      </div>

      {m.notes && <p className="mx-5 mt-3 text-xs text-muted-foreground">{m.notes}</p>}

      <div className="mt-auto flex flex-col gap-3 p-5 pt-4">
        <SourceLink source={m.source} compact />
        <div className="flex flex-wrap gap-2">
          <Link href={`/can-i-run/${m.id}`} className={buttonClass("primary", "sm")}>
            Can my computer run it? <ArrowRight className="size-3.5" aria-hidden />
          </Link>
          <Link href={`/hardware-for-model?m=${encodeURIComponent(m.id)}`} className={buttonClass("secondary", "sm")}>
            What hardware do I need? <ArrowRight className="size-3.5" aria-hidden />
          </Link>
          <Link href={`/compare/models?m=${encodeURIComponent(m.id)}`} className={buttonClass("outline", "sm")} aria-label={`Compare ${m.name} with other models`}>
            <Scale className="size-3.5" aria-hidden /> Compare
          </Link>
        </div>
      </div>
    </Card>
  );
}

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{children}</dd>
    </div>
  );
}
