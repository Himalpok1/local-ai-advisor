import { searchHf } from "@/lib/hf/fetch";
import { clientKey, rateLimited } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return Response.json({ results: [] });
  if (rateLimited(`search:${clientKey(request)}`, 60)) return Response.json({ error: "Too many searches — slow down a little." }, { status: 429 });
  try {
    return Response.json({ results: await searchHf(q) }, { headers: { "Cache-Control": "public, max-age=600, s-maxage=3600" } });
  } catch {
    return Response.json({ results: [], error: "Search is unavailable right now." }, { status: 502 });
  }
}
