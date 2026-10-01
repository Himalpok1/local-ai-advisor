import { modelAlerts } from "@/lib/me/alerts";
import { currentUserId, listRigs, newModelsSeenAt } from "@/lib/me/server";
import { decodeRig } from "@/lib/me/shared";

/** Unread new-model alerts for the account menu badge. */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return Response.json({ unread: 0 });
  try {
    const [rigs, seenAt] = await Promise.all([listRigs(userId), newModelsSeenAt(userId)]);
    const alerts = await modelAlerts(rigs.map(decodeRig).filter((r) => !!r), seenAt);
    return Response.json({ unread: alerts.filter((a) => a.unread).length }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ unread: 0, error: "unavailable" }, { status: 503 });
  }
}
