# TamaGhost — Structure

- `client/src/App.tsx` — adoption, care buttons, stat bars, focus timer UI.
- `client/src/GhostSprite.tsx` — pixel ghost SVG per evolution stage + mood.
- `server/src/actions.ts` — pet state, decay, care actions, focus sessions,
  mood lines, evolution thresholds.
- `server/src/schema.ts` — pet + focus-session tables.
- `drizzle/` — SQL migrations (pet table, then pet + focus sessions).
- `.kiro/specs/tamaghost/` — requirements, design and tasks for this project.
