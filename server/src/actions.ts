// Actions for TamaGhost. One file, one exported `Actions` map.
//
// Game model:
// - One ghost pet (single row, id = 1). Stats hunger/happiness/energy are
//   0–100 and decay over real elapsed time, computed server-side from the
//   stored `lastTickAt` instant on every read and mutation.
// - Care actions (feed / play / sleep / wake) nudge the stats.
// - Completing a focus session logs a session, awards XP, restores the pet,
//   and XP drives evolution: Baby Boo -> Young Phantom -> Grown Specter.
// - The mood line is chosen from the pet's current stats and the user's
//   focus habits today (sessions and minutes), so the pet reacts to both.

import { defineAction, z, type ActionsModule, type Ctx } from "@hatch/space-sdk";
import { desc } from "drizzle-orm";
import * as schema from "./schema";

// ---------------------------------------------------------------------------
// Evolution stages
// ---------------------------------------------------------------------------

const STAGES = [
  { stage: 0, name: "Baby Boo", xpRequired: 0 },
  { stage: 1, name: "Young Phantom", xpRequired: 60 },
  { stage: 2, name: "Grown Specter", xpRequired: 180 },
] as const;

function stageForXp(xp: number): number {
  let stage = 0;
  for (const s of STAGES) {
    if (xp >= s.xpRequired) stage = s.stage;
  }
  return stage;
}

// ---------------------------------------------------------------------------
// Decay: points lost per hour while awake. Sleeping restores energy.
// ---------------------------------------------------------------------------

const DECAY_PER_HOUR = { hunger: 5, happiness: 3, energy: 4 } as const;
const SLEEP_ENERGY_PER_HOUR = 16;
const SLEEP_HUNGER_PER_HOUR = 2;

function clampStat(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

type PetRow = typeof schema.pets.$inferSelect;

function applyDecay(pet: PetRow, now: Date): PetRow {
  const elapsedHours = Math.max(
    0,
    (now.getTime() - pet.lastTickAt.getTime()) / 3_600_000,
  );
  if (elapsedHours <= 0) return { ...pet, lastTickAt: now };
  const sleeping = pet.sleeping === 1;
  return {
    ...pet,
    hunger: clampStat(
      pet.hunger -
        elapsedHours * (sleeping ? SLEEP_HUNGER_PER_HOUR : DECAY_PER_HOUR.hunger),
    ),
    happiness: clampStat(
      pet.happiness - elapsedHours * (sleeping ? 1 : DECAY_PER_HOUR.happiness),
    ),
    energy: clampStat(
      sleeping
        ? pet.energy + elapsedHours * SLEEP_ENERGY_PER_HOUR
        : pet.energy - elapsedHours * DECAY_PER_HOUR.energy,
    ),
    lastTickAt: now,
  };
}

// ---------------------------------------------------------------------------
// Mood lines: picked from stats + today's focus habits.
// ---------------------------------------------------------------------------

type MoodKey =
  | "sleeping"
  | "hungry"
  | "sleepy"
  | "sad"
  | "proud"
  | "content"
  | "cheerful";

const MOOD_LINES: Record<MoodKey, string[]> = {
  sleeping: [
    "Zzz… dreaming of pumpkin patches and quiet libraries…",
    "Shhh… even ghosts need their beauty sleep.",
    "Zzz… recharging my ectoplasm…",
  ],
  hungry: [
    "My tummy is rumbling louder than thunder in a haunted house… feed me?",
    "I could really haunt a snack right about now.",
    "Boo… hoo. An empty ghost tummy is the scariest thing of all.",
  ],
  sleepy: [
    "My eyelids are heavier than a tombstone… maybe a nap soon?",
    "I'm fading a little… ghosts get tired too, you know.",
    "One more yawn and I'll float straight through the floor.",
  ],
  sad: [
    "It's been quiet in the graveyard… play with me for a bit?",
    "I practiced my boo all alone. Nobody heard it. Boo hoo.",
    "A little game would really lift my spirits. Get it? Spirits?",
  ],
  proud: [
    "You focused so well today! I practically sparkle with pride.",
    "Look at us — a studying machine and their very impressed ghost.",
    "All that focus is making me stronger. I can feel my boo getting boo-ier!",
  ],
  content: [
    "Floating happily… this haunted house feels like home with you here.",
    "I did three loop-de-loops today. Ghost cardio is important.",
    "The moon is out, my tummy is fine, and you're here. Perfect night.",
  ],
  cheerful: [
    "Boo! …Did I get you that time? I'm getting better at this!",
    "I hid behind the moon and scared a cloud. It rained a little. Sorry, cloud.",
    "If I had feet, I'd be doing a happy little dance right now.",
  ],
};

function pickLine(key: MoodKey, seed: number): string {
  const lines = MOOD_LINES[key];
  const line = lines[Math.abs(seed) % lines.length];
  return line ?? lines[0] ?? "";
}

function computeMood(
  pet: PetRow,
  focusMinutesToday: number,
  sessionsToday: number,
): { mood: MoodKey; line: string } {
  // Seed changes every 10 minutes so the line rotates without flickering.
  const seed = Math.floor(Date.now() / 600_000) + pet.xp;
  if (pet.sleeping === 1) return { mood: "sleeping", line: pickLine("sleeping", seed) };
  if (pet.hunger < 30) return { mood: "hungry", line: pickLine("hungry", seed) };
  if (pet.energy < 25) return { mood: "sleepy", line: pickLine("sleepy", seed) };
  if (pet.happiness < 35) return { mood: "sad", line: pickLine("sad", seed) };
  if (sessionsToday >= 2 || focusMinutesToday >= 50)
    return { mood: "proud", line: pickLine("proud", seed) };
  if (pet.happiness >= 75) return { mood: "cheerful", line: pickLine("cheerful", seed) };
  return { mood: "content", line: pickLine("content", seed) };
}

// ---------------------------------------------------------------------------
// Shared state loading: fetch pet, apply decay, persist, add focus habits.
// ---------------------------------------------------------------------------

const petStateSchema = z.object({
  name: z.string(),
  hunger: z.number(),
  happiness: z.number(),
  energy: z.number(),
  xp: z.number(),
  stage: z.number(),
  stageName: z.string(),
  nextStageXp: z.number().nullable(),
  sleeping: z.boolean(),
  mood: z.string(),
  moodLine: z.string(),
  focusMinutesToday: z.number(),
  sessionsToday: z.number(),
  totalFocusMinutes: z.number(),
  totalSessions: z.number(),
});

type PetState = z.infer<typeof petStateSchema>;

async function loadPetState(ctx: Ctx): Promise<PetState | null> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.pets).limit(1);
  const row = rows[0];
  if (!row) return null;

  const now = new Date();
  const pet = applyDecay(row, now);
  await db
    .update(schema.pets)
    .set({
      hunger: pet.hunger,
      happiness: pet.happiness,
      energy: pet.energy,
      lastTickAt: pet.lastTickAt,
    })
    .run();

  const sessions = await db
    .select()
    .from(schema.focusSessions)
    .orderBy(desc(schema.focusSessions.id))
    .limit(500);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  let focusMinutesToday = 0;
  let sessionsToday = 0;
  let totalFocusMinutes = 0;
  for (const s of sessions) {
    totalFocusMinutes += s.minutes;
    if (s.completedAt.getTime() >= startOfToday.getTime()) {
      focusMinutesToday += s.minutes;
      sessionsToday += 1;
    }
  }

  const stage = stageForXp(pet.xp);
  const stageInfo = STAGES[stage] ?? STAGES[0];
  const next = STAGES[stage + 1];
  const { mood, line } = computeMood(pet, focusMinutesToday, sessionsToday);

  return {
    name: pet.name,
    hunger: pet.hunger,
    happiness: pet.happiness,
    energy: pet.energy,
    xp: pet.xp,
    stage,
    stageName: stageInfo.name,
    nextStageXp: next ? next.xpRequired : null,
    sleeping: pet.sleeping === 1,
    mood,
    moodLine: line,
    focusMinutesToday,
    sessionsToday,
    totalFocusMinutes,
    totalSessions: sessions.length,
  };
}

const getStateResponse = z.object({ pet: petStateSchema.nullable() });
type GetStateResponse = z.infer<typeof getStateResponse>;

export const Actions = {
  getState: defineAction({
    description:
      "Returns the current TamaGhost pet state (stats after real-time decay, evolution stage, mood line, focus habits), or pet: null before adoption.",
    request: z.object({}),
    response: getStateResponse,
    async handler(ctx): Promise<GetStateResponse> {
      const pet = await loadPetState(ctx);
      return { pet };
    },
  }),

  adoptPet: defineAction({
    description:
      "Adopts the ghost pet with the given name. Only works when no pet exists yet.",
    request: z.object({ name: z.string().trim().min(1).max(16) }),
    response: getStateResponse,
    async handler(ctx, args): Promise<GetStateResponse> {
      const db = ctx.db<typeof schema>();
      const existing = await db.select().from(schema.pets).limit(1);
      if (existing.length > 0) {
        throw new Error("A ghost has already been adopted in this haunted house.");
      }
      const now = new Date();
      await db
        .insert(schema.pets)
        .values({
          id: 1,
          name: args.name,
          hunger: 80,
          happiness: 80,
          energy: 80,
          xp: 0,
          sleeping: 0,
          lastTickAt: now,
          bornAt: now,
        })
        .run();
      ctx.invalidateQueries();
      const pet = await loadPetState(ctx);
      return { pet };
    },
  }),

  careForPet: defineAction({
    description:
      "Performs one care action on the pet: feed (restores hunger), play (restores happiness, costs energy), sleep (starts restoring energy), or wake.",
    request: z.object({
      action: z.enum(["feed", "play", "sleep", "wake"]),
    }),
    response: z.object({
      pet: petStateSchema,
      reaction: z.string(),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const state = await loadPetState(ctx);
      if (!state) throw new Error("No pet to care for yet — adopt a ghost first.");

      const rows = await db.select().from(schema.pets).limit(1);
      const pet = rows[0];
      if (!pet) throw new Error("No pet to care for yet — adopt a ghost first.");

      let { hunger, happiness, energy, sleeping } = pet;
      let reaction = "";
      const name = pet.name;

      switch (args.action) {
        case "feed":
          if (sleeping === 1) {
            reaction = `${name} is fast asleep — snacks can wait until wake-up time.`;
          } else if (hunger >= 98) {
            reaction = `${name} pats a very full tummy. "One more bite and I'll pop like a balloon!"`;
            happiness = clampStat(happiness + 2);
          } else {
            hunger = clampStat(hunger + 30);
            happiness = clampStat(happiness + 4);
            reaction = `Nom nom nom! ${name} devours a pumpkin-spice ectoplasm snack.`;
          }
          break;
        case "play":
          if (sleeping === 1) {
            reaction = `${name} mumbles in their sleep… playtime needs an awake ghost.`;
          } else if (energy < 10) {
            reaction = `${name} tries to play but keeps floating downward. Too tired — maybe a nap first?`;
          } else {
            happiness = clampStat(happiness + 24);
            energy = clampStat(energy - 9);
            hunger = clampStat(hunger - 4);
            reaction = `You toss a glow-in-the-dark ball and ${name} zooms after it, giggling through the walls!`;
          }
          break;
        case "sleep":
          if (sleeping === 1) {
            reaction = `${name} is already deep in dreamland.`;
          } else {
            sleeping = 1;
            reaction = `${name} curls up inside a cozy little coffin bed. "Wake me when the moon is high…"`;
          }
          break;
        case "wake":
          if (sleeping === 0) {
            reaction = `${name} is already awake and floating about.`;
          } else {
            sleeping = 0;
            reaction = `${name} stretches, yawns a tiny boo, and floats up ready for the night.`;
          }
          break;
      }

      await db
        .update(schema.pets)
        .set({ hunger, happiness, energy, sleeping, lastTickAt: new Date() })
        .run();
      ctx.invalidateQueries();
      const updated = await loadPetState(ctx);
      if (!updated) throw new Error("Pet state vanished unexpectedly.");
      return { pet: updated, reaction };
    },
  }),

  completeFocusSession: defineAction({
    description:
      "Records a completed focus session of the given minutes: logs it, awards XP toward evolution, and restores the pet's happiness and energy.",
    request: z.object({ minutes: z.number().int().min(1).max(180) }),
    response: z.object({
      pet: petStateSchema,
      xpGained: z.number(),
      evolved: z.boolean(),
      reaction: z.string(),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const before = await loadPetState(ctx);
      if (!before) throw new Error("No pet yet — adopt a ghost first.");

      const rows = await db.select().from(schema.pets).limit(1);
      const pet = rows[0];
      if (!pet) throw new Error("No pet yet — adopt a ghost first.");

      const xpGained = args.minutes * 2;
      const newXp = pet.xp + xpGained;
      const evolved = stageForXp(newXp) > stageForXp(pet.xp);
      const newStageName =
        STAGES[stageForXp(newXp)]?.name ?? before.stageName;

      await db
        .insert(schema.focusSessions)
        .values({ minutes: args.minutes, xpGained, completedAt: new Date() })
        .run();
      await db
        .update(schema.pets)
        .set({
          xp: newXp,
          happiness: clampStat(pet.happiness + 12),
          energy: clampStat(pet.energy + 8),
          sleeping: 0,
          lastTickAt: new Date(),
        })
        .run();
      ctx.invalidateQueries();

      const updated = await loadPetState(ctx);
      if (!updated) throw new Error("Pet state vanished unexpectedly.");
      const reaction = evolved
        ? `EVOLUTION! Bathed in the glow of your focus, ${pet.name} has evolved into a ${newStageName}!`
        : `${pet.name} basks in the glow of your ${args.minutes}-minute focus session and feels restored. +${xpGained} XP!`;
      return { pet: updated, xpGained, evolved, reaction };
    },
  }),
} satisfies ActionsModule;
