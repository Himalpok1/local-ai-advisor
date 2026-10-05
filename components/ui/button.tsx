import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "border-2 border-ink bg-primary text-primary-foreground shadow-brutal press disabled:shadow-none",
  secondary: "border-2 border-ink bg-accent text-accent-foreground shadow-brutal press disabled:shadow-none",
  outline: "border-2 border-ink bg-card text-foreground shadow-brutal press disabled:shadow-none",
  ghost: "border-2 border-transparent text-foreground hover:border-ink hover:bg-muted active:bg-primary/60",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-xs sm:text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg gap-2.5",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-full font-bold cursor-pointer select-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function LinkButton({
  href,
  variant,
  size,
  className,
  children,
}: { href: string; variant?: Variant; size?: Size; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}
