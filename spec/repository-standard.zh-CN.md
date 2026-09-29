# AI-Native Repository Standard 2.0 (AI 原生仓库标准 2.0)

[English](repository-standard.md)

## 面向 AI 智能体 (Coding Agents) 的仓库设计规范

> 关于这些规则背后的设计哲学，请参阅 [Philosophy](philosophy.zh-CN.md)
> ([English](philosophy.md) · [日本語](philosophy.ja.md)).

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

# I. Context Must Be Earned (上下文必须按需获取)

## 规则 01 — 严防上下文膨胀 (Context Bloat)
不要在每次任务中都把所有的领域知识、规则和技能一股脑塞给 Agent。全局路由器 (`AGENTS.md`) 必须保持极简（< 2KB）。具体的上下文（例如数据库 Schema 或功能开发 Skill）必须**仅在特定任务需要时才加载**。

## 规则 02 — 渐进式呈现是路由策略，而非固定阅读顺序 (Progressive Disclosure)
Agent 应根据任务动态路由到必要的上下文：
`Task (任务)` → `Project Map (地图)` → `Domain / Contract (领域/契约)` → `Implementation / Test (实现/验证)`

---

# II. Standardize Concepts, Isolate Runtimes (标准跨工具，实例单工具)

## 规则 03 — Semantic-Agnostic, Runtime-Aware, Model-Tunable (语义与模型解耦，运行时感知，模型可调)
整个 AI 编码产业必须被拆分为三个独立维度：
1. **Model / Model Provider (模型 / 模型提供商)**（如 OpenAI、Anthropic、Google、DeepSeek、Qwen、Meta、Moonshot、Zhipu、MiniMax）：决定底层推理引擎所属的提供商或模型家族。这里绝不要写死具体的模型版本号——提供商和模型家族的更替远比具体版本号缓慢。
2. **Agent Runtime (智能体运行时)**（如 Claude Code、Codex、Gemini CLI、Cursor、Qwen Code、DeepSeek Harness）：决定*如何*读取文件、*何时*加载技能、*怎样*执行拦截钩子。
3. **Repository Standard (仓库标准)**（即语义）：定义你的项目*是什么*。

你仓库里的语义规范（领域知识、契约、工作流）必须是 **Model-Agnostic (与模型无关的)**。然而，因为不同的运行时（Runtime）期望不同的配置结构（`.claude/`, `.cursor/rules/`, `.agents/skills/`），你的项目工程结构必须是 **Runtime-Aware (运行时感知的)**。可选地，极小一部分 prompt / skill 措辞可以是 **Model-Tunable (模型可调的)**——针对特定模型的上下文窗口或指令风格做微调——但这类调整绝不能渗透进 Repository Standard 的核心语义。

**Model Provider ≠ Agent Runtime，切勿把它们合并成一个维度。** 一个 Runtime 并不专属于某一个 Model Provider（Cursor 和 Claude Code 都可以由 Anthropic、OpenAI 或 DeepSeek 等兼容 API 的模型驱动）；反过来，同一个提供商的模型也可能出现在多个 Runtime 里（Qwen Code 原生运行 Qwen，但也支持将 DeepSeek、OpenAI、Anthropic 配置为第三方 provider）。正因如此，**Model Provider 绝不能成为 Template 的一个维度**（不存在 `templates/deepseek/` 或 `templates/qwen/`），它被单独记录在 [Model Compatibility Matrix（模型兼容性矩阵）](model-compatibility.md) 中。

**建立明确的 Runtime 所有权，避免规则漂移。**
一个生产项目可以同时使用多个 Agent Runtime（例如开发者用 Cursor，CI 用 Claude Code），但你必须明确划分所有权。业务逻辑（`docs/domains`）是通用的，你绝不能在 `.cursor/rules/` 和 `.claude/skills` 中重复维护相同的业务规则。每个工具的 Runtime Adapter 都必须干净地将 Agent 引导回唯一的语义真理。

技能与护栏同理：规范技能只在 `.agents/skills/<name>/SKILL.md` 维护一份。原生读取 `.agents/skills/` 的运行时（Codex、Cursor、Gemini CLI）无需任何额外配置；只认自己目录的运行时（Claude Code 的 `.claude/skills`）拿到的是**符号链接**而不是副本。护栏逻辑写在与运行时无关的脚本里，适配器只负责挂接触发方式（原生的编辑前钩子，外加 shell 改动也绕不过去的 CI 步骤）。详见 [Runtime Adapters](adapters.md)。

---

# III. The Human-Agent Boundary (人机边界)

## 规则 04 — Clone ≠ Trust (克隆不等于信任)
Agent 的自动化脚本、生命周期钩子（如 `PreToolUse`）和 MCP 服务器配置可以被 Git 版本控制以保证环境可复现。但是，**Clone 代码并不意味着授予信任。** 任何能够执行代码或修改物理环境的自动化钩子和工具，在被 Agent 调用前，必须经过人类的明确授权。

## 规则 05 — 显式的权限边界 (`MANUAL_TASKS.md`)
每个 AI-Native 仓库必须明确定义 AI 允许自主执行的边界和人类介入的边界：
- **[Autonomous (自主执行)]**：例如写代码、跑单测、格式化。
- **[Approval Required (需审批)]**：例如生产库迁移、推送到主分支。
- **[Manual Only (仅限人类)]**：例如注入生产密钥、更新 DNS 记录、真机物理调试。

---

# IV. 认知结构 (Cognitive Structure)

## 规则 06 — 项目地图 (Project Map)
必须存在一个紧凑的（< 100 行）全局地图（如 `docs/PROJECT_MAP.md`），让 AI 快速建立大局观，知道核心组件的位置。

## 规则 07 — 接口先于实现 (Interfaces Before Implementations)
业务能力必须优先定义接口（Protocols, abstract classes）。接口必须详尽说明职责、输入输出、错误处理和副作用。

## 规则 08 — 业务不变量 (Invariants)
绝对不能被破坏的业务规则（例如“断网必须降级”或“高危操作必须二次确认”）必须被显式文档化（如 `docs/invariants/`），而不能仅仅隐藏在代码逻辑中。

---

# V. 验证闭环 (Verification)

## 规则 09 — 必须进行闭环验证
AI Agent 写完代码并不意味着任务结束。仓库必须提供确定性的验证工具（例如 `scripts/validate.sh`、Linters、类型检查器、测试套件）。Agent 必须主动运行这些工具，并在确认返回 `exit code 0` 后才能结束任务。

---

# VI. 显式结构，拒绝过度抽象

AI-Native 不等于重度抽象。保持架构边界清晰、源文件体积小（建议 < 500 行）、符号命名具有明确业务意义。目标是为 AI 创造极小的认知边界。
