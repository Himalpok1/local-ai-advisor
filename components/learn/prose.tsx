/** Small caption under a figure. */
export function FigureCaption({ children }: { children: React.ReactNode }) {
  return <figcaption className="mt-2 text-xs text-muted-foreground">{children}</figcaption>;
}

/** Inline code / file-name style. */
export function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>;
}
