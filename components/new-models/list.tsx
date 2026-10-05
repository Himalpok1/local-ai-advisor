"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ExternalLink, Heart, Lock } from "lucide-react";
import type { NewModel } from "@/lib/hf/new-models";
import { COMFORT_LABEL, COMFORT_RANK } from "@/lib/schemas/results";
import { fmtTps } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/form";
import { COMFORT_STYLE } from "@/components/advisor/comfort";
import { OpennessBadge } from "@/components/explore/openness-badge";

type Filter = "all" | "open-source" | "small";

const date = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function NewModelsList({ items }: { items: NewModel[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = useMemo(
    () =>
      items.filter((m) => {
        if (filter === "open-source") return m.openness === "open-source";
        // Usable for chat on the smallest reference machine (16 GB laptop).
        if (filter === "small") return !!m.ratings && COMFORT_RANK[m.ratings[0].level] >= COMFORT_RANK.acceptable;
        return true;
      }),
    [items, filter],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          ariaLabel="Filter releases"
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All releases" },
            { value: "open-source", label: "Open source (OSI)" },
            { value: "small", label: "Runs on a 16 GB laptop" },
          ]}
        />
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {shown.length} of {items.length}
        </p>
      </div>
      {shown.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No recent releases match this filter.</Card>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {shown.map((m) => (
            <li key={m.repo}>
              <ModelCard m={m} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ModelCard({ m }: { m: NewModel }) {
  const [owner, name] = m.repo.split("/");
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words font-semibold leading-tight">{name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {owner} · {date(m.createdAt)}
            {m.baseModel ? ` · fine-tune of ${m.baseModel}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {m.paramsB && <Badge>{m.paramsB >= 10 ? Math.round(m.paramsB) : m.paramsB}B</Badge>}
          {m.pipeline === "image-text-to-text" && <Badge tone="good">Vision</Badge>}
          <OpennessBadge license={m.license} />
          {m.gated && (
            <Badge tone="warn">
              <Lock className="size-3" aria-hidden /> Gated
            </Badge>
          )}
        </div>
      </div>

      {m.ratings ? (
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {m.ratings.map((r) => (
            <div key={r.label} className={cn("rounded-lg border-2 px-2.5 py-2", COMFORT_STYLE[r.level].bg, COMFORT_STYLE[r.level].border)}>
              <dt className="text-[11px] text-muted-foreground">{r.label}</dt>
              <dd className={cn("text-xs font-semibold", COMFORT_STYLE[r.level].text)}>{COMFORT_LABEL[r.level]}</dd>
              {r.tps ? <dd className="text-[11px] tabular-nums text-muted-foreground">{fmtTps(r.tps)}</dd> : null}
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-4 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{m.unrated ? `Not rated: ${m.unrated}` : "Rating pending. Open it to rate it live."}</p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-4 text-sm">
        <Link href={`/hugging-face?repo=${encodeURIComponent(m.repo)}`} className="inline-flex items-center gap-1 font-medium text-link hover:underline">
          Check on my computer <ArrowRight className="size-3.5" aria-hidden />
        </Link>
        <a href={`https://huggingface.co/${m.repo}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          Hugging Face <ExternalLink className="size-3.5" aria-hidden />
        </a>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Heart className="size-3" aria-hidden /> {m.likes.toLocaleString("en-US")}
        </span>
      </div>
    </Card>
  );
}
