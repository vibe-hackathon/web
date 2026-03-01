"use client";

import { useHackathonStore } from "@/lib/store";

const ICONS: Record<string, string> = {
  speak: "💬", think: "🤔", code: "💻", move: "🚶", present: "🎤", idle: "☕",
};

export default function Sidebar() {
  const { agents, selectedAgentId, selectAgent, getAgentHistory, getTeamForAgent, phase } =
    useHackathonStore();

  if (!selectedAgentId) {
    return (
      <div className="w-2/5 bg-gray-900 border-l border-gray-700 p-6 text-gray-400 flex items-center justify-center">
        <p className="text-center text-sm">Click on an agent to view details</p>
      </div>
    );
  }

  const agent = agents[selectedAgentId];
  if (!agent) return null;

  const history = getAgentHistory(selectedAgentId);
  const team = getTeamForAgent(selectedAgentId);

  return (
    <div className="w-2/5 bg-gray-900 border-l border-gray-700 overflow-y-auto text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xl">
              {agent.pronunciatio}
            </div>
            <div>
              <h2 className="font-bold text-sm">{agent.name}</h2>
              <p className="text-xs text-gray-400 capitalize">{agent.category.replace("_", " ")}</p>
            </div>
          </div>
          <button onClick={() => selectAgent(null)} className="text-gray-500 hover:text-white text-lg">
            x
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Current Status</h3>
        <div className="flex items-center gap-2 mb-1">
          <span>{ICONS[agent.currentAction] ?? "❓"}</span>
          <span className="text-sm capitalize">{agent.currentAction}</span>
        </div>
        <p className="text-sm text-gray-300">{agent.actionDescription}</p>
        <p className="text-xs text-gray-500 mt-1">Location: {agent.location}</p>
      </div>

      {/* Team */}
      {team && (phase === "development" || phase === "results") && (
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Team</h3>
          <p className="text-sm font-medium">{team.name}</p>
          {team.projectIdea && (
            <p className="text-xs text-gray-300 mt-1">
              <span className="text-gray-500">Idea: </span>{team.projectIdea}
            </p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {team.memberIds.map((id) => (
              <button
                key={id}
                onClick={() => selectAgent(id)}
                className={`text-xs px-2 py-0.5 rounded-full ${
                  id === selectedAgentId ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {agents[id]?.name.split(" ")[0] ?? id}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div className="p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Activity Log</h3>
        <div className="space-y-2">
          {history.slice().reverse().map((e) => (
            <div key={e.round} className="text-xs border-l-2 border-gray-700 pl-3 py-1">
              <div className="text-gray-500">Round {e.round}</div>
              <div className="text-gray-300">{e.action}</div>
              {e.chat && <div className="text-gray-400 italic mt-0.5">&quot;{e.chat}&quot;</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
