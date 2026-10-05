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
        className="h-11 w-full cursor-pointer appearance-none rounded-xl border-2 border-ink bg-card pl-3.5 pr-10 text-sm font-medium text-foreground shadow-brutal-sm transition-colors hover:bg-muted"
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
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground" />
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
        "inline-flex max-w-full items-center gap-1 overflow-x-auto no-scrollbar rounded-full border-2 border-ink bg-card p-1 shadow-brutal-sm",
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
              "shrink-0 rounded-full border-2 font-semibold transition cursor-pointer select-none",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
              isSelected
                ? "border-ink bg-primary font-bold text-on-fill"
                : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
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
    <div className={cn("flex h-11 items-center rounded-xl border-2 border-ink bg-card shadow-brutal-sm focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-ring", className)}>
      <input
        type="number"
        aria-label={ariaLabel}
        className="h-full w-full min-w-0 rounded-xl bg-transparent px-3 text-sm font-medium text-foreground outline-none"
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
        className={cn("mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-ink transition-colors cursor-pointer", checked ? "bg-sticker-green" : "bg-muted")}
      >
        <span className={cn("size-4 rounded-full bg-ink transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
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
        "flex w-full items-start gap-3 rounded-xl border-2 border-ink bg-card p-3.5 text-left transition cursor-pointer hover:bg-muted focus-visible:outline-3 focus-visible:outline-ring",
        selected && "bg-primary text-on-fill shadow-brutal-sm hover:bg-primary",
        className,
      )}
    >
      {icon && <span className={cn("mt-0.5 shrink-0 text-muted-foreground transition-colors", selected && "text-on-fill")}>{icon}</span>}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center justify-between gap-2 text-sm font-bold">
          <span className="truncate">{title}</span>
          {badge}
        </span>
        {description && <span className={cn("text-xs leading-relaxed", selected ? "text-on-fill/80" : "text-muted-foreground")}>{description}</span>}
      </span>
    </button>
  );
}
