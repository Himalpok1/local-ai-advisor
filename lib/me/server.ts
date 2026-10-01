import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { rigs, savedItems, speedReports, users } from "@/lib/db/schema";
import type { RigDto, SavedItemDto } from "./shared";

/** Signed-in user id, or undefined. Reads the JWT cookie only; never touches MySQL. */
export async function currentUserId(): Promise<string | undefined> {
  const session = await auth();
  return session?.user?.id ?? undefined;
}

export async function requireUserId(): Promise<string> {
  const id = await currentUserId();
  if (!id) throw new Error("Sign in first");
  return id;
}

export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return !!email && admins.includes(email);
}

export async function listRigs(userId: string): Promise<RigDto[]> {
  const rows = await getDb().select().from(rigs).where(eq(rigs.userId, userId)).orderBy(desc(rigs.isDefault), rigs.createdAt);
  return rows.map((r) => ({ id: r.id, name: r.name, query: r.query, isDefault: r.isDefault }));
}

export async function listSavedItems(userId: string): Promise<SavedItemDto[]> {
  const rows = await getDb().select().from(savedItems).where(eq(savedItems.userId, userId)).orderBy(desc(savedItems.createdAt));
  return rows.map((r) => ({ id: r.id, label: r.label, path: r.path, query: r.query, createdAt: r.createdAt.toISOString() }));
}

export async function listMyReports(userId: string) {
  return getDb().select().from(speedReports).where(eq(speedReports.userId, userId)).orderBy(desc(speedReports.createdAt)).limit(100);
}

export async function newModelsSeenAt(userId: string): Promise<Date | null> {
  const [row] = await getDb().select({ at: users.newModelsSeenAt }).from(users).where(eq(users.id, userId));
  return row?.at ?? null;
}

export async function ownsRig(userId: string, id: string) {
  const [row] = await getDb().select({ id: rigs.id }).from(rigs).where(and(eq(rigs.id, id), eq(rigs.userId, userId)));
  return !!row;
}
