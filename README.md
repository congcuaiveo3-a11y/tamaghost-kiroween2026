# TamaGhost 👻

**TamaGhost resurrects the beloved 90s Tamagotchi — as a friendly ghost that
haunts your browser and evolves with your real focus and study habits.**

Built with Kiro for Kiroween 2026 — Category: **Resurrection**.

## What it does

- **Adopt a pixel ghost.** Name your Baby Boo and it moves in — a hand-drawn
  pixel ghost in a haunted night scene (moon, stars, pumpkins, bats).
- **Care for it, in real time.** Hunger, Happiness and Energy decay with real
  elapsed time, even while the tab is closed. Feed, Play, Sleep / Wake to keep
  it happy. While sleeping, Energy recharges (+16/hour) while Hunger fades
  more slowly.
- **Focus together, evolve together.** Run a focus timer (1 / 5 / 15 / 25
  minutes). Finishing a session earns **+2 XP per minute** plus a happiness
  and energy boost — and your ghost evolves:
  **Baby Boo (0 XP) → Young Phantom (60 XP) → Grown Specter (180 XP)**.
- **It talks back.** Short mood lines react to the pet's stats and your focus
  habits of the day. Your focus history (sessions today, minutes today, all
  time) is shown on the pet screen.
- **It remembers you.** Pet state persists across reloads.

## How it works

- **Client:** TypeScript + React (`client/src/App.tsx`, `client/src/GhostSprite.tsx`)
- **Server:** server actions (`server/src/actions.ts`) — all stat decay is
  computed server-side from the stored last-tick instant on every read or
  mutation, so decay is honest across reloads and closed tabs.
- **Data:** SQLite via Drizzle (`server/src/schema.ts`, `drizzle/` migrations)
- **Kiro:** spec-driven development — see `.kiro/specs/tamaghost/` for
  requirements, design and tasks, and `.kiro/steering/` for product, tech and
  structure docs.

## Project structure

- `client/src/App.tsx` — adoption, care buttons, stat bars, focus timer UI
- `client/src/GhostSprite.tsx` — pixel ghost SVG per evolution stage + mood
- `server/src/actions.ts` — pet state, decay, care actions, focus sessions,
  mood lines, evolution thresholds
- `server/src/schema.ts` — pet + focus-session tables
- `drizzle/` — SQL migrations
- `.kiro/` — steering docs + specs (how this was built with Kiro)

## License

MIT — see `LICENSE`.
