import { cn } from "@/lib/utils";

/**
 * Dot, the pixel brand mascot from "The One-Minute Check" film.
 * A 14x12 sprite drawn as SVG rects (spec: magenta body, darker belly, ink pupils, paper eye whites).
 * Motion is CSS-only (see `.dot` in globals.css): irregular blinks, slow breathing and a rare hop
 * in the `idle` pose, and a happy hop while a `[data-dot-cue]` element inside a `.dot-stage`
 * ancestor is hovered, focused or pressed. Reduced motion renders her static.
 * Decorative: aria-hidden, no pointer events. Size her with a width class; the aspect ratio is fixed.
 */
export type DotPose = "idle" | "blink" | "happy";

const MAG = "#F13D7E";
const MAG_D = "#C2275C";
const INK = "#171410";
const PAPER = "#FFFDF8";

type Px = readonly [col: number, row: number];

/** Body silhouette, one horizontal run per row: [row, firstCol, lastCol]. */
const BODY: readonly (readonly [number, number, number])[] = [
  [0, 4, 9],
  [1, 3, 10],
  [2, 2, 11],
  [3, 1, 12],
  [4, 1, 12],
  [5, 1, 12],
  [6, 1, 12],
  [7, 2, 11],
  [8, 3, 10],
  [9, 4, 9],
];
const BELLY_ROW = 8;

const ARMS_DOWN: readonly Px[] = [[0, 5], [1, 5], [0, 6], [1, 6], [12, 5], [13, 5], [12, 6], [13, 6]];
const ARMS_UP: readonly Px[] = [0, 1, 2, 3].flatMap((r) => [[0, r], [13, r]] as const);
const LEGS: readonly Px[] = [[3, 10], [3, 11], [4, 10], [4, 11], [9, 10], [9, 11], [10, 10], [10, 11]];
const WHITES: readonly Px[] = [[3, 3], [4, 3], [3, 4], [4, 4], [9, 3], [10, 3], [9, 4], [10, 4]];
const PUPILS: readonly Px[] = [[4, 3], [4, 4], [9, 3], [9, 4]];
const LIDS: readonly Px[] = [[3, 4], [4, 4], [9, 4], [10, 4]];
const HAPPY: readonly Px[] = [[3, 4], [4, 3], [9, 4], [10, 3]];

function Pixels({ px, fill }: { px: readonly Px[]; fill: string }) {
  return px.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />);
}

export function Dot({ pose = "idle", className }: { pose?: DotPose; className?: string }) {
  return (
    <span data-pose={pose} aria-hidden className={cn("dot pointer-events-none", className)}>
      <span className="dot-hop">
        <svg viewBox="0 0 14 12" shapeRendering="crispEdges">
          <g className="dot-arms-down">
            <Pixels px={ARMS_DOWN} fill={MAG} />
          </g>
          <g className="dot-arms-up">
            <Pixels px={ARMS_UP} fill={MAG} />
          </g>
          <Pixels px={LEGS} fill={MAG} />
          {BODY.map(([y, from, to]) => (
            <rect key={y} x={from} y={y} width={to - from + 1} height={1} fill={y === BELLY_ROW ? MAG_D : MAG} />
          ))}
          <g className="dot-eyes-open">
            <Pixels px={WHITES} fill={PAPER} />
            <Pixels px={PUPILS} fill={INK} />
          </g>
          <g className="dot-eyes-closed">
            <Pixels px={LIDS} fill={INK} />
          </g>
          <g className="dot-eyes-happy">
            <Pixels px={HAPPY} fill={INK} />
          </g>
        </svg>
      </span>
    </span>
  );
}
