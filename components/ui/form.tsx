"use client";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium", className)} {...props} />;
}

export function Field({ label, hint, children, className }: { label: React.ReactNode; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  className,
  ariaLabel,
}: {
  value: T | undefined;
  onChange: (v: T) => void;
  options: { value: T; label: string; group?: string; disabled?: boolean }[];
  className?: string;
  ariaLabel?: string;
}) {
  const groups = [...new Set(options.map((o) => o.group ?? ""))];
  return (
    <div className={cn("relative", className)}>
      <select
        aria-label={ariaLabel}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-10 w-full appearance-none rounded-lg border bg-card pl-3 pr-9 text-sm focus-visible:outline-2 focus-visible:outline-ring"
      >
        {groups.map((g) =>
          g ? (
            <optgroup key={g} label={g}>
              {options.filter((o) => o.group === g).map((o) => (
                <option key={o.value} value={o.value} disabled={o.disabled}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ) : (
            options.filter((o) => !o.group).map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))
          ),
        )}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  className,
  size = "md",
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; hint?: string }[];
  className?: string;
  size?: "sm" | "md";
  ariaLabel?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("inline-flex flex-wrap gap-1 rounded-lg border bg-muted p-1", className)}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          title={o.hint}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md font-medium transition",
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
            o.value === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  className,
  ariaLabel,
  placeholder,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
  ariaLabel?: string;
  placeholder?: string;
}) {
  return (
    <div className={cn("flex h-10 items-center rounded-lg border bg-card focus-within:outline-2 focus-within:outline-ring", className)}>
      <input
        type="number"
        aria-label={ariaLabel}
        className="h-full w-full min-w-0 rounded-lg bg-transparent px-3 text-sm outline-none"
        value={value ?? ""}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value === "" ? undefined : Number(e.target.value);
          onChange(v === undefined || Number.isNaN(v) ? undefined : v);
        }}
      />
      {suffix && <span className="pr-3 text-sm text-muted-foreground">{suffix}</span>}
    </div>
  );
}

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition", checked ? "bg-primary" : "bg-border")}
      >
        <span className={cn("size-4 rounded-full bg-white shadow transition", checked ? "translate-x-4.5" : "translate-x-0.5")} />
      </button>
      <span className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

export function OptionCard({
  selected,
  onClick,
  title,
  description,
  icon,
  badge,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border bg-card p-3 text-left transition hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-ring",
        selected && "border-primary bg-accent/60 ring-1 ring-primary",
        className,
      )}
    >
      {icon && <span className={cn("mt-0.5 shrink-0 text-muted-foreground", selected && "text-primary")}>{icon}</span>}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center justify-between gap-2 text-sm font-medium">
          <span className="truncate">{title}</span>
          {badge}
        </span>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </span>
    </button>
  );
}
