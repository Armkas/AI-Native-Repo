# 🗺️ 项目全景地图 (PROJECT_MAP.md)

> 本文档为全项目物理结构与技术栈的宏观全景索引。AI 代理可在此迅速了解系统的整体布局与各子系统位置。

---

## 1. 顶层物理结构 (Top-Level Structure)

```text
.
├── AGENTS.md           # 全局 AI 代理唯一规范源 (Single Source of Truth)
├── CLAUDE.md / GEMINI.md / .cursor/rules/   # 运行时适配器（只保留你所用运行时的那一个）
├── MANUAL_TASKS.md     # 待办人工操作与人机职责边界清单
├── README.md           # 人类开发者项目介绍
│
├── .agents/            # 机器可读索引、规则与技能
│   ├── context-index.md    # 快速符号与接口索引
│   ├── dependency-map.md   # 依赖拓扑图与影响评估
│   ├── rules/              # 细分平台规则
│   └── skills/             # 规范技能：<name>/SKILL.md（功能开发、缺陷修复、数据库迁移……）
│
├── docs/               # 知识层 (AI Context Architecture)
│   ├── architecture/       # 系统架构与黄金特性样板
│   ├── contracts/          # API RPC 与数据库契约
│   ├── invariants/         # 业务不变式与安全红线
│   ├── adr/                # 架构决策记录
│   ├── plans/              # 版本化任务计划：目标、验收标准、决策日志
│   └── domains/            # 业务领域垂直知识
│
└── [src / apps / ...]  # 代码实现运行时层 (Software Runtime Architecture)
    └── features/           # 业务功能模块 (按 Feature 物理聚合)
```

---

## 2. 核心子系统与物理位置映射

| 业务子系统 / 模块 | 职责概述 | 知识层文档 | 代码实现目录 (Code Layer) |
| :--- | :--- | :--- | :--- |
| **认证与用户 (Auth)** | 登录、注册、会话鉴权 | [docs/domains/auth.md](domains/auth.md) | `src/features/auth/` |
| **核心业务特性 (Feature)** | 核心业务主流程与状态流转 | [docs/domains/domain-template.md](domains/domain-template.md) | `src/features/[feature]/` |
| **通用基础设施 (Core / Shared)** | 网络请求客户端、工具函数库 | [docs/architecture/overview.md](architecture/overview.md) | `src/core/` / `src/shared/` |

---

## 3. 技术栈声明 (Technology Stack)

- **前端 / 客户端**：[例如: React / Next.js、SwiftUI / MVVM 或 Flutter]
- **服务端 / 后端**：[例如: FastAPI / Python、Node.js / Express 或 Go]
- **数据库**：[例如: PostgreSQL、MySQL、SQLite 或云数据库]
