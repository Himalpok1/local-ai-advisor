"use client";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-foreground", className)} {...props} />;
}

export function Field({ label, hint, children, className }: { label: React.ReactNode; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium text-foreground">{label}</span>
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
        className="h-10 w-full appearance-none rounded-xl border border-border/80 bg-card pl-3.5 pr-9 text-sm text-foreground shadow-2xs transition-colors focus-visible:outline-2 focus-visible:outline-ring"
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
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex max-w-full items-center gap-1 overflow-x-auto no-scrollbar rounded-xl border border-border/70 bg-muted/80 p-1 shadow-2xs",
        className
      )}
    >
      {options.map((o) => {
        const isSelected = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            title={o.hint}
            onClick={() => onChange(o.value)}
            className={cn(
              "shrink-0 rounded-lg font-medium transition cursor-pointer select-none",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
              isSelected
                ? "bg-card text-foreground shadow-xs ring-1 ring-border/50 font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            {o.label}
          </button>
        );
      })}
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
    <div className={cn("flex h-10 items-center rounded-xl border border-border/80 bg-card shadow-2xs focus-within:outline-2 focus-within:outline-ring", className)}>
      <input
        type="number"
        aria-label={ariaLabel}
        className="h-full w-full min-w-0 rounded-xl bg-transparent px-3 text-sm text-foreground outline-none"
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
    <label className="flex cursor-pointer items-start gap-3 select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition cursor-pointer", checked ? "bg-primary" : "bg-muted-foreground/30")}
      >
        <span className={cn("size-4 rounded-full bg-white shadow-xs transition-transform", checked ? "translate-x-4.5" : "translate-x-0.5")} />
      </button>
      <span className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{label}</span>
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
        "flex w-full items-start gap-3 rounded-xl border border-border/80 bg-card p-3.5 text-left transition cursor-pointer hover:border-primary/50 hover:shadow-2xs focus-visible:outline-2 focus-visible:outline-ring",
        selected && "border-primary bg-primary/5 ring-1 ring-primary",
        className,
      )}
    >
      {icon && <span className={cn("mt-0.5 shrink-0 text-muted-foreground transition-colors", selected && "text-primary")}>{icon}</span>}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center justify-between gap-2 text-sm font-medium">
          <span className="truncate">{title}</span>
          {badge}
        </span>
        {description && <span className="text-xs text-muted-foreground leading-relaxed">{description}</span>}
      </span>
    </button>
  );
}
