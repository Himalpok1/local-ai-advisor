"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Search, TriangleAlert } from "lucide-react";
import { TOOLS } from "@/data";
import type { WorkloadProfileInput } from "@/lib/schemas";
import type { ParsedHfModel } from "@/lib/hf/parse";
import { normalizeRepo } from "@/lib/hf/parse";
import { importHfModel } from "@/lib/hf/client";
import { bestQuantFor, candidateQuants } from "@/lib/recommendations";
import { encodeState, resolveHardware, type AppState } from "@/lib/share";
import { recHref } from "@/lib/links";
import { USE_CASE_LIST } from "@/lib/workloads/profiles";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HardwarePicker } from "./hardware-picker";
import { defaultsForUseCase, workloadLabel } from "./workload-form";
import { ModelFacts } from "./hf-model-facts";
import { readHfState } from "@/lib/hf/state";
import { RecommendationCard } from "./recommendation-card";

const EXAMPLES = ["Qwen/Qwen3.8-27B", "unsloth/Qwen3.8-27B-GGUF", "google/gemma-4-26B-A4B-it", "openai/gpt-oss-120b", "mistralai/Devstral-Small-2-24B-Instruct-2512", "zai-org/GLM-4.7-Flash"];
interface Hit {
  id: string;
  downloads?: number;
  tags?: string[];
  gated?: boolean;
}

function hitFormat(hit: Hit): string {
  if (hit.tags?.some((t) => /gguf/i.test(t)) || /-gguf/i.test(hit.id)) return "GGUF";
  return hit.tags?.includes("mlx") ? "MLX" : "safetensors";
}

export function HfLookup({ initialRepo, initial }: { initialRepo?: string; initial: AppState }) {
  const [query, setQuery] = useState(initialRepo ?? "");
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(-1);
  const [restored, setRestored] = useState(false);
  const searchVersion = useRef(0);
  const loadVersion = useRef(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(!!initialRepo);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<ParsedHfModel>();
  const [state, setState] = useState<AppState>({ ...initial, hardwareId: initial.hardwareId ?? "mbp-m4-pro-20c-48" });
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = async (raw: string) => {
    const version = ++loadVersion.current;
    ++searchVersion.current;
    clearTimeout(debounce.current);
    const repo = normalizeRepo(raw);
    setOpen(false);
    if (!repo) {
      setLoading(false);
      setResult(undefined);
      setError("Enter a model id like “Qwen/Qwen3-8B” or paste a huggingface.co link.");
      return;
    }
    setQuery(repo);
    setLoading(true);
    setError(undefined);
    try {
      const parsed = await importHfModel(repo);
      if (version === loadVersion.current) setResult(parsed);
    } catch (e) {
      if (version !== loadVersion.current) return;
      setResult(undefined);
      setError((e as Error).message);
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  };

  useEffect(() => {
    // Restore after hydration so server and client initially render identically.
    const timer = setTimeout(() => {
      try {
        if (typeof window !== "undefined" && !initial.hardwareId) {
          const saved = readHfState(window.localStorage.getItem("laa:hf-state"));
          if (saved) setState(saved);
        }
      } catch { /* Storage may be unavailable in private mode. */ }
      setRestored(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [initial.hardwareId]);

  useEffect(() => {
    if (!restored || typeof window === "undefined") return;
    try { window.localStorage.setItem("laa:hf-state", JSON.stringify({ hardwareId: state.hardwareId, custom: state.custom, os: state.os, workload: state.workload })); } catch { /* Optional persistence. */ }
  }, [state, restored]);

  // Shared links (?repo=…) load the model on arrival.
  useEffect(() => {
    if (!initialRepo) return;
    let alive = true;
    const version = ++loadVersion.current;
    importHfModel(initialRepo)
      .then((r) => alive && version === loadVersion.current && setResult(r))
      .catch((e: Error) => alive && version === loadVersion.current && setError(e.message))
      .finally(() => alive && version === loadVersion.current && setLoading(false));
    return () => {
      alive = false;
    };
  }, [initialRepo]);

  useEffect(() => {
    const qs = new URLSearchParams(encodeState({ hardwareId: state.hardwareId, custom: state.custom, os: state.os, workload: state.workload }));
    if (result) qs.set("repo", result.facts.repo);
    window.history.replaceState(window.history.state, "", `${window.location.pathname}?${qs}`);
  }, [result, state]);

  const onType = (v: string) => {
    setQuery(v);
    const version = ++searchVersion.current;
    setActive(-1);
    setOpen(false);
    clearTimeout(debounce.current);
    if (v.trim().length < 2 || v.includes("huggingface.co")) {
      setHits([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/hf/search?q=${encodeURIComponent(v.trim())}`);
        const body = await r.json();
        if (version !== searchVersion.current) return;
        setHits(body.results ?? []);
        setOpen(true);
      } catch {
        if (version !== searchVersion.current) return;
        setHits([]);
      }
    }, 300);
  };

  const hardware = resolveHardware(state);
  const rec = useMemo(() => {
    if (!result || !hardware) return undefined;
    const quants = candidateQuants(result.model.id);
    return bestQuantFor({ hardware, modelId: result.model.id, os: state.os, workload: state.workload }, quants.length ? quants : result.model.supportedQuantizations);
  }, [result, hardware, state.os, state.workload]);
  const setWorkload = (p: Partial<WorkloadProfileInput>) => setState((s) => ({ ...s, workload: { ...s.workload, ...p } }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <p className="text-sm font-medium text-primary">Check any Hugging Face model</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Will this model run comfortably for you?</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        Search Hugging Face or paste a model link. We read its real architecture — parameters, experts, attention layout, context and file sizes — and rate it for your hardware and workload, even if it was released today.
      </p>

      <form
        className="relative mt-6 max-w-3xl"
        onSubmit={(e) => {
          e.preventDefault();
          void load(query);
        }}
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => onType(e.target.value)}
              onFocus={() => hits.length && setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder="e.g. Qwen/Qwen3.8-27B or https://huggingface.co/…"
              aria-label="Hugging Face model"
              role="combobox"
              onKeyDown={(e) => {
                if (e.key === "Escape") { setOpen(false); setActive(-1); ++searchVersion.current; clearTimeout(debounce.current); }
                if ((e.key === "ArrowDown" || e.key === "ArrowUp") && hits.length) {
                  e.preventDefault(); setOpen(true);
                  const next = e.key === "ArrowDown" ? (active + 1) % hits.length : (active <= 0 ? hits.length - 1 : active - 1);
                  setActive(next);
                  document.getElementById(`hf-option-${next}`)?.scrollIntoView({ block: "nearest" });
                }
                if (e.key === "Enter" && open && active >= 0 && hits[active]) { e.preventDefault(); void load(hits[active].id); }
              }}
              aria-activedescendant={open && active >= 0 ? `hf-option-${active}` : undefined}
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls="hf-results"
              autoComplete="off"
              className="h-12 w-full rounded-xl border bg-card pl-10 pr-3 text-base focus-visible:outline-2 focus-visible:outline-ring"
            />
          </div>
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Check"}
          </Button>
        </div>
        {open && hits.length > 0 && (
          <ul id="hf-results" role="listbox" className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border bg-card p-1 shadow-lg">
            {hits.map((h, index) => (
              <li key={h.id} id={`hf-option-${index}`} role="option" aria-selected={active === index} className={active === index ? "bg-muted" : ""}>
                <button type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => load(h.id)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted">
                  <span className="truncate font-medium">{h.id}</span><Badge>{hitFormat(h)}</Badge>{h.gated && <Badge tone="warn">Gated</Badge>}
                  {h.downloads !== undefined && <span className="shrink-0 text-xs text-muted-foreground">{h.downloads.toLocaleString("en-US")} downloads</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        <span className="py-1 text-muted-foreground">Try:</span>
        {EXAMPLES.map((e) => (
          <button key={e} type="button" onClick={() => load(e)} className="rounded-md border bg-card px-2 py-1 hover:bg-muted">
            {e}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="mt-6 flex max-w-3xl items-start gap-2 rounded-xl border border-borderline/40 bg-borderline/10 p-4 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-borderline" />
          {error}
        </div>
      )}
      {loading && !result && (
        <p className="mt-8 flex items-center gap-2 text-muted-foreground" role="status">
          <Loader2 className="size-4 animate-spin" /> Reading the model from Hugging Face…
        </p>
      )}

      {result && (
        <div className={cn("mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]", loading && "opacity-60")}>
          <div className="space-y-3"><ModelFacts r={result} /><Link className="text-sm text-primary hover:underline" href={`/hf/${result.facts.repo}`}>Permanent model page</Link></div>
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your hardware & workload</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <HardwarePicker value={{ hardwareId: state.hardwareId, custom: state.custom, os: state.os }} onChange={(v) => setState((s) => ({ ...s, ...v }))} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Use case">
                    <Select ariaLabel="Use case" value={state.workload.useCase} onChange={(u) => setWorkload(defaultsForUseCase(u, state.workload))} options={USE_CASE_LIST.map((u) => ({ value: u.id, label: u.label, group: u.group }))} />
                  </Field>
                  <Field label="AI tool">
                    <Select ariaLabel="Tool" value={state.workload.toolId} onChange={(t) => setWorkload({ toolId: t })} options={TOOLS.map((t) => ({ value: t.id, label: t.name }))} />
                  </Field>
                </div>
              </CardContent>
            </Card>
            {rec && (
              <>
                <RecommendationCard rec={rec} eyebrow="Best quantization for your workload" href={recHref(rec, state.workload, state.custom)} workloadLabel={workloadLabel(state.workload)} />
                <div className="flex flex-wrap gap-2">
                  <Link href={`/hardware-for-model?${encodeState({ modelId: result.model.id, workload: state.workload, target: "comfortable" })}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-card px-3 text-sm font-medium hover:bg-muted">
                    What hardware would be comfortable? <ArrowRight className="size-4" />
                  </Link>
                  <Link href={`/compare/models?${encodeState({ hardwareId: state.hardwareId, custom: state.custom, workload: state.workload })}&models=${encodeURIComponent(result.model.id)}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-card px-3 text-sm font-medium hover:bg-muted">
                    Compare with curated models <ArrowRight className="size-4" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
