import { cn } from "@/lib/utils";

const COLORS = {
  yellow: "bg-primary",
  green: "bg-sticker-green",
  pink: "bg-sticker-pink",
  blue: "bg-sticker-blue",
  orange: "bg-sticker-orange",
  teal: "bg-sticker-teal",
  white: "bg-card text-foreground",
} as const;

export type StickerColor = keyof typeof COLORS;

/** A slightly tilted, outlined label, like a sticker slapped onto the page. */
export function Sticker({
  children,
  color = "yellow",
  rotate = -3,
  className,
}: {
  children: React.ReactNode;
  color?: StickerColor;
  rotate?: number;
  className?: string;
}) {
  return (
    <span
      style={{ rotate: `${rotate}deg` }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border-2 border-ink px-3 py-1.5 text-sm font-extrabold text-on-fill shadow-brutal-sm",
        COLORS[color],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Small uppercase pill used as a section eyebrow. */
export function Eyebrow({ children, color = "pink", className }: { children: React.ReactNode; color?: StickerColor; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-on-fill",
        COLORS[color],
        className,
      )}
    >
      {children}
    </span>
  );
}
