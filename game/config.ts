import Phaser from "phaser";
import { HackathonScene } from "./scenes/HackathonScene";

export function createGameConfig(parent: string | HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    pixelArt: true,
    physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 } } },
    scene: [HackathonScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: "100%",
      height: "100%",
    },
  };
}
