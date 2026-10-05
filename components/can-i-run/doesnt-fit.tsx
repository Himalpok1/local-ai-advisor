import Link from "next/link";
import { ArrowRight, Cpu, Layers, MemoryStick, PanelTopClose } from "lucide-react";
import type { HardwareConfiguration, Model } from "@/lib/schemas";
import type { Recommendation } from "@/lib/schemas/results";
import { CHAT, CHAT_APPS_CLOSED, canIRunHref, memoryGap, rate, smallerSiblings, usable } from "@/lib/can-i-run";
import { fmtGB } from "@/lib/format";
import { ComfortBadge } from "@/components/advisor/comfort";
import { quantOf, speedOf } from "./parts";

/** Two bars on one scale: what the model needs vs what the machine has left for it. */
function GapBars({ needed, available }: { needed: number; available: number }) {
  const max = Math.max(needed, available, 0.1);
  const rows = [
    { label: "Needs", value: needed, className: "bg-nofit" },
    { label: "Free for AI", value: available, className: "bg-primary" },
  ];
  return (
    <div className="space-y-2" aria-hidden>
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[6.5rem_minmax(0,1fr)_4rem] items-center gap-3 text-sm">
          <span className="text-muted-foreground">{r.label}</span>
          <span className="h-3 overflow-hidden rounded-full bg-muted">
            <span className={`block h-full rounded-full ${r.className}`} style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
          </span>
          <span className="text-right font-medium tabular-nums">{fmtGB(r.value)}</span>
        </div>
      ))}
    </div>
  );
}

function Option({ icon: Icon, title, children }: { icon: typeof Cpu; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-xl border-2 bg-card p-4">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/25 text-link">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 space-y-1.5 text-sm">
        <p className="font-semibold">{title}</p>
        {children}
      </div>
    </li>
  );
}

/**
 * What a "doesn't fit" answer page shows instead of run commands: the memory arithmetic for this exact
 * pair, then the concrete ways to make it work, each rated by the engine.
 */
export function DoesNotFit({ model, hardware, chat, siblings }: { model: Model; hardware: HardwareConfiguration; chat: Recommendation; siblings: HardwareConfiguration[] }) {
  const gap = memoryGap(chat);
  const osName = hardware.vendor === "apple" ? "macOS" : hardware.os.includes("windows") ? "Windows" : "the operating system";
  const closed = rate(model, hardware, CHAT_APPS_CLOSED);
  const closedGap = memoryGap(closed);
  const smaller = smallerSiblings(model, hardware).slice(0, 3);
  const bigger = siblings
    .filter((h) => h.systemRamGB > hardware.systemRamGB)
    .sort((a, b) => a.systemRamGB - b.systemRamGB)
    .map((h) => rate(model, h, CHAT))
    .find((r) => usable(r.level));

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border-2 bg-card p-5 sm:p-6">
        <h2 className="text-xl font-semibold tracking-tight">Why it doesn’t fit</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Even its smallest practical version ({quantOf(chat)}) needs about <strong className="text-foreground">{fmtGB(gap.neededGB)}</strong> for the model, its
          context memory and the runtime. After {osName} (≈{fmtGB(gap.osGB)}), a browser with a few tabs (≈{fmtGB(gap.appsGB)}) and {chat.tool.name} (≈
          {fmtGB(gap.toolGB)}), {hardware.name} has about <strong className="text-foreground">{fmtGB(gap.availableGB)}</strong> left, so it’s{" "}
          <strong className="text-foreground">{fmtGB(gap.shortByGB)} short</strong>.
        </p>
        <div className="mt-4">
          <GapBars needed={gap.neededGB} available={gap.availableGB} />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold tracking-tight">Ways to make it work</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          <Option icon={PanelTopClose} title="Close everything else">
            {usable(closed.level) || closed.level === "borderline" ? (
              <p className="text-muted-foreground">
                With no other apps open, {model.name} runs at {quantOf(closed)}: <ComfortBadge level={closed.level} size="sm" /> {speedOf(closed) !== "—" && <>at {speedOf(closed)}</>}. Expect the
                system to feel tight while it’s loaded.
              </p>
            ) : (
              <p className="text-muted-foreground">
                Not enough on its own: with every other app closed it’s still about {fmtGB(closedGap.shortByGB)} short.
              </p>
            )}
          </Option>

          <Option icon={Layers} title="Pick a smaller model from the same family">
            {smaller.length ? (
              <ul className="space-y-1">
                {smaller.map((r) => (
                  <li key={r.model.id}>
                    <Link href={canIRunHref(r.model, hardware)} className="inline-flex flex-wrap items-center gap-2 text-link hover:underline">
                      {r.model.name} <ComfortBadge level={r.level} size="sm" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No smaller {model.family} model in our catalog runs well here. See the other models below.</p>
            )}
          </Option>

          <Option icon={MemoryStick} title="Get more memory">
            {bigger ? (
              <p className="text-muted-foreground">
                The same {hardware.vendor === "apple" ? "chip" : "machine"} with{" "}
                <Link href={canIRunHref(model, bigger.hardware)} className="text-link hover:underline">
                  {bigger.hardware.systemRamGB} GB
                </Link>{" "}
                handles it: <ComfortBadge level={bigger.level} size="sm" />.
              </p>
            ) : (
              <p className="text-muted-foreground">
                You’d want at least {fmtGB(gap.neededGB + gap.osGB + gap.appsGB + gap.toolGB)} of {hardware.memoryArchitecture === "discrete" ? "VRAM plus RAM" : "memory"} in total. The
                machines below are the cheapest that run it comfortably.
              </p>
            )}
          </Option>

          <Option icon={Cpu} title="Check your exact setup">
            <p className="text-muted-foreground">These pages assume typical settings. A shorter context or a lighter chat app can change the answer.</p>
            <Link href={`/check?hw=${hardware.id}`} className="inline-flex items-center gap-1 font-medium text-link hover:underline">
              Check {hardware.name} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Option>
        </ul>
      </div>
    </section>
  );
}
