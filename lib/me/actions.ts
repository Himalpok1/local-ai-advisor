"use server";
import { and, count, eq, gte, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { HARDWARE_MAP } from "@/data";
import { getDb } from "@/lib/db";
import { rigs, savedItems, speedReports, users } from "@/lib/db/schema";
import { assessReport, SpeedReportInputSchema } from "@/lib/community/reports";
import { invalidateCommunityStats } from "@/lib/community/server";
import { rateLimited } from "@/lib/rate-limit";
import { decodeState } from "@/lib/share";
import { isAdmin, ownsRig, requireUserId } from "./server";
import { MAX_RIGS, MAX_SAVED_ITEMS, SAVEABLE_PATHS, normalizeQuery, rigQuery } from "./shared";

/* Server Functions are reachable by direct POST, so each one checks the session and ownership itself. */

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });
const idSchema = z.string().uuid();

export async function saveRig(input: { name: string; query: string; isDefault?: boolean }): Promise<ActionResult> {
  const userId = await requireUserId();
  const name = z.string().trim().min(1).max(80).safeParse(input.name);
  if (!name.success) return fail("Give the rig a name (up to 80 characters).");
  const query = rigQuery(decodeState(new URLSearchParams(input.query)));
  if (!query || query.length > 2048) return fail("That hardware configuration isn't valid.");

  const db = getDb();
  const [{ n }] = await db.select({ n: count() }).from(rigs).where(eq(rigs.userId, userId));
  if (n >= MAX_RIGS) return fail(`You can save up to ${MAX_RIGS} rigs.`);
  const id = crypto.randomUUID();
  const isDefault = !!input.isDefault || n === 0;
  await db.transaction(async (tx) => {
    if (isDefault) await tx.update(rigs).set({ isDefault: false }).where(eq(rigs.userId, userId));
    await tx.insert(rigs).values({ id, userId, name: name.data, query, isDefault });
  });
  revalidatePath("/me");
  return { ok: true, id };
}

export async function renameRig(id: string, name: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = z.string().trim().min(1).max(80).safeParse(name);
  if (!idSchema.safeParse(id).success || !parsed.success) return fail("Give the rig a name (up to 80 characters).");
  await getDb().update(rigs).set({ name: parsed.data }).where(and(eq(rigs.id, id), eq(rigs.userId, userId)));
  revalidatePath("/me");
  return { ok: true };
}

/** Change what the rig is mostly used for; alerts and "what it runs" use this workload. */
export async function updateRigQuery(id: string, query: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const clean = rigQuery(decodeState(new URLSearchParams(query)));
  if (!idSchema.safeParse(id).success || !clean) return fail("That configuration isn't valid.");
  await getDb().update(rigs).set({ query: clean }).where(and(eq(rigs.id, id), eq(rigs.userId, userId)));
  revalidatePath("/me");
  return { ok: true };
}

export async function setDefaultRig(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!idSchema.safeParse(id).success || !(await ownsRig(userId, id))) return fail("Rig not found.");
  await getDb().transaction(async (tx) => {
    await tx.update(rigs).set({ isDefault: false }).where(and(eq(rigs.userId, userId), ne(rigs.id, id)));
    await tx.update(rigs).set({ isDefault: true }).where(eq(rigs.id, id));
  });
  revalidatePath("/me");
  return { ok: true };
}

export async function deleteRig(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!idSchema.safeParse(id).success) return fail("Rig not found.");
  await getDb().delete(rigs).where(and(eq(rigs.id, id), eq(rigs.userId, userId)));
  revalidatePath("/me");
  return { ok: true };
}

export async function saveItem(input: { label: string; path: string; query: string }): Promise<ActionResult> {
  const userId = await requireUserId();
  const label = z.string().trim().min(1).max(120).safeParse(input.label);
  if (!label.success) return fail("Give it a name (up to 120 characters).");
  if (!(SAVEABLE_PATHS as readonly string[]).includes(input.path)) return fail("This page can't be saved.");
  const query = normalizeQuery(input.query);
  if (query.length > 2048) return fail("This configuration is too long to save.");

  const db = getDb();
  const [{ n }] = await db.select({ n: count() }).from(savedItems).where(eq(savedItems.userId, userId));
  if (n >= MAX_SAVED_ITEMS) return fail(`You can save up to ${MAX_SAVED_ITEMS} items. Delete some on your account page.`);
  const id = crypto.randomUUID();
  await db.insert(savedItems).values({ id, userId, label: label.data, path: input.path, query });
  revalidatePath("/me");
  return { ok: true, id };
}

export async function deleteItem(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!idSchema.safeParse(id).success) return fail("Item not found.");
  await getDb().delete(savedItems).where(and(eq(savedItems.id, id), eq(savedItems.userId, userId)));
  revalidatePath("/me");
  return { ok: true };
}

export async function markNewModelsSeen(): Promise<ActionResult> {
  const userId = await requireUserId();
  await getDb().update(users).set({ newModelsSeenAt: new Date() }).where(eq(users.id, userId));
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Community speed reports                                             */
/* ------------------------------------------------------------------ */

const REPORTS_PER_DAY = 30;

export type ReportResult = { ok: true; status: "approved" | "pending"; flags: string[] } | { ok: false; error: string };

export async function submitSpeedReport(input: unknown): Promise<ReportResult> {
  const userId = await requireUserId();
  if (rateLimited(`report:${userId}`, 6)) return { ok: false, error: "Too many reports in a minute. Wait a moment and try again." };
  const parsed = SpeedReportInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const r = parsed.data;
  const assessment = assessReport(r);
  if (!assessment.ok) return { ok: false, error: assessment.error ?? "That combination can't run." };

  const db = getDb();
  const [{ n }] = await db
    .select({ n: count() })
    .from(speedReports)
    .where(and(eq(speedReports.userId, userId), gte(speedReports.createdAt, new Date(Date.now() - 86_400_000))));
  if (n >= REPORTS_PER_DAY) return { ok: false, error: `You can submit up to ${REPORTS_PER_DAY} reports a day.` };

  const status = assessment.flags.length ? "pending" : "approved";
  await db.insert(speedReports).values({
    userId,
    hardwareId: r.hardwareId,
    chipKey: HARDWARE_MAP.get(r.hardwareId)!.chipKey,
    modelId: r.modelId,
    quant: r.quant,
    runtimeId: r.runtimeId,
    backend: assessment.backend!,
    os: r.os,
    contextTokens: r.contextTokens,
    promptTokens: r.promptTokens,
    outputTokens: r.outputTokens,
    generationTps: r.generationTps,
    prefillTps: r.prefillTps ?? null,
    notes: r.notes || null,
    status,
    flagReason: assessment.flags.join(" ").slice(0, 500) || null,
  });
  revalidatePath("/me");
  invalidateCommunityStats();
  revalidatePath("/community");
  return { ok: true, status, flags: assessment.flags };
}

export async function deleteSpeedReport(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!idSchema.safeParse(id).success) return fail("Report not found.");
  await getDb().delete(speedReports).where(and(eq(speedReports.id, id), eq(speedReports.userId, userId)));
  revalidatePath("/me");
  invalidateCommunityStats();
  revalidatePath("/community");
  return { ok: true };
}

export async function moderateSpeedReport(id: string, status: "approved" | "rejected"): Promise<ActionResult> {
  if (!(await isAdmin())) return fail("Not allowed.");
  if (!idSchema.safeParse(id).success || !["approved", "rejected"].includes(status)) return fail("Report not found.");
  await getDb().update(speedReports).set({ status }).where(eq(speedReports.id, id));
  revalidatePath("/community/review");
  invalidateCommunityStats();
  revalidatePath("/community");
  return { ok: true };
}
