import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Bell, Bookmark, Gauge, HardDrive, Trash2 } from "lucide-react";
import { HARDWARE_MAP, MODEL_MAP, QUANTIZATIONS, RUNTIME_MAP } from "@/data";
import { COMFORT_LABEL } from "@/lib/schemas/results";
import { modelAlerts } from "@/lib/me/alerts";
import { deleteItem, deleteSpeedReport } from "@/lib/me/actions";
import { currentUserId, listMyReports, listRigs, listSavedItems, newModelsSeenAt } from "@/lib/me/server";
import { decodeRig, savedHref, type DecodedRig } from "@/lib/me/shared";
import { fmtTps } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { COMFORT_STYLE } from "@/components/advisor/comfort";
import { SignInCard } from "@/components/me/sign-in-card";
import { RigList } from "@/components/me/rig-list";
import { ActionButton } from "@/components/me/action-button";
import { MarkNewModelsSeen } from "@/components/me/mark-seen";

export const metadata: Metadata = { title: "My rigs & saved", robots: { index: false } };

const date = (d: Date | string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export default async function MePage() {
  const userId = await currentUserId();
  if (!userId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <SignInCard />
      </div>
    );
  }

  let data;
  try {
    const [rigs, saved, reports, seenAt] = await Promise.all([listRigs(userId), listSavedItems(userId), listMyReports(userId), newModelsSeenAt(userId)]);
    data = { rigs, saved, reports, seenAt };
  } catch {
    return (
      <p role="alert" className="mx-auto max-w-xl px-4 py-16 text-muted-foreground">
        Your account data is unavailable right now. Try again shortly.
      </p>
    );
  }
  const decoded = data.rigs.map(decodeRig).filter((r) => !!r);

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">My rigs &amp; saved</h1>
        <p className="mt-2 text-muted-foreground">Your computers, bookmarked results, new-model alerts and speed reports.</p>
      </header>

      <section aria-labelledby="rigs" className="space-y-4">
        <SectionTitle id="rigs" icon={<HardDrive className="size-5" />} title="My rigs" />
        {data.rigs.length ? (
          <RigList rigs={data.rigs} />
        ) : (
          <Card className="space-y-3 p-6">
            <p className="font-medium">No rigs yet</p>
            <p className="text-sm text-muted-foreground">
              Pick your computer in any tool and click <strong>Save as my rig</strong>. Your default rig is pre-selected in the check wizard, and new models are rated for it.
            </p>
            <Link href="/check" className={buttonClass("primary", "sm", "w-fit")}>
              Pick my computer
            </Link>
          </Card>
        )}
      </section>

      {decoded.length > 0 && (
        <section aria-labelledby="alerts" className="space-y-4">
          <SectionTitle id="alerts" icon={<Bell className="size-5" />} title="New models for your rigs" />
          <Suspense fallback={<Card className="p-6 text-sm text-muted-foreground">Rating the latest releases on your rigs…</Card>}>
            <Alerts rigs={decoded} seenAt={data.seenAt} />
          </Suspense>
        </section>
      )}

      <section aria-labelledby="saved" className="space-y-4">
        <SectionTitle id="saved" icon={<Bookmark className="size-5" />} title="Saved" />
        {data.saved.length ? (
          <Card className="divide-y">
            {data.saved.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <Link href={savedHref(s)} className="font-medium hover:underline">
                    {s.label}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {s.path.slice(1).replace("/", " · ")} · saved {date(s.createdAt)}
                  </p>
                </div>
                <ActionButton action={deleteItem.bind(null, s.id)} className="hover:text-borderline">
                  <Trash2 className="size-3.5" aria-hidden /> Delete
                </ActionButton>
              </div>
            ))}
          </Card>
        ) : (
          <Card className="p-6 text-sm text-muted-foreground">
            Use the <strong>Save</strong> button next to “Copy shareable link” on any evaluation, comparison or stack to keep it here.
          </Card>
        )}
      </section>

      <section aria-labelledby="reports" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle id="reports" icon={<Gauge className="size-5" />} title="My speed reports" />
          <Link href="/community/submit" className={buttonClass("outline", "sm")}>
            Report a speed
          </Link>
        </div>
        {data.reports.length ? (
          <Card className="divide-y">
            {data.reports.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">
                    {MODEL_MAP.get(r.modelId)?.name ?? r.modelId} · {QUANTIZATIONS[r.quant as keyof typeof QUANTIZATIONS]?.label ?? r.quant} on {HARDWARE_MAP.get(r.hardwareId)?.name ?? r.hardwareId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {RUNTIME_MAP.get(r.runtimeId)?.name ?? r.runtimeId} · {r.generationTps} tok/s generation
                    {r.prefillTps ? ` · ${r.prefillTps} tok/s prompt` : ""} · {date(r.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={r.status === "approved" ? "good" : r.status === "pending" ? "warn" : "bad"} title={r.flagReason ?? undefined}>
                    {r.status === "approved" ? "Live" : r.status === "pending" ? "In review" : "Rejected"}
                  </Badge>
                  <ActionButton action={deleteSpeedReport.bind(null, r.id)} confirm="Delete this report?" className="hover:text-borderline">
                    <Trash2 className="size-3.5" aria-hidden /> Delete
                  </ActionButton>
                </div>
              </div>
            ))}
          </Card>
        ) : (
          <Card className="p-6 text-sm text-muted-foreground">
            Measured a model yourself? <Link href="/community/submit" className="font-medium text-primary hover:underline">Report the speed</Link> and it calibrates the estimates for everyone with your chip.
          </Card>
        )}
      </section>
    </div>
  );
}

function SectionTitle({ id, icon, title }: { id: string; icon: React.ReactNode; title: string }) {
  return (
    <h2 id={id} className="flex scroll-mt-24 items-center gap-2 text-xl font-semibold">
      <span className="text-primary">{icon}</span>
      {title}
    </h2>
  );
}

async function Alerts({ rigs, seenAt }: { rigs: DecodedRig[]; seenAt: Date | null }) {
  let alerts;
  try {
    alerts = await modelAlerts(rigs, seenAt);
  } catch {
    return <Card className="p-6 text-sm text-muted-foreground">Couldn&apos;t reach Hugging Face. Try again shortly.</Card>;
  }
  if (!alerts.length) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        None of the releases from the last 45 days run acceptably on your rigs for what you use them for. <Link href="/new-models" className="font-medium text-primary hover:underline">See all new models</Link>.
      </Card>
    );
  }
  return (
    <>
      <MarkNewModelsSeen />
      <ul className="grid gap-3 md:grid-cols-2">
        {alerts.map((a) => (
          <li key={a.item.repo}>
            <Card className={cn("flex h-full flex-col gap-2 p-4", a.unread && "border-primary/50")}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={a.href} className="break-words font-semibold hover:underline">
                    {a.item.repo.split("/")[1]}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {a.item.org} · {date(a.item.createdAt)}
                  </p>
                </div>
                {a.unread && <Badge tone="primary">New</Badge>}
              </div>
              <ul className="space-y-1 text-sm">
                {a.fits.map((f) => (
                  <li key={f.rigId} className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", COMFORT_STYLE[f.level].bg, COMFORT_STYLE[f.level].text)}>{COMFORT_LABEL[f.level]}</span>
                    <span>on {f.rigName}</span>
                    <span className="text-muted-foreground">
                      · {f.quantLabel}
                      {f.tps ? ` · ${fmtTps(f.tps)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
