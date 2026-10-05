"use client";
import { useMemo, useState } from "react";
import { Bot, Code2, MessageCircle } from "lucide-react";
import { getHardware, getModel, getTool } from "@/data";
import { evaluate } from "@/lib/recommendations";
import { fmtMinutes, fmtSec, fmtTps } from "@/lib/format";
import type { WorkloadProfileInput } from "@/lib/schemas";
import type { Recommendation } from "@/lib/schemas/results";
import { Segmented } from "@/components/ui/form";
import { ComfortBadge, COMFORT_STYLE } from "@/components/advisor/comfort";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "./widget-frame";

const HARDWARE_ID = "mbp-m4-pro-20c-48";
const MODEL_CHOICES = [
  { id: "qwen3.6-27b", label: "Qwen3.6 27B · dense" },
  { id: "qwen3.6-35b-a3b", label: "Qwen3.6 35B-A3B · MoE" },
] as const;
type ModelChoice = (typeof MODEL_CHOICES)[number]["id"];

const WORKLOADS: { key: string; title: string; Icon: typeof Bot; workload: WorkloadProfileInput }[] = [
  { key: "chat", title: "Casual chat", Icon: MessageCircle, workload: { useCase: "casual-chat", toolId: "open-webui", devEnv: "light" } },
  { key: "questions", title: "Coding questions", Icon: Code2, workload: { useCase: "coding-questions", toolId: "continue" } },
  { key: "agent", title: "Agentic coding", Icon: Bot, workload: { useCase: "agentic-coding", toolId: "opencode", repositorySize: "medium" } },
];

function keyReason(rec: Recommendation): string | undefined {
  const e = rec.explanation;
  return e.blockers[0] ?? e.warnings[0] ?? e.positives[0];
}

export function WorkloadCompare() {
  const [modelId, setModelId] = useState<ModelChoice>("qwen3.6-27b");
  const hardware = getHardware(HARDWARE_ID);
  const model = getModel(modelId);

  const results = useMemo(
    () =>
      WORKLOADS.map((w) => {
        try {
          return { ...w, rec: evaluate({ hardware, modelId, quant: "q4", workload: w.workload }) };
        } catch {
          return { ...w, rec: null };
        }
      }),
    [hardware, modelId],
  );

  return (
    <WidgetFrame
      title="Same model, same computer, different workloads"
      description={
        <>
          {hardware.name} · {model.name} at Q4. Only the workload changes.
        </>
      }
      controls={
        <Segmented
          size="sm"
          ariaLabel="Model"
          value={modelId}
          onChange={setModelId}
          options={MODEL_CHOICES.map((m) => ({ value: m.id, label: m.label }))}
        />
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
        {results.map(({ key, title, Icon, workload, rec }) => (
          <div key={key} className={cn("flex flex-col rounded-xl border-2 p-4", rec && COMFORT_STYLE[rec.level].border)}>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Icon className="size-4 text-muted-foreground" /> {title}
            </p>
            <p className="text-xs text-muted-foreground">via {getTool(workload.toolId).name}</p>
            {rec ? (
              <>
                <div className="mt-3">
                  <ComfortBadge level={rec.level} size="sm" />
                </div>
                <p className="mt-2 text-sm font-medium leading-snug">{rec.headline}</p>
                {keyReason(rec) && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{keyReason(rec)}</p>}
                <div className="min-h-3 flex-1" />
                {rec.performance && (
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 border-t-2 pt-3 text-xs [&_dd]:text-right [&_dd]:font-mono [&_dd]:tabular-nums [&_dt]:text-muted-foreground">
                    <dt>Generation</dt>
                    <dd>{fmtTps(rec.performance.generationTps, rec.performance.basis)}</dd>
                    <dt>Prefill</dt>
                    <dd>{fmtTps(rec.performance.prefillTps, rec.performance.basis)}</dd>
                    <dt>Per step</dt>
                    <dd>{fmtSec(rec.performance.stepLatencySec)}</dd>
                    <dt>Per task</dt>
                    <dd>{fmtMinutes(rec.performance.taskMinutes)}</dd>
                  </dl>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Could not evaluate this combination.</p>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Switch to the MoE model: it is <em>bigger</em> on disk but reads only ~3B parameters per token, so every agent step is much faster.
        {" "}“Per task” = typical number of model calls × time per call.
      </p>
    </WidgetFrame>
  );
}
