# TamaGhost — Design

- State: single pet row + focus-session log (see steering/tech.md for the
  exact decay and XP numbers).
- Decay is applied lazily: every read/mutation first advances the pet from
  `lastTickAt` to now, clamps stats to 0–100, and persists the result. This
  keeps one source of truth and makes "time passes while away" real.
- Mood selection: sleeping wins first, then low energy (< 25) → sleepy,
  then the lowest stat drives the line; focus habits (sessions today) shift
  the pool toward encouraging lines.
- Sprites: three SVG stages, same ghost character growing up — baby, young
  phantom, grown specter — with bounce / sleep-Zzz / hearts reactions.
- Scope guard (v1): no daily quests, costumes or leaderboard. Those stay as
  stretch goals only.
