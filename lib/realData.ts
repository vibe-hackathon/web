/**
 * Real Data Loader - Loads merged data from docs/record/merged-data.json
 */

import { Round, RoundAction, Team, HackathonPhase } from "./types";
import { toFrontendId } from "./agentMapping";
import mergedDataRaw from "@/docs/record/merged-data.json";

// --- Type definitions ---

interface ChatMessage {
  timestamp: string;
  turn: number;
  phase: string;
  sub_turn: string | null | number;
  agent_id: string;
  agent_name: string;
  utterance: string;
  group_members: string[];
  session_history?: string;
  role?: string;
}

interface DiscussionRound {
  round: number;
  group: string;
  messages: ChatMessage[];
}

interface DevelopmentTeam {
  teamId: string;
  messages: ChatMessage[];
  poster: string | null;
}

interface EvaluationTeam {
  teamId: string;
  messages: ChatMessage[];
  scores: {
    team_id: string;
    average_score: number;
    dimension_averages: Record<string, number>;
    judge_outputs: any[];
  } | null;
}

interface MergedData {
  agents: any[];
  roundSummaries: any[];
  discussionRounds: DiscussionRound[];
  developmentPhase: DevelopmentTeam[];
  evaluationPhase: EvaluationTeam[];
  metadata: any;
}

const mergedData = mergedDataRaw as MergedData;

// --- Helpers ---

const EMOJIS: Record<string, string[]> = {
  speak: ["💬", "🗣️", "💭", "📢"],
  think: ["🤔", "💡", "🧠", "✨"],
  code: ["💻", "⌨️", "🔧", "📝"],
  present: ["🎤", "📊", "🏆", "🎯"],
  idle: ["😴", "☕", "👀", "🫠"],
  move: ["🚶", "👟", "➡️", "🏃"],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Parse utterance JSON string - handle malformed JSON
 */
function parseUtterance(utteranceStr: string): any {
  try {
    return JSON.parse(utteranceStr);
  } catch {
    // If it starts with ```json, extract the JSON part
    const jsonMatch = utteranceStr.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        return { utterance: utteranceStr };
      }
    }
    // Try to extract utterance field from malformed JSON
    const utteranceMatch = utteranceStr.match(/"utterance"\s*:\s*"([^"]+)"/);
    if (utteranceMatch) {
      return { utterance: utteranceMatch[1] };
    }
    return { utterance: utteranceStr.substring(0, 200) };
  }
}

/**
 * Extract chat content from utterance
 */
function extractChatContent(msg: ChatMessage): string {
  const parsed = parseUtterance(msg.utterance);
  
  if (msg.phase === "idea_gen") {
    return parsed.title ? `${parsed.title}: ${parsed.utterance}` : (parsed.utterance || msg.utterance.substring(0, 200));
  } else if (msg.phase === "discussion") {
    return parsed.utterance || msg.utterance.substring(0, 200);
  } else if (msg.phase === "summary") {
    return parsed.my_idea || parsed.utterance || "Summarizing discussion";
  } else if (msg.phase === "D") {
    return parsed.utterance || msg.utterance.substring(0, 200);
  } else if (msg.phase === "E_intro" || msg.phase === "E_qa" || msg.phase === "E_final") {
    // Phase E messages are plain text or JSON with utterance field
    return parsed.utterance || msg.utterance.substring(0, 200);
  }
  
  return parsed.utterance || msg.utterance.substring(0, 200);
}

/**
 * Convert chat message to RoundAction
 */
function messageToAction(msg: ChatMessage, phase: HackathonPhase): RoundAction {
  const frontendId = toFrontendId(msg.agent_id);
  const targetIds = msg.group_members
    .filter((id) => id !== msg.agent_id)
    .map(toFrontendId);
  const chatContent = extractChatContent(msg);

  let actionType: "speak" | "present" = "speak";
  let description = "Discussing";
  
  if (phase === "results") {
    if (msg.role === "judge") {
      actionType = "present";
      description = "Evaluating project";
    } else {
      actionType = "speak";
      description = msg.phase === "E_intro" ? "Introducing project" : "Answering questions";
    }
  }

  return {
    agentId: frontendId,
    type: actionType,
    description,
    pronunciatio: pick(EMOJIS[actionType]),
    targetAgentIds: targetIds,
    chatContent,
    location: phase === "results" ? "Main Stage" : "Discussion Area",
  };
}

/**
 * Load teams from phase_d data
 */
export function loadTeamsFromPhaseD(): Record<string, Team> {
  const teams: Record<string, Team> = {};
  const developmentPhase = mergedData.developmentPhase;

  const teamNames = [
    "Eyes of the Future", "GreenGridAI", "Echoes of Silence", "EcoHabits",
    "Eternal Echoes", "EyesOnYou", "Ephemeral Echoes", "Global Wireless Power Grid",
    "MicroFinanceChain", "HapticMapGen", "NeuroBridge", "EcoConnect",
  ];

  const teamIdeas = [
    "Combining real-time object recognition with job search, housing assistance, and mental health support.",
    "Decentralized AI for Sustainable Energy Distribution",
    "Amplify the voices of the silenced, challenge systemic oppression.",
    "Foster Global Empathy and Environmental Awareness Through Emotional Signaling",
    "Digitizing Organic Materials for Thought-Provoking Digital Art",
    "Empowering visually impaired users with real-time image descriptions.",
    "Addressing Oppression Through Ephemeral Technology",
    "Transforming Energy Access and Sustainability Globally",
    "Transparent Lending, Transformative Impact",
    "Transform Environments into Tactile Terrain for the Visually Impaired",
    "Bridging the Gap: Enabling Communication for Motor-Impaired Users",
    "Connect individuals with local environmental initiatives, fostering community action and awareness.",
  ];

  developmentPhase.forEach((team, index) => {
    const firstMessage = team.messages[0];
    const memberIds = firstMessage.group_members.map(toFrontendId);

    teams[team.teamId] = {
      id: team.teamId,
      name: teamNames[index],
      memberIds,
      projectIdea: teamIdeas[index],
      projectPlan: null,
      projectOutput: team.poster,
      techStack: null,
    };
  });

  return teams;
}

/**
 * Load all rounds from merged data
 * Structure: 7 discussion rounds × 20 turns + 24 development turns + 99 evaluation turns = 263 total rounds
 */
export function loadAllRounds(): Round[] {
  const rounds: Round[] = [];
  const discussionRounds = mergedData.discussionRounds;
  const developmentPhase = mergedData.developmentPhase;
  const evaluationPhase = mergedData.evaluationPhase;

  // Process discussion rounds (7 big rounds × 20 turns each = 140 frontend rounds)
  for (let bigRound = 1; bigRound <= 7; bigRound++) {
    const groupsInRound = discussionRounds.filter((r) => r.round === bigRound);
    
    for (let turn = 1; turn <= 20; turn++) {
      const actions: RoundAction[] = [];
      
      for (const group of groupsInRound) {
        const message = group.messages.find((m) => m.turn === turn);
        if (message) {
          actions.push(messageToAction(message, "free_discussion"));
        }
      }

      const roundNumber = (bigRound - 1) * 20 + turn;
      const hour = 9 + Math.floor((turn - 1) / 4);
      const minute = ((turn - 1) % 4) * 15;
      const timestamp = `${hour}:${minute.toString().padStart(2, "0")} AM`;

      rounds.push({
        number: roundNumber,
        phase: "free_discussion",
        actions,
        groupChats: [],
        timestamp,
      });
    }
  }

  // Process development phase (24 turns = 24 frontend rounds)
  for (let turn = 1; turn <= 24; turn++) {
    const actions: RoundAction[] = [];
    
    for (const team of developmentPhase) {
      const message = team.messages.find((m) => m.turn === turn);
      if (message) {
        const frontendId = toFrontendId(message.agent_id);
        const targetIds = message.group_members
          .filter((id) => id !== message.agent_id)
          .map(toFrontendId);
        const chatContent = extractChatContent(message);

        actions.push({
          agentId: frontendId,
          type: turn <= 16 ? "speak" : "code",
          description: turn <= 16 ? "Discussing implementation" : "Coding project",
          pronunciatio: pick(turn <= 16 ? EMOJIS.speak : EMOJIS.code),
          targetAgentIds: turn <= 16 ? targetIds : undefined,
          chatContent: turn <= 16 ? chatContent : undefined,
          location: "Team Workspace",
        });
      }
    }

    const roundNumber = 140 + turn;
    const hour = 16 + Math.floor((turn - 1) / 4);
    const minute = ((turn - 1) % 4) * 15;
    const timestamp = `${hour}:${minute.toString().padStart(2, "0")} PM`;

    rounds.push({
      number: roundNumber,
      phase: "development",
      actions,
      groupChats: [],
      timestamp,
    });
  }

  // Process evaluation phase (99 turns = 99 frontend rounds)
  for (let turn = 1; turn <= 99; turn++) {
    const actions: RoundAction[] = [];
    
    for (const team of evaluationPhase) {
      const message = team.messages.find((m) => m.turn === turn);
      if (message) {
        actions.push(messageToAction(message, "results"));
      }
    }

    const roundNumber = 164 + turn;
    const hour = 20 + Math.floor((turn - 1) / 12);
    const minute = ((turn - 1) % 12) * 5;
    const timestamp = `${hour}:${minute.toString().padStart(2, "0")} PM`;

    rounds.push({
      number: roundNumber,
      phase: "results",
      actions,
      groupChats: [],
      timestamp,
    });
  }

  return rounds;
}

/**
 * Get phase for round number
 */
export function getPhaseForRound(r: number): HackathonPhase {
  if (r <= 140) return "free_discussion"; // Rounds 1-140 (7 big rounds × 20)
  if (r <= 164) return "development";     // Rounds 141-164 (24 turns)
  return "results";                       // Rounds 165-263 (99 turns)
}

/**
 * Get total number of rounds
 */
export function getTotalRounds(): number {
  return 263; // 7 × 20 + 24 + 99
}
