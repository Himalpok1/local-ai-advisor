"use client";
import { useEffect, useState } from "react";
import { MODEL_MAP, registerModel } from "@/data";
import type { ParsedHfModel } from "./parse";

export const isHfId = (id?: string) => !!id && id.startsWith("hf:");

const inflight = new Map<string, Promise<ParsedHfModel>>();
const details = new Map<string, ParsedHfModel>();

/** Fetch a Hugging Face model through our API and register it with the engine. */
export function importHfModel(repoOrId: string): Promise<ParsedHfModel> {
  const repo = repoOrId.replace(/^hf:/, "");
  const key = `hf:${repo}`;
  if (details.has(key)) return Promise.resolve(details.get(key)!);
  if (!inflight.has(key)) {
    inflight.set(
      key,
      fetch(`/api/hf/model?repo=${encodeURIComponent(repo)}`)
        .then(async (r) => {
          const body = await r.json();
          if (!r.ok) throw new Error(body.error ?? "Lookup failed");
          const parsed = body as ParsedHfModel;
          parsed.model = registerModel(parsed.model);
          details.set(key, parsed);
          return parsed;
        })
        .finally(() => inflight.delete(key)),
    );
  }
  return inflight.get(key)!;
}

export function hfDetails(id: string): ParsedHfModel | undefined {
  return details.get(id);
}

/** Ensure every hf: id in `ids` is loaded. Returns status for rendering. */
export function useHfModels(ids: (string | undefined)[]): { ready: boolean; error?: string } {
  const pending = ids.filter((id): id is string => isHfId(id) && !MODEL_MAP.has(id!));
  const key = pending.join("|");
  const [state, setState] = useState<{ key: string; error?: string; done: boolean }>({ key: "", done: true });
  useEffect(() => {
    if (!key) return;
    let alive = true;
    Promise.all(key.split("|").map((id) => importHfModel(id)))
      .then(() => alive && setState({ key, done: true }))
      .catch((e: Error) => alive && setState({ key, done: true, error: e.message }));
    return () => {
      alive = false;
    };
  }, [key]);
  if (!key) return { ready: true };
  if (state.key === key && state.error) return { ready: false, error: state.error };
  return { ready: false };
}
