# TamaGhost — Requirements

## Pet lifecycle
- REQ-1: A user adopts exactly one ghost pet and gives it a name.
- REQ-2: The pet has Hunger, Happiness and Energy (0–100), decaying over
  real elapsed time: hunger −5/h, energy −4/h, happiness −3/h while awake.
- REQ-3: Care actions: Feed restores hunger, Play restores happiness and
  costs energy, Sleep starts restoring energy (+16/h), Wake ends sleep.
- REQ-4: While sleeping, hunger decays slower (−2/h) and happiness −1/h.
- REQ-5: Pet state persists across reloads.

## Focus & evolution
- REQ-6: Focus timer presets 1 / 5 / 15 / 25 minutes.
- REQ-7: Completing a session awards +2 XP per minute and restores
  happiness and energy; the session is logged.
- REQ-8: Evolution stages by total XP: Baby Boo ≥ 0, Young Phantom ≥ 60,
  Grown Specter ≥ 180. Evolution is announced in the UI.

## Mood
- REQ-9: The pet speaks a short mood line chosen from its stats (sleeping,
  sleepy, hungry, happy, …) and the owner's focus habits of the day.
