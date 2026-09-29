# 🗺️ 项目全景地图 (PROJECT_MAP.md)

> 系统的宏观概览：东西在哪、用什么搭的。控制在 100 行以内。

---

## 1. 顶层物理结构

```text
.
├── AGENTS.md           # 面向所有 AI 代理、与运行时无关的入口
├── CLAUDE.md / GEMINI.md / .cursor/rules/   # 运行时适配器（只保留你所用运行时的那一个）
├── MANUAL_TASKS.md     # 人机边界与人工待办清单（[ ]）
├── README.md           # 人类开发者项目介绍
│
├── .agents/
│   └── skills/verify/  # 轻量版唯一的核心技能
│
├── docs/
│   ├── PROJECT_MAP.md      # 本文件
│   └── architecture/       # overview.md —— 技术栈与分层
│
└── [src / apps / ...]  # 代码实现
```

---

## 2. 核心子系统与目录映射

| 子系统 / 模块 | 职责 | 代码目录 |
| :--- | :--- | :--- |
| **[模块 A]** | [做什么] | `src/[module-a]/` |
| **[模块 B]** | [做什么] | `src/[module-b]/` |
| **通用基础设施** | 网络客户端、公共工具，见 [overview.md](architecture/overview.md) | `src/core/` |

---

## 3. 技术栈声明

- **前端 / 客户端**：[例如 React / Next.js、SwiftUI / MVVM 或 Flutter]
- **服务端 / 后端**：[例如 FastAPI / Python、Node.js / Express 或 Go]
- **数据库**：[例如 PostgreSQL、MySQL、SQLite 或云数据库]
