# [项目名称] — AGENTS.md

> 与运行时无关的 AI 代理入口。只做**路由**（<= 2048 字节）：指向上下文，不承载上下文。

## 宣称"完成"之前必须验证

```bash
<Typecheck Command>   # 例如 npm run typecheck / mypy . / swift build
<Build Command>       # 例如 npm run build / cargo check
<Test Command>        # 例如 npm test / pytest（若当前阶段启用测试）
bash scripts/check-freshness.sh   # AI 上下文层不得腐化
```

完整流程见技能 [`verify`](.agents/skills/verify/SKILL.md)。命令无法执行时必须明确说明。

## 护栏与评测

[受保护路径](.agents/guardrails/protected-paths.txt)由 `scripts/guard-paths.sh` 强制执行；被拦截就停下，去问人类。被评测时不得修改 [evals/](evals/README.md)。

## 范围与状态

- **冻结区域**：[例如 `legacy/` —— 不读取、不修改]
- **测试策略**：[例如 当前阶段只要求类型检查 + 构建通过]
- **人机边界**：生产环境、密钥与第三方控制台操作 → [MANUAL_TASKS.md](MANUAL_TASKS.md)

## 按任务路由（渐进式披露）

1. 规则：[.agents/rules/global.md](.agents/rules/global.md)
2. 东西在哪：[docs/PROJECT_MAP.md](docs/PROJECT_MAP.md) → [.agents/context-index.md](.agents/context-index.md)
3. 业务含义：[docs/domains/](docs/domains/README.md)
4. 组件如何连接：[docs/contracts/](docs/contracts/backend_rpc.md)
5. 为什么这样 / 什么绝不能破坏：[docs/adr/](docs/adr/README.md)、[docs/invariants/](docs/invariants/business_invariants.md)
6. 影响半径：[.agents/dependency-map.md](.agents/dependency-map.md)
7. 任务意图：验收标准，[docs/plans/](docs/plans/README.md)
8. 最后才是：`Interface`，然后是实现。

## 技能（按需加载）

规范技能在 [.agents/skills/](.agents/skills/)，有匹配的就用，不要即兴发挥：
`feature-development` · `bug-fix` · `database-migration` · `api-contract-change` · `verify` · `review` · `doc-sync`
