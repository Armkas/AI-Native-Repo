# 🗺️ Project Map (PROJECT_MAP.md)

> High-level overview of the system: where things live and what they are built with. Keep it under 100 lines.

---

## 1. Top-Level Physical Structure

```text
.
├── AGENTS.md           # Runtime-neutral entry point for all AI agents
├── CLAUDE.md / GEMINI.md / .cursor/rules/   # Runtime adapter (only the one for your runtime)
├── MANUAL_TASKS.md     # Human operational boundaries & manual checklist ([ ])
├── README.md           # Developer introduction
│
├── .agents/
│   └── skills/verify/  # The one core skill of the light tier
│
├── docs/
│   ├── PROJECT_MAP.md      # This file
│   └── architecture/       # overview.md — stack and layers
│
└── [src / apps / ...]  # Implementation
```

---

## 2. Core Subsystems & Directory Mappings

| Subsystem / Module | Responsibility | Code Implementation |
| :--- | :--- | :--- |
| **[Module A]** | [What it does] | `src/[module-a]/` |
| **[Module B]** | [What it does] | `src/[module-b]/` |
| **Common Infrastructure** | HTTP client, shared utilities — see [overview.md](architecture/overview.md) | `src/core/` |

---

## 3. Technology Stack Declarations

- **Frontend / Client**: [e.g., React / Next.js, SwiftUI / MVVM, or Flutter]
- **Backend / Server**: [e.g., FastAPI / Python, Node.js / Express, or Go]
- **Database**: [e.g., PostgreSQL, MySQL, SQLite, or Cloud DB]
