"use client";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { ChipMascot } from "@/components/art/illustrations";
import { buttonClass } from "@/components/ui/button";
import { useHfModels } from "@/lib/hf/client";

/** Renders children only once any Hugging Face models referenced by id are imported. */
export function HfModelGate({ ids, children }: { ids: (string | undefined)[]; children: () => React.ReactNode }) {
  const { ready, error } = useHfModels(ids);
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <ChipMascot className="mx-auto w-28" tone="fill-fill-technical" />
        <h1 className="mt-3 text-2xl font-extrabold">Couldn’t load this model from Hugging Face</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Link href="/hugging-face" className={buttonClass("primary", "md", "mt-6")}>
          Try another model →
        </Link>
      </div>
    );
  }
  if (!ready) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground" role="status">
        <Loader2 className="size-6 animate-spin" />
        Reading the model’s architecture from Hugging Face…
      </div>
    );
  }
  return <>{children()}</>;
}
