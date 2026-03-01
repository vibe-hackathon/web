# Hackathon Arena - JSON 数据框架设计

## 概述

本文档定义了 Hackathon Arena 项目的完整 JSON 数据结构。前端可以直接读取 `docs/record/` 目录下的数据文件，无需后端转换。

---

## 数据源位置

```
docs/record/
├── agents.json                    # 50 个 AI Agent 的完整定义
├── round_1/
│   ├── round_summary.json         # 第 1 轮汇总数据
│   └── <group_dir>/               # 每个讨论组的详细数据
│       ├── chat.json              # 公开对话记录
│       └── debug.json             # LLM 调试日志（可选）
├── round_2/ ... round_7/          # 第 2-7 轮数据（结构同上）
└── phase_d/
    └── team_<N>/                  # 12 个最终团队
        ├── chat.json              # 开发阶段对话
        ├── debug.json             # LLM 调试日志（可选）
        └── poster.md              # 项目最终成果海报
```

---

## 核心数据结构

### 1. `agents.json` - Agent 定义

**文件路径：** `docs/record/agents.json`

**结构：** 包含 50 个 agent 的数组

```json
[
  {
    "agent_id": "A_00",
    "name": "Elon Musk",
    "category": "tech_founders",
    "persona": {
      "archetype": "First-Principles Dictator",
      "selfishness": 0.79,
      "risk_appetite": 0.93,
      "communication_style": "Blunt & Memetic",
      "collaboration_mode": "First Principles Dictator",
      "decision_speed": 0.88,
      "empathy_level": 0.25,
      "stubbornness": 0.9,
      "humor_style": "Edgy & Meme-lord",
      "uncertainty_tolerance": 0.95,
      "perfectionism": 0.7,
      "social_needs": 0.6,
      "core_values": [
        "engineering over everything",
        "multi-planetary survival"
      ],
      "skills": {
        "backend": 0.85,
        "frontend": 0.3,
        "ml_research": 0.7,
        "product_thinking": 0.8,
        "pitching": 0.85
      },
      "team_roles": {
        "pm_visionary": 5,
        "tech_lead": 4,
        "presenter": 5,
        "designer": 2,
        "coder": 3
      },
      "track_affinities": {
        "T01": 0.2,
        "T02": 0.43,
        "T03": 0.87,
        "T04": 0.82
      }
    },
    "prompt_file": "config/prompts/agents/agent_elon_musk_en.md"
  }
  // ... 49 more agents (A_01 to A_49)
]
```

**字段说明：**
- `agent_id`: Agent 唯一标识符（`A_00` 到 `A_49`）
- `name`: Agent 真实姓名
- `category`: 分类（`tech_founders`, `politicians`, `artists`, `historical_figures`, `influencers`）
- `persona`: 完整的人格特征定义
  - `skills`: 技能评分（0-1）
  - `team_roles`: 团队角色适配度（1-5）
  - `track_affinities`: 对各赛道的亲和度（0-1）

**前端映射：**
- 前端 `lib/agents.ts` 中的 50 个 agent 需要根据 `agent_id` 映射到对应的 `name` 和 `category`
- `spriteKey` 和 `profileImage` 由前端根据 agent 顺序分配（保持现有逻辑）

---

### 2. `round_N/round_summary.json` - 轮次汇总

**文件路径：** `docs/record/round_1/round_summary.json` 到 `round_7/round_summary.json`

**结构：**

```json
{
  "timestamp": "2026-03-01T04:58:33.043112+00:00",
  "round": 1,
  "groups": [
    ["A_15", "A_44", "A_35", "A_31"],
    ["A_00", "A_19", "A_22", "A_38"],
    // ... 更多组（round 1-3 有 13 组，round 4-5 有 12 组，round 6-7 有 9 组）
    ["A_32", "A_42"]  // 最后一组可能只有 2 人
  ],
  "decisions": {
    "A_15": {
      "want_to_work_with": {
        "A_44": false,
        "A_35": false,
        "A_31": true
      }
    }
    // ... 每个 agent 对组内其他成员的合作意愿
  },
  "agent_summaries": {
    "A_00": {
      "name": "Elon Musk",
      "idea": "GreenGridAI (T01): AI + 去中心化能源管理... — Role: tech_lead",
      "round_memory": "\n[Round 1 Summary]\n我的想法：...\n立场：...\n印象：...\n想合作的人：...",
      "want_to_work_with": {
        "A_19": false,
        "A_22": false,
        "A_38": true
      },
      "status": "LONE_WOLF" | "PARTIAL_TEAM" | "LOCKED_TEAM"
    }
    // ... 所有 50 个 agent 的汇总
  },
  "partial_teams": [
    ["A_04", "A_08"],
    ["A_09", "A_41", "A_12", "A_30"],
    // ... 部分形成的团队（2-4 人）
  ],
  "agent_status": {
    "A_00": "LOCKED_TEAM",
    "A_01": "PARTIAL_TEAM",
    "A_02": "LONE_WOLF"
    // ... 所有 agent 的状态
  }
}
```

**字段说明：**
- `round`: 轮次编号（1-7）
- `groups`: 本轮的讨论分组（每组 2-4 人）
- `decisions`: 每个 agent 对组内成员的合作意愿（true/false）
- `agent_summaries`: 每个 agent 的当前状态
  - `idea`: 当前项目想法（格式：`项目名 (赛道): 描述 — Role: 角色`）
  - `round_memory`: 累积的轮次记忆（包含历史轮次的总结）
  - `status`: 组队状态
    - `LONE_WOLF`: 独狼（未找到队友）
    - `PARTIAL_TEAM`: 部分团队（2-3 人）
    - `LOCKED_TEAM`: 锁定团队（4 人，确定进入 Phase D）
- `partial_teams`: 当前形成的部分团队列表
- `agent_status`: 所有 agent 的状态快照

**轮次演变：**
- Round 1-3: 13 组，大部分 agent 状态为 `LONE_WOLF`
- Round 4-5: 12 组，开始出现 `PARTIAL_TEAM`
- Round 6-7: 9 组，大量 `LOCKED_TEAM` 出现，最终形成 12 个 4 人团队

---

### 3. `round_N/<group_dir>/chat.json` - 讨论组对话

**文件路径：** `docs/record/round_1/A00__A19__A22__A38/chat.json`

**目录命名规则：** 组内 agent ID 按字母序排列，用 `__` 连接（如 `A00__A19__A22__A38`）

**结构：** 包含 20 条消息的数组（每组固定 20 条）

```json
[
  {
    "timestamp": "2026-03-01T04:57:32.059265+00:00",
    "turn": 1,
    "phase": "idea_gen",
    "sub_turn": null,
    "agent_id": "A_00",
    "agent_name": "Elon Musk",
    "utterance": "{\"utterance\": \"...\", \"title\": \"GreenGridAI\", \"track\": \"T01\", \"core_insight\": \"...\", \"your_role\": \"tech_lead\"}",
    "group_members": ["A_00", "A_19", "A_22", "A_38"]
  },
  // Turn 1-4: idea_gen (每人提出想法)
  // Turn 5-16: discussion (3 轮讨论，每轮 4 人，sub_turn 1-3)
  // Turn 17-20: summary (每人总结)
]
```

**字段说明：**
- `turn`: 发言序号（1-20）
- `phase`: 对话阶段
  - `idea_gen`: 想法生成（Turn 1-4）
  - `discussion`: 讨论（Turn 5-16，分 3 个 sub_turn）
  - `summary`: 总结（Turn 17-20）
- `sub_turn`: 讨论子轮次（`idea_gen` 和 `summary` 为 `null`，`discussion` 为 1-3）
- `utterance`: JSON 字符串，内容根据 phase 不同：
  - `idea_gen`: `{utterance, title, track, core_insight, your_role}`
  - `discussion`: `{utterance, private_notes}`
  - `summary`: `{my_idea, other_ideas[{agent_id, idea, my_impression, reason}], key_disagreements[], my_stance_update, want_to_work_with{}}`
- `group_members`: 本组所有成员的 agent_id 列表

**前端展示建议：**
- 每轮 20 条消息可以按 phase 分段展示
- `utterance` 需要 JSON.parse() 后再提取具体字段
- `discussion` 阶段的 3 个 sub_turn 可以折叠显示

---

### 4. `phase_d/team_N/chat.json` - 开发阶段对话

**文件路径：** `docs/record/phase_d/team_1/chat.json` 到 `team_12/chat.json`

**结构：** 包含 24 条消息的数组（每队固定 24 条）

```json
[
  {
    "timestamp": "2026-03-01T05:04:22.618600+00:00",
    "turn": 1,
    "phase": "D",
    "sub_turn": "1a",
    "agent_id": "A_09",
    "agent_name": "A_09",
    "utterance": "{\"utterance\": \"...\", \"proposal\": \"# 项目名\\n> 标语\\n...\", \"judge_intel\": {\"J_01\": \"...\"}, \"private_notes\": \"...\"}",
    "session_history": "",
    "group_members": ["A_09", "A_41", "A_12", "A_30"]
  },
  // Turn 1-4: sub_turn 1a (每人提出项目提案)
  // Turn 5-8: sub_turn 1b (讨论和优化)
  // Turn 9-12: sub_turn 2a (细化技术方案)
  // Turn 13-16: sub_turn 2b (分工和实现)
  // Turn 17-20: sub_turn 3a (准备最终海报)
  // Turn 21-24: sub_turn 3b (最终确认和提交)
]
```

**字段说明：**
- `phase`: 固定为 `"D"`（Development）
- `sub_turn`: 开发子阶段（`"1a"`, `"1b"`, `"2a"`, `"2b"`, `"3a"`, `"3b"`）
  - `1a/1b`: 项目提案和讨论
  - `2a/2b`: 技术方案细化
  - `3a/3b`: 最终海报准备
- `utterance`: JSON 字符串，内容根据 sub_turn 不同：
  - `1a-2b`: `{utterance, proposal, judge_intel, private_notes}`
  - `3a-3b`: `{utterance, poster}` (poster 是最终的 Markdown 海报内容)
- `session_history`: 累积的对话历史（纯文本）
- `group_members`: 团队成员列表（固定 4 人）

**Phase D 团队列表：**

| Team | Members | 项目名称 | 赛道 |
|------|---------|---------|------|
| team_1 | A_09, A_41, A_12, A_30 | Eyes of the Future | T01 |
| team_2 | A_38, A_00, A_44, A_34 | GreenGridAI | T01 |
| team_3 | A_25, A_03, A_05, A_01 | Echoes of Silence | T01 |
| team_4 | A_24, A_47, A_37, A_14 | EcoHabits | T01 |
| team_5 | A_28, A_23, A_26, A_17 | Eternal Echoes | T03 |
| team_6 | A_15, A_31, A_04, A_40 | EyesOnYou | T01 |
| team_7 | A_45, A_21, A_06, A_20 | Ephemeral Echoes | T01 |
| team_8 | A_19, A_35, A_33, A_11 | Global Wireless Power Grid | T01 |
| team_9 | A_18, A_10, A_32, A_39 | MicroFinanceChain | T01 |
| team_10 | A_07, A_42, A_22, A_48 | HapticMapGen | T01 |
| team_11 | A_08, A_36, A_13, A_27 | NeuroBridge | T01 |
| team_12 | A_02, A_43, A_16, A_46 | EcoConnect | T01 |

**淘汰的 Agent：**
- `A_29` (Takashi Murakami)
- `A_49` (PewDiePie)

---

### 5. `phase_d/team_N/poster.md` - 项目海报

**文件路径：** `docs/record/phase_d/team_1/poster.md` 到 `team_12/poster.md`

**格式：** Markdown 文件

```markdown
# Eyes of the Future
> Combining real-time object recognition with job search, housing assistance, and mental health support.

**Track:** T01

## Problem
Millions of visually impaired individuals face daily challenges...

## Solution
Eyes of the Future leverages real-time object recognition...

## Tech Stack
- TensorFlow for real-time object recognition
- Flask for backend API
- React for frontend UI
- AWS S3 for storage
- PostgreSQL for database

## Team
- A_09: Tech Lead, responsible for the data pipeline and backend
- A_41: UX/UI Designer, responsible for the frontend and user experience
- A_12: Product Manager, responsible for the overall project management
- A_30: Data Scientist, responsible for data processing and model training

## Key Features
1. Real-time object recognition for the visually impaired
2. Job search functionality
3. Housing assistance
4. Mental health support

## Demo Pitch
Eyes of the Future is a comprehensive platform...
```

**前端展示建议：**
- 直接渲染 Markdown 内容
- 提取 `Track` 字段用于分类展示
- 提取 `Team` 部分的 agent_id 用于关联 agent 头像和信息

---

## 赛道定义

根据 `agents.json` 中的 `track_affinities` 字段，项目有 4 个赛道：

| 赛道 ID | 名称（推测） | 描述 |
|---------|-------------|------|
| T01 | Social Impact | 社会影响类项目（教育、医疗、无障碍等） |
| T02 | Creative Tech | 创意科技类项目（艺术、设计、媒体等） |
| T03 | Infrastructure | 基础设施类项目（AI、数据、系统等） |
| T04 | Consumer | 消费者类项目（娱乐、社交、商业等） |

**注意：** 赛道的具体名称和描述需要从其他配置文件中获取（如 `config/tracks.json`），此处为根据 agent 亲和度推测。

---

## 前端数据加载流程

### 方案 A：直接读取原始数据（推荐）

```typescript
// 1. 加载 agents
import agentsData from '@/docs/record/agents.json';

// 2. 加载某一轮的汇总
import round1Summary from '@/docs/record/round_1/round_summary.json';

// 3. 加载某个讨论组的对话
import round1Group1Chat from '@/docs/record/round_1/A00__A19__A22__A38/chat.json';

// 4. 加载 Phase D 某个团队的数据
import team1Chat from '@/docs/record/phase_d/team_1/chat.json';
import team1Poster from '@/docs/record/phase_d/team_1/poster.md?raw';
```

### 方案 B：动态加载（适合大数据量）

```typescript
// 使用 fetch 或 axios 动态加载
const loadRoundSummary = async (round: number) => {
  const response = await fetch(`/docs/record/round_${round}/round_summary.json`);
  return response.json();
};

const loadGroupChat = async (round: number, groupDir: string) => {
  const response = await fetch(`/docs/record/round_${round}/${groupDir}/chat.json`);
  return response.json();
};
```

---

## 前端类型映射

### 当前前端类型 → 数据源映射

| 前端类型 | 数据源 | 映射说明 |
|---------|--------|---------|
| `Agent` | `agents.json` + `round_summary.json` | 静态信息来自 `agents.json`，动态状态（`currentAction`, `teamId`）来自 `round_summary.agent_summaries` |
| `Team` | `phase_d/team_N/` | `memberIds` 来自 `chat.json[0].group_members`，`projectIdea` 来自 `poster.md` |
| `Round` | `round_N/round_summary.json` | `number` = round，`phase` = "discussion"，`timestamp` 需要根据 round 计算 |
| `RoundAction` | `round_N/<group>/chat.json` | 每条 chat 消息映射为一个 action，`type` = "speak"，`description` = utterance 内容 |
| `GroupChat` | `round_N/<group>/chat.json` | `id` = group_dir，`participantIds` = group_members，`messages` = 所有 chat 条目 |

### 需要调整的前端逻辑

1. **轮次数量**：从 50 轮改为 7 轮讨论 + Phase D
2. **阶段定义**：
   - Round 1-7: `"discussion"` 阶段
   - Phase D: `"development"` 阶段
   - Phase E（待添加）: `"results"` 阶段
3. **Agent 位置计算**：根据 agent 的 `status` 和 `teamId` 计算位置
   - `LONE_WOLF`: 分散在公共区域
   - `PARTIAL_TEAM`: 聚集在临时区域
   - `LOCKED_TEAM`: 聚集在团队区域
4. **时间戳**：使用数据中的真实 `timestamp` 字段，而非计算生成

---

## Phase E 评审阶段（预留）

Phase E 将包含 5 个评委对 12 个团队的评审数据。数据结构待用户提供后补充。

**预期结构：**

```
docs/record/phase_e/
├── judges.json              # 5 个评委的定义
├── evaluations.json         # 评审结果
└── final_rankings.json      # 最终排名
```

---

## 数据统计

| 数据类型 | 数量 | 说明 |
|---------|------|------|
| Agents | 50 | 包含 2 个被淘汰的 agent |
| Discussion Rounds | 7 | Round 1-7 |
| Groups per Round | 9-13 | Round 1-3: 13 组，Round 4-5: 12 组，Round 6-7: 9 组 |
| Messages per Group | 20 | 固定 20 条（idea_gen 4 + discussion 12 + summary 4） |
| Final Teams | 12 | Phase D 的 12 个团队 |
| Messages per Team | 24 | Phase D 固定 24 条（6 个 sub_turn × 4 人） |
| Eliminated Agents | 2 | A_29 (Takashi Murakami), A_49 (PewDiePie) |

---

## 注意事项

1. **Agent ID 格式**：数据中使用 `A_00` 到 `A_49` 格式，前端需要保持一致或建立映射表
2. **Utterance 解析**：所有 `utterance` 字段都是 JSON 字符串，需要 `JSON.parse()` 后使用
3. **Debug 文件**：`debug.json` 包含完整的 LLM prompt 和 response，仅用于调试，前端可忽略
4. **Timestamp 格式**：所有时间戳为 ISO 8601 格式（`2026-03-01T05:04:22.618600+00:00`）
5. **Markdown 渲染**：`poster.md` 和 `proposal` 字段中的 Markdown 需要前端渲染器支持
6. **数据完整性**：所有 50 个 agent 在 `round_summary.json` 的 `agent_summaries` 中都有记录，即使未参与当轮讨论

---

## 后端 API 设计建议（可选）

如果后端需要提供 API 而非直接读取文件，建议的端点：

```
GET /api/agents                          # 获取所有 agent 定义
GET /api/rounds                          # 获取所有轮次汇总
GET /api/rounds/:round                   # 获取指定轮次汇总
GET /api/rounds/:round/groups/:group     # 获取指定讨论组的对话
GET /api/phase_d/teams                   # 获取所有团队列表
GET /api/phase_d/teams/:team             # 获取指定团队的对话和海报
GET /api/tracks                          # 获取赛道定义
```

但根据当前需求，**前端直接读取 JSON 文件即可，无需后端 API**。
