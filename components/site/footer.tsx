import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-semibold">Local AI Advisor</p>
          <p className="mt-2 max-w-md text-muted-foreground">
            Recommendations are estimates derived from hardware specifications, model architecture and verified public benchmarks. Measured
            numbers are always labelled; everything else is an estimate with a stated confidence. Data last verified 2026-09-30.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-medium">Tools</p>
          <Link className="text-muted-foreground hover:text-foreground" href="/check">What can my computer run?</Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/hardware-for-model">What hardware do I need?</Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/stack">Build my local AI stack</Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/compare/models">Compare models</Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/compare/hardware">Compare hardware</Link>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-medium">Data</p>
          <Link className="text-muted-foreground hover:text-foreground" href="/models">Models</Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/hardware">Hardware</Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/runtimes">Runtimes</Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/tools">AI tools</Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/methodology">Methodology & sources</Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/learn">Learn the concepts</Link>
        </div>
      </div>
    </footer>
  );
}
