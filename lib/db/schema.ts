import type { AdapterAccountType } from "next-auth/adapters";
import { int, mysqlTable, primaryKey, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
