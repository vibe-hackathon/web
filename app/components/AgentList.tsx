"use client";

import { useHackathonStore } from "@/lib/store";

const CAT_COLORS: Record<string, string> = {
  tech_entrepreneur: "border-blue-400",
  politician: "border-red-400",
  artist: "border-purple-400",
  historical_figure: "border-amber-400",
  influencer: "border-green-400",
};

export default function AgentList() {
  const { agents, selectedAgentId, selectAgent } = useHackathonStore();
  const sorted = Object.values(agents).sort((a, b) => a.category.localeCompare(b.category));

  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-gray-900 border-t border-gray-700 overflow-x-auto">
      {sorted.map((a) => (
        <button
          key={a.id}
          onClick={() => selectAgent(a.id === selectedAgentId ? null : a.id)}
          className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-all min-w-[52px] ${
            a.id === selectedAgentId ? "bg-green-500/20 ring-2 ring-green-400" : "hover:bg-gray-800"
          }`}
          title={a.name}
        >
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-lg ${CAT_COLORS[a.category]} bg-gray-700`}>
            {a.pronunciatio}
          </div>
          <span className="text-[10px] text-gray-400 truncate max-w-[48px]">{a.name.split(" ")[0]}</span>
        </button>
      ))}
    </div>
  );
}
