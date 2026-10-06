# 📖 Knowledge Layer Documentation Index (docs/README.md)

> This directory is the **Knowledge Center (AI Context Layer)** shared between AI Coding Agents and human developers.

---

## Directory Navigation

```text
docs/
├── PROJECT_MAP.md              # 1. System Map (Macro topology, subsystems, and tech stack)
├── architecture/               # 2. Architecture, design principles, and guidelines
│   ├── overview.md             #    System architecture overview and tech stack
│   ├── golden_feature_template.md # Canonical Golden Feature Template (Mandatory layout)
│   └── env_secrets_config.md   #    Environment variables & secrets specification
├── contracts/                  # 3. Interfaces & database contracts
│   ├── backend_rpc.md          #    API / RPC payloads, headers, and error codes
│   └── database_schema.md      #    Physical database schema snapshot
├── invariants/                 # 4. Inviolable business rules & safety guardrails
│   └── business_invariants.md  #    Core invariants that must never be broken
├── adr/                        # 5. Architecture Decision Records (ADRs)
│   ├── README.md               #    ADR index table
│   └── ADR-000-template.md     #    Standard ADR template
├── plans/                      # 6. Versioned task plans (intent of one task)
│   ├── README.md               #    When to write a plan, lifecycle, active plans
│   └── plan-template.md        #    Goal, acceptance criteria, steps, decision log
└── domains/                    # 7. Business vertical domain knowledge
    ├── README.md               #    Domain index
    ├── domain-template.md      #    Domain knowledge template
    └── auth.md                 #    Example domain (Authentication)
```
