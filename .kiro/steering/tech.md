# TamaGhost — Tech

- TypeScript + React client, server actions, SQLite via Drizzle.
- One pet row (name, hunger / happiness / energy 0–100, XP, evolution stage,
  sleeping flag, last-tick timestamp) plus a focus-session log.
- All stat decay is computed server-side from the stored last-tick instant
  (UTC epoch ms) on every read or mutation, so decay is honest across reloads
  and closed tabs.
- Decay per hour while awake: hunger −5, energy −4, happiness −3.
- While sleeping: energy +16/hour, hunger −2/hour, happiness −1/hour.
- Focus session: +2 XP per completed minute, plus a happiness and energy
  boost; the session is logged with minutes, XP gained and completion time.
- Pixel-art ghost sprites are hand-authored inline SVG (three evolution
  stages), with CSS/SVG Halloween ambience (moon, stars, pumpkins, bats).
  No external images, feeds or third-party APIs.
