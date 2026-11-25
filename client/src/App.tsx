import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaTopScrim } from "@hatch/space-sdk/client";
import { api, type ApiResponse } from "./api";
import { actionFields } from "@hatch/space-sdk/fields" with { type: "macro" };
import type { Actions } from "../../server/src/actions";
import { GhostSprite, type GhostMood } from "./GhostSprite";

const FIELDS = actionFields<typeof Actions>();

type PetState = NonNullable<ApiResponse<typeof api, "getState">["pet"]>;
type CareAction = "feed" | "play" | "sleep" | "wake";

// ---------------------------------------------------------------------------
// Small pixel-flavored icons (inline SVG, no emoji)
// ---------------------------------------------------------------------------

function PumpkinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3c0 1 .5 1.7 1.5 2" stroke="#7ee08a" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="12" cy="14" rx="9" ry="7.5" fill="#ff8c42" />
      <path d="M8 10.5 9.5 13H7L8 10.5ZM16 10.5 17 13h-2.5L16 10.5Z" fill="#241a45" />
      <path d="M8 16.5c1.2 1 2.6 1.5 4 1.5s2.8-.5 4-1.5" stroke="#241a45" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 20.5C7 16.5 3.5 13.2 3.5 9.4 3.5 6.5 5.7 4.5 8.3 4.5c1.5 0 3 .8 3.7 2 .7-1.2 2.2-2 3.7-2 2.6 0 4.8 2 4.8 4.9 0 3.8-3.5 7.1-8.5 11.1Z"
        fill="#ff9db0"
      />
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M13 2 4.5 13.5H11L9.8 22 19 10h-6.5L13 2Z" fill="#7ee08a" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"
        fill="#ffd166"
      />
    </svg>
  );
}

function BallIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="#b388ff" />
      <path d="M5 9c4 2.5 10 2.5 14 0M5.5 15.5c4-2.5 9-2.5 13 0" stroke="#f5eeda" strokeWidth="1.8" fill="none" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Stat bar
// ---------------------------------------------------------------------------

function StatBar({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: ReactNode;
}) {
  const low = value < 30;
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-lg leading-none text-[var(--text)]">
          {icon}
          {label}
        </span>
        <span
          className="font-[family-name:var(--font-pixel)] text-[10px]"
          style={{ color: low ? "#ff7b72" : "var(--dim)" }}
        >
          {value}
          {low ? " !" : ""}
        </span>
      </div>
      <div
        className="mt-1.5 h-3.5 w-full overflow-hidden rounded-sm border border-[var(--border)] bg-[var(--bg-deep)]"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Haunted scene decorations
// ---------------------------------------------------------------------------

const STARS: Array<{ left: string; top: string; delay: string; size: number }> = [
  { left: "6%", top: "10%", delay: "0s", size: 3 },
  { left: "18%", top: "22%", delay: "0.7s", size: 2 },
  { left: "32%", top: "7%", delay: "1.3s", size: 2 },
  { left: "55%", top: "14%", delay: "0.4s", size: 3 },
  { left: "68%", top: "6%", delay: "1.8s", size: 2 },
  { left: "82%", top: "20%", delay: "1.1s", size: 2 },
  { left: "92%", top: "9%", delay: "2.2s", size: 3 },
  { left: "44%", top: "26%", delay: "2.6s", size: 2 },
];

function Bat({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 32 12" className={className} style={style} aria-hidden="true">
      <path
        d="M16 6c-2-3-5-4-8-3C6 3.6 4 3 2 1c.3 3-.3 5-2 7 3-1 5-.5 7 1 1.5 1 3 1.5 5 1l4-4Zm0 0c2-3 5-4 8-3 2 .6 4 0 6-2-.3 3 .3 5 2 7-3-1-5-.5-7 1-1.5 1-3 1.5-5 1l-4-4Z"
        fill="#0d0820"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Focus timer
// ---------------------------------------------------------------------------

const FOCUS_PRESETS = [1, 5, 15, 25];

function FocusTimer({
  petName,
  disabled,
  onComplete,
}: {
  petName: string;
  disabled: boolean;
  onComplete: (minutes: number) => void;
}) {
  const [preset, setPreset] = useState(15);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [running, setRunning] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          setRunning(false);
          if (!doneRef.current) {
            doneRef.current = true;
            onComplete(preset);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, preset, onComplete]);

  const choosePreset = (m: number) => {
    setPreset(m);
    setSecondsLeft(m * 60);
    setRunning(false);
    doneRef.current = false;
  };

  const reset = () => {
    setRunning(false);
    setSecondsLeft(preset * 60);
    doneRef.current = false;
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const totalSeconds = preset * 60;
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const finished = secondsLeft === 0 && !running;

  return (
    <section
      aria-label="Focus timer"
      className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <h2 className="font-[family-name:var(--font-pixel)] text-[11px] leading-relaxed text-[var(--text)]">
        Focus to feed the glow
      </h2>
      <p className="mt-1 text-lg leading-tight text-[var(--dim)]">
        Finish a session and {petName} absorbs your focus energy: +2 XP per
        minute, plus a happiness and energy boost.
      </p>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Session length">
        {FOCUS_PRESETS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => choosePreset(m)}
            disabled={running}
            aria-pressed={preset === m}
            className="min-h-11 rounded-md border px-3 font-[family-name:var(--font-pixel)] text-[10px] disabled:opacity-40"
            style={{
              borderColor: preset === m ? "var(--accent)" : "var(--border)",
              background: preset === m ? "var(--surface-alt)" : "transparent",
              color: preset === m ? "var(--accent)" : "var(--dim)",
            }}
          >
            {m} min
          </button>
        ))}
      </div>

      <div className="mt-4 text-center">
        <span className="font-[family-name:var(--font-pixel)] text-4xl tracking-wider text-[var(--text)]">
          {mm}:{ss}
        </span>
      </div>
      <div
        className="mt-3 h-3 w-full overflow-hidden rounded-sm border border-[var(--border)] bg-[var(--bg-deep)]"
        role="progressbar"
        aria-label="Focus session progress"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-[var(--accent-green)] transition-all duration-1000"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <div className="mt-4 flex gap-2">
        {running ? (
          <button
            type="button"
            onClick={() => setRunning(false)}
            className="min-h-12 flex-1 rounded-md bg-[var(--surface-alt)] px-4 font-[family-name:var(--font-pixel)] text-[11px] text-[var(--text)]"
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (secondsLeft === 0) reset();
              doneRef.current = false;
              setRunning(true);
            }}
            disabled={disabled}
            className="min-h-12 flex-1 rounded-md bg-[var(--accent)] px-4 font-[family-name:var(--font-pixel)] text-[11px] text-[#241a45] disabled:opacity-40"
          >
            {finished ? "Go again" : secondsLeft < totalSeconds ? "Resume focus" : "Start focus"}
          </button>
        )}
        <button
          type="button"
          onClick={reset}
          disabled={running === false && secondsLeft === totalSeconds}
          className="min-h-12 rounded-md border border-[var(--border)] px-4 font-[family-name:var(--font-pixel)] text-[11px] text-[var(--dim)] disabled:opacity-40"
        >
          Reset
        </button>
      </div>
      {finished && (
        <p className="mt-3 text-center text-lg leading-tight text-[var(--accent-green)]">
          Session complete — {petName} is glowing!
        </p>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Adoption screen
// ---------------------------------------------------------------------------

function AdoptScreen() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const adopt = useMutation({
    mutationFn: async (n: string) => await api.adoptPet({ name: n }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pet-state"] }),
    onError: (e) => setError(e instanceof Error ? e.message : "Adoption failed. Try again."),
  });

  const submit = () => {
    if (!name.trim()) {
      setError("Give your ghost a name first — every good haunting starts with a name.");
      return;
    }
    setError(null);
    adopt.mutate(name.trim());
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-10">
      <div className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-4 pb-6 pt-8 text-center">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="star absolute rounded-full bg-[#f5eeda]"
            style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }}
          />
        ))}
        <div className="absolute right-5 top-5 h-12 w-12 rounded-full bg-[#ffd166] shadow-[0_0_36px_10px_rgba(255,209,102,0.35)]" aria-hidden="true" />
        <div className="ghost-float relative mx-auto mt-6 w-40">
          <GhostSprite stage={0} mood="cheerful" className="w-full" />
        </div>
        <h1 className="mt-5 font-[family-name:var(--font-pixel)] text-sm leading-relaxed text-[var(--text)]">
          A little ghost is waiting to be adopted
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-xl leading-tight text-[var(--dim)]">
          This Baby Boo drifted in from the 90s, looking for someone to care
          for it — and to study alongside. Name your ghost to begin the
          haunting.
        </p>
      </div>

      <div className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
        <label htmlFor="ghost-name" className="text-lg text-[var(--text)]">
          Ghost's name
        </label>
        <input
          id="ghost-name"
          type="text"
          {...FIELDS.adoptPet.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="e.g. Mochi"
          className="mt-1 min-h-12 w-full rounded-md border border-[var(--border)] bg-[var(--bg-deep)] px-3 text-xl text-[var(--text)] placeholder:text-[var(--dim)]"
        />
        {error && (
          <p role="alert" className="mt-2 text-lg leading-tight text-[#ff7b72]">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={adopt.isPending}
          className="mt-3 min-h-12 w-full rounded-md bg-[var(--accent)] px-4 font-[family-name:var(--font-pixel)] text-[11px] text-[#241a45] disabled:opacity-50"
        >
          {adopt.isPending ? "Summoning…" : "Adopt this ghost"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main pet screen
// ---------------------------------------------------------------------------

function PetScreen({ pet }: { pet: PetState }) {
  const queryClient = useQueryClient();
  const [bubble, setBubble] = useState<string | null>(null);
  const [evolvedFlash, setEvolvedFlash] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const bubbleTimer = useRef<number | null>(null);

  const showBubble = (text: string, ms = 6000) => {
    setBubble(text);
    if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setBubble(null), ms);
  };

  const care = useMutation({
    mutationFn: async (action: CareAction) => await api.careForPet({ action }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pet-state"] });
      showBubble(data.reaction);
    },
    onError: (e) => setNotice(e instanceof Error ? e.message : "That didn't work — try again."),
  });

  const focus = useMutation({
    mutationFn: async (minutes: number) => await api.completeFocusSession({ minutes }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pet-state"] });
      showBubble(data.reaction, 9000);
      if (data.evolved) {
        setEvolvedFlash(true);
        window.setTimeout(() => setEvolvedFlash(false), 5000);
      }
    },
    onError: (e) => setNotice(e instanceof Error ? e.message : "Couldn't save that session — try again."),
  });

  const mood = pet.mood as GhostMood;
  const bubbleText = bubble ?? pet.moodLine;
  const xpProgress =
    pet.nextStageXp != null
      ? Math.min(100, Math.round((pet.xp / pet.nextStageXp) * 100))
      : 100;

  const careButton =
    "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-2 font-[family-name:var(--font-pixel)] text-[10px] text-[var(--text)] disabled:opacity-50 active:bg-[var(--surface)]";

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-10">
      {/* --- Haunted scene --- */}
      <div className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)]">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="star absolute rounded-full bg-[#f5eeda]"
            style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }}
          />
        ))}
        <div className="absolute right-5 top-5 h-12 w-12 rounded-full bg-[#ffd166] shadow-[0_0_36px_10px_rgba(255,209,102,0.35)]" aria-hidden="true">
          <span className="absolute left-2 top-3 h-2.5 w-2.5 rounded-full bg-[#e8bc55]" />
          <span className="absolute left-6 top-7 h-2 w-2 rounded-full bg-[#e8bc55]" />
        </div>
        <Bat className="bat absolute left-0 top-8 w-10 opacity-70" />

        {/* Speech bubble */}
        <div className="relative z-10 mx-4 mt-5">
          <div
            key={bubbleText}
            className="bubble-pop relative rounded-lg border-2 border-[#241a45] bg-[#f5eeda] px-3 py-2 text-center"
          >
            <p className="text-xl leading-tight text-[#241a45]">{bubbleText}</p>
            <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-[#241a45] bg-[#f5eeda]" aria-hidden="true" />
          </div>
        </div>

        {/* Ghost */}
        <div className="relative z-10 flex justify-center pb-2 pt-6">
          <div className={`relative w-44 ${pet.sleeping ? "" : "ghost-float"}`}>
            <div className="ghost-sway">
              <GhostSprite stage={pet.stage} mood={mood} className="w-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)]" />
            </div>
            {pet.sleeping && (
              <>
                <span className="zzz absolute -right-2 top-0 font-[family-name:var(--font-pixel)] text-xs text-[var(--dim)]">Z</span>
                <span className="zzz absolute -right-5 top-2 font-[family-name:var(--font-pixel)] text-[10px] text-[var(--dim)]" style={{ animationDelay: "0.9s" }}>Z</span>
              </>
            )}
            {evolvedFlash && (
              <>
                <span className="sparkle-burst absolute -left-4 top-2 text-2xl text-[#ffd166]" aria-hidden="true">✦</span>
                <span className="sparkle-burst absolute -right-4 top-10 text-2xl text-[#ffd166]" style={{ animationDelay: "0.4s" }} aria-hidden="true">✦</span>
                <span className="sparkle-burst absolute left-1/2 top-0 text-xl text-[#7ee08a]" style={{ animationDelay: "0.8s" }} aria-hidden="true">✦</span>
              </>
            )}
          </div>
        </div>

        {/* Ground: pumpkins + tombstones */}
        <div className="relative flex items-end justify-between px-5 pb-3" aria-hidden="true">
          <PumpkinIcon className="w-10" />
          <svg viewBox="0 0 24 24" className="w-8" aria-hidden="true">
            <path d="M6 21v-8a6 6 0 0 1 12 0v8h-4v-5h-4v5H6Z" fill="#453a75" />
          </svg>
          <svg viewBox="0 0 24 24" className="w-6" aria-hidden="true">
            <path d="M7 21v-7a5 5 0 0 1 10 0v7h-3.4v-4H10.4v4H7Z" fill="#453a75" />
          </svg>
          <PumpkinIcon className="w-7" />
        </div>
        <div className="h-2 bg-[#0d0820]" aria-hidden="true" />
      </div>

      {evolvedFlash && (
        <p role="status" className="mt-3 rounded-md border border-[#ffd166] bg-[var(--surface)] px-3 py-2 text-center text-xl leading-tight text-[#ffd166]">
          Evolution! {pet.name} is now a {pet.stageName}!
        </p>
      )}
      {notice && (
        <p role="alert" className="mt-3 rounded-md border border-[#ff7b72] bg-[var(--surface)] px-3 py-2 text-center text-lg leading-tight text-[#ff7b72]">
          {notice}
        </p>
      )}

      {/* --- Identity + evolution --- */}
      <div className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-[family-name:var(--font-pixel)] text-sm leading-relaxed text-[var(--text)]">
            {pet.name}
          </h1>
          <span className="rounded-sm bg-[var(--surface-alt)] px-2 py-1 font-[family-name:var(--font-pixel)] text-[9px] text-[var(--accent)]">
            Stage {pet.stage + 1} · {pet.stageName}
          </span>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-lg leading-none text-[var(--dim)]">
            <span>Evolution XP</span>
            <span>
              {pet.nextStageXp != null
                ? `${pet.xp} / ${pet.nextStageXp} XP`
                : `${pet.xp} XP · fully evolved`}
            </span>
          </div>
          <div
            className="mt-1.5 h-3.5 w-full overflow-hidden rounded-sm border border-[var(--border)] bg-[var(--bg-deep)]"
            role="progressbar"
            aria-label="Evolution progress"
            aria-valuenow={xpProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full bg-[var(--accent)] transition-all duration-700" style={{ width: `${xpProgress}%` }} />
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <StatBar label="Hunger" value={pet.hunger} color="#ff8c42" icon={<PumpkinIcon className="w-5" />} />
          <StatBar label="Happiness" value={pet.happiness} color="#ff9db0" icon={<HeartIcon className="w-5" />} />
          <StatBar label="Energy" value={pet.energy} color="#7ee08a" icon={<BoltIcon className="w-5" />} />
        </div>
        <p className="mt-3 text-lg leading-tight text-[var(--dim)]">
          {pet.sleeping
            ? `${pet.name} is asleep — energy recharges while hunger slowly fades.`
            : "Stats fade with real time, even while you're away. Check in, care, and focus together."}
        </p>
      </div>

      {/* --- Care actions --- */}
      <div className="mt-4 flex gap-2" role="group" aria-label="Care actions">
        <button type="button" className={careButton} disabled={care.isPending} onClick={() => care.mutate("feed")}>
          <PumpkinIcon className="w-6" />
          Feed
        </button>
        <button type="button" className={careButton} disabled={care.isPending} onClick={() => care.mutate("play")}>
          <BallIcon className="w-6" />
          Play
        </button>
        {pet.sleeping ? (
          <button type="button" className={careButton} disabled={care.isPending} onClick={() => care.mutate("wake")}>
            <BoltIcon className="w-6" />
            Wake up
          </button>
        ) : (
          <button type="button" className={careButton} disabled={care.isPending} onClick={() => care.mutate("sleep")}>
            <MoonIcon className="w-6" />
            Sleep
          </button>
        )}
      </div>

      {/* --- Focus timer --- */}
      <div className="mt-4">
        <FocusTimer petName={pet.name} disabled={focus.isPending} onComplete={(m) => focus.mutate(m)} />
      </div>

      {/* --- Focus habits --- */}
      <p className="mt-4 text-center text-lg leading-tight text-[var(--dim)]">
        Today: {pet.sessionsToday} session{pet.sessionsToday === 1 ? "" : "s"} ·{" "}
        {pet.focusMinutesToday} focus minutes · All time: {pet.totalFocusMinutes}{" "}
        minutes across {pet.totalSessions} session{pet.totalSessions === 1 ? "" : "s"}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App root
// ---------------------------------------------------------------------------

export function App() {
  const state = useQuery({
    queryKey: ["pet-state"],
    queryFn: () => api.getState({}),
    refetchInterval: 60_000,
  });

  return (
    <div className="min-h-screen bg-[var(--bg-deep)] font-[family-name:var(--font-body)]">
      <SafeAreaTopScrim backgroundColor="var(--bg-deep)" />
      <main className="pt-4">
        {state.isPending ? (
          <p className="py-16 text-center text-xl text-[var(--dim)]">
            Peeking into the haunted house…
          </p>
        ) : state.isError ? (
          <div className="mx-auto max-w-md px-4 py-16 text-center">
            <p className="text-xl text-[#ff7b72]">
              The séance failed to connect. 
            </p>
            <button
              type="button"
              onClick={() => state.refetch()}
              className="mt-4 min-h-12 rounded-md bg-[var(--accent)] px-5 font-[family-name:var(--font-pixel)] text-[11px] text-[#241a45]"
            >
              Try again
            </button>
          </div>
        ) : state.data.pet ? (
          <PetScreen pet={state.data.pet} />
        ) : (
          <AdoptScreen />
        )}
      </main>
    </div>
  );
}
