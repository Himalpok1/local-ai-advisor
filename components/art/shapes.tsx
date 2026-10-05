import { cn } from "@/lib/utils";

/**
 * Flat, outlined decorative shapes (stars, bursts, clovers) in the neobrutalism style.
 * Colour comes from `currentColor`, so tint them with a text colour class, e.g. `text-sticker-green`.
 * All shapes are decorative: aria-hidden, no pointer events.
 */
type ShapeProps = { className?: string };

const STROKE = { stroke: "var(--ink)", strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

function starPoints(points: number, inner: number) {
  const out: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? 47 : 47 * inner;
    const a = (i * Math.PI) / points - Math.PI / 2;
    out.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return out.join(" ");
}

/** Pointed star / spiky burst. `inner` is the inner radius ratio: low = spiky, high = round. */
export function Star({ points = 8, inner = 0.55, className }: ShapeProps & { points?: number; inner?: number }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={cn("pointer-events-none shrink-0 fill-current", className)}>
      <polygon points={starPoints(points, inner)} {...STROKE} />
    </svg>
  );
}

/** Four-pointed sparkle. */
export function Sparkle({ className }: ShapeProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={cn("pointer-events-none shrink-0 fill-current", className)}>
      <path d="M50 4 C54 32 68 46 96 50 C68 54 54 68 50 96 C46 68 32 54 4 50 C32 46 46 32 50 4Z" {...STROKE} />
    </svg>
  );
}

/** Four overlapping lobes, like a clover or a flower. */
export function Clover({ className }: ShapeProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={cn("pointer-events-none shrink-0 fill-current", className)}>
      <path
        d="M50 50 C30 50 18 40 18 28 C18 14 30 6 40 10 C46 12 50 18 50 24 C50 18 54 12 60 10 C70 6 82 14 82 28 C82 40 70 50 50 50Z M50 50 C70 50 82 60 82 72 C82 86 70 94 60 90 C54 88 50 82 50 76 C50 82 46 88 40 90 C30 94 18 86 18 72 C18 60 30 50 50 50Z"
        {...STROKE}
      />
    </svg>
  );
}

/** Four curved blades. */
export function Pinwheel({ className }: ShapeProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={cn("pointer-events-none shrink-0 fill-current", className)}>
      <path
        d="M50 50 C50 20 62 6 80 10 C92 14 94 30 82 40 C74 46 62 50 50 50Z M50 50 C80 50 94 62 90 80 C86 92 70 94 60 82 C54 74 50 62 50 50Z M50 50 C50 80 38 94 20 90 C8 86 6 70 18 60 C26 54 38 50 50 50Z M50 50 C20 50 6 38 10 20 C14 8 30 6 40 18 C46 26 50 38 50 50Z"
        {...STROKE}
      />
    </svg>
  );
}

/** Spiky-circle sticker with text in the middle, e.g. a "FREE" badge. */
export function BurstBadge({ children, className, shapeClassName }: { children: React.ReactNode; className?: string; shapeClassName?: string }) {
  return (
    <span className={cn("relative inline-grid place-items-center", className)}>
      <Star points={14} inner={0.8} className={cn("absolute inset-0 size-full text-primary", shapeClassName)} />
      <span className="relative text-center font-display text-sm font-extrabold uppercase leading-none text-on-fill">{children}</span>
    </span>
  );
}

type Placement = { shape: "star" | "sparkle" | "clover" | "pinwheel"; className: string };

/** A fixed scatter of shapes for hero backdrops. Positions are in `className` so they can change per breakpoint. */
export function ShapeField({ items, className }: { items: Placement[]; className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {items.map((it, i) => {
        const Shape = it.shape === "sparkle" ? Sparkle : it.shape === "clover" ? Clover : it.shape === "pinwheel" ? Pinwheel : Star;
        return <Shape key={i} className={cn("absolute", it.className)} />;
      })}
    </div>
  );
}
