import { HfError, loadHfModel } from "@/lib/hf/fetch";
import { normalizeRepo } from "@/lib/hf/parse";
import { clientKey, rateLimited } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const repo = normalizeRepo(new URL(request.url).searchParams.get("repo") ?? "");
  if (!repo) return Response.json({ error: "Enter a Hugging Face model id like “Qwen/Qwen3-8B”." }, { status: 400 });
  if (rateLimited(`model:${clientKey(request)}`)) return Response.json({ error: "Too many lookups — try again in a minute." }, { status: 429 });
  try {
    const parsed = await loadHfModel(repo);
    return Response.json(parsed, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=21600" } });
  } catch (e) {
    if (e instanceof HfError) return Response.json({ error: e.message }, { status: e.status });
    console.error("hf model lookup failed", repo, e);
    return Response.json({ error: "Couldn't reach Hugging Face right now. Please try again." }, { status: 502 });
  }
}
