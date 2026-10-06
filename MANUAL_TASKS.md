# 📋 Human / Agent Boundary (MANUAL_TASKS.md)

> The permission contract for agents working on this reference repository. Silence is not approval.

## 1. [Autonomous]

- Edit `spec/`, `template-source/`, `cli/`, `scripts/`, `examples/`, READMEs and docs
- Run `./scripts/validate.sh`, `node cli/tests/test.js`, `node scripts/generate-templates.js`, `swift build` / `swift test` in an example
- Local branches and local commits

## 2. [Approval Required]

- Changing what a normative rule requires (MUST / MUST NOT), or adding / removing a rule or pillar
- Changing CLI behavior that existing consumer repositories rely on: `anr update` / `--prune` semantics, the `anr.yaml` format
- Adding a runtime, a tier or a template language
- Adding any dependency to the CLI (it is zero-dependency by design)
- Changing `.github/workflows/`
- `git push`, opening or merging pull requests

## 3. [Manual Only]

- Version bumps, git tags and GitHub releases
- Publishing the CLI (npm registry, GitHub Packages)
- Repository settings, secrets, branch protection
- Announcing a new standard version

## 4. Pending human tasks

- [ ] _none_
