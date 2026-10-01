"use client";
import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import type { RunCommand } from "@/lib/downloads";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";

/** Tabbed, copy-paste commands for running a model in each local runtime. */
export function RunCommands({ commands, className }: { commands: RunCommand[]; className?: string }) {
  const [active, setActive] = useState(commands[0]?.id);
  const cmd = commands.find((c) => c.id === active) ?? commands[0];
  if (!cmd) return null;
  return (
    <div className={cn("rounded-xl border bg-card", className)}>
      <div role="tablist" aria-label="Runtime" className="flex flex-wrap gap-1 border-b p-1.5">
        {commands.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={c.id === cmd.id}
            onClick={() => setActive(c.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              c.id === cmd.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="space-y-3 p-4">
        {cmd.code && <CodeBlock code={cmd.code} />}
        {cmd.href && (
          <a href={cmd.href} className={buttonClass("primary", "sm")}>
            <ExternalLink className="size-3.5" aria-hidden /> Open in {cmd.label}
          </a>
        )}
        {cmd.note && <p className="text-sm text-muted-foreground">{cmd.note}</p>}
      </div>
    </div>
  );
}

export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-muted p-3 pr-12 font-mono text-xs leading-relaxed">
        {code}
      </pre>
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy command"}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard blocked: the text is still selectable */
          }
        }}
        className="absolute right-2 top-2 grid size-7 place-items-center rounded-md border bg-card text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}
