# AI-Native Repository Standard 2.0 (AI 原生仓库标准 2.0)

[English](repository-standard.md)

## 面向 AI 智能体 (Coding Agents) 的仓库设计规范

> 关于这些规则背后的设计哲学与深层考量，请参阅 [Philosophy](philosophy.zh-CN.md)
> ([English](philosophy.md) · [日本語](philosophy.ja.md))。

---

## 规范术语约定 (RFC 2119)
本规范中的关键词 **必须 (MUST)**、**禁止 (MUST NOT)**、**强制要求 (REQUIRED)**、**应当 (SHOULD)**、**建议 (RECOMMENDED)** 和 **可以 (MAY)** 依照 [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt) 进行解释。
- **规范性条款 (Normative Rules)**：硬性规定，由测试与验证器强制执行。
- **推荐启发式 (Recommended Heuristics)**：基于认知预算与工程经验的最佳实践。
- **资料性阐述 (Informative Rationale)**：背景原理与设计原因（详见 Philosophy）。

---

# 0. 走向 AI-Native (AI 原生)

本标准将代码仓库从被动的“供 AI 阅读的书”升级为主动的“供 AI 工作的车间”。

我们定义了与传统软件架构（MVVM、Clean、DDD 等）并列的 **8 大 AI-Native 架构支柱**：

1. **Context (认知层)** (Project Map, Domains, Architecture) - *系统是什么。*
2. **Rules (规则层)** (AGENTS.md, Cursor Rules) - *Agent 必须/禁止做什么。*
3. **Contracts (契约层)** (Protocols, Schemas) - *组件之间如何协作。*
4. **Skills (技能层)** (SKILL.md) - *如何执行特定的原子任务。*
5. **Workflows (工作流层)** (SOPs) - *如何编排复杂的开发流程。*
6. **Tools (工具层)** (MCP, CLI, Scripts) - *Agent 如何操作物理世界。*
7. **Verification (验证层)** (Tests, Validators, Hooks) - *如何证明 Agent 做对了。*
8. **Human / Agent Boundary (边界层)** (MANUAL_TASKS.md) - *哪些决定必须由人类做出。*

---

# I. 上下文管理 (Context Management)

## 规则 01 (规范性) — 全局路由器最小预算
全局路由器 (`AGENTS.md`) **必须** 严格作为目录指针与路由层，**禁止** 嵌入深层业务实现、完整数据表定义或大篇幅架构文档。
- 为防止指令膨胀并保护注意力，全局路由器 **必须** 遵循 ANR 的工程设计预算：**<= 2048 bytes (2 KiB)**。
- 任务特定的上下文 **必须** 采用按需加载，禁止无条件注入常驻 Prompt。

## 规则 02 (启发式) — 渐进式呈现 (Progressive Disclosure)
上下文获取 **应当** 遵循渐进式路线，而非一次性全量注入：
`Task (任务)` → `Project Map (地图)` → `Domain / Contract (领域/契约)` → `Implementation / Test (实现/验证)`

---

# II. 标准跨工具，实例单工具 (Standardize Semantics, Isolate Runtimes)

## 规则 03 (规范性) — 三层架构分离：模型提供商 × 智能体运行时 × 仓库标准
ANR 正式确立三层解耦架构：
1. **模型 / 模型提供商 (Model Provider)**（如 OpenAI、Anthropic、Google、DeepSeek、Qwen、Meta 等）：底层的推理引擎。模型版本号 **禁止** 硬编码进目录路径或模板分类中。
2. **智能体运行时 (Agent Runtime)**（如 Claude Code、Codex、Gemini CLI、Cursor）：定义 *如何* 读取文件、*何时* 加载技能、*怎样* 执行拦截钩子。
3. **仓库标准 (Repository Standard)**（规范语义意图）：定义项目架构设计与业务语义。

**模型提供商 ≠ 智能体运行时，绝对禁止合并为一个维度。**
一个 Runtime 并不归属于单个 Model Provider；Provider 矩阵统一维护在 [Model Compatibility Matrix（模型兼容性矩阵）](model-compatibility.md) 中，绝不能成为独立模板目录。

## 规则 04 (规范性) — 规范语义意图的单一源头
项目的设计意图与业务语义 **必须** 保存在 `docs/` 与 `.agents/` 中。运行时适配器（`CLAUDE.md`、`.cursor/rules/core.mdc`、`GEMINI.md`）**必须** 作为轻量包装入口，将 Agent 干净地路由到规范语义层，禁止在各工具间冗余复制相同的业务规则。

## 规则 05 (规范性) — 规范化技能 (Agent Skills 开放标准)
所有通用与可复用技能 **必须** 规范存放于 `.agents/skills/<name>/SKILL.md`，并严格遵守 Agent Skills 开放标准：
- 目录名 **必须** 与 `SKILL.md` frontmatter 中的 `name` 严格一致（小写字母、数字及中划线，<= 64 字符）。
- Frontmatter **必须** 包含非空的 `description`（<= 1024 字符），描述调起时机与使用场景。
- 原生支持 `.agents/skills` 的运行时（Codex、Cursor、Gemini CLI）直接读取；仅认自身目录的运行时（Claude Code）通过符号链接（`.claude/skills`）进行跨工具共享，杜绝副本漂移。

---

# III. 人机边界 (Human-Agent Boundary)

## 规则 06 (规范性) — 克隆不等于信任 (Clone ≠ Trust)
Agent 脚本、Hooks（如 PreToolUse）和工具配置可提交至 Git。但 **Clone 代码绝不意味着授予本地环境信任。** 任何可执行本地代码或变更环境的自动化工具，在调起前 **必须** 具备显式的人类授权机制。

## 规则 07 (规范性) — 显式的权限边界 (`MANUAL_TASKS.md`)
每个 AI-Native 仓库 **必须** 在 `MANUAL_TASKS.md` 中划分确切的权限边界：
- **[Autonomous (自主执行)]**：无需询问（如编写源码、执行测试、格式化）。
- **[Approval Required (需审批)]**：高风险操作（如生产数据库迁移、调整核心依赖）。
- **[Manual Only (仅限人类)]**：仅限人类手动执行（如注入生产密钥、更新生产 DNS、真机硬件联调）。

---

# IV. 认知结构 (Cognitive Structure)

## 规则 08 (启发式) — 项目全局地图 (Project Map)
项目根目录 `docs/` 下 **应当** 维护紧凑的全局地图（`PROJECT_MAP.md`），行数建议控制在 **~100 行** 以内。

## 规则 09 (规范性) — 接口先于实现 (Interfaces Before Implementations)
公共边界与跨模块调用 **必须** 优先定义接口（协议、抽象类型、契约），详尽说明职责、输入输出与副作用。

## 规则 10 (规范性) — 显式记录业务不变量 (Invariants)
不可破坏的核心业务不变量 **必须** 显式记录于 `docs/invariants/` 并由自动化测试覆盖。

---

# V. 闭环验证 (Verification & Quality)

## 规则 11 (规范性) — 闭环确定性验证
Agent 的工作在代码生成后并未完成。仓库 **必须** 提供确定性验证工具（如测试套件、类型检查、代码规范、新鲜度脚本）。Agent **必须** 自主执行验证，并在确认退出码为 `0` 后才能交付任务。

## 规则 12 (启发式) — 显式结构优于过度抽象
AI-Native 架构提倡清晰直观的物理与逻辑边界，避免过深的不必要抽象层与代理层。源文件 **应当** 保持聚焦（建议 < 500 行），降低 AI 认知负担。
