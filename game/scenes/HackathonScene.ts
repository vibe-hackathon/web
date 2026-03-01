import Phaser from "phaser";
import { Agent } from "../../lib/types";
import { SPRITE_KEYS } from "../../lib/agents";
import { bridgeState } from "../PhaserBridge";

// Original tilemap: 140 cols x 100 rows. Tile pixel size is computed
// dynamically from the map background image so agents always land inside it.
const MAP_COLS = 140;
const MAP_ROWS = 100;
const MOVE_SPEED = 4;

interface PersonaSprite {
  sprite: Phaser.Physics.Arcade.Sprite;
  nameText: Phaser.GameObjects.Text;
  bubble: Phaser.GameObjects.Image;
  emojiText: Phaser.GameObjects.Text;
  targetX: number;
  targetY: number;
  lastDir: string;
}

export class HackathonScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private camTarget!: Phaser.Physics.Arcade.Sprite;
  private personas = new Map<string, PersonaSprite>();
  private focusedId: string | null = null;

  // Drag state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragThreshold = 8;

  public agentStates: Record<string, Agent> = {};
  private onAgentClick?: (id: string) => void;

  constructor() {
    super({ key: "HackathonScene" });
  }

  setOnAgentClick(cb: (id: string) => void) { this.onAgentClick = cb; }

  focusAgent(id: string | null) { this.focusedId = id; }

  updateAgents(agents: Record<string, Agent>) {
    this.agentStates = agents;
    for (const [id, agent] of Object.entries(agents)) {
      const p = this.personas.get(id);
      if (p) {
        p.targetX = agent.position.x * this._tileW;
        p.targetY = agent.position.y * this._tileH;
        p.emojiText.setText(agent.pronunciatio);
      }
    }
  }

  preload() {
    const b = "/assets";
    // Map image
    this.load.image("map_bg", `${b}/map.png`);
    // Character atlases
    for (const c of SPRITE_KEYS)
      this.load.atlas(c, `${b}/characters/${c}.png`, `${b}/characters/atlas.json`);
    // Speech bubble
    this.load.image("speech_bubble", `${b}/speech_bubble/v3.png`);
  }

  create() {
    // Read initial state from bridge before building anything
    this.agentStates = bridgeState.agents;
    if (bridgeState.onAgentClick) this.onAgentClick = bridgeState.onAgentClick;

    this.buildMap();
    this.setupCamera();
    this.createAnimations();
    this.createAllPersonas();
  }

  private buildMap() {
    const bg = this.add.image(0, 0, "map_bg").setOrigin(0, 0).setDepth(-2);
    this._mapWidth = bg.width;
    this._mapHeight = bg.height;
    this._tileW = this._mapWidth / MAP_COLS;
    this._tileH = this._mapHeight / MAP_ROWS;
  }

  private _mapWidth = 0;
  private _mapHeight = 0;
  private _tileW = 32;
  private _tileH = 32;

  private setupCamera() {
    this.camTarget = this.physics.add
      .sprite(2400, 588, SPRITE_KEYS[0], "down")
      .setSize(30, 40).setOffset(0, 0).setDepth(-1).setAlpha(0);
    const cam = this.cameras.main;
    cam.startFollow(this.camTarget);
    cam.setBounds(0, 0, this._mapWidth, this._mapHeight);
    // Ensure the map fills the viewport horizontally on load
    const minZoom = cam.width / this._mapWidth;
    if (cam.zoom < minZoom) cam.setZoom(minZoom);
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Mouse drag to pan
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.dragStartX = p.x;
      this.dragStartY = p.y;
      this.isDragging = false;
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return;
      const dx = p.x - this.dragStartX;
      const dy = p.y - this.dragStartY;
      if (!this.isDragging && Math.abs(dx) + Math.abs(dy) > this.dragThreshold) {
        this.isDragging = true;
        this.focusedId = null;
        cam.stopFollow();
      }
      if (this.isDragging) {
        cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom;
        cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom;
      }
    });
    this.input.on("pointerup", () => {
      if (this.isDragging) {
        // Re-sync camTarget to current scroll so keyboard still works
        this.camTarget.setPosition(
          cam.scrollX + cam.width / 2,
          cam.scrollY + cam.height / 2
        );
        cam.startFollow(this.camTarget);
      }
      this.isDragging = false;
    });

    // Re-clamp zoom when the viewport is resized so black edges never appear
    this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
      const newMin = gameSize.width / this._mapWidth;
      if (cam.zoom < newMin) cam.setZoom(newMin);
    });

    // Mouse wheel zoom – min zoom ensures the map always fills the viewport horizontally
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _gos: unknown[], _dx: number, dy: number) => {
      const minZoom = cam.width / this._mapWidth;
      const zoomDelta = dy > 0 ? -0.02 : 0.02;
      const newZoom = Phaser.Math.Clamp(cam.zoom + zoomDelta, minZoom, 3);
      cam.setZoom(newZoom);
    });
  }

  private createAnimations() {
    for (const c of SPRITE_KEYS) {
      for (const dir of ["left", "right", "down", "up"]) {
        this.anims.create({
          key: `${c}-${dir}-walk`,
          frames: this.anims.generateFrameNames(c, { prefix: `${dir}-walk.`, start: 0, end: 3, zeroPad: 3 }),
          frameRate: 4,
          repeat: -1,
        });
      }
    }
  }

  private createAllPersonas() {
    for (const [id, agent] of Object.entries(this.agentStates)) {
      const sx = agent.position.x * this._tileW + this._tileW / 2;
      const sy = agent.position.y * this._tileH + this._tileH;

      const sprite = this.physics.add
        .sprite(sx, sy, agent.spriteKey, "down")
        .setSize(30, 40).setOffset(0, 0).setInteractive({ useHandCursor: true });
      sprite.displayWidth = 40;
      sprite.scaleY = sprite.scaleX;
      sprite.on("pointerup", () => { if (!this.isDragging) this.onAgentClick?.(id); });

      const bubble = this.add.image(sx + 60, sy - 39, "speech_bubble").setDepth(3);
      bubble.displayWidth = 130;
      bubble.displayHeight = 58;

      const initials = agent.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
      const emojiText = this.add.text(sx - 6, sy - 67, `${initials}: ${agent.pronunciatio}`, {
        font: "18px monospace", color: "#000000", padding: { x: 6, y: 4 },
      }).setDepth(3);

      const nameText = this.add.text(sx - 20, sy + 8, agent.name.split(" ")[0], {
        font: "11px Arial", color: "#333", backgroundColor: "#ffffffcc", padding: { x: 2, y: 1 },
      }).setDepth(3);

      this.personas.set(id, { sprite, nameText, bubble, emojiText, targetX: sx, targetY: sy, lastDir: "d" });
    }
  }

  update() {
    // Camera
    const spd = 400;
    this.camTarget.setVelocity(0);
    if (this.cursors.left.isDown) this.camTarget.setVelocityX(-spd);
    if (this.cursors.right.isDown) this.camTarget.setVelocityX(spd);
    if (this.cursors.up.isDown) this.camTarget.setVelocityY(-spd);
    if (this.cursors.down.isDown) this.camTarget.setVelocityY(spd);

    if (this.focusedId) {
      const p = this.personas.get(this.focusedId);
      if (p) { this.camTarget.setPosition(p.sprite.x, p.sprite.y); this.camTarget.setVelocity(0); }
    }

    // Move sprites
    for (const [id, p] of this.personas) {
      let dir = "";
      if (Math.abs(p.sprite.x - p.targetX) > MOVE_SPEED) {
        dir = p.sprite.x < p.targetX ? "r" : "l";
        p.sprite.x += dir === "r" ? MOVE_SPEED : -MOVE_SPEED;
      } else if (Math.abs(p.sprite.y - p.targetY) > MOVE_SPEED) {
        dir = p.sprite.y < p.targetY ? "d" : "u";
        p.sprite.y += dir === "d" ? MOVE_SPEED : -MOVE_SPEED;
      } else {
        p.sprite.x = p.targetX;
        p.sprite.y = p.targetY;
      }

      p.emojiText.setPosition(p.sprite.x - 6, p.sprite.y - 67);
      p.bubble.setPosition(p.sprite.x + 60, p.sprite.y - 39);
      p.nameText.setPosition(p.sprite.x - 20, p.sprite.y + 8);

      const agent = this.agentStates[id];
      if (!agent) continue;
      const sk = agent.spriteKey;

      if (dir === "l") p.sprite.anims.play(`${sk}-left-walk`, true);
      else if (dir === "r") p.sprite.anims.play(`${sk}-right-walk`, true);
      else if (dir === "u") p.sprite.anims.play(`${sk}-up-walk`, true);
      else if (dir === "d") p.sprite.anims.play(`${sk}-down-walk`, true);
      else {
        p.sprite.anims.stop();
        const idle: Record<string, string> = { l: "left", r: "right", u: "up", d: "down" };
        p.sprite.setTexture(sk, idle[p.lastDir] ?? "down");
      }
      if (dir) p.lastDir = dir;
    }
  }
}
