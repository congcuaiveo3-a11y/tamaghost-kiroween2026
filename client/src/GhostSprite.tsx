// Hand-drawn pixel-art ghost sprites, rendered as crisp SVG rects.
// Three evolution stages; the face changes with the pet's mood.

export type GhostMood =
  | "sleeping"
  | "hungry"
  | "sleepy"
  | "sad"
  | "proud"
  | "content"
  | "cheerful";

const PALETTE: Record<string, string> = {
  W: "#f7f3ff", // ghost body — moon cream
  S: "#d9d0f5", // body shade
  E: "#241a45", // eyes / mouth — deep violet
  C: "#ff9db0", // cheeks — candy pink
  P: "#ff8c42", // pumpkin hat — orange
  D: "#e56f1f", // pumpkin shade
  G: "#7ee08a", // sprout / stem — ectoplasm green
};

interface StageArt {
  width: number;
  height: number;
  body: string[];
  eyeY: number;
  eyeLeftX: number;
  eyeRightX: number;
  cheekY: number;
  cheekLeftX: number;
  cheekRightX: number;
  mouthX: number;
  mouthY: number;
}

const BABY: StageArt = {
  width: 12,
  height: 12,
  body: [
    "....WWWW....",
    "..WWWWWWWW..",
    ".WWWWWWWWWW.",
    "WWWWWWWWWWWW",
    "WWWWWWWWWWWW",
    "WWWWWWWWWWWW",
    "WWWWWWWWWWWW",
    "WWWWWWWWWWWW",
    "WWWWWWWWWWWW",
    "WWWWWWWWWWWS",
    "WWWWWWWWWWWS",
    "W.WW.WW.WW.W",
  ],
  eyeY: 4,
  eyeLeftX: 3,
  eyeRightX: 7,
  cheekY: 6,
  cheekLeftX: 1,
  cheekRightX: 9,
  mouthX: 5,
  mouthY: 7,
};

const YOUNG: StageArt = {
  width: 14,
  height: 14,
  body: [
    ".....G..G.....",
    "......GG......",
    "...WWWWWWWW...",
    ".WWWWWWWWWWWW.",
    "WWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWS",
    "WWWWWWWWWWWWWS",
    "WWWWWWWWWWWWWS",
    "W.WW.WWWW.WW.W",
  ],
  eyeY: 6,
  eyeLeftX: 4,
  eyeRightX: 9,
  cheekY: 8,
  cheekLeftX: 2,
  cheekRightX: 10,
  mouthX: 6,
  mouthY: 9,
};

const GROWN: StageArt = {
  width: 16,
  height: 16,
  body: [
    ".......GG.......",
    ".....PPPPPP.....",
    "....PPPPPPPP....",
    "....PDPDDPDP....",
    "..WWWWWWWWWWWW..",
    ".WWWWWWWWWWWWWW.",
    "WWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWWWS",
    "WWWWWWWWWWWWWWWS",
    "WWWWWWWWWWWWWWWS",
    "WW.WWWW.WWWW.WWW",
  ],
  eyeY: 8,
  eyeLeftX: 5,
  eyeRightX: 10,
  cheekY: 10,
  cheekLeftX: 3,
  cheekRightX: 11,
  mouthX: 7,
  mouthY: 11,
};

const STAGE_ART: StageArt[] = [BABY, YOUNG, GROWN];

function facePixels(art: StageArt, mood: GhostMood): Array<[number, number]> {
  const px: Array<[number, number]> = [];
  const eyes = (mode: "open" | "closed" | "droopy") => {
    for (const ex of [art.eyeLeftX, art.eyeRightX]) {
      if (mode === "open") {
        px.push([ex, art.eyeY], [ex + 1, art.eyeY], [ex, art.eyeY + 1], [ex + 1, art.eyeY + 1]);
      } else if (mode === "closed") {
        px.push([ex, art.eyeY + 1], [ex + 1, art.eyeY + 1]);
      } else {
        px.push([ex, art.eyeY + 1], [ex + 1, art.eyeY + 1], [ex + 1, art.eyeY + 2]);
      }
    }
  };
  const mx = art.mouthX;
  const my = art.mouthY;
  switch (mood) {
    case "sleeping":
      eyes("closed");
      px.push([mx, my], [mx + 1, my]);
      break;
    case "proud":
    case "cheerful":
      eyes("closed");
      px.push([mx, my], [mx + 1, my], [mx, my + 1], [mx + 1, my + 1]);
      break;
    case "hungry":
      eyes("open");
      px.push([mx, my + 1], [mx + 1, my + 1], [mx, my + 2], [mx + 1, my + 2]);
      break;
    case "sleepy":
      eyes("closed");
      px.push([mx, my + 1], [mx + 1, my + 1], [mx, my + 2], [mx + 1, my + 2]);
      break;
    case "sad":
      eyes("droopy");
      // frown: corners down
      px.push([mx - 1, my + 1], [mx, my], [mx + 1, my], [mx + 2, my + 1]);
      break;
    default: // content
      eyes("open");
      // smile: corners up
      px.push([mx - 1, my - 1], [mx, my], [mx + 1, my], [mx + 2, my - 1]);
      break;
  }
  return px;
}

export function GhostSprite({
  stage,
  mood,
  className,
}: {
  stage: number;
  mood: GhostMood;
  className?: string;
}) {
  const art = STAGE_ART[stage] ?? BABY;
  const cells: Array<{ x: number; y: number; fill: string }> = [];

  art.body.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch && ch !== "." && PALETTE[ch]) {
        cells.push({ x, y, fill: PALETTE[ch] });
      }
    }
  });

  // Cheeks
  for (const cx of [art.cheekLeftX, art.cheekRightX]) {
    cells.push({ x: cx, y: art.cheekY, fill: PALETTE.C ?? "#ff9db0" });
    cells.push({ x: cx + 1, y: art.cheekY, fill: PALETTE.C ?? "#ff9db0" });
  }

  // Face
  for (const [x, y] of facePixels(art, mood)) {
    cells.push({ x, y, fill: PALETTE.E ?? "#241a45" });
  }

  return (
    <svg
      viewBox={`0 0 ${art.width} ${art.height}`}
      className={className}
      role="img"
      aria-label="Your ghost pet"
      shapeRendering="crispEdges"
    >
      {cells.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={1.02} height={1.02} fill={c.fill} />
      ))}
    </svg>
  );
}
