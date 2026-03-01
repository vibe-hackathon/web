# Hackathon Arena - 数据库设计文档

## 项目背景

Hackathon Arena 是一个实时 2D 可视化虚拟黑客马拉松项目。50 个 AI Agent（名人角色）在 4 个阶段中竞争，前端使用 Phaser 3 渲染 Smallville 风格的地图。

**当前状态：** 项目目前是纯前端应用，没有后端和数据库。所有数据通过 `lib/mockRounds.ts` 在客户端随机生成，每次刷新页面数据都不同。本文档定义后端需要的数据库 schema，以实现数据持久化。

---

## 目录

1. [核心实体概览](#1-核心实体概览)
2. [ER 关系图](#2-er-关系图)
3. [表结构详细设计](#3-表结构详细设计)
4. [枚举类型定义](#4-枚举类型定义)
5. [索引设计](#5-索引设计)
6. [数据流与前端对应关系](#6-数据流与前端对应关系)
7. [SQL 建表语句参考](#7-sql-建表语句参考)
8. [设计决策与注意事项](#8-设计决策与注意事项)

---

## 1. 核心实体概览

根据前端代码 `lib/types.ts` 中定义的接口，数据库需要存储以下实体：

| 实体 | 前端类型 | 描述 | 预计数据量 |
|------|---------|------|-----------|
| **Hackathon** | 无（新增） | 一次黑客马拉松比赛的元数据 | 少量 |
| **Agent** | `Agent` | AI Agent 的静态信息 | 50 / hackathon |
| **Team** | `Team` | 团队信息 | 10 / hackathon |
| **Round** | `Round` | 每一轮的全局状态 | 50 / hackathon |
| **RoundAction** | `RoundAction` | 每个 Agent 在每一轮的行为 | 2,500 / hackathon (50 agents x 50 rounds) |
| **GroupChat** | `GroupChat` | 群组对话 | 变化 |
| **ChatMessage** | `GroupChat.messages[*]` | 单条聊天消息 | 变化 |

---

## 2. ER 关系图

```
┌──────────────┐
│  hackathons   │
│──────────────│
│ id (PK)       │
│ name          │
│ total_rounds  │
│ status        │
│ created_at    │
└──────┬───────┘
       │
       │ 1:N
       ├───────────────────────────┐──────────────────────┐
       ▼                           ▼                      ▼
┌──────────────┐          ┌──────────────┐        ┌──────────────┐
│    agents     │          │    teams      │        │    rounds     │
│──────────────│          │──────────────│        │──────────────│
│ id (PK)       │          │ id (PK)       │        │ id (PK)       │
│ hackathon_id  │◄────┐    │ hackathon_id  │        │ hackathon_id  │
│ name          │     │    │ name          │        │ number        │
│ category      │     │    │ project_idea  │        │ phase         │
│ sprite_key    │     │    │ project_plan  │        │ timestamp     │
│ profile_image │     │    │ project_output│        └──────┬───────┘
│ team_id (FK)──┼─────┼───►│ tech_stack    │               │
└──────┬───────┘     │    └──────────────┘               │ 1:N
       │              │                                    │
       │              │                            ┌───────┴───────┐
       │              │                            ▼               ▼
       │              │                   ┌──────────────┐  ┌──────────────┐
       │              │                   │ round_actions │  │ group_chats  │
       │              │                   │──────────────│  │──────────────│
       │              │                   │ id (PK)       │  │ id (PK)       │
       │              └───────────────────┤ agent_id (FK) │  │ round_id (FK) │
       │                                  │ round_id (FK) │  └──────┬───────┘
       │                                  │ type          │         │
       │                                  │ description   │         │ 1:N
       │                                  │ pronunciatio  │         ▼
       │                                  │ chat_content  │  ┌──────────────┐
       │                                  │ location      │  │chat_messages │
       │                                  └──────┬───────┘  │──────────────│
       │                                         │          │ id (PK)       │
       │                                         │ N:M      │ group_chat_id │
       │                                         ▼          │ speaker_id(FK)│
       │                                  ┌──────────────┐  │ content       │
       │                                  │action_targets│  │ round (int)   │
       │                                  │──────────────│  └──────────────┘
       │                                  │ action_id(FK) │
       └─────────────────────────────────►│ target_id(FK) │
                                          └──────────────┘

┌───────────────────┐
│ group_chat_members │
│───────────────────│
│ group_chat_id (FK) │
│ agent_id (FK)      │
└───────────────────┘
```

---

## 3. 表结构详细设计

### 3.1 `hackathons` - 黑客马拉松比赛

> **新增实体**：前端代码没有这个概念（只有一个硬编码的比赛），但后端应该支持多场比赛。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK | 主键 |
| `name` | VARCHAR(255) | NOT NULL | 比赛名称 |
| `total_rounds` | INTEGER | NOT NULL, DEFAULT 50 | 总轮数（对应 `store.totalRounds`） |
| `status` | ENUM | NOT NULL, DEFAULT 'pending' | 比赛状态：pending / running / completed |
| `current_round` | INTEGER | NOT NULL, DEFAULT 0 | 当前进行到的轮次 |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW | 创建时间 |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW | 更新时间 |

**前端对应：** `store.totalRounds`、`store.currentRound`

---

### 3.2 `agents` - AI Agent

> **对应前端类型：** `lib/types.ts` 中的 `Agent` 接口

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | VARCHAR(64) | PK | Agent 唯一标识，如 `"elon_musk"`（对应 `Agent.id`） |
| `hackathon_id` | UUID | FK → hackathons.id, NOT NULL | 所属比赛 |
| `name` | VARCHAR(128) | NOT NULL | 显示名，如 `"Elon Musk"`（对应 `Agent.name`） |
| `category` | ENUM(agent_category) | NOT NULL | 分类（对应 `Agent.category`） |
| `sprite_key` | VARCHAR(64) | NOT NULL | 精灵图 key，如 `"Adam_Smith"`（对应 `Agent.spriteKey`） |
| `profile_image` | VARCHAR(256) | NOT NULL | 头像路径（对应 `Agent.profileImage`） |
| `team_id` | VARCHAR(64) | FK → teams.id, NULLABLE | 所属团队（对应 `Agent.teamId`，初始为 null） |

**注意：** 以下字段是 **运行时状态**，不存储在 `agents` 表中，而是通过 `round_actions` 表的最新记录推导：
- `currentAction` → 从 `round_actions` 中查最新 round 的 `type`
- `actionDescription` → 从 `round_actions` 中查最新 round 的 `description`
- `pronunciatio` → 从 `round_actions` 中查最新 round 的 `pronunciatio`
- `location` → 从 `round_actions` 中查最新 round 的 `location`
- `position` → 前端根据 `phase` + `team_id` + `agent_index` 通过 `positions.ts` 计算，**不需要存数据库**

**前端对应：** `lib/agents.ts` 中 `DEFS` 数组的 50 个 agent 定义

---

### 3.3 `teams` - 团队

> **对应前端类型：** `lib/types.ts` 中的 `Team` 接口

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | VARCHAR(64) | PK | 团队标识，如 `"team_1"`（对应 `Team.id`） |
| `hackathon_id` | UUID | FK → hackathons.id, NOT NULL | 所属比赛 |
| `name` | VARCHAR(128) | NOT NULL | 团队名称（对应 `Team.name`） |
| `project_idea` | TEXT | NULLABLE | 项目创意（对应 `Team.projectIdea`） |
| `project_plan` | TEXT | NULLABLE | 项目计划（对应 `Team.projectPlan`，当前前端未使用） |
| `project_output` | TEXT | NULLABLE | 项目产出（对应 `Team.projectOutput`，当前前端未使用） |
| `tech_stack` | TEXT | NULLABLE | 技术栈（对应 `Team.techStack`，当前前端未使用） |

**前端对应：** `lib/mockRounds.ts` 中 `generateTeams()` 生成的 10 个团队

**成员关系：** 通过 `agents.team_id` 外键关联，一个 Team 有 5 个 Agent（对应 `Team.memberIds`）

---

### 3.4 `rounds` - 轮次

> **对应前端类型：** `lib/types.ts` 中的 `Round` 接口

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK | 主键 |
| `hackathon_id` | UUID | FK → hackathons.id, NOT NULL | 所属比赛 |
| `number` | INTEGER | NOT NULL | 轮次编号 1-50（对应 `Round.number`） |
| `phase` | ENUM(hackathon_phase) | NOT NULL | 阶段（对应 `Round.phase`） |
| `timestamp` | VARCHAR(16) | NOT NULL | 显示时间如 `"9:00 AM"`（对应 `Round.timestamp`） |

**UNIQUE 约束：** `(hackathon_id, number)` — 每场比赛的每个轮次唯一

**阶段与轮次的对应关系**（来自 `lib/mockRounds.ts:getPhaseForRound`）：

| 轮次范围 | 阶段 | 说明 |
|----------|------|------|
| 1-12 | `free_discussion` | 自由讨论，Agent 分散在公共区域 |
| 13-24 | `group_brainstorm` | 组队头脑风暴，Agent 按团队聚集 |
| 25-40 | `development` | 开发阶段，Agent 在各自团队区域编码 |
| 41-50 | `results` | 成果展示，Agent 聚集在中央舞台 |

---

### 3.5 `round_actions` - Agent 每轮行为

> **对应前端类型：** `lib/types.ts` 中的 `RoundAction` 接口

这是**数据量最大的表**：50 agents × 50 rounds = 2,500 行/比赛

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK | 主键 |
| `round_id` | UUID | FK → rounds.id, NOT NULL | 所属轮次 |
| `agent_id` | VARCHAR(64) | FK → agents.id, NOT NULL | 执行动作的 Agent（对应 `RoundAction.agentId`） |
| `type` | ENUM(action_type) | NOT NULL | 动作类型（对应 `RoundAction.type`） |
| `description` | TEXT | NOT NULL | 行为描述（对应 `RoundAction.description`） |
| `pronunciatio` | VARCHAR(16) | NOT NULL | Emoji 状态指示（对应 `RoundAction.pronunciatio`） |
| `chat_content` | TEXT | NULLABLE | 说话内容（对应 `RoundAction.chatContent`，仅 `speak` 时有值） |
| `location` | VARCHAR(64) | NOT NULL | 发生地点（对应 `RoundAction.location`） |

**UNIQUE 约束：** `(round_id, agent_id)` — 每个 Agent 每轮只有一个行为

**前端对应：** `lib/mockRounds.ts` 中 `generateAllRounds()` 为每个 agent 每轮生成一个 action

---

### 3.6 `action_targets` - 行为目标关联（多对多）

> **对应前端字段：** `RoundAction.targetAgentIds`（可选的 string 数组）

当 Agent 的动作涉及其他 Agent（如 `speak` 类型指向对话对象）时，记录目标关系。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `action_id` | UUID | FK → round_actions.id, NOT NULL | 动作 ID |
| `target_agent_id` | VARCHAR(64) | FK → agents.id, NOT NULL | 目标 Agent ID |

**PK：** `(action_id, target_agent_id)` 联合主键

**使用场景示例**（来自 `mockRounds.ts`）：
- `free_discussion` 阶段：Agent 随机和 1 个 Agent 聊天 → 1 条 target 记录
- `group_brainstorm` 阶段：Agent 和团队所有成员讨论 → 最多 4 条 target 记录
- `development` 阶段：Agent 和团队某个成员讨论 → 1 条 target 记录

---

### 3.7 `group_chats` - 群组对话

> **对应前端类型：** `lib/types.ts` 中的 `GroupChat` 接口

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | VARCHAR(64) | PK | 对话标识（对应 `GroupChat.id`） |
| `round_id` | UUID | FK → rounds.id, NOT NULL | 所属轮次（对应 `GroupChat.round` → 关联到具体 round） |

**注意：** 当前前端代码中 `groupChats` 始终为空数组（`mockRounds.ts:190`），但类型定义已预留。后端应实现此表以支持未来功能。

---

### 3.8 `group_chat_members` - 群组对话参与者（多对多）

> **对应前端字段：** `GroupChat.participantIds`

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `group_chat_id` | VARCHAR(64) | FK → group_chats.id, NOT NULL | 群聊 ID |
| `agent_id` | VARCHAR(64) | FK → agents.id, NOT NULL | 参与者 Agent ID |

**PK：** `(group_chat_id, agent_id)` 联合主键

---

### 3.9 `chat_messages` - 聊天消息

> **对应前端类型：** `GroupChat.messages` 数组中的对象 `{ speakerId, speakerName, content, round }`

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK | 主键 |
| `group_chat_id` | VARCHAR(64) | FK → group_chats.id, NOT NULL | 所属群聊 |
| `speaker_id` | VARCHAR(64) | FK → agents.id, NOT NULL | 说话者（对应 `speakerId`） |
| `content` | TEXT | NOT NULL | 消息内容（对应 `content`） |
| `round_number` | INTEGER | NOT NULL | 发生轮次（对应 `round`） |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW | 消息时间，用于排序 |

**说明：** 前端类型中有 `speakerName` 字段，这是冗余数据，可通过 JOIN `agents` 表获取，不需要单独存储。

---

## 4. 枚举类型定义

根据 `lib/types.ts` 第 1-3 行的类型定义：

### `agent_category`

```sql
CREATE TYPE agent_category AS ENUM (
  'tech_entrepreneur',  -- 科技企业家 (10人)
  'politician',         -- 政治家 (10人)
  'artist',             -- 艺术家 (10人)
  'historical_figure',  -- 历史人物 (10人)
  'influencer'          -- 网红 (10人)
);
```

### `hackathon_phase`

```sql
CREATE TYPE hackathon_phase AS ENUM (
  'free_discussion',    -- 自由讨论 (Rounds 1-12)
  'group_brainstorm',   -- 组队头脑风暴 (Rounds 13-24)
  'development',        -- 开发 (Rounds 25-40)
  'results'             -- 结果展示 (Rounds 41-50)
);
```

### `action_type`

```sql
CREATE TYPE action_type AS ENUM (
  'speak',    -- 说话（有 chatContent 和 targetAgentIds）
  'think',    -- 思考
  'code',     -- 编码（开发阶段）
  'move',     -- 移动
  'present',  -- 展示（结果阶段）
  'idle'      -- 空闲
);
```

### `hackathon_status`

```sql
CREATE TYPE hackathon_status AS ENUM (
  'pending',    -- 未开始
  'running',    -- 进行中
  'completed'   -- 已完成
);
```

---

## 5. 索引设计

### 高频查询场景

根据 `lib/store.ts` 中的 store actions，后端 API 需要支持的核心查询：

| 查询场景 | 对应前端代码 | SQL 模式 |
|----------|------------|---------|
| 获取某轮所有 agent 的行为 | `store.goToRound(round)` — 读取 `allRounds[clamped-1].actions` | `SELECT * FROM round_actions WHERE round_id = ?` |
| 获取某 agent 的历史行为 | `store.getAgentHistory(agentId)` — 遍历 `rounds.slice(0, currentRound)` | `SELECT * FROM round_actions WHERE agent_id = ? AND round_id IN (...) ORDER BY round.number` |
| 获取某 agent 的团队 | `store.getTeamForAgent(agentId)` — 查 `agents[agentId].teamId` | `SELECT t.* FROM teams t JOIN agents a ON a.team_id = t.id WHERE a.id = ?` |
| 获取某轮的 speak 行为（Timeline activity feed） | `Timeline.tsx` — 过滤 `actions.filter(a => a.type === 'speak')` | `SELECT * FROM round_actions WHERE round_id = ? AND type = 'speak'` |
| 获取全部 agent 列表 | `AgentList.tsx` — 读取 `store.agents` | `SELECT * FROM agents WHERE hackathon_id = ?` |

### 推荐索引

```sql
-- round_actions 表（最频繁查询的表）
CREATE INDEX idx_round_actions_round_id ON round_actions(round_id);
CREATE INDEX idx_round_actions_agent_id ON round_actions(agent_id);
CREATE INDEX idx_round_actions_type ON round_actions(round_id, type);  -- 按类型过滤

-- rounds 表
CREATE UNIQUE INDEX idx_rounds_hackathon_number ON rounds(hackathon_id, number);

-- agents 表
CREATE INDEX idx_agents_hackathon_id ON agents(hackathon_id);
CREATE INDEX idx_agents_team_id ON agents(team_id);

-- teams 表
CREATE INDEX idx_teams_hackathon_id ON teams(hackathon_id);

-- action_targets 表
CREATE INDEX idx_action_targets_target ON action_targets(target_agent_id);

-- chat_messages 表
CREATE INDEX idx_chat_messages_group ON chat_messages(group_chat_id, round_number);
```

---

## 6. 数据流与前端对应关系

### 6.1 前端 Store → 后端 API 映射

下表展示了 `lib/store.ts` 中每个 Zustand store 字段和 action 如何对应到后端 API：

| Store 字段/Action | 当前数据来源 | 后端 API 建议 | 数据库查询 |
|-------------------|-------------|--------------|-----------|
| `agents` | `createInitialAgents()` 硬编码 | `GET /api/hackathons/:id/agents` | `SELECT * FROM agents WHERE hackathon_id = :id` |
| `teams` | `generateTeams()` 随机生成 | `GET /api/hackathons/:id/teams` | `SELECT * FROM teams WHERE hackathon_id = :id` |
| `rounds` | `generateAllRounds()` 随机生成 | `GET /api/hackathons/:id/rounds` | `SELECT * FROM rounds WHERE hackathon_id = :id ORDER BY number` |
| `goToRound(n)` | 读取 `allRounds[n-1].actions` | `GET /api/hackathons/:id/rounds/:n/actions` | `SELECT ra.*, array_agg(at.target_agent_id) as targets FROM round_actions ra LEFT JOIN action_targets at ON ra.id = at.action_id WHERE ra.round_id = :roundId GROUP BY ra.id` |
| `getAgentHistory(agentId)` | 遍历 `rounds.slice(0, currentRound)` | `GET /api/hackathons/:id/agents/:agentId/history?upToRound=N` | `SELECT ra.*, r.number FROM round_actions ra JOIN rounds r ON ra.round_id = r.id WHERE ra.agent_id = :agentId AND r.number <= :N ORDER BY r.number` |
| `getTeamForAgent(agentId)` | 查 `agents[agentId].teamId` → `teams[teamId]` | `GET /api/hackathons/:id/agents/:agentId/team` | `SELECT t.* FROM teams t JOIN agents a ON a.team_id = t.id WHERE a.id = :agentId` |

### 6.2 不需要存储在数据库中的数据

以下数据由前端实时计算，**不需要持久化**：

| 数据 | 原因 | 前端计算逻辑 |
|------|------|-------------|
| `Agent.position` (x, y 坐标) | 由 `lib/positions.ts` 的 `assignPosition()` 根据 phase + teamIndex 实时计算 | 基于地图区域定义 + 随机偏移 |
| `Agent.currentAction` 等运行时状态 | 从 `round_actions` 的当前轮数据推导 | `goToRound()` 时从 actions 更新 |
| `store.isPlaying` / `store.playbackSpeed` | 纯 UI 状态 | Zustand store 本地管理 |
| `store.selectedAgentId` | 纯 UI 状态 | 用户交互驱动 |
| `store.phase` | 可由 `round.number` 推导 | `getPhaseForRound(roundNumber)` |

---

## 7. SQL 建表语句参考

以下为 PostgreSQL 风格的完整建表语句：

```sql
-- ============================================
-- 枚举类型
-- ============================================

CREATE TYPE agent_category AS ENUM (
  'tech_entrepreneur', 'politician', 'artist', 'historical_figure', 'influencer'
);

CREATE TYPE hackathon_phase AS ENUM (
  'free_discussion', 'group_brainstorm', 'development', 'results'
);

CREATE TYPE action_type AS ENUM (
  'speak', 'think', 'code', 'move', 'present', 'idle'
);

CREATE TYPE hackathon_status AS ENUM (
  'pending', 'running', 'completed'
);

-- ============================================
-- 核心表
-- ============================================

CREATE TABLE hackathons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  total_rounds  INTEGER NOT NULL DEFAULT 50,
  status        hackathon_status NOT NULL DEFAULT 'pending',
  current_round INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE teams (
  id             VARCHAR(64) NOT NULL,
  hackathon_id   UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  name           VARCHAR(128) NOT NULL,
  project_idea   TEXT,
  project_plan   TEXT,
  project_output TEXT,
  tech_stack     TEXT,
  PRIMARY KEY (id, hackathon_id)
);

CREATE TABLE agents (
  id             VARCHAR(64) NOT NULL,
  hackathon_id   UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  name           VARCHAR(128) NOT NULL,
  category       agent_category NOT NULL,
  sprite_key     VARCHAR(64) NOT NULL,
  profile_image  VARCHAR(256) NOT NULL,
  team_id        VARCHAR(64),
  PRIMARY KEY (id, hackathon_id),
  FOREIGN KEY (team_id, hackathon_id) REFERENCES teams(id, hackathon_id) ON DELETE SET NULL
);

CREATE TABLE rounds (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id  UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  number        INTEGER NOT NULL,
  phase         hackathon_phase NOT NULL,
  timestamp     VARCHAR(16) NOT NULL,
  UNIQUE (hackathon_id, number)
);

CREATE TABLE round_actions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id      UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  agent_id      VARCHAR(64) NOT NULL,
  type          action_type NOT NULL,
  description   TEXT NOT NULL,
  pronunciatio  VARCHAR(16) NOT NULL,
  chat_content  TEXT,
  location      VARCHAR(64) NOT NULL,
  UNIQUE (round_id, agent_id)
);

CREATE TABLE action_targets (
  action_id       UUID NOT NULL REFERENCES round_actions(id) ON DELETE CASCADE,
  target_agent_id VARCHAR(64) NOT NULL,
  PRIMARY KEY (action_id, target_agent_id)
);

CREATE TABLE group_chats (
  id        VARCHAR(64) PRIMARY KEY,
  round_id  UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE
);

CREATE TABLE group_chat_members (
  group_chat_id VARCHAR(64) NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  agent_id      VARCHAR(64) NOT NULL,
  PRIMARY KEY (group_chat_id, agent_id)
);

CREATE TABLE chat_messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id  VARCHAR(64) NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  speaker_id     VARCHAR(64) NOT NULL,
  content        TEXT NOT NULL,
  round_number   INTEGER NOT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- 索引
-- ============================================

CREATE INDEX idx_agents_hackathon     ON agents(hackathon_id);
CREATE INDEX idx_agents_team          ON agents(team_id, hackathon_id);
CREATE INDEX idx_teams_hackathon      ON teams(hackathon_id);
CREATE INDEX idx_rounds_hackathon     ON rounds(hackathon_id);
CREATE INDEX idx_round_actions_round  ON round_actions(round_id);
CREATE INDEX idx_round_actions_agent  ON round_actions(agent_id);
CREATE INDEX idx_round_actions_type   ON round_actions(round_id, type);
CREATE INDEX idx_action_targets_tgt   ON action_targets(target_agent_id);
CREATE INDEX idx_chat_messages_group  ON chat_messages(group_chat_id, round_number);
CREATE INDEX idx_group_chats_round    ON group_chats(round_id);
```

---

## 8. 设计决策与注意事项

### 8.1 为什么 `position` 不存数据库？

前端 `Agent.position` 是一个 `{ x: number; y: number }` 坐标，但它完全由 `lib/positions.ts` 中的 `assignPosition(agentIndex, phase, teamIndex)` 函数计算得出。这个函数基于：
- Agent 的序号
- 当前阶段（phase）
- 团队编号
- 地图上的预定义区域 + 随机偏移

**这意味着位置是前端展示逻辑，不是业务数据。** 后端只需要提供 phase 和 team 信息，前端可以自行计算位置。

### 8.2 为什么新增 `hackathons` 表？

前端当前硬编码了一场比赛（50 rounds、50 agents），但后端应该支持：
- 创建多场比赛
- 每场比赛独立的 agent 分组和 round 数据
- 比赛状态管理（pending → running → completed）

### 8.3 `round_actions` vs `group_chats` 的对话数据

当前代码中存在**两套对话机制**：

1. **`RoundAction.chatContent`** — 嵌入在行为中的简单发言（当前实际使用）
2. **`GroupChat.messages`** — 结构化的群组聊天（类型已定义但未实际使用，`groupChats` 始终为 `[]`）

建议：
- **短期**：只用 `round_actions.chat_content` 存储简单对话，这与前端当前实现一致
- **长期**：当后端真正用 AI 生成群组对话时，启用 `group_chats` + `chat_messages` 表

### 8.4 `Team.projectPlan / projectOutput / techStack` 的使用

这三个字段在前端类型中已定义但值始终为 `null`（见 `mockRounds.ts:115-117`）。数据库中保留这些列以支持未来功能：
- `project_plan`：AI 生成的项目计划（brainstorm 阶段结束时写入）
- `project_output`：项目产出描述/链接（development 阶段结束时写入）
- `tech_stack`：使用的技术栈（brainstorm 阶段决定时写入）

### 8.5 Agent ID 的设计

前端使用 `"elon_musk"` 这样的 slug 作为 Agent ID（见 `lib/agents.ts:22`）。数据库直接复用这个 slug 作为主键（VARCHAR），而不是额外生成 UUID，原因：
- 代码中大量直接引用这些 ID（如 `SNIPPETS` 对象的 key）
- Agent 数量固定（50 个），不存在 ID 冲突风险
- 便于调试和日志阅读

### 8.6 数据写入时机

后端在 AI 模拟运行时，按以下顺序写入数据：

```
1. 创建 hackathon 记录
2. 批量插入 50 个 agent 记录（team_id 暂为 null）
3. 批量插入 10 个 team 记录
4. 更新 agent 的 team_id（分配团队）
5. 逐轮模拟：
   a. 插入 round 记录
   b. 批量插入 50 条 round_actions
   c. 批量插入对应的 action_targets
   d. 如有群组对话，插入 group_chats + chat_messages
   e. 更新 hackathon.current_round
6. 模拟结束：更新 hackathon.status = 'completed'
```

### 8.7 性能估算

单场比赛的数据量：

| 表 | 行数 | 大小估算 |
|----|------|---------|
| hackathons | 1 | < 1 KB |
| agents | 50 | ~ 5 KB |
| teams | 10 | ~ 2 KB |
| rounds | 50 | ~ 3 KB |
| round_actions | 2,500 | ~ 250 KB |
| action_targets | ~1,500 (约 60% 的 action 有 target) | ~ 50 KB |
| group_chats | 0 (当前) | 0 |
| chat_messages | 0 (当前) | 0 |
| **总计** | **~4,100** | **~310 KB** |

数据量很小，单场比赛的所有数据可以一次性加载到前端 Zustand store 中，无需分页。
