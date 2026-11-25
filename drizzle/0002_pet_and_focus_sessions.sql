DROP TABLE entries;
--> statement-breakpoint
CREATE TABLE pets (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  hunger INTEGER NOT NULL DEFAULT 80,
  happiness INTEGER NOT NULL DEFAULT 80,
  energy INTEGER NOT NULL DEFAULT 80,
  xp INTEGER NOT NULL DEFAULT 0,
  sleeping INTEGER NOT NULL DEFAULT 0,
  last_tick_at INTEGER NOT NULL,
  born_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE focus_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  minutes INTEGER NOT NULL,
  xp_gained INTEGER NOT NULL,
  completed_at INTEGER NOT NULL
);
