# Hackathon Arena Frontend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a real-time 2D visualization of a virtual hackathon where 50 AI agents (famous personas) compete across 4 phases, using Phaser 3 for rendering with the Stanford Generative Agents tilemap + sprites, inside a Next.js 16 app.

**Architecture:** Phaser 3 game engine embedded in Next.js via dynamic import (SSR disabled). A Zustand store holds all agent state and round data. Mock data simulates 50 agents across ~30 rounds in 4 hackathon phases. A timeline scrubber lets users replay the entire hackathon round-by-round. The frontend auto-assigns agent positions on the map based on their current state (free discussion -> scattered, grouped brainstorm -> clusters, development -> at desks, results -> audience formation).

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Phaser 3.80+, Zustand, Stanford Generative Agents tilemap/sprites (Apache-2.0 licensed)

---

## Overview

### Hackathon Phases (4 stages)
1. **Free Discussion** (Rounds 1-8): All 50 agents mingle freely, chat 1-on-1 or in small groups (max 4), explore ideas
2. **Grouping & Brainstorm** (Rounds 9-16): Agents form teams of ~5, cluster together, brainstorm project ideas
3. **Development** (Rounds 17-24): Teams sit at workstations, discuss + "code", produce project artifacts
4. **Results & Demo** (Rounds 25-30): Teams present, gather at stage area

### Agent Data Per Round
Each agent has one action per round:
- **speak**: say something in a conversation (with target agent(s))
- **think**: internal thought/idea (shown as thought bubble)
- **code**: write/commit code (during dev phase)
- **move**: transition between locations
- **present**: demo their project (results phase)
- **idle**: doing nothing notable

### Agent Detail Panel (click to open)
- Current status + activity description
- Recent communication history
- Project idea (after brainstorm)
- Project planning details
- Project output (poster/demo)
- Team info + members

### Position Assignment Logic (frontend-driven)
The frontend maps agent state -> map position:
- **Free Discussion**: agents spread across common areas (cafes, parks, sidewalks)
- **Grouped**: team members cluster within 3-5 tiles of each other in distinct zones
- **Development**: teams sit at indoor workstations (houses/offices on the Smallville map)
- **Results**: all agents gather near the town center/park area

### 50 Agents (5 categories of 10)
1. Tech Entrepreneurs: Elon Musk, Steve Jobs, Mark Zuckerberg, Jeff Bezos, Travis Kalanick, Elizabeth Holmes, Adam Neumann, Peter Thiel, Sam Altman, Alexander Wang
2. Politicians: Donald Trump, Vladimir Putin, Xi Jinping, Winston Churchill, Barack Obama, Angela Merkel, Narendra Modi, Volodymyr Zelenskyy, Margaret Thatcher, Joe Biden
3. Artists: Kanye West, Banksy, Salvador Dali, Andy Warhol, Lady Gaga, Ai Weiwei, Damien Hirst, Marina Abramovic, Yoko Ono, Takashi Murakami
4. Historical Figures: Napoleon Bonaparte, Mahatma Gandhi, Cleopatra, Genghis Khan, Martin Luther King Jr., Nikola Tesla, Julius Caesar, Qin Shi Huang, Marie Curie, Leonardo da Vinci
5. Influencers: Logan Paul, Jake Paul, Andrew Tate, Belle Delphine, Nikocado Avocado, Addison Rae, MrBeast, Pokimane, Kim Kardashian, PewDiePie

---

## Task 0: Download Stanford Generative Agents Assets

**Files:**
- Create: `public/assets/` (directory structure)
- Download from: `https://github.com/joonspk-research/generative_agents`

**Step 1: Clone the repo sparse and copy assets**

```bash
cd /tmp
git clone --depth 1 --filter=blob:none --sparse https://github.com/joonspk-research/generative_agents.git
cd generative_agents
git sparse-checkout set environment/frontend_server/static_dirs/assets environment/frontend_server/templates
```

**Step 2: Copy required assets to project**

```bash
# Map assets (tilesets)
mkdir -p <project>/public/assets/the_ville/visuals/map_assets
cp -r environment/frontend_server/static_dirs/assets/the_ville/visuals/map_assets/* <project>/public/assets/the_ville/visuals/map_assets/

# Tiled map JSON
cp environment/frontend_server/static_dirs/assets/the_ville/visuals/the_ville_jan7.json <project>/public/assets/the_ville/visuals/

# Character sprites + atlas
mkdir -p <project>/public/assets/characters/profile
cp environment/frontend_server/static_dirs/assets/characters/*.png <project>/public/assets/characters/
cp environment/frontend_server/static_dirs/assets/characters/*.json <project>/public/assets/characters/
cp environment/frontend_server/static_dirs/assets/characters/profile/*.png <project>/public/assets/characters/profile/

# Speech bubble
mkdir -p <project>/public/assets/speech_bubble
cp environment/frontend_server/static_dirs/assets/speech_bubble/v3.png <project>/public/assets/speech_bubble/
```

**Step 3: Verify assets are in place**

Run: `ls public/assets/the_ville/visuals/the_ville_jan7.json && ls public/assets/characters/atlas.json && echo "Assets OK"`
Expected: Both files exist, "Assets OK" printed.

**Step 4: Cleanup temp clone**

```bash
rm -rf /tmp/generative_agents
```

**Step 5: Commit**

```bash
git add public/assets/
git commit -m "chore: add Stanford Generative Agents map and sprite assets"
```

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install phaser and zustand**

```bash
pnpm add phaser zustand
```

**Step 2: Verify installation**

Run: `pnpm ls phaser zustand`
Expected: Both packages listed with versions.

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add phaser and zustand dependencies"
```

---

## Task 2: TypeScript Types and Mock Data

**Files:**
- Create: `lib/types.ts`
- Create: `lib/agents.ts`
- Create: `lib/positions.ts`
- Create: `lib/mockRounds.ts`

### Step 1: Create type definitions

Create `lib/types.ts` with these types:

```typescript
export type AgentCategory = "tech_entrepreneur" | "politician" | "artist" | "historical_figure" | "influencer";
export type HackathonPhase = "free_discussion" | "group_brainstorm" | "development" | "results";
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

export interface HackathonState {
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
```

### Step 2: Create agent definitions

Create `lib/agents.ts` with all 50 agents mapped to the available Stanford character sprites (25 sprites, 2 agents per sprite). First check which character PNGs actually exist in the downloaded assets and use only those names as SPRITE_KEYS.

Each agent gets: id, name, category, spriteKey, and initial state (idle, position off-screen).

### Step 3: Create position assignment logic

Create `lib/positions.ts` with pre-defined zones on the Smallville map for each phase:
- FREE_DISCUSSION_ZONES: 6 zones spread across public areas (cafe, park, library, town square, etc.)
- TEAM_ZONES: 10 zones for 10 teams in distinct areas
- DEV_ZONES: same as team zones but tighter radius
- RESULTS_ZONE: single large zone at town center

Function `assignPosition(agentIndex, phase, teamIndex)` returns `{x, y}` tile coordinates with random offset within the zone radius.

### Step 4: Create mock round data generator

Create `lib/mockRounds.ts` that generates 30 rounds of mock data:
- Rounds 1-8 (free_discussion): 60% speak, 20% think, 10% move, 10% idle
- Rounds 9-16 (group_brainstorm): 70% speak within team, 20% think, 10% idle
- Rounds 17-24 (development): 40% code, 40% speak, 10% think, 10% idle
- Rounds 25-30 (results): 50% present, 30% speak, 20% idle

Include personality-appropriate chat snippets for each agent (at least 3 per agent). Include fallback generic snippets.

Team generation: shuffle all 50 agents, divide into 10 teams of 5. Each team gets a project idea from a pre-defined list.

### Step 5: Verify types compile

Run: `npx tsc --noEmit`
Expected: No errors.

### Step 6: Commit

```bash
git add lib/
git commit -m "feat: add types, agent definitions, position logic, and mock data generator"
```

---

## Task 3: Zustand Store

**Files:**
- Create: `lib/store.ts`

### Step 1: Create the Zustand store

Create `lib/store.ts` using `create` from zustand with:

**State:**
- All fields from HackathonState
- Pre-generated teams and rounds (from mockRounds.ts)
- Initial agents (from agents.ts) with teamIds assigned

**Actions:**
- `goToRound(round)`: clamp to 1-30, update phase, update all agent states from that round's actions, reassign positions based on phase
- `nextRound()` / `prevRound()`: increment/decrement and call goToRound
- `selectAgent(agentId | null)`: set selectedAgentId
- `togglePlayback()`: toggle isPlaying
- `setPlaybackSpeed(speed)`: set 1x/2x/4x
- `getAgentHistory(agentId)`: return array of {round, action, chat} up to currentRound
- `getTeamForAgent(agentId)`: return Team or null

### Step 2: Commit

```bash
git add lib/store.ts
git commit -m "feat: add Zustand store with round navigation and agent state management"
```

---

## Task 4: Phaser Game Scene

**Files:**
- Create: `game/config.ts`
- Create: `game/scenes/HackathonScene.ts`
- Create: `game/PhaserBridge.ts`

### Step 1: Create Phaser config

Create `game/config.ts` with Phaser.AUTO, 1500x800, pixelArt: true, arcade physics (no gravity), zoom: 0.8. Scene: [HackathonScene].

### Step 2: Create HackathonScene

Create `game/scenes/HackathonScene.ts` - this is the core file, directly adapted from the Stanford `main_script.html`:

**preload():** Load all tileset images, Tiled JSON map, character atlases, speech bubble. Asset paths use `/assets/...` (public directory).

**create():**
- Build tilemap with all layers (exactly matching Stanford: Bottom Ground, Exterior Ground, Exterior Decoration L1/L2, Interior Ground, Wall, Interior Furniture L1/L2, Foreground L1/L2, Collisions)
- Set collision layer to depth -1, foreground layers to depth 2
- Create invisible camera target sprite at (2400, 588)
- Set up camera follow + bounds
- Create walk animations for all character sprites (left/right/up/down-walk, 4 frames each, frameRate 4, repeat -1)
- Create persona sprites for all 50 agents with: physics sprite, speech bubble image, pronunciatio text (initials + emoji), name label text
- Each sprite is interactive (click handler -> onAgentClick callback)

**update():**
- Handle arrow key camera movement (speed 400)
- If an agent is focused, snap camera to their position
- For each persona sprite: interpolate movement toward target position at MOVEMENT_SPEED (4 px/frame), play walk animation in direction of movement, show idle frame when arrived
- Update overlay positions (speech bubble, pronunciatio text, name label) to follow sprite

**Public methods:**
- `updateAgents(agents)`: update target positions and pronunciatio for all personas
- `setOnAgentClick(callback)`: set click handler
- `focusAgent(agentId)`: pan camera to agent

TILE_WIDTH = 32, MOVEMENT_SPEED = 4.

### Step 3: Create PhaserBridge

Create `game/PhaserBridge.ts` - a module that manages the Phaser.Game instance:
- `initGame(container, initialAgents, onAgentClick)`: create game, pass agents to scene
- `updateGameAgents(agents)`: forward to scene.updateAgents()
- `focusGameAgent(agentId)`: forward to scene.focusAgent()
- `destroyGame()`: cleanup

### Step 4: Commit

```bash
git add game/
git commit -m "feat: add Phaser 3 game scene with tilemap and agent sprite movement"
```

---

## Task 5: React Components - PhaserGame Wrapper

**Files:**
- Create: `app/components/PhaserGame.tsx`

### Step 1: Create dynamic Phaser wrapper

"use client" component that:
- Uses useRef for container div and game/bridge instances
- useEffect on mount: dynamically imports PhaserBridge, calls initGame with container ref
- useEffect on agents change: calls updateGameAgents
- useEffect on selectedAgentId change: calls focusGameAgent
- Cleanup on unmount: calls destroyGame
- Renders a div with ref, id="game-container", full width/height

### Step 2: Commit

```bash
git add app/components/PhaserGame.tsx
git commit -m "feat: add PhaserGame React wrapper with dynamic import"
```

---

## Task 6: React Components - UI Chrome

**Files:**
- Create: `app/components/TopBar.tsx`
- Create: `app/components/AgentList.tsx`
- Create: `app/components/Sidebar.tsx`
- Create: `app/components/Timeline.tsx`

### Step 1: TopBar

Dark bg, flex row with:
- Left: "Hackathon Arena" title + phase badge (colored pill with phase name)
- Right: Round X/30, Agent count

Phase colors: free_discussion=blue, group_brainstorm=purple, development=green, results=amber.

### Step 2: AgentList (bottom portrait bar)

Horizontal scrollable row of all 50 agents, sorted by category. Each agent: clickable button with emoji/avatar circle (colored border by category) + first name. Selected agent gets green highlight ring.

Category border colors: tech=blue, politician=red, artist=purple, historical=amber, influencer=green.

### Step 3: Sidebar (agent detail panel)

Width 320px, dark bg, right side. Shows when selectedAgentId is set:
- Header: emoji, name, category, close button
- Current Status: action icon + type + description + location
- Team Info (hidden during free_discussion): team name, project idea, member pills (clickable to switch focus)
- Activity Log: reverse-chronological list of round actions with chat quotes

When no agent selected: centered "Click on an agent to view details" message.

### Step 4: Timeline

Bottom bar with:
- Controls: Prev/Pause-Play/Next buttons + speed selector (1x/2x/4x) + timestamp
- Scrubber: range input over colored phase segments (blue/purple/green/amber proportional to round count), white dot indicator
- Phase labels below scrubber
- Activity feed: horizontal scroll of up to 5 speak actions from current round (agent name: chat content)

Auto-playback: useEffect with setInterval (2000ms / playbackSpeed), advances rounds, stops at end.

### Step 5: Commit

```bash
git add app/components/
git commit -m "feat: add TopBar, AgentList, Sidebar, and Timeline UI components"
```

---

## Task 7: Main Page Assembly

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

### Step 1: Update globals.css

Set dark mode as default (background: #0a0a0a), add `overflow: hidden` to body, add custom scrollbar styles.

### Step 2: Update layout.tsx metadata

Title: "Hackathon Arena", description: "Virtual AI Hackathon - 50 agents compete in real-time".

### Step 3: Assemble main page

Replace page.tsx with "use client" component:
- Dynamic import PhaserGame with ssr:false + loading state
- useEffect to call goToRound(1) on mount
- Layout: flex column h-screen
  - TopBar
  - flex row (flex-1, overflow-hidden):
    - PhaserGame (flex-1)
    - Sidebar
  - AgentList
  - Timeline

### Step 4: Verify build

Run: `pnpm build`
Expected: Build succeeds.

### Step 5: Commit

```bash
git add app/
git commit -m "feat: assemble main page with game, sidebar, agent list, and timeline"
```

---

## Task 8: Polish and Debug

### Step 1: Run dev server

```bash
pnpm dev
```

### Step 2: Verify all features

- [ ] Tilemap loads and displays Smallville map
- [ ] 50 agent sprites appear on the map
- [ ] Clicking an agent opens sidebar with details
- [ ] Timeline scrubber navigates between rounds 1-30
- [ ] Agents move between positions when changing rounds
- [ ] Play button auto-advances rounds
- [ ] Arrow keys move the camera
- [ ] Phase indicator updates across 4 phases
- [ ] Agent list bar shows all 50 agents with category colors
- [ ] Clicking team member in sidebar switches focus
- [ ] Activity feed shows current round's conversations

### Step 3: Fix issues

Common things to debug:
- Asset paths (public/ directory resolution)
- Character sprite names matching actual PNG files
- Tileset names matching Tiled JSON layer references
- Phaser scene lifecycle timing (create() vs React state sync)
- TypeScript strict mode errors
- Phaser keyboard input not conflicting with React

### Step 4: Final commit

```bash
git add -A
git commit -m "fix: polish and debug initial implementation"
```
