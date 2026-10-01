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
        {!blocked && p && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <Fact label="Speed" value={fmtTps(p.perStreamGenerationTps, p.basis)} note={DIM_WORD[dim("generation")!.level]} />
            <Fact label="Memory left" value={fmtGB(rec.memory.headroomGB)} note={rec.memory.headroomGB < 1 ? "Very tight" : `of ${fmtGB(rec.memory.installedGB)}`} warn={rec.memory.headroomGB < 1} />
            <Fact label="First word in" value={fmtSec(p.coldPromptSec)} note={DIM_WORD[dim("prefill")!.level]} />
          </div>
        )}
        {!blocked && p && (
          <Disclosure summary="All the details">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Your setup</dt>
              <dd className="text-right">{rec.hardware.name}</dd>
              <dt className="text-muted-foreground">Workload</dt>
              <dd className="text-right">{workloadLabel ?? getUseCase(rec.useCase).label}</dd>
              <dt className="text-muted-foreground">Runtime → tool</dt>
              <dd className="text-right">
                {rec.runtime.name} → {rec.tool.name}
              </dd>
              <dt className="text-muted-foreground">Memory used</dt>
              <dd className="text-right">{fmtGB(rec.memory.inferencePeakGB)}</dd>
              <dt className="text-muted-foreground">Context</dt>
              <dd className="text-right">
                {fmtCtx(rec.context.effective)} · {rec.context.maxPractical ? `up to ${fmtCtx(rec.context.maxPractical)} practical` : "no size is practical here"}
              </dd>
              <dt className="text-muted-foreground">Tool support</dt>
              <dd className="text-right">{SUPPORT_LABEL[rec.connection.level]}</dd>
              <dt className="text-muted-foreground">Use-case fit</dt>
              <dd className="text-right">{dim("suitability")!.summary}</dd>
            </dl>
            <div className="mt-4">
              <ExplanationPanel rec={rec} showLists={false} />
            </div>
          </Disclosure>
        )}
        {blocked && <p className="text-sm text-muted-foreground">{rec.explanation.blockers[0]}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
          <ConfidenceBadge level={rec.confidence.level} />
          {href && (
            <Link href={href} className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-primary hover:underline">
              How to install & more <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

function Fact({ label, value, note, warn }: { label: string; value: string; note?: string; warn?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/60 px-1.5 py-2.5">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-sm font-bold tabular-nums leading-tight", warn && "text-technical")}>{value}</p>
      {note && <p className="mt-0.5 text-[11px] text-muted-foreground">{note}</p>}
    </div>
  );
}
