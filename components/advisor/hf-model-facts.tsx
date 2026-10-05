import { ExternalLink } from "lucide-react";
import { QUANTIZATIONS } from "@/data/quantizations";
import type { QuantId } from "@/lib/schemas";
import type { ParsedHfModel } from "@/lib/hf/parse";
import { kvBytesPerToken, kvCacheGB, weightsGB } from "@/lib/memory";
import { fmtCtx, fmtGB, fmtParams } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OpennessBadge } from "@/components/explore/openness-badge";

const ATTENTION_LABEL = {
  full: "Standard (full attention)",
  "sliding-window": "Sliding-window + global layers",
  "hybrid-linear": "Hybrid linear + full attention",
  mla: "Multi-head latent attention (compressed KV)",
} as const;

/** Shared facts for interactive lookups and server-rendered model pages. */
export function ModelFacts({ r }: { r: ParsedHfModel }) {
  const m = r.model;
  const f = r.facts;
  const quants = m.supportedQuantizations;
  const fmt = m.supportedFormats.includes("gguf") ? "gguf" : m.supportedFormats[0];
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
              <span className="truncate">{m.name}</span>
              <OpennessBadge license={m.license} />
            </CardTitle>
            <CardDescription>
              {m.organization} · {m.license}
              {f.downloads !== undefined && ` · ${f.downloads.toLocaleString("en-US")} downloads`}
            </CardDescription>
          </div>
          <a href={m.source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-link hover:underline">
            Hugging Face <ExternalLink className="size-3.5" />
          </a>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {f.isGgufRepo && <Badge tone="primary">GGUF repo</Badge>}
          {f.isMlxRepo && <Badge tone="primary">MLX repo</Badge>}
          {m.denseOrMoE === "moe" && <Badge>Mixture of experts</Badge>}
          {m.vision && <Badge>Vision</Badge>}
          {m.thinking && <Badge>Reasoning / thinking mode</Badge>}
          {f.gated && <Badge tone="warn">Gated</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Parameters</dt>
          <dd className="text-right">
            {fmtParams(m.parameterCount)} {f.parametersExact ? <Badge tone="good">exact</Badge> : <Badge>estimated</Badge>}
          </dd>
          {m.denseOrMoE === "moe" && (
            <>
              <dt className="text-muted-foreground">Active per token</dt>
              <dd className="text-right">
                ≈{fmtParams(m.activeParameterCount)} ({f.experts?.active} of {f.experts?.total} experts)
              </dd>
            </>
          )}
          <dt className="text-muted-foreground">Context window</dt>
          <dd className="text-right">{fmtCtx(m.contextWindow)} tokens{f.extendedContext && <span className="block text-xs text-muted-foreground">RoPE-extended to {fmtCtx(f.extendedContext)} (quality degrades past native — treat long-context ratings as optimistic)</span>}</dd>
          <dt className="text-muted-foreground">Attention</dt>
          <dd className="text-right">{ATTENTION_LABEL[f.attention]}</dd>
          <dt className="text-muted-foreground">Layers · KV heads · head dim</dt>
          <dd className="text-right">
            {f.layers} · {f.kvHeads} · {f.headDim}
          </dd>
          <dt className="text-muted-foreground">KV cache</dt>
          <dd className="text-right">
            {Math.round(kvBytesPerToken(m) / 1024)} KB/token · {fmtGB(kvCacheGB(m, 32768, 1, "f16"))} at 32K
          </dd>
          {(["toolCalling", "thinking", "vision"] as const).map((key) => (
            <div key={key} className="contents">
              <dt className="text-muted-foreground">{key === "toolCalling" ? "Tool calling" : key === "thinking" ? "Thinking" : "Vision"}</dt>
              <dd className="text-right">{f.signals[key].value} <span className="text-xs text-muted-foreground">({f.signals[key].signal === "none" ? "inferred — no supporting signal" : `from ${f.signals[key].signal.replaceAll("-", " ")}`})</span></dd>
            </div>
          ))}
          <dt className="text-muted-foreground">Commercial use</dt>
          <dd className="text-right"><Badge>{({ yes: "allowed", no: "not allowed", conditional: "conditional", unknown: "check card" })[f.commercialUse.commercial]}</Badge><span className="block text-xs text-muted-foreground">{f.commercialUse.note}</span></dd>
          <dt className="text-muted-foreground">Import confidence</dt>
          <dd className="text-right">{m.source.confidence} · capabilities estimated</dd>
        </dl>

        <div>
          <p className="mb-2 text-sm font-medium">Weights by quantization</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {quants.map((q: QuantId) => {
              const known = !!m.knownSizesGB?.[q];
              const sizeFormat = f.sizeFormats[q] ?? fmt;
              return (
                <div key={q} className="rounded-lg border-2 p-2 text-center">
                  <p className="text-xs text-muted-foreground">{QUANTIZATIONS[q].formatNames[fmt] ?? QUANTIZATIONS[q].label}</p>
                  <p className="font-medium tabular-nums">{fmtGB(weightsGB(m, QUANTIZATIONS[q], sizeFormat))}</p>
                  <p className="text-[10px] text-muted-foreground">{known ? `${sizeFormat} file size` : "computed · low confidence"}</p>
                </div>
              );
            })}
          </div>
        </div>

        {r.warnings.length > 0 && (
          <ul className="space-y-1 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            {r.warnings.map((w) => (
              <li key={w}>• {w}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
