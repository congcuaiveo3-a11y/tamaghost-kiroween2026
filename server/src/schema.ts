// Drizzle schema for TamaGhost.
//
// One pet per artifact (single-row table, id = 1) plus an append-only log of
// completed focus sessions. Stats are stored as whole numbers 0–100 and are
// decayed lazily on the server from `lastTickAt` whenever state is read or
// mutated, so elapsed real time is honored across reloads.

import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const pets = sqliteTable("pets", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  hunger: integer("hunger").notNull().default(80),
  happiness: integer("happiness").notNull().default(80),
  energy: integer("energy").notNull().default(80),
  xp: integer("xp").notNull().default(0),
  sleeping: integer("sleeping").notNull().default(0),
  lastTickAt: integer("last_tick_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  bornAt: integer("born_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const focusSessions = sqliteTable("focus_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  minutes: integer("minutes").notNull(),
  xpGained: integer("xp_gained").notNull(),
  completedAt: integer("completed_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
