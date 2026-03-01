export type AgentCategory = "tech_entrepreneur" | "politician" | "artist" | "historical_figure" | "influencer";
export type HackathonPhase = "free_discussion" | "development" | "results";
export type ActionType = "speak" | "think" | "code" | "move" | "present" | "idle";

export interface Agent {
  id: string;
  name: string;
  category: AgentCategory;
  spriteKey: string;
  teamId: string | null;
  profileImage: string;
  currentAction: ActionType;
  actionDescription: string;
  pronunciatio: string;
  location: string;
  position: { x: number; y: number };
}

export interface RoundAction {
  agentId: string;
  type: ActionType;
  description: string;
  pronunciatio: string;
  targetAgentIds?: string[];
  chatContent?: string;
  location: string;
}

export interface GroupChat {
  id: string;
  participantIds: string[];
  messages: { speakerId: string; speakerName: string; content: string; round: number }[];
  round: number;
}

export interface Round {
  number: number;
  phase: HackathonPhase;
  actions: RoundAction[];
  groupChats: GroupChat[];
  timestamp: string;
}

export interface Team {
  id: string;
  name: string;
  memberIds: string[];
  projectIdea: string | null;
  projectPlan: string | null;
  projectOutput: string | null;
  techStack: string | null;
}
