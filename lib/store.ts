import { create } from "zustand";
import { HackathonPhase, Agent, Team, Round } from "./types";
import { createInitialAgents } from "./agents";
import { loadTeamsFromPhaseD, loadAllRounds, getPhaseForRound, getTotalRounds } from "./realData";
import { assignPosition } from "./positions";

const teams = loadTeamsFromPhaseD();
const allRounds = loadAllRounds();
const initialAgents = createInitialAgents();
const totalRounds = getTotalRounds();

// Assign team IDs to agents
Object.values(teams).forEach((team) => {
  team.memberIds.forEach((id) => {
    if (initialAgents[id]) initialAgents[id].teamId = team.id;
  });
});

const agentIds = Object.keys(initialAgents);
const agentIndexMap: Record<string, number> = {};
agentIds.forEach((id, i) => { agentIndexMap[id] = i; });

const agentTeamIndex: Record<string, number> = {};
Object.values(teams).forEach((team, i) => {
  team.memberIds.forEach((id) => { agentTeamIndex[id] = i; });
});

interface StoreActions {
  goToRound: (round: number) => void;
  nextRound: () => void;
  prevRound: () => void;
  selectAgent: (agentId: string | null) => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  getAgentHistory: (agentId: string) => Array<{ round: number; action: string; chat?: string }>;
  getTeamForAgent: (agentId: string) => Team | null;
}

interface StoreState {
  currentRound: number;
  totalRounds: number;
  phase: HackathonPhase;
  agents: Record<string, Agent>;
  teams: Record<string, Team>;
  rounds: Round[];
  selectedAgentId: string | null;
  isPlaying: boolean;
  playbackSpeed: number;
}

export const useHackathonStore = create<StoreState & StoreActions>((set, get) => ({
  currentRound: 1,
  totalRounds,
  phase: "free_discussion",
  agents: initialAgents,
  teams,
  rounds: allRounds,
  selectedAgentId: null,
  isPlaying: false,
  playbackSpeed: 1,

  goToRound: (round) => {
    const clamped = Math.max(1, Math.min(round, totalRounds));
    const phase = getPhaseForRound(clamped);
    const roundData = allRounds[clamped - 1];
    const updated = { ...get().agents };

    for (const action of roundData.actions) {
      const agent = updated[action.agentId];
      if (!agent) continue;
      const idx = agentIndexMap[action.agentId];
      const ti = agentTeamIndex[action.agentId] ?? null;
      const pos = assignPosition(idx, phase, ti);

      updated[action.agentId] = {
        ...agent,
        currentAction: action.type,
        actionDescription: action.description,
        pronunciatio: action.pronunciatio,
        location: action.location,
        position: pos,
      };
    }

    set({ currentRound: clamped, phase, agents: updated });
  },

  nextRound: () => {
    const { currentRound, totalRounds, goToRound } = get();
    if (currentRound < totalRounds) goToRound(currentRound + 1);
  },

  prevRound: () => {
    const { currentRound, goToRound } = get();
    if (currentRound > 1) goToRound(currentRound - 1);
  },

  selectAgent: (agentId) => set({ selectedAgentId: agentId }),

  togglePlayback: () => set((s) => ({ isPlaying: !s.isPlaying })),

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  getAgentHistory: (agentId) => {
    const { rounds, currentRound } = get();
    return rounds.slice(0, currentRound).map((round) => {
      const a = round.actions.find((x) => x.agentId === agentId);
      return { round: round.number, action: a?.description ?? "idle", chat: a?.chatContent };
    });
  },

  getTeamForAgent: (agentId) => {
    const { teams, agents } = get();
    const agent = agents[agentId];
    if (!agent?.teamId) return null;
    return teams[agent.teamId] ?? null;
  },
}));
