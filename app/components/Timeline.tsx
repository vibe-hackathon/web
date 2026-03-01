"use client";

import { useEffect, useRef } from "react";
import { useHackathonStore } from "@/lib/store";

const PHASES = [
  { phase: "free_discussion", start: 1, end: 140, label: "Discussion (7 Rounds)", color: "bg-blue-500" },
  { phase: "development", start: 141, end: 164, label: "Development", color: "bg-green-500" },
  { phase: "results", start: 165, end: 263, label: "Evaluation", color: "bg-amber-500" },
];

export default function Timeline() {
  const {
    currentRound, totalRounds, isPlaying, playbackSpeed,
    goToRound, nextRound, prevRound, togglePlayback, setPlaybackSpeed, rounds, agents,
  } = useHackathonStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        const s = useHackathonStore.getState();
        if (s.currentRound >= s.totalRounds) s.togglePlayback();
        else s.nextRound();
      }, 2000 / playbackSpeed);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, playbackSpeed]);

  const rd = rounds[currentRound - 1];
  const talks = rd?.actions.filter((a) => a.type === "speak").slice(0, 5) ?? [];

  return (
    <div className="bg-gray-900 border-t border-gray-700 px-4 py-3">
      {/* Controls */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={prevRound} disabled={currentRound <= 1}
          className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30 text-white">
          Prev
        </button>
        <button onClick={togglePlayback}
          className="px-3 py-1 text-xs bg-blue-600 rounded hover:bg-blue-500 text-white font-medium">
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button onClick={nextRound} disabled={currentRound >= totalRounds}
          className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30 text-white">
          Next
        </button>
        <div className="flex items-center gap-1 ml-2">
          {[1, 2, 4].map((s) => (
            <button key={s} onClick={() => setPlaybackSpeed(s)}
              className={`px-2 py-0.5 text-xs rounded ${
                playbackSpeed === s ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}>
              {s}x
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-auto">{rd?.timestamp}</span>
      </div>

      {/* Scrubber */}
      <div className="relative mb-2">
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-800">
          {PHASES.map((p) => (
            <div key={p.phase} className={`${p.color} opacity-40`}
              style={{ width: `${((p.end - p.start + 1) / totalRounds) * 100}%` }} title={p.label} />
          ))}
        </div>
        <input type="range" min={1} max={totalRounds} value={currentRound}
          onChange={(e) => goToRound(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer" />
        <div className="absolute top-0 w-2 h-2 bg-white rounded-full -translate-x-1/2 pointer-events-none"
          style={{ left: `${((currentRound - 1) / (totalRounds - 1)) * 100}%` }} />
      </div>

      {/* Phase labels */}
      <div className="flex text-[10px] text-gray-500 mb-2">
        {PHASES.map((p) => (
          <div key={p.phase} style={{ width: `${((p.end - p.start + 1) / totalRounds) * 100}%` }}
            className="text-center truncate">{p.label}</div>
        ))}
      </div>
    </div>
  );
}
