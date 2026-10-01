"use client";
import Link from "next/link";
import { Loader2, TriangleAlert } from "lucide-react";
import { useHfModels } from "@/lib/hf/client";

/** Renders children only once any Hugging Face models referenced by id are imported. */
export function HfModelGate({ ids, children }: { ids: (string | undefined)[]; children: () => React.ReactNode }) {
  const { ready, error } = useHfModels(ids);
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <TriangleAlert className="mx-auto size-8 text-borderline" />
        <h1 className="mt-3 text-xl font-semibold">Couldn’t load this model from Hugging Face</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Link href="/hugging-face" className="mt-6 inline-block text-primary hover:underline">
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
