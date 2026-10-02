# AI-Native Repository Standard & Reference Implementation

[🇺🇸 English](README.md) | [🇨🇳 简体中文](README.zh-CN.md) | [🇹🇼 繁體中文](README.zh-TW.md) | [🇯🇵 日本語](README.ja.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇩🇪 Deutsch](README.de.md) | [🇷🇺 Русский](README.ru.md) | [🇺🇦 Українська](README.uk.md) | [🇧🇷 Português](README.pt-BR.md) | [🇰🇷 한국어](README.ko.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇸🇦 العربية](README.ar.md)

> **"벤더들은 AI가 저장소에 진입하는 방식을 표준화하고, ANR은 저장소 자체가 AI 에이전트를 위한 지속 가능한 엔지니어링 자산으로 설계되는 방식을 표준화합니다."**

AI 코딩 에이전트가 자율적으로 이해하고, 탐색하고, 수정하며, 검증할 수 있는 저장소를 구축하고 유지하기 위한 크로스 에이전트 표준, 참조 아키텍처 및 수명 주기 거버넌스 플랫폼입니다.

---

## 🤔 ANR이 필요한가요? (AI-Friendly 저장소를 위한 두 가지 경로)

**AI 친화적인 저장소를 구축하기 위해 반드시 ANR을 설치할 필요는 없습니다.**  
최신 에이전트 런타임(Claude Code, OpenAI Codex, Cursor, Gemini CLI, Copilot)은 이미 네이티브 지침, 규칙, 훅 및 스킬 메커니즘을 제공합니다. ANR은 **에이전트 실행 능력(운영체제)**과 **저장소 컨텍스트 아키텍처 및 거버넌스(지속 가능한 코드 자산 구성)**를 명확히 분리합니다.

### 경로 A: 도구 없는 수동 최소 설정 (개인 개발자 및 프로토타입 권장)
개인 프로젝트나 소규모 저장소를 관리하는 경우 외부 CLI가 전혀 필요하지 않습니다. ANR의 핵심 아키텍처 원칙만 따르면 됩니다:
1. **최소한의 전역 라우터**: 루트에 있는 `AGENTS.md`(또는 `CLAUDE.md`, `GEMINI.md`)를 `<= 2048 bytes (2 KiB)` 예산 내로 유지합니다. 프롬프트 메모리에 프로젝트 백과사전을 채우는 대신 컨텍스트로 안내하는 항공 교통 관제사 역할을 합니다.
2. **Agent Skills를 통한 모듈식 워크플로**: 반복 가능한 절차적 작업을 개방형 [Agent Skills](https://agentskills.io) 표준 형식으로 `.agents/skills/<name>/SKILL.md`에 배치합니다.
3. **구조화된 도메인 및 계약 레이어**: 비즈니스 아키텍처는 `docs/domains/`로, 데이터베이스 스키마 및 API 계약은 `docs/contracts/`로 분리합니다.
4. **작업 관련 점진적 컨텍스트 공개**: 에이전트가 현재 작업과 관련된 문서만 읽도록 보장합니다.
5. **결정론적 검증**: 에이전트가 작업을 완료했다고 선언하기 전에 통과해야 하는 명시적인 빌드 및 테스트 명령을 정의합니다.
6. **실행 가능한 인간 권한 경계**: 민감한 설정이나 릴리스 스크립트를 훅이나 CI 검사를 통해 보호합니다.

---

### 경로 B: 표준화된 수명 주기 플랫폼 (ANR CLI — 팀 및 다중 에이전트 환경)
팀 단위로 프로덕션 시스템을 운영하거나 여러 AI 에이전트를 함께 사용할 때, ANR은 검증되고 자동화된 수명 주기 프레임워크를 제공합니다:
- **에이전트 간 이식성**: 단일 진실 소스(`docs/`, `.agents/skills/`)를 Claude Code, Codex, Cursor, Gemini CLI에 규칙 중복 없이 깔끔하게 매핑합니다.
- **다중 저장소 거버넌스**: 수십 개의 마이크로서비스 또는 라이브러리 전반에 걸쳐 일관된 구조적 표준, 계약 및 권한 경계를 적용합니다.
- **Day 2 유지 관리 및 진화**: 작성자를 존중하는 JSON 병합 및 `--prune` 폐기 파일 정리를 지원하는 `anr update`와 링크 끊김 및 스킬 준수를 진단하는 `anr doctor`를 사용합니다.

---

## 🚀 빠른 시작: CLI 스캐폴드

더 이상 파일을 수동으로 복사할 필요가 없습니다. 선호하는 에이전트 런타임 및 프로젝트 복잡성에 맞게 맞춤화된 AI 네이티브 작업 공간을 즉시 구축할 수 있는 강력한 CLI를 제공합니다.

**빈 디렉토리에서 다음 명령을 실행하세요:**

```bash
npx ai-native-repo init .
```

### 12-템플릿 매트릭스
CLI는 대화형으로 12-템플릿 매트릭스(4 런타임 × 3 티어) 중에서 선택하도록 요청합니다.

**1단계: 에이전트 런타임 선택**
- `claude-code`: 순수 Anthropic 생태계 훅 및 스킬.
- `codex`: 순수 OpenAI/Codex 에이전트 구조.
- `cursor`: Cursor의 `.cursor/rules/*.mdc` 전역 매칭에 최적화됨.
- `gemini-cli`: 순수 Google Gemini 환경.

**2단계: 복잡도 티어 선택**
- `light`: 간단한 스크립트나 프로토타입을 위한 최소한의 컨텍스트 파일.
- `standard`: 기본값. 프로덕션 서비스를 위한 전체 컨텍스트, 계약 및 규칙 아키텍처.
- `full`: 엔터프라이즈 급. standard에 경로 가드레일(읽기 전용 / 추가 전용 파일, 훅 또는 CI로 강제)과 컨텍스트 신선도 검사를 더합니다.

---

## 🎯 핵심 설계 철학: 이중 "점진적" 아키텍처 (The Dual Progressive Architecture)

대부분의 AI 프롬프트 템플릿이 실제 복잡한 프로젝트에서 실패하는 데에는 두 가지 이유가 있습니다. **과도한 컨텍스트 주입으로 인한 모델의 주의력 붕괴(Context Bloat)**, 그리고 **높은 초기 진입 장벽으로 인한 기존 프로젝트 도입의 어려움**입니다. 본 표준은 두 가지 점진적(Progressive) 설계를 통해 이 문제를 해결합니다.

### 1. 점진적 컨텍스트 공개 (Progressive Context Disclosure) — AI 주의력 보존
> **Context Must Be Earned (컨텍스트는 필요할 때에만 요청되어야 합니다).**

AI 에이전트에게 수만 단어에 달하는 거대한 문서를 한 번에 주입하지 마세요. 전역 진입점(`AGENTS.md`)은 **<= 2048 bytes (2 KiB)**로 엄격히 제한되어 경량 항공 교통 관제사 역할을 합니다. AI는 작업에 따라 필요한 컨텍스트를 단계별로 탐색하며, 결코 한 번에 모든 것을 로드하지 않습니다.

* **L0: Agent Rules (<= 2048 bytes)** → AI는 어떻게 작동해야 하는가? (행동 규칙 및 전역 라우터)
* **L1: Project Map (< 100줄)** → 프로젝트의 전체 구조와 핵심 컴포넌트는 어디에 있는가? (물리 맵)
* **L2: Architecture / Domain** → 이 도메인은 어떤 비즈니스 문제를 해결하는가?
* **L3: Interface / Contract** → 컴포넌트 간 경계와 프로토콜은 어떻게 정의되는가?
* **L4: Invariants / Tests** → 절대 위반해서는 안 되는 규칙은 무엇인가? 어떻게 검증하는가?
* **L5: Implementation** → 실제 소스 코드 구현

**현재 작업에 필요한 컨텍스트만 로드**하므로 토큰 비용을 크게 절감하고 초장문 프롬프트로 인한 주의력 분산과 코드 환각을 완벽히 방지합니다.

### 2. 저장소의 점진적 채택 (Progressive Repository Adoption) — 기존 프로젝트의 마찰 없는 도입
> **처음부터 다시 시작할 필요가 없습니다. 모든 기존 프로젝트는 10분 만에 AI-Native로 진화할 수 있습니다.**

하룻밤 사이에 레거시 코드베이스 전체의 문서를 작성할 필요는 없습니다. 본 표준의 **Tier 복잡도 모델**을 통해 기존 저장소는 자연스럽게 성장할 수 있습니다.

* **Day 1 (Tier 1: Light) — 10분 빠른 도입**: 기존 코드를 전혀 수정하지 않습니다. 2KB 미만의 라우터를 생성하고, AI가 기존 디렉터리를 스캔하여 현실적인 `PROJECT_MAP.md`를 생성하게 하며, `MANUAL_TASKS.md`에 진입 금지 영역을 지정합니다. 이것만으로도 AI가 길을 잃지 않습니다.
* **Day 30 (Tier 2: Standard) — 온디맨드 지식 축적**: 손대는 부분만 문서화합니다. AI가 특정 모듈(예: 인증)을 수정할 때 해당 PR에서 `domains/auth.md`를 작성하고 `verify` 스킬로 테스트 루프를 연동합니다.
* **Day 90 (Tier 3: Full) — 엔터프라이즈 가드레일**: 팀이 충분히 적응하면 읽기 전용/추가 전용 경로 보호(Guardrails)와 CI 신선도 자동 검사를 도입합니다.

---

## ⚠️ 의미론적 독립, 런타임 인식, 모델 조정 가능 (Semantic-Agnostic, Runtime-Aware, Model-Tunable)

2026년 기준으로, 업계는 AI 네이티브 저장소를 구축하기 위해 세 가지 다른 계층을 분리해야 한다는 것을 깨달았습니다.
1. **모델 / 모델 제공자** (예: OpenAI, Anthropic, Google, DeepSeek, Qwen, Meta, Moonshot, Zhipu, MiniMax): 기반 모델의 원시 능력과 추론 수준을 결정합니다. 여기에 특정 모델 버전을 하드코딩하지 마세요 — 전체 런타임 × 모델 제공자 매핑은 [모델 호환성 매트릭스](spec/model-compatibility.md)를 참고하세요.
2. **에이전트 런타임** (예: Claude Code, Codex, Gemini CLI, Cursor): 파일이 *어떻게* 읽히고, *언제* 훅이 실행되는지 결정합니다.
3. **저장소 표준**: 프로젝트의 보편적인 의미론적 진실입니다.

프로젝트의 비즈니스 의미론은 **모델 독립적**이어야 하지만 **런타임 인식**을 해야 합니다.

**모델 제공자 ≠ 에이전트 런타임 — 둘을 하나의 축으로 합치지 마세요.** 하나의 런타임은 특정 모델 제공자에 종속되지 않습니다 (Cursor와 Claude Code는 Anthropic, OpenAI, 또는 DeepSeek 같은 API 호환 제공자로도 구동될 수 있습니다). 그래서 모델 제공자는 별도의 Template이 되는 대신 [모델 호환성 매트릭스](spec/model-compatibility.md)에 따로 기록됩니다.
- **Anthropic의 Claude Code**는 `.claude/settings.json`을 예상합니다.
- **Cursor**는 `.cursor/rules/*.mdc`를 예상합니다.

---

## 🏗 AI 네이티브 아키텍처의 8가지 기둥

1. **컨텍스트 ("무엇을")**: *`PROJECT_MAP`, `Domains`, `Architecture`*
2. **규칙 ("지침 및 제약")**: *`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`*
3. **계약 ("연결 방법")**: *`Protocols`, `Schemas`, `API Definitions`*
4. **스킬 ("특정 작업을 수행하는 방법")**: *`SKILL.md`*
5. **워크플로우 ("오케스트레이션 방법")**: *`SOPs`*
6. **도구 ("세계와 상호작용하는 방법")**: *`MCP Servers`, `CLI Scripts`*
7. **검증 ("증거")**: *`Tests`, `Validators`, `Hooks`*
8. **인간 / 에이전트 경계 ("신뢰 장벽")**: *`MANUAL_TASKS.md`*
