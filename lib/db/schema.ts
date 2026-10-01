import type { AdapterAccountType } from "next-auth/adapters";
import { boolean, double, index, int, mysqlEnum, mysqlTable, primaryKey, text, timestamp, varchar } from "drizzle-orm/mysql-core";

// Auth.js tables, matching @auth/drizzle-adapter's MySQL layout. Tokens are TEXT because
// Google's access/id tokens can outgrow the adapter's default VARCHAR(255).
// Sessions are JWT cookies, so there is no session table.

export const users = mysqlTable("user", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  emailVerified: timestamp("emailVerified", { mode: "date", fsp: 3 }),
  image: varchar("image", { length: 1024 }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  /** When the user last opened their new-model alerts; newer releases count as unread. */
  newModelsSeenAt: timestamp("newModelsSeenAt", { mode: "date" }),
});

export const accounts = mysqlTable(
  "account",
  {
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).$type<AdapterAccountType>().notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: int("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 1024 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })],
);

/* App data. Configurations are stored as the same query strings the URLs use, and are
   re-validated by decodeState() every time they are read. */

export const rigs = mysqlTable(
  "rig",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    /** Hardware, OS and the workload the rig is mostly used for (hw=…&os=…&uc=…). */
    query: varchar("query", { length: 2048 }).notNull(),
    isDefault: boolean("isDefault").notNull().default(false),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("rig_user_idx").on(t.userId)],
);

export const savedItems = mysqlTable(
  "saved_item",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 120 }).notNull(),
    /** App path from SAVEABLE_PATHS; the link is always path + "?" + query. */
    path: varchar("path", { length: 64 }).notNull(),
    query: varchar("query", { length: 2048 }).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("saved_item_user_idx").on(t.userId)],
);

export const speedReports = mysqlTable(
  "speed_report",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    hardwareId: varchar("hardwareId", { length: 64 }).notNull(),
    chipKey: varchar("chipKey", { length: 64 }).notNull(),
    modelId: varchar("modelId", { length: 128 }).notNull(),
    quant: varchar("quant", { length: 16 }).notNull(),
    runtimeId: varchar("runtimeId", { length: 64 }).notNull(),
    /** Backend the engine selects for this runtime on this hardware + OS (metal, cuda…). */
    backend: varchar("backend", { length: 16 }).notNull(),
    os: varchar("os", { length: 16 }).notNull(),
    contextTokens: int("contextTokens").notNull(),
    promptTokens: int("promptTokens").notNull(),
    outputTokens: int("outputTokens").notNull(),
    generationTps: double("generationTps").notNull(),
    prefillTps: double("prefillTps"),
    notes: varchar("notes", { length: 500 }),
    /** approved: counted in community stats. pending: implausible, held for review. */
    status: mysqlEnum("status", ["approved", "pending", "rejected"]).notNull(),
    flagReason: varchar("flagReason", { length: 500 }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("speed_report_chip_idx").on(t.chipKey, t.status), index("speed_report_user_idx").on(t.userId, t.createdAt)],
);
