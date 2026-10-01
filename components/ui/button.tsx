import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "gradient";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:brightness-105 active:scale-[0.98] shadow-xs hover:shadow-sm transition-all",
  gradient: "bg-gradient-to-r from-primary via-indigo-600 to-primary bg-[length:200%_auto] text-primary-foreground hover:brightness-110 active:scale-[0.98] shadow-sm hover:shadow-md hover:shadow-primary/20 transition-all",
  secondary: "bg-accent text-accent-foreground hover:brightness-95 active:scale-[0.98] transition-all",
  outline: "border border-border/80 bg-card text-foreground hover:bg-muted/70 hover:border-border active:scale-[0.98] shadow-2xs transition-all",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-[0.98] transition-all",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs sm:text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 sm:h-12 px-5 sm:px-6 text-sm sm:text-base gap-2.5",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-xl font-medium transition cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap",
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
