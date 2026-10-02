# AI-Native Repository Standard & Reference Implementation (AI-Native 仓库标准与参考实现)

[🇺🇸 English](README.md) | [🇨🇳 简体中文](README.zh-CN.md) | [🇹🇼 繁體中文](README.zh-TW.md) | [🇯🇵 日本語](README.ja.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇩🇪 Deutsch](README.de.md) | [🇷🇺 Русский](README.ru.md) | [🇺🇦 Українська](README.uk.md) | [🇧🇷 Português](README.pt-BR.md) | [🇰🇷 한국어](README.ko.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇸🇦 العربية](README.ar.md)

> **“厂商在解决‘AI 怎么进入 Repo’，ANR 解决的是‘Repo 本身应该怎样被设计成适合 AI 长期工作的工程资产’。”**

一套跨 Agent 的工程规范、参考架构与生命周期治理平台，用于组织、验证和长期维护对 AI 友好的软件仓库。

---

## 🤔 你需要 ANR 吗？（两种路径选择）

**你并不必须安装 ANR 才能构建对 AI 友好的仓库。**  
现代 Agent 运行时（Claude Code、OpenAI Codex、Cursor、Gemini CLI、Copilot）已经原生提供了 instructions、rules、hooks 与 skills 机制。ANR 的核心思想在于将**运行时能力（Runtime Capabilities，各家怎么读指令与调工具）**与**仓库语义架构及治理（Repository Context Architecture & Governance，代码库资产怎么组织）**严格解耦。

### 路径 A：零工具手工极简方案 (Minimum Manual Setup — 适合个人与小型原型)
如果你只有一个轻量仓库或个人项目，完全不需要安装任何额外 CLI，只需遵循本标准的核心设计原则：
1. **全局路由极轻量**：在根目录放置一个遵循预算 `<= 2048 bytes (2 KiB)` 的 `AGENTS.md`（或 `CLAUDE.md` / `GEMINI.md`），充当空中交通管制员，只做路由，绝不把整个项目百科塞进提示词内存。
2. **任务工作流模块化**：可复用的专项操作写成开放标准的 [Agent Skills](https://agentskills.io) 放入 `.agents/skills/<skill-name>/SKILL.md`。
3. **领域与契约结构化**：将业务架构与模块划分放入 `docs/domains/`，接口与数据表契约放入 `docs/contracts/`。
4. **上下文渐进式展开**：让 Agent 仅在执行对应任务时按需读取相关路径。
5. **确定性验收**：定义严谨的构建与测试命令，宣称完成前必须实测通过。
6. **可执行的人类边界**：核心敏感配置或生产发布脚本通过 hook 或 CI 阻断非授权篡改。

---

### 路径 B：标准化生命周期方案 (ANR Standard & CLI — 适合团队与多 Agent 协作)
当你面临以下场景时，ANR 提供经过工程验证的标准范式与自动化生命周期保障：
- **跨 Agent 协同与无缝迁移**：团队成员同时使用 Cursor、Claude Code、Codex 或 Gemini CLI，需要一套单一真实的语义资产与适配器映射，避免为每个工具重复手写一套规则。
- **多仓库资产治理**：跨数十个微服务或库统一代码库规范、契约结构与人机权限边界，降低组织协作摩擦。
- **Day 2 演进与维护**：通过 `anr update` 实现所有权感知的无损升级与 JSON 配置深度合并，通过 `anr doctor` 持续诊断死链与技能合规性，通过 `scripts/guard-paths.sh` 杜绝规则漂移。

---

## 🚀 快速开始：CLI 脚手架

你不再需要手动复制文件了。我们提供了一个强大的命令行工具（CLI），可以根据你偏好的 Agent Runtime（智能体运行时）和项目复杂度，瞬间搭建出一个完整的 AI-Native 工作区。

**在任何空目录中运行以下命令：**

```bash
npx ai-native-repo init .
```

### 12 套模板矩阵
CLI 会以交互的方式让你从我们的 12 套模板矩阵（4 种运行时 × 3 种复杂度层级）中进行选择：

**第一步：选择你的 Agent Runtime**
- `claude-code`: 纯正的 Anthropic 生态环境，包含特有的 hooks 和 skills。
- `codex`: 纯正的 OpenAI/Codex 智能体结构。
- `cursor`: 专为 Cursor 的 `.cursor/rules/*.mdc` 全局匹配机制优化的环境。
- `gemini-cli`: 纯正的 Google Gemini 环境。

**第二步：选择复杂度层级 (Tier)**
- `light`: 最基础的上下文文件（PROJECT_MAP + 核心规则），适合简单的脚本或原型。
- `standard`: 默认选项。包含完整的上下文、契约和规则架构，适合生产级服务。
- `full`: 高成熟度确定性护栏。在 standard 基础上增加路径护栏（只读 / 只追加文件，由钩子或 CI 强制执行）与上下文新鲜度检查脚本。

*或者，你也可以通过参数直接一键生成：*
```bash
npx ai-native-repo init . --runtime cursor --tier standard
npx ai-native-repo init . --runtime claude-code --tier full --lang zh-CN   # en (default) | zh-CN | ja
```

---

## 🎯 核心设计哲学：双重“渐进式”架构 (The Dual Progressive Architecture)

市面上大多数 AI Prompt 模板在复杂项目中迅速失效，根源在于两大痛点：**一次性塞入过多规则导致模型注意力崩溃（Context Bloat）**，以及**门槛过高导致已有老项目无法落地**。本标准通过两层渐进式设计彻底解决这两个问题：

### 1. 上下文渐进式披露 (Progressive Context Disclosure) —— 保护 AI 注意力
> **Context Must Be Earned（上下文必须按需获取）。**

不要给 AI 塞入几万字的超级大文档。全局入口（`AGENTS.md`）遵循设计预算控制在 **<= 2048 bytes (2 KiB)**，充当极简的“空中交通管制员（Traffic Controller）”。AI 根据任务按需逐层展开上下文，绝不一次性全量加载：

* **L0: Agent Rules (<= 2048 bytes)** → AI 怎么工作？（行为红线与全局路由）
* **L1: Project Map (~100行)** → 项目是什么？核心组件在哪里？（物理地图）
* **L2: Architecture / Domain** → 这个具体业务领域在解决什么问题？
* **L3: Interface / Contract** → 组件之间如何定义边界与协议？
* **L4: Invariants / Tests** → 什么规则绝对不能破坏？如何进行闭环验证？
* **L5: Implementation** → 具体业务代码实现

**每次任务仅按需获取当前层级上下文**，既有效控制 Token 开销，又显著减少不相关上下文对大模型注意力造成的干扰与歧义。

### 2. 仓库渐进式采纳 (Progressive Repository Adoption) —— 存量老项目低摩擦落地
> **无需推倒重来，任何已写好的老项目都能渐进式接入 ANR 标准。**

你完全不需要在一夜之间为整个老仓库补齐所有架构文档。通过本标准的 **Tier 阶梯复杂度模型**，已有项目可以自然生长：

* **Day 1（Tier 1: Light）极简接入**：无需重构任何代码。生成 <= 2048-byte 预算的极简路由，让 AI 扫描现有目录自动生成真实的 `PROJECT_MAP.md`，并在 `MANUAL_TASKS.md` 划定显式人机协作边界，让 AI 拥有清晰的项目全局地图。
* **Day 30（Tier 2: Standard）按需沉淀**：不为写文档而写文档。仅当 AI 正在修改某具体业务模块时，顺手沉淀出对应的 `domains/*.md`，并接入 `verify` 自动化测试闭环。
* **Day 90（Tier 3: Full）成熟护栏**：团队完全建立信任后，配置只读/只追加路径拦截（Guardrails）、原生编辑前钩子与云端 CI 新鲜度检查。


---

## ⚠️ 语义不可知，运行时感知，模型可调 (Semantic-Agnostic, Runtime-Aware, Model-Tunable)

**“语义是统一的，但运行时是分裂的。”**

到了 2026 年，主流智能体运行时与工程实践已日益明确地将三个层级进行解耦分离：
1. **模型 / 模型提供商 (The Model / Model Provider)**（例如：OpenAI、Anthropic、Google、DeepSeek、Qwen、Meta、Moonshot、智谱 (Zhipu)、MiniMax）：决定了底层模型的原始能力和推理水平。这里绝不要写死具体的模型版本号——完整的运行时 × 模型提供商映射请见[模型兼容性矩阵](spec/model-compatibility.md)。
2. **智能体运行时 (The Agent Runtime)**（例如：Claude Code, Codex, Gemini CLI, Cursor）：决定了智能体*如何*读取文件、*何时*调用技能，以及执行*什么*钩子。
3. **仓库标准 (The Repository Standard)**（例如：上下文、契约、工作流）：你的项目的通用语义真相（Semantic truth）。

虽然你项目的业务语义是**模型不可知**的（OpenAI 和 Anthropic 的模型都能读懂 `docs/domains/voice.md` 文件），但它们必须是**运行时感知**的。
- **Anthropic 的 Claude Code** 期望读取 `.claude/settings.json`（专注于生命周期管理）。
- **Cursor** 期望读取 `.cursor/rules/*.mdc`（专注于多模型的全局模式匹配）。

**Model Provider ≠ Agent Runtime，两者不能合并成一个维度。** 一个 Runtime 从不专属于某一个 Model Provider——Cursor 和 Claude Code 都可以由 Anthropic、OpenAI，或 DeepSeek 这样的兼容 API 提供商驱动；同一个提供商的模型也可能出现在多个 Runtime 里。这正是 Model Provider 被单独记录在[模型兼容性矩阵](spec/model-compatibility.md)、而不是变成一个独立 Template 的原因。

### 参考仓库 (Reference) vs 消费者仓库 (Consumer)
- **本仓库 (Reference)**: 这个 GitHub 仓库是全局的*参考标准仓库*。它包含了多种运行时的适配器、模板生成器以及 CLI 工具的源码。
- **你的仓库 (Consumer)**: 通过 CLI 生成出来的属于你的仓库是*消费者仓库*。它应该只包含**一种** Runtime 适配器和**一种** Tier 层级，从而确保 AI 智能体永远不会被互相冲突的规则集所困扰。

### 当前的参考运行时 (Reference Runtimes) vs 新兴运行时 (Emerging Runtimes)
本仓库目前为四种**参考运行时**提供开箱即用的模板：`claude-code`、`codex`、`gemini-cli`、`cursor`。其他真实存在的运行时——Qwen Code、DeepSeek Harness、Windsurf、GitHub Copilot 等——被记录为[模型兼容性矩阵](spec/model-compatibility.md)中的**新兴运行时**，待其约定稳定后可能升级为参考运行时。

---

## 🏗 八大支柱架构 (The 8-Pillar Architecture)

本标准将代码仓库从“一本给 AI 读的书”提升为了“一个供 AI 操作的工作区”。它定义了 8 个架构层：

### 1. 语境 (Context) - “这是什么”
*`PROJECT_MAP`, `Domains`, `Architecture`*
告诉 AI 这个系统是什么，东西都在哪里，以及为什么这样设计。

### 2. 规则 (Rules) - “指令与约束”
*`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`*
智能体的行为指令与声明性约束。代码必须如何格式化，导入必须如何处理，以及绝对不能打破的架构边界。

### 3. 契约 (Contracts) - “它们如何连接”
*`Protocols`, `Schemas`, `API Definitions`*
组件之间的显式边界。AI 智能体比人类更需要依赖在有意义的架构边界上的显式接口（Interfaces）。

### 4. 技能 (Skills) - “如何完成具体任务”
*`SKILL.md`*
可复用的、原子化的能力（例如：“在这个仓库中如何生成数据库迁移”）。

### 5. 工作流 (Workflows) - “如何编排流程”
*`SOPs`*
多步操作程序（例如：“规划 -> 检查不变量 -> 实现 -> 测试 -> 验证 -> 更新文档”）。

### 6. 工具 (Tools) - “如何触及世界”
*`MCP Servers`, `Deterministic CLI Scripts`*
结构化的能力扩展。智能体可以使用它们来安全地读取数据库、获取日志或编译代码。

### 7. 验证 (Verification) - “闭环证据”
*`Tests`, `Validators`, `Hooks`*
自动化的工作闭环。包括代码验证 + 智能体行为验证。直到验证脚本返回退出码 `0`，智能体的工作才算真正结束。

### 8. 人机边界 (Human / Agent Boundary) - “信任屏障”
*`MANUAL_TASKS.md`*
清晰的权限划分：AI 可以自主做什么，它必须请求许可才能做什么（例如：部署到生产环境），以及哪些事必须由人类手动完成。

---

## 📂 开发者指南

如果你想参与贡献这个 AI-Native 仓库标准本身：

```text
AI-Native-Repo/ (Reference Repository)
│
├── spec/                        # 规范标准：与工具无关的底层理论和哲学
├── cli/                         # `npx ai-native-repo` 脚手架的源代码
├── template-source/             # 唯一模板真实源 (Source of Truth)
│   ├── common/                  # 共享文档 (分为 Light, Standard, Full)
│   └── runtimes/                # 针对不同运行时的具体适配器 (Claude, Cursor 等)
│
├── scripts/
│   ├── generate-templates.js    # 将上述两部分拼合生成 12 套模板矩阵至 cli/templates/
│   └── validate.sh              # 确保整个标准仓库的完整性和无漂移的 CI 管道
└── anr.yaml                     # 机器可读的清单文件
```
