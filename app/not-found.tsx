import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { ChipMascot } from "@/components/art/illustrations";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 sm:py-28">
      <ChipMascot className="mx-auto w-36" tone="fill-fill-technical" />
      <p className="mt-6 font-display text-6xl font-extrabold">404</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">This page ran out of memory.</h1>
      <p className="mt-3 text-lg text-foreground/80">We couldn’t find what you were looking for. Try the computer check, or head back home.</p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/check" className={buttonClass("primary", "lg")}>
          <Compass className="size-5" /> Check my computer
        </Link>
        <Link href="/" className={buttonClass("outline", "lg")}>
          Back home <ArrowRight className="size-5" />
        </Link>
      </div>
    </div>
  );
}
