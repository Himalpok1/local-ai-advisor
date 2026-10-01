import { HARDWARE_MAP } from "@/data";
import { communityBenchmarks } from "@/lib/community/reports";
import { communityStats } from "@/lib/community/server";

/** Community measurements for one chip: display stats plus the groups that calibrate the engine. */
export async function GET(request: Request) {
  const hw = new URL(request.url).searchParams.get("hw") ?? "";
  const hardware = HARDWARE_MAP.get(hw);
  if (!hardware) return Response.json({ stats: [], benchmarks: [] });
  try {
    const stats = await communityStats(hardware.chipKey);
    return Response.json({ stats, benchmarks: communityBenchmarks(stats) }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
  } catch {
    return Response.json({ stats: [], benchmarks: [] }, { status: 503 });
  }
}
