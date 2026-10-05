import { Check, Info, TriangleAlert, X } from "lucide-react";
import { COMFORT_LABEL, COMFORT_RANK, COMFORT_LEVELS, type Recommendation } from "@/lib/schemas/results";
import { ConfidenceBadge } from "./comfort";

export function ExplanationPanel({ rec, showLists = true }: { rec: Recommendation; showLists?: boolean }) {
  const e = rec.explanation;
  const higher = COMFORT_LEVELS[COMFORT_LEVELS.indexOf(rec.level) - 1];
  const showWhyNot = higher && COMFORT_RANK[rec.level] >= COMFORT_RANK["technically-runs"] && e.whyNotHigher.length > 0;
  return (
    <div className="space-y-5 text-sm">
      <div>
        <h4 className="mb-2 font-semibold">Why?</h4>
        <ul className="space-y-1.5">
          {e.positives.map((p) => (
            <li key={p} className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-comfortable" aria-label="Good" />
              <span>{p}</span>
            </li>
          ))}
          {e.warnings.map((p) => (
            <li key={p} className="flex gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-borderline" aria-label="Warning" />
              <span>{p}</span>
            </li>
          ))}
          {e.blockers.map((p) => (
            <li key={p} className="flex gap-2">
              <X className="mt-0.5 size-4 shrink-0 text-technical" aria-label="Problem" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      {showWhyNot && (
        <div className="rounded-lg border-2 bg-muted/50 p-4">
          <h4 className="mb-2 font-semibold">
            Why “{COMFORT_LABEL[rec.level]}” rather than “{COMFORT_LABEL[higher]}”?
          </h4>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {e.whyNotHigher.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {showLists && (e.betterFor.length > 0 || e.lessSuitableFor.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {e.betterFor.length > 0 && (
            <div>
              <h4 className="mb-1.5 font-semibold">Better for</h4>
              <ul className="space-y-1 text-muted-foreground">
                {e.betterFor.map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
            </div>
          )}
          {e.lessSuitableFor.length > 0 && (
            <div>
              <h4 className="mb-1.5 font-semibold">Less suitable for</h4>
              <ul className="space-y-1 text-muted-foreground">
                {e.lessSuitableFor.map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border-2 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Info className="size-4 text-muted-foreground" />
          <h4 className="font-semibold">How sure are we?</h4>
          <ConfidenceBadge level={rec.confidence.level} />
        </div>
        {rec.performance && <p className="mb-2 text-muted-foreground">{rec.performance.basisExplanation}</p>}
        <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
          {rec.confidence.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
