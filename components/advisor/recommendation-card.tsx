import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Recommendation } from "@/lib/schemas/results";
import { COMFORT_LABEL } from "@/lib/schemas/results";
import { fmtCtx, fmtGB, fmtSec, fmtTps } from "@/lib/format";
import { SUPPORT_LABEL } from "@/lib/compatibility";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Disclosure } from "@/components/ui/disclosure";
import { ComfortBadge, ComfortScale, ConfidenceBadge, COMFORT_STYLE } from "./comfort";
import { ExplanationPanel } from "./explanation";
import { getUseCase } from "@/lib/workloads/profiles";

const DIM_WORD = { excellent: "Excellent", good: "Comfortable", fair: "Adequate", poor: "Slow", inadequate: "Too slow" } as const;

export function quantName(rec: Recommendation) {
  return rec.quant.formatNames[rec.format] ?? rec.quant.label;
}

export function RecommendationCard({
  rec,
  eyebrow,
  reason,
  href,
  workloadLabel,
  className,
}: {
  rec: Recommendation;
  eyebrow?: string;
  reason?: string;
  href?: string;
  workloadLabel?: string;
  className?: string;
}) {
  const style = COMFORT_STYLE[rec.level];
  const dim = (k: string) => rec.dimensions.find((d) => d.key === k);
  const p = rec.performance;
  const blocked = rec.level === "unsupported" || rec.level === "does-not-fit";
  return (
    <Card className={cn("flex flex-col overflow-hidden", className)}>
      <div className={cn("border-b px-5 py-4", style.bg)}>
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{eyebrow}</p>}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold leading-tight">
              {rec.model.name} <span className="text-muted-foreground">— {quantName(rec)}</span>
            </h3>
            <p className={cn("mt-1 text-sm font-medium", style.text)}>
              {blocked ? rec.headline : `${COMFORT_LABEL[rec.level]} for your workload`}
            </p>
          </div>
          <ComfortBadge level={rec.level} />
        </div>
        {!blocked && (
          <div className="mt-2">
            <ComfortScale level={rec.level} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        {reason && <p className="text-sm">{reason}</p>}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Your setup</dt>
          <dd className="text-right">{rec.hardware.name}</dd>
          <dt className="text-muted-foreground">Workload</dt>
          <dd className="text-right">{workloadLabel ?? getUseCase(rec.useCase).label}</dd>
          <dt className="text-muted-foreground">Runtime → tool</dt>
          <dd className="text-right">
            {rec.runtime.name} → {rec.tool.name}
          </dd>
          {!blocked && p && (
            <>
              <dt className="text-muted-foreground">Memory</dt>
              <dd className="text-right">
                {fmtGB(rec.memory.inferencePeakGB)} · {rec.memory.headroomGB < 1 ? "almost no headroom" : `${fmtGB(rec.memory.headroomGB)} headroom`}
              </dd>
              <dt className="text-muted-foreground">Generation</dt>
              <dd className="text-right">
                {DIM_WORD[dim("generation")!.level]} · {fmtTps(p.perStreamGenerationTps, p.basis)}
              </dd>
              <dt className="text-muted-foreground">Prompt processing</dt>
              <dd className="text-right">
                {DIM_WORD[dim("prefill")!.level]} · first prompt {fmtSec(p.coldPromptSec)}
              </dd>
              <dt className="text-muted-foreground">Context</dt>
              <dd className="text-right">
                {fmtCtx(rec.context.effective)} · up to {rec.context.maxPractical ? fmtCtx(rec.context.maxPractical) : "—"} practical
              </dd>
              <dt className="text-muted-foreground">Tool support</dt>
              <dd className="text-right">{SUPPORT_LABEL[rec.connection.level]}</dd>
              <dt className="text-muted-foreground">Use-case fit</dt>
              <dd className="text-right">{dim("suitability")!.summary}</dd>
            </>
          )}
        </dl>
        {blocked && <p className="text-sm text-muted-foreground">{rec.explanation.blockers[0]}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <ConfidenceBadge level={rec.confidence.level} />
          {href && (
            <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Full analysis & what-if <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
        {!blocked && (
          <Disclosure summary="Why this rating">
            <ExplanationPanel rec={rec} showLists={false} />
          </Disclosure>
        )}
      </div>
    </Card>
  );
}
