# AI-Native Repository Standard —— 哲学

[🇬🇧 English](philosophy.md) | [🇯🇵 日本語](philosophy.ja.md)

> **不要给 AI 更多代码，而是给 AI 更好的结构。**

本文解释 [AI-Native Repo 标准](repository-standard.md) 背后的**原因**。
标准告诉你**要遵守哪些规则**，本文告诉你**这些规则为什么存在**。

---

## 一句话定义

> **AI-Native Repository** 是一种面向 AI Coding Agent 的软件仓库架构：
> 通过结构化的知识层、渐进式上下文、明确的领域边界、Interface / Contract、
> Invariant、ADR、依赖索引和可验证测试，使 AI 能够以**最少的上下文**
> 正确理解、导航、修改和维护大型代码库。

它追求的不是：

> 让 AI 读完整个项目。

而是：

> **让 AI 在不读完整个项目的情况下，仍然能够正确理解整个项目。**

## 两个平面：AI Context Architecture + Software Architecture

AI-Native Repo **不是**新的 MVC，也不是「AI-MVVM」。传统架构并没有过时。

它是在现有软件架构之上增加一个 **Agent Context Layer**。

```text
Knowledge Layer + Code Layer

        ↓

AI Context Architecture
        +
Software Architecture
        ↓
Implementation
```

```text
AI-Native Repository
│
├── AI Context Architecture
│       = AI 如何理解、导航、验证代码
│
└── Software Architecture
        = 程序如何运行
```

软件架构仍可以是传统的：

```text
iOS:
MVVM / TCA / Clean / Feature Architecture

Backend:
DDD / Clean / Hexagonal / Dependency Inversion
```

完整模型：

```text
                    AI-Native Repo
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
   AI Context Architecture       Software Architecture
             │                           │
      ┌──────┼──────┐              ┌─────┼─────┐
      │      │      │              │     │     │
     Rules  Maps  Domain          MVVM  DDD   Clean
      │      │      │              │     │     │
 Contracts Invariants ADR       Feature DI  Hexagonal
      │      │      │              │     │     │
      └──────┼──────┘              └─────┼─────┘
             │                           │
             └──────────────┬────────────┘
                            ▼
                           Code
```

**Runtime Architecture** —— 程序怎么跑：

```text
View
 ↓
ViewModel
 ↓
UseCase
 ↓
Repository
 ↓
API
```

**Cognitive Architecture** —— AI 怎么理解程序：

```text
Task
 ↓
Map
 ↓
Domain
 ↓
Contract
 ↓
Invariant
 ↓
Test
 ↓
Implementation
```

```text
Runtime Flow     →  程序怎么跑？
Cognitive Flow   →  AI 怎么理解程序？
```

Agent 走过的栈是：

```text
Agent Layer            AI 应该怎么工作
Knowledge Layer        项目是什么、为什么、有哪些规则
Software Architecture  MVVM / DDD / Clean / Hexagonal / TCA / …
Implementation         Swift / Python / SQL / 基础设施
```

本标准**不规定**某一种运行时架构。iOS 可以继续用 MVVM 或 TCA；后端可以继续用 DDD、Clean、Hexagonal 或 Vertical Slice。无论 Runtime Architecture 选择什么，都必须满足 AI Context Architecture。

AI-Native ≠ Abstraction-Heavy。不要这样：

```text
UserService
IUserService
UserServiceProtocol
BaseUserService
UserServiceFactory
UserServiceAdapter
UserServiceFacade
```

而要这样：

```text
一个清晰职责
        +
一个清晰 Interface
        +
一个或少量 Implementation
        +
清晰规则
```

> **Explicit structure，不是 excessive abstraction。**

本文其余部分（地图、契约、不变量、ADR、索引、测试）就是 AI Context Architecture。Feature 边界和依赖倒置让运行时平面更容易被 Agent 使用，并不取代它。

---

# 一、核心理念

## 1. 项目不仅是代码，也是知识

传统项目大致是：

```text
code + a short README + comments
```

AI-Native 项目是：

```text
AI Context Architecture  +  Software Architecture  →  Implementation
```

知识层就是 AI Context Architecture。代码层容纳运行时架构和实现：

```text
project
├── knowledge layer          AI Context Architecture
│   ├── agent rules
│   ├── project map
│   ├── architecture
│   ├── domain knowledge
│   ├── interfaces & contracts
│   ├── invariants
│   ├── ADRs
│   └── indexes
│
└── code layer               Software Architecture + Implementation
    ├── iOS                  例如 Feature + MVVM / Clean
    ├── backend              例如 Feature + DDD / Hexagonal
    ├── web
    ├── worker
    └── other systems
```

## 2. 目标是“理解”，不是“读完”

错误目标：把上下文窗口做得足够大，把整个项目全部塞进去。

正确目标：

> **Small Context → Large Understanding（小上下文 → 大理解）**

## 3. 不应依赖越来越大的 Context Window

窗口更大并不意味着更容易理解项目。项目应主动**降低**无关、重复、隐藏、冗余的信息，
**提高**信息密度、结构化程度、可定位性和可验证性。

## 4. AI 应该“导航项目”，而不是“扫描项目”

理想：

```text
问题 → 地图 → 定位领域 → 定位模块 → 读接口 → 读规则 → 读测试 → （必要时）读实现
```

而不是：

```text
问题 → grep 全项目 → 读大量文件 → 自己猜架构
```

---

# 二、知识层

## 5. 知识层与代码层必须逻辑分离

- 知识层：项目是什么、为什么这样设计、东西在哪里、有哪些规则。
- 代码层：具体怎么实现。

二者应能各自独立理解。

## 6. 文档不是代码的复制品

代码描述 **How**，文档描述 **What / Why / Where**。文档不应逐行讲解函数如何执行，
而应说明它是什么、为什么存在、有哪些约束、去哪里找。

## 7. 文档承担“路由”作用

`AGENTS.md` 是导航员——它告诉 AI *下一步去哪里*。`PROJECT_MAP.md`、`ARCHITECTURE.md`
和领域文档才是实际知识。

---

# 三、分层上下文

## 8. 渐进式披露是路由策略，而非死板的阅读顺序 (Progressive Disclosure)

AI 不应一次获得全部信息。这是一种**动态的上下文路由策略**，而不是固定的阅读流程。AI 应根据任务按需请求上下文：

```text
L0  Agent Rules        →  AI 应该怎么工作？
L1  Project Map        →  项目是什么？东西在哪里？
L2  Architecture/Domain →  这个业务是什么？
L3  Interface/Contract →  这个模块能干什么？
L4  Invariant/ADR/Tests →  什么不能违反？为什么这样设计？必须表现成什么样？
L5  Implementation     →  具体怎么实现？
```

只有当前层信息不足时才继续往下。

## 9. 每一层只回答一种问题

（对应关系见规则 8。）不要把它们合并成一个超级文档。

## 10. 每一层都有 Context Budget（上下文预算）

> **不要为了传达 10 个事实，写 1000 行文本。**

宁可短地图、短规则、明确接口、明确索引，也不要一个巨大的超级文档。

---

# 四、Agent 规则

## 11. 根目录必须有统一的 Agent 工作合同

`AGENTS.md` 定义：项目是什么、从哪里开始读、默认阅读顺序、架构原则、测试规则、
修改规则、禁止事项。

## 12. `AGENTS.md` 不应成为超级 Prompt

它不是几千行技术细节，只负责告诉 Agent *怎么工作* 以及 *去哪里找细节*。

## 13. Agent 规则可以作用域化

```text
AGENTS.md
ios/AGENTS.md
backend/AGENTS.md
```

越靠近代码的规则越具体。在 `backend/features/voice/` 工作时，AI 叠加：
全局规则 + Backend 规则 + Voice 领域规则。

---

# 五、项目地图

## 14. 必须有全局 Project Map

它建立第一层认知：用途、顶层目录、子系统、主要领域、主要入口、核心数据流、
重要文档位置。

## 15. Project Map 必须短

它的任务是告诉 AI 下一步去哪里，而不是解释每一行代码。目标约 100 行。

## 16. 必须存在 Context Index

它回答：**某个东西在哪里？**

```text
VoiceService   → backend/features/voice/application/
SpeechService  → backend/features/voice/interface/
VoiceSession   → ios/features/voice/interface/
```

## 17. Context Index 尽可能自动生成

机器生成：文件、Symbol、Class、Protocol、Function、Reference、Import、Dependency、
测试与实现的对应关系。
人工维护：业务意义、架构意图、设计原因、业务规则。

---

# 六、代码架构

运行时模式（MVVM、DDD、Clean 等）由项目自行选择。本标准要求的是：运行时代码有 **Agent 能落进去的清晰边界**。

## 18. 按 Feature / Domain 组织，而非按文件类型

```text
features/            不要   controllers/
├── voice/                  services/
├── navigation/             models/
├── account/                utils/
└── billing/
```

## 19. Feature 是 AI 的主要上下文边界

一个任务最好落在 `features/voice/` 内，而不是散落在 `services/`、`models/`、
`controllers/`、`utils/` 里几十个文件。

## 20. Domain 边界必须明确

每个 Domain 定义：负责什么、不负责什么、依赖谁、被谁使用、提供什么接口、有哪些规则、
有哪些测试。

---

# 七、Interface / Contract (边界驱动 Boundary-Driven)

## 21. 基于明确的边界，而非为抽象而抽象

不要为所有的内部函数强行增加 Interface。Interface 应当建立在有意义的架构边界处，并且它能提供以下价值：
- 定义依赖方向 (dependency direction)
- 模块隔离 (isolation)
- 为测试提供 Mock 替换 (substitution or mocking)
- 提供商抽象 (provider abstraction)
- 外部系统边界 (external system boundary)
- 明确的领域边界 (explicit domain boundary)

要的是明确结构，不是过量抽象：一个职责 → 一个接口 → 少量实现。一堆用不上的 Adapter 会让 Agent 更难，而不是更容易。

## 22. Interface 先于 Implementation 被阅读

先问 *这个东西能做什么*，再关心 *它具体怎么做*。

## 23. Interface 不只是方法签名

优秀的 Interface 应表达：职责、输入、输出、错误、副作用、限制。

```text
SpeechService
  职责:   Audio → Text
  错误:   provider error → domain error
  副作用: 不得执行用户命令
  约束:   网络失败允许 fallback
```

## 24. API Contract 与 Domain Contract 分离

HTTP Request/Response 不等于 Domain Service Interface。

---

# 八、Implementation

## 25. Implementation 与 Interface 分离

```text
voice/
├── interface/        定义能力
├── application/      编排能力
├── domain/           建模能力
└── infrastructure/   提供能力
```

## 26. 默认“不展开”，而不是“默认正确”

不需要时不读 Implementation。但**不要**假设它永远正确。当测试失败、行为异常、
Contract 无法解释、或怀疑实现有 bug 时，就应下钻。

---

# 九、业务规则与强制拦截 (Rules & Enforcement)

## 27. 规则必须分级：建议 (Advisory) vs 拦截 (Enforced)

Instruction 不等于 Enforcement。不要以为在 `AGENTS.md` 里写一句“绝对不要删除数据”，就能在物理上阻止 Agent 犯错。规则必须分为三层：

1. **建议性指令 / 声明性约束 (Advisory Constraint)** (`CLAUDE.md`, `.cursor/rules/`)：口头告诉 Agent 应该怎么做。
2. **强制护栏 (Guardrail / Enforcement)** (`PreToolUse` Hooks, CI, Permissions, 权限控制)：在系统底层物理拦截违规行为。
3. **验证 / 证据 (Verification)** (Tests, Lint, Build)：客观证明结果是否正确。

## 27.1 业务规则必须独立存在

不能只埋在实现代码里：

```text
静默 > 20s        → 结束连续语音
网络断开           → fallback
危险操作           → 用户确认
```

## 28. Invariant 是跨实现的约束

Implementation 可以换。Invariant 不应随意改变，除非产品需求改变。修改代码前，
AI 先检查 Invariant：*是否仍然成立？*

---

# 十、ADR

## 29. 所有重要架构决定必须记录“为什么”

为什么用 WebSocket？为什么用 Repository？为什么 Router 不能直连数据库？为什么用这种缓存？

## 30. ADR 必须记录替代方案

问题、选择、原因、被拒绝的方案、代价、未来改变条件。这可防止 AI 把
**有意的复杂性** 误认为 **可以随便简化的代码**。

---

# 十一、依赖关系

## 31–33. 项目能回答三个问题

```text
X 依赖谁？        VoiceService → SpeechService, LLMService, Validator
谁使用 X？        SpeechService ← VoiceService, VoiceSession
改 X 会影响什么？ SpeechService → VoiceService, VoiceRouter, VoiceSessionTests, ...
```

## 34. 依赖 / 影响图应自动生成

`SYMBOL_INDEX`、`DEPENDENCY_GRAPH`、`IMPACT_GRAPH` 是机器可知的，不要让人手工维护。

---

# 十二、命名

## 35. 命名就是 AI 的索引

优先 `SpeechRecognitionService`、`NavigationRouteCalculator`、`VoiceCommandRouter`。
避免 `Manager`、`Helper`、`Utils`、`Common`、`Worker`、`Handler`，除非确有明确含义。

## 36. 一个文件只有一个核心职责

不要 2000 行的 `MegaManager.swift` 同时负责网络、数据库、导航、语音、分析、UI。
文件边界本身就是上下文边界。

## 37. 源文件大小

AI-Native 仓库应避免大型手动维护的源文件。

作为指导原则：

- **≤ 300 行**：理想
- **301–500 行**：正常，但开始关注职责
- **501–800 行**：应该检查是否需要拆分
- **801–1000 行**：不推荐，应认真考虑重构
- **> 1000 行**：原则上禁止新建
- **> 1500 行**：强烈要求拆分，通常已经属于 God File 风险

生成文件、快照、迁移、schema 和其他机器生成的工件在适当时可以豁免。

**目标不是机械地减少代码行数，而是缩小 AI 的认知边界。**

---

# 十三、测试与验证 (Tests & Verification)

## 38. 验证必须是确定性闭环的 (Deterministic and Closed-Loop)

不能接受 Agent 自己声称“代码看起来没问题”的结论。验证应该分为两类：
1. **代码验证 (Code Verification)**: 单元测试、集成测试、构建、静态分析。
2. **Agent 行为验证 (Agent Behavior Verification)**: 测试 Agent 是否能成功触发技能、是否能遵守工作流、是否能拒绝危险操作。

它既是验证机制，也是 **可执行的知识（executable knowledge）**。

## 39. 测试名称表达行为

`testNetworkFailureFallsBackToLocalRecognition()`，而不是 `test1()`。

## 40. 先局部验证，再全局验证

```text
修改 → focused unit test → integration test → （必要时）full suite
```

不要为了省 Token 而永远只运行单个脚本。

---

# 十四、Generated 内容

## 41. Source of Truth 必须唯一

如果某个东西是自动生成的（`generated/`），标记 **DO NOT EDIT**。修改源，再重新生成。

---

# 十五、文档与代码冲突

## 42. 文档不是绝对真理

它可能过期。事实层级：

```text
实际测试 / 实际行为
 → 当前实现
 → Contract
 → 文档
 → 注释
```

发现冲突时，不要偷偷修改其中一边。识别冲突并修正正确的 Source of Truth。

---

# 十六、避免无意义上下文与 Token 降噪

## 43. 显式配置排除规则以隔离无关噪音

`build/`、`DerivedData/`、`Pods/`、`node_modules/`、`.venv/`、`cache/`、`logs/`、
二进制文件（如 `.gguf`, `.bin`）、敏感配置（`.env*`）必须显式排除。
使用各 Runtime 自己的机制：Claude Code 用 `permissions.deny` 的 `Read(...)` 规则，Cursor 用 `.cursorignore`，
Gemini CLI 用 `.geminiignore`。不存在跨 Runtime 的通用忽略文件——`.agentsignore` 没有任何主流 Runtime 会读取，
Codex 更是完全没有忽略文件——所以密钥应放在工作区之外，而不是寄希望于某个约定。
不要把上下文预算消耗在机器产物或噪音数据上。

## 43.1 语义真理 vs 运行入口 (Semantic Truth vs Runtime Entry)

在异构 AI 工具并存的现实中（Claude Code, Gemini, Windsurf, Cursor），不同的工具默认读取不同的入口（`CLAUDE.md`, `GEMINI.md`, `.cursor/rules/*.mdc`）。
原则是：**`docs/` 承载项目无关具体工具的语义真理 (Semantic Truth)，而各家特有的配置文件仅作为运行入口 (Runtime Entry)**。
不要将业务知识复制到 `.cursor/rules/` 或 `CLAUDE.md` 中。这些 Runtime Adapter 应当将 Agent 引导路由回统一的 `docs/` 标准架构中。

## 43.2 人机协作边界与工具 (`MANUAL_TASKS.md`)

AI 并非全能。涉及第三方后台（Cloudflare / Stripe / Apple Developer）、生产密钥注入、真实硬件联调等事项，必须显式隔离在 `MANUAL_TASKS.md`（或 `人工操作.md`）中，形成清晰的人机协作契约。在让人类接手任务时，必须解释“为什么这个操作需要人来做”。

## 43.3 Tools 与 MCP 是结构化能力，而非天然安全

不要认为 MCP (Model Context Protocol) 是一种“绝对安全”的协议。所有的工具都必须是 **结构化 (Structured)、权限校验 (Permissioned)、能力封顶 (Capability-Bounded)** 的。建议为工具划分风险等级：
- **只读 (Read Only)**: (如读取数据库 Schema)
- **本地修改 (Local Mutation)**: (如格式化代码，运行本地测试)
- **外部修改 (External Mutation)**: (如调用开发环境 API)
- **生产/破坏性 (Production / Destructive)**: (如修改生产数据、发布版本) —— 这必须强制配置人类授权护栏。

---

# 十七、AI 工作流程

## 44. 先定位，再深入，闭环验证与文档防腐化

```text
task → Agent Rules → Project Map → Domain → Interface → Invariant/ADR
     → 相关测试 → 依赖/影响 → 实现 → 修改 → 验证命令(闭环自检) → Doc-Sync(防腐化)
```

## 44.1 闭环验证命令必须可执行
完成代码修改后，AI 必须运行明确声明的验证命令（如编译、类型检查、语法 lint），不可凭空宣称“已修改完毕”。

## 44.2 文档防腐化机制 (Doc-Sync)
只要改动了接口、契约或数据库结构，必须同步登记到地图与索引中，保持知识层与代码层的实时同构。

## 45. 没有理由不要扫描整个仓库

全仓库上下文只留给确实需要的任务（例如“分析整个项目的所有依赖关系”）。

## 46. 上下文随问题逐步扩大

```text
L0 不知道问题在哪
L1 知道是 Voice
L2 知道是 VoiceSession
L3 知道是 SpeechService
L4 发现测试失败
L5 只读那一处实现
```

这就是 **Progressive Context Expansion**。

---

# 十八、知识以“问题”为中心组织

## 47. 文档应让 AI 能回答具体问题

```text
改语音        → voice.md
看接口        → interface
知道为什么     → ADR
知道不能改什么 → invariants
知道谁受影响   → dependency / impact
确认行为       → tests
```

这比“把所有知识塞进 `architecture.md`”更 AI-friendly。

---

# 十九、跨平台项目

## 48. 知识层独立于平台

只有 iOS、只有 FastAPI、或 iOS + FastAPI——知识层的思想都不变。

## 49. 代码层随实际系统增减

```text
只有 iOS:   docs/ ios/
只有后端:   docs/ backend/
全栈:       docs/ ios/ backend/ web/
```

## 50. 跨系统业务共用一个 Domain

`docs/domains/voice.md` 可以在一处描述 `iOS Voice → API → FastAPI Voice → LLM`。
领域知识不被某种语言绑死。

---

# 二十、自动化

## 51. 机器能知道的，尽量交给机器

机器：Symbol、Reference、Import、Dependency、文件位置、Call Graph、测试映射。
人：Why、Intent、业务规则、架构决策。

## 52. 文档系统应可自动验证

`anr validate`（当前）：验证 Interface 契约与 Domain 文档完整性，检查 `AGENTS.md` 路由器尺寸预算，执行新鲜度检查脚本。

## 53. 文档系统应可自动生成

`anr index`（计划中）：自动提取符号与拓扑，生成 `context-index.md`、`symbol-index.md`、`dependency-map.md`。

## 54. 提供初始化与演化更新能力

`anr init` 与 `anr update`（当前）：交互式或参数化一键搭建 12 套模板矩阵，安全同步技能与防御钩子基础设施，让任何项目立即拥有 AI-Native 原生结构并平滑演化。

---

# 二十一、最重要的架构思想

## 55–59. 不要让 AI 猜

| 传统 | AI-Native |
|---|---|
| 代码 → AI 猜 → 架构 | 架构 → 代码 |
| 业务规则藏在代码里 | invariants + domain knowledge |
| “为什么这么写？”——没人知道 | ADR |
| 全局搜索某个东西在哪 | Context Index |
| 为理解一个小问题读取大量上下文 | Progressive Disclosure |

---

# 二十二、最终模型

```text
                    AI-Native Repo
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
   AI Context Architecture       Software Architecture
             │                           │
      ┌──────┼──────┐              ┌─────┼─────┐
      │      │      │              │     │     │
     Rules  Maps  Domain          MVVM  DDD   Clean
      │      │      │              │     │     │
 Contracts Invariants ADR       Feature DI  Hexagonal
      │      │      │              │     │     │
      └──────┼──────┘              └─────┼─────┘
             │                           │
             └──────────────┬────────────┘
                            ▼
                           Code
```

Cognitive Architecture（Agent 如何理解）叠在 Runtime Architecture（程序如何运行）之上：

```text
                         AI TASK
                            │
                            ▼
          ┌─────────────────────────────────┐
          │     AI Context Architecture     │
          │                                 │
          │  AGENTS → Map → Domain          │
          │  Contract → Invariant / ADR     │
          │  Tests → Dependency / Impact    │
          └────────────────┬────────────────┘
                           ▼
          ┌─────────────────────────────────┐
          │     Software Architecture       │
          │  MVVM / TCA / Clean / DDD / …   │
          └────────────────┬────────────────┘
                           ▼
          ┌─────────────────────────────────┐
          │     Implementation              │
          └────────────────┬────────────────┘
                           ▼
                 MODIFY → TEST → UPDATE KNOWLEDGE
```

---

> **AI-Native Repo 不是给 AI 更多代码，而是给 AI 更好的结构。**
