import { currentUserId, listRigs } from "@/lib/me/server";

/** The signed-in user's rigs for the hardware pickers. Empty when signed out. */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return Response.json({ rigs: [] });
  try {
    return Response.json({ rigs: await listRigs(userId) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ rigs: [], error: "unavailable" }, { status: 503 });
  }
}
