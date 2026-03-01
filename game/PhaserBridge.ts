import Phaser from "phaser";
import { createGameConfig } from "./config";
import { HackathonScene } from "./scenes/HackathonScene";
import { Agent } from "../lib/types";

let game: Phaser.Game | null = null;

// Shared state that Scene reads during init/create
export const bridgeState: {
  agents: Record<string, Agent>;
  onAgentClick?: (id: string) => void;
} = { agents: {} };

export function initGame(
  container: HTMLElement,
  initialAgents: Record<string, Agent>,
  onAgentClick: (id: string) => void
): Phaser.Game {
  if (game) game.destroy(true);

  // Set shared state BEFORE game boots
  bridgeState.agents = initialAgents;
  bridgeState.onAgentClick = onAgentClick;

  const config = createGameConfig(container);
  game = new Phaser.Game(config);
  return game;
}

export function updateGameAgents(agents: Record<string, Agent>) {
  if (!game) return;
  bridgeState.agents = agents;
  const s = game.scene.getScene("HackathonScene") as HackathonScene;
  if (s?.scene?.isActive()) s.updateAgents(agents);
}

export function focusGameAgent(id: string | null) {
  if (!game) return;
  const s = game.scene.getScene("HackathonScene") as HackathonScene;
  if (s?.scene?.isActive()) s.focusAgent(id);
}

export function destroyGame() {
  if (game) { game.destroy(true); game = null; }
}
