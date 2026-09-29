# AI-Native Repository Standard

[🇺🇸 English](README.md) | [🇨🇳 简体中文](README.zh-CN.md) | [🇹🇼 繁體中文](README.zh-TW.md) | [🇯🇵 日本語](README.ja.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇩🇪 Deutsch](README.de.md) | [🇷🇺 Русский](README.ru.md) | [🇺🇦 Українська](README.uk.md) | [🇧🇷 Português](README.pt-BR.md) | [🇰🇷 한국어](README.ko.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇸🇦 العربية](README.ar.md)

> **Don't just give AI more context. Give it a native workspace.**
> **AI에게 단지 더 많은 문맥을 주지 마세요. 네이티브 작업 공간을 제공하세요.**

AI 코딩 에이전트가 자율적으로 이해하고, 탐색하고, 수정하며, 검증할 수 있는 저장소를 구축하기 위한 표준, CLI 스캐폴드 및 참조 아키텍처입니다.

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
