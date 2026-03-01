import { HackathonPhase } from "./types";

const FREE_ZONES = [
  { cx: 55, cy: 56, r: 4 }, // Hobbs Cafe
  { cx: 70, cy: 46, r: 6 }, // Park
  { cx: 40, cy: 32, r: 4 }, // Library
  { cx: 58, cy: 38, r: 5 }, // Town square
  { cx: 32, cy: 56, r: 3 }, // Supply Store
  { cx: 80, cy: 60, r: 5 }, // Residential
];

const TEAM_ZONES = [
  { cx: 55, cy: 56, r: 3 },
  { cx: 70, cy: 46, r: 3 },
  { cx: 40, cy: 32, r: 3 },
  { cx: 58, cy: 38, r: 3 },
  { cx: 25, cy: 32, r: 3 },
  { cx: 80, cy: 35, r: 3 },
  { cx: 25, cy: 50, r: 3 },
  { cx: 80, cy: 55, r: 3 },
  { cx: 65, cy: 65, r: 3 },
  { cx: 35, cy: 60, r: 3 },
  { cx: 45, cy: 45, r: 3 },
  { cx: 75, cy: 28, r: 3 },
];

const RESULTS_ZONE = { cx: 68, cy: 48, r: 8 };

function randOffset(r: number) {
  const a = Math.random() * Math.PI * 2;
  const d = Math.random() * r;
  return { dx: Math.round(Math.cos(a) * d), dy: Math.round(Math.sin(a) * d) };
}

export function assignPosition(
  agentIndex: number,
  phase: HackathonPhase,
  teamIndex: number | null
): { x: number; y: number } {
  if (phase === "free_discussion") {
    const z = FREE_ZONES[agentIndex % FREE_ZONES.length];
    const o = randOffset(z.r);
    return { x: z.cx + o.dx, y: z.cy + o.dy };
  }
  if (phase === "development") {
    const ti = teamIndex ?? Math.floor(agentIndex / 5);
    const z = TEAM_ZONES[ti % TEAM_ZONES.length];
    const r = 2;
    const o = randOffset(r);
    return { x: z.cx + o.dx, y: z.cy + o.dy };
  }
  // results - all agents gather at center stage
  const o = randOffset(RESULTS_ZONE.r);
  return { x: RESULTS_ZONE.cx + o.dx, y: RESULTS_ZONE.cy + o.dy };
}
