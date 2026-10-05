import { cn } from "@/lib/utils";

/**
 * Flat spot illustrations in the same thick-outline style as the shapes. Decorative only (aria-hidden);
 * give them a size with `className`, e.g. `w-48`.
 */
const LINE = "stroke-ink";

function Svg({ className, children, viewBox = "0 0 200 160" }: { className?: string; children: React.ReactNode; viewBox?: string }) {
  return (
    <svg viewBox={viewBox} aria-hidden fill="none" strokeLinecap="round" strokeLinejoin="round" className={cn("pointer-events-none h-auto shrink-0", className)}>
      {children}
    </svg>
  );
}

/** A smiling chip with legs. The site mascot. */
export function ChipMascot({ className, tone = "fill-sticker-pink" }: { className?: string; tone?: string }) {
  return (
    <Svg className={className} viewBox="0 0 160 160">
      {[44, 66, 88, 110].flatMap((p) => [
        <path key={`t${p}`} d={`M${p} 30 V12`} strokeWidth={5} className={LINE} />,
        <path key={`b${p}`} d={`M${p} 130 V148`} strokeWidth={5} className={LINE} />,
        <path key={`l${p}`} d={`M30 ${p + 4} H12`} strokeWidth={5} className={LINE} />,
        <path key={`r${p}`} d={`M130 ${p + 4} H148`} strokeWidth={5} className={LINE} />,
      ])}
      <rect x="30" y="30" width="100" height="100" rx="18" strokeWidth={5} className={cn(LINE, tone)} />
      <rect x="46" y="46" width="68" height="68" rx="10" strokeWidth={4} className={cn(LINE, "fill-card")} />
      <circle cx="64" cy="74" r="5" className="fill-ink" />
      <circle cx="96" cy="74" r="5" className="fill-ink" />
      <path d="M62 92 Q80 106 98 92" strokeWidth={5} className={LINE} />
    </Svg>
  );
}

/** A laptop whose screen shows the chip mascot: "local AI on your computer". */
export function LaptopArt({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <rect x="30" y="12" width="140" height="94" rx="10" strokeWidth={4} className={cn(LINE, "fill-card")} />
      <rect x="41" y="23" width="118" height="72" rx="6" strokeWidth={3.5} className={cn(LINE, "fill-sticker-teal")} />
      <rect x="82" y="36" width="36" height="36" rx="7" strokeWidth={3.5} className={cn(LINE, "fill-primary")} />
      <circle cx="93" cy="52" r="2.6" className="fill-ink" />
      <circle cx="107" cy="52" r="2.6" className="fill-ink" />
      <path d="M92 61 Q100 68 108 61" strokeWidth={3} className={LINE} />
      {[88, 100, 112].map((x) => (
        <path key={x} d={`M${x} 72 V80`} strokeWidth={3.5} className={LINE} />
      ))}
      <path d="M12 112 H188 L178 134 Q177 138 172 138 H28 Q23 138 22 134 Z" strokeWidth={4} className={cn(LINE, "fill-sticker-pink")} />
      <path d="M84 118 H116" strokeWidth={4} className={LINE} />
      <path d="M176 28 l4 -12 l4 12 l12 4 l-12 4 l-4 12 l-4 -12 l-12 -4z" strokeWidth={3} className={cn(LINE, "fill-primary")} />
    </Svg>
  );
}

/** Five podium bars, tallest = best: the comfort tiers. */
export function TiersArt({ className }: { className?: string }) {
  const bars = [
    { x: 14, h: 28, fill: "fill-fill-technical" },
    { x: 46, h: 48, fill: "fill-fill-borderline" },
    { x: 78, h: 68, fill: "fill-fill-acceptable" },
    { x: 110, h: 88, fill: "fill-fill-comfortable" },
    { x: 142, h: 108, fill: "fill-fill-excellent" },
  ];
  return (
    <Svg className={className}>
      {bars.map((b) => (
        <rect key={b.x} x={b.x} y={140 - b.h} width="30" height={b.h} rx="6" strokeWidth={4} className={cn(LINE, b.fill)} />
      ))}
      <path d="M8 144 H192" strokeWidth={4} className={LINE} />
      <path d="M157 12 l5 -10 l5 10 l10 5 l-10 5 l-5 10 l-5 -10 l-10 -5z" strokeWidth={3} className={cn(LINE, "fill-primary")} />
    </Svg>
  );
}

/** A memory bar filling up, with a "full" marker. */
export function MemoryArt({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <rect x="10" y="40" width="180" height="70" rx="12" strokeWidth={4} className={cn(LINE, "fill-card")} />
      <rect x="20" y="50" width="104" height="50" rx="7" strokeWidth={3.5} className={cn(LINE, "fill-sticker-blue")} />
      <rect x="124" y="50" width="30" height="50" strokeWidth={3.5} className={cn(LINE, "fill-primary")} />
      {[26, 52, 78, 104, 130, 156, 182].map((x) => (
        <path key={x} d={`M${x} 110 V124`} strokeWidth={4} className={LINE} />
      ))}
      <path d="M154 28 V40" strokeWidth={4} className={LINE} />
      <rect x="132" y="8" width="44" height="20" rx="10" strokeWidth={3.5} className={cn(LINE, "fill-sticker-pink")} />
    </Svg>
  );
}
