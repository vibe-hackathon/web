"use client";

import { useHackathonStore } from "@/lib/store";

const PHASE_LABELS: Record<string, string> = {
  free_discussion: "Phase A-C: Discussion",
  development: "Phase D: Development",
  results: "Phase E: Evaluation",
};

const PHASE_COLORS: Record<string, string> = {
  free_discussion: "bg-blue-500",
  development: "bg-green-500",
  results: "bg-amber-500",
};

export default function TopBar() {
  const { currentRound, totalRounds, phase } = useHackathonStore();

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-gray-900 text-white border-b border-gray-700">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold tracking-tight">Hackathon Arena</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${PHASE_COLORS[phase]}`}>
          {PHASE_LABELS[phase]}
        </span>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <div>
          <span className="text-gray-400">Round </span>
          <span className="font-mono font-bold">{currentRound}/{totalRounds}</span>
        </div>
        <div>
          <span className="text-gray-400">Agents </span>
          <span className="font-mono font-bold">50</span>
        </div>
      </div>
    </div>
  );
}
