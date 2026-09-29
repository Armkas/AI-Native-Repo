# AI-Friendly Project —— 理念

[🇬🇧 English](philosophy.md) | [🇨🇳 简体中文](philosophy.zh-CN.md)

> **⚠️ Notice: This Japanese translation is currently outdated and refers to the older "AI-Friendly Project" terminology instead of the 2.0 "AI-Native Repository Standard". Please refer to the English or Chinese versions for the most up-to-date architecture.**

> **AI にコードを増やすのではなく、より良い構造を与える。**

本書は [AI-Friendly Repo 標準](repository-standard.md) の背後にある**理由**を説明する。
標準は**どのルールに従うか**を示し、本書は**なぜそのルールが存在するか**を示す。

---

## 一文の定義

> **AI-Friendly Project** とは、AI コーディングエージェントのために設計されたリポジトリ
> アーキテクチャである。構造化されたナレッジレイヤー、漸進的コンテキスト、明確な
> ドメイン境界、Interface / Contract、Invariant、ADR、依存インデックス、検証可能な
> テストを通じて、AI が**最小限のコンテキスト**で大規模コードベースを正しく理解・
> ナビゲート・変更・保守できるようにする。

目指すのは：

> AI にプロジェクト全体を読ませること

ではなく：

> **プロジェクト全体を読まなくても、AI が正しく理解できること。**

## 二つの平面：AI Context Architecture + Software Architecture

AI-Friendly Repo は新しい MVC でも「AI-MVVM」でもない。従来のアーキテクチャは陳腐化していない。

既存のソフトウェアアーキテクチャの上に **Agent Context Layer** を加える。

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
AI-Friendly Repository
│
├── AI Context Architecture
│       = エージェントがコードを理解・ナビゲート・検証する方法
│
└── Software Architecture
        = プログラムの動き方
```

ソフトウェアアーキテクチャは従来どおりでよい：

```text
iOS:
MVVM / TCA / Clean / Feature Architecture

Backend:
DDD / Clean / Hexagonal / Dependency Inversion
```

全体モデル：

```text
                    AI-Friendly Repo
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

**Runtime Architecture** —— プログラムはどう動くか：

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

**Cognitive Architecture** —— AI はどうプログラムを理解するか：

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
Runtime Flow     →  プログラムはどう動くか？
Cognitive Flow   →  AI はどうプログラムを理解するか？
```

エージェントが辿るスタックは：

```text
Agent Layer            AI はどう働くべきか
Knowledge Layer        プロジェクトは何か、なぜ、どのルールか
Software Architecture  MVVM / DDD / Clean / Hexagonal / TCA / …
Implementation         Swift / Python / SQL / インフラ
```

本標準は単一のランタイムアーキテクチャを**規定しない**。iOS は MVVM や TCA のままでよく、バックエンドは DDD、Clean、Hexagonal、Vertical Slice のままでよい。選んだ Runtime Architecture が何であれ、AI Context Architecture を満たさなければならない。

AI-Friendly ≠ Abstraction-Heavy。こうではない：

```text
UserService
IUserService
UserServiceProtocol
BaseUserService
UserServiceFactory
UserServiceAdapter
UserServiceFacade
```

こうである：

```text
一つの明確な責務
        +
一つの明確な Interface
        +
一つまたは少数の Implementation
        +
明確なルール
```

> **Explicit structure であり、excessive abstraction ではない。**

本書の残り（マップ、契約、不変条件、ADR、インデックス、テスト）が AI Context Architecture である。Feature 境界と依存性逆転はランタイム平面をエージェントが使いやすくするだけで、置き換えるものではない。

---

# I. コアの考え方

## 1. プロジェクトはコードだけでなく、知識でもある

従来のプロジェクトはおおよそ：

```text
code + a short README + comments
```

AI-Friendly なプロジェクトは：

```text
AI Context Architecture  +  Software Architecture  →  Implementation
```

ナレッジレイヤーが AI Context Architecture である。コードレイヤーはランタイムアーキテクチャと実装を持つ：

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
    ├── iOS                  例：Feature + MVVM / Clean
    ├── backend              例：Feature + DDD / Hexagonal
    ├── web
    ├── worker
    └── other systems
```

## 2. 目的は「理解」であって「取り込み」ではない

誤った目的：コンテキストウィンドウを十分大きくして、プロジェクト全体を詰め込む。

正しい目的：

> **Small Context → Large Understanding（小さなコンテキスト → 大きな理解）**

## 3. ますます大きくなるコンテキストウィンドウに依存しない

ウィンドウが大きいほど理解が深まるわけではない。プロジェクトは、無関係・重複・
隠れた・冗長な情報を積極的に**減らし**、情報密度・構造化・位置特定性・検証可能性を
**高める**べきである。

## 4. AI はプロジェクトを「ナビゲート」すべきで、「スキャン」すべきでない

理想：

```text
問い → マップ → ドメイン特定 → モジュール特定 → インターフェース読解
     → ルール読解 → テスト読解 → （必要な場合のみ）実装読解
```

ではなく：

```text
問い → リポジトリ全体を grep → 大量のファイルを読む → アーキテクチャを推測
```

---

# II. ナレッジレイヤー

## 5. ナレッジレイヤーとコードレイヤーは論理的に分離する

- ナレッジレイヤー：プロジェクトが何か、なぜこの設計か、どこに何があるか、どのルールが適用されるか。
- コードレイヤー：具体的にどう実装されているか。

それぞれ単独で理解できること。

## 6. ドキュメントはコードの複製ではない

コードは **How** を、ドキュメントは **What / Why / Where** を記述する。ドキュメントは
関数の一行ごとの実行を語るのではなく、それが何であり、なぜ存在し、何に制約され、
どこにあるかを述べる。

## 7. ドキュメントは「ルーター」として機能する

`AGENTS.md` はナビゲーターであり、AI に *次にどこへ行くか* を伝える。実際の知識は
`PROJECT_MAP.md`、`ARCHITECTURE.md`、ドメインドキュメントにある。

---

# III. 階層化コンテキスト

## 8. 漸進的開示（Progressive Disclosure）

AI は一度にすべてを得るべきではなく、レベルごとに降りていく：

```text
L0  Agent Rules        →  AI はどう働くべきか？
L1  Project Map        →  プロジェクトは何か？どこに何があるか？
L2  Architecture/Domain →  このビジネスは何か？
L3  Interface/Contract →  このモジュールは何ができるか？
L4  Invariant/ADR/Tests →  何を破ってはいけないか？なぜこの設計か？どう振る舞うべきか？
L5  Implementation     →  具体的にどう実装されているか？
```

現在のレベルで情報が不足する場合のみ次へ進む。

## 9. 各レベルはちょうど一種類の問いに答える

（対応は規則 8 を参照。）これらを一つの超巨大ドキュメントに統合しないこと。

## 10. 各レベルにはコンテキスト予算がある

> **10 個の事実を伝えるために 1000 行を費やさない。**

巨大な一枚岩ドキュメントより、短いマップ・短いルール・的確なインターフェース・
的確なインデックスを優先する。

---

# IV. エージェントルール

## 11. ルートには単一のエージェント作業契約が必要

`AGENTS.md` が定義する：プロジェクトが何か、どこから読み始めるか、デフォルトの読解順、
アーキテクチャ原則、テストルール、変更ルール、禁止事項。

## 12. `AGENTS.md` を巨大プロンプトにしない

数千行の技術詳細ではない。エージェントに *どう働くか* と *詳細をどこで探すか* だけを伝える。

## 13. エージェントルールはスコープ化できる

```text
AGENTS.md
ios/AGENTS.md
backend/AGENTS.md
```

コードに近いルールほど具体的になる。`backend/features/voice/` で作業するとき、AI は
グローバルルール + バックエンドルール + Voice ドメインルールを積み重ねる。

---

# V. プロジェクトマップ

## 14. グローバルなプロジェクトマップが必要

第一層の認識を確立する：目的、トップレベルディレクトリ、サブシステム、主要ドメイン、
主要エントリポイント、コアデータフロー、重要ドキュメントの場所。

## 15. プロジェクトマップは短くする

その役割は AI に次にどこへ行くかを伝えることであり、すべての行を説明することではない。
目安は約 100 行。

## 16. コンテキストインデックスが必要

これは **X はどこにあるか？** に答える。

```text
VoiceService   → backend/features/voice/application/
SpeechService  → backend/features/voice/interface/
VoiceSession   → ios/features/voice/interface/
```

## 17. コンテキストインデックスは可能な限り自動生成する

機械が生成：ファイル、シンボル、クラス、プロトコル、関数、参照、インポート、依存、
テストと実装の対応。
人間が保守：ビジネス上の意味、アーキテクチャの意図、設計理由、ビジネスルール。

---

# VI. コードアーキテクチャ

ランタイムパターン（MVVM、DDD、Clean など）はプロジェクトが選ぶ。本標準が求めるのは、エージェントが着地できる**明確な境界**があることである。

## 18. ファイル種別ではなく、フィーチャー / ドメインで構成する

```text
features/            NOT   controllers/
├── voice/                 services/
├── navigation/            models/
├── account/               utils/
└── billing/
```

## 19. フィーチャーは AI の主要なコンテキスト境界

タスクは `services/`、`models/`、`controllers/`、`utils/` に散らばる数十のファイルではなく、
`features/voice/` の中に収まるのが理想。

## 20. ドメイン境界は明示する

各ドメインが定義する：何を担当し、何を担当せず、何に依存し、誰に使われ、どの
インターフェースを公開し、どのルールとテストを持つか。

---

# VII. Interface / Contract

## 21. 重要なビジネス能力は明示的に抽象化する

Swift の `protocol`、Python の `Protocol`、または同等の interface / trait / abstract type。

求めるのは明確な構造であり、過剰な抽象ではない。一つの責務 → 一つのインターフェース → 少数の実装。使われない Adapter の山はエージェントを助けるどころか困らせる。

## 22. Interface は Implementation より先に読まれる

まず *これは何ができるか*、次に *どうやるか*。

## 23. Interface はメソッドシグネチャ以上のもの

良い Interface は表現する：責務、入力、出力、エラー、副作用、制約。

```text
SpeechService
  責務:   Audio → Text
  エラー: provider error → domain error
  副作用: ユーザーコマンドを実行してはならない
  制約:   ネットワーク障害時は fallback 可
```

## 24. API Contract と Domain Contract を分離する

HTTP Request/Response は Domain Service Interface と同じではない。

---

# VIII. Implementation

## 25. Implementation は Interface と分離する

```text
voice/
├── interface/        能力を定義
├── application/      能力を編成
├── domain/           能力をモデル化
└── infrastructure/   能力を提供
```

## 26. デフォルトは「展開しない」であって「正しいと仮定する」ではない

不要なら Implementation を読まない。しかし常に正しいと**仮定しない**。テスト失敗、
異常な振る舞い、Contract で説明できない、実装にバグの疑いがある場合は掘り下げる。

---

# IX. ビジネスルール

## 27. ビジネスルールは独立して存在する

実装コードの中だけに埋めない：

```text
無音 > 20s        → 連続音声を終了
ネットワーク切断  → fallback
高リスク操作      → ユーザー確認を要求
```

## 28. Invariant は実装をまたぐ制約

Implementation は差し替え可能。Invariant は、製品要件が変わらない限り、みだりに
変更してはならない。コード変更前に、AI はまず Invariant を確認する：*まだ成立するか？*

---

# X. ADR

## 29. 重要なアーキテクチャ決定はすべて「なぜ」を記録する

なぜ WebSocket か？なぜ Repository か？なぜ Router が DB を直接呼べないか？なぜこの
キャッシュ戦略か？

## 30. ADR は代替案を記録する

問題、決定、理由、却下した代替案、コスト、再検討の条件。これにより AI が
**意図的な複雑性** を **自由に単純化してよいコード** と取り違えるのを防ぐ。

---

# XI. 依存関係

## 31–33. プロジェクトは三つの問いに答えられる

```text
X は誰に依存するか？   VoiceService → SpeechService, LLMService, Validator
誰が X を使うか？       SpeechService ← VoiceService, VoiceSession
X を変えると何が壊れるか？ SpeechService → VoiceService, VoiceRouter, VoiceSessionTests, ...
```

## 34. 依存 / 影響マップは自動生成すべき

`SYMBOL_INDEX`、`DEPENDENCY_GRAPH`、`IMPACT_GRAPH` は機械が知りうる。人手で保守させない。

---

# XII. 命名

## 35. 命名は AI のインデックスである

`SpeechRecognitionService`、`NavigationRouteCalculator`、`VoiceCommandRouter` を優先。
`Manager`、`Helper`、`Utils`、`Common`、`Worker`、`Handler` は、具体的な意味を持たない限り避ける。

## 36. 1 ファイル 1 つのコア責務

ネットワーク・DB・ナビゲーション・音声・分析・UI を一手に担う 2000 行の
`MegaManager.swift` を作らない。ファイル境界こそがコンテキスト境界。

## 37. ソースファイルサイズ

AI-Friendly なリポジトリは、手動で保守される巨大なソースファイルを避けるべきである。

ガイドライン：

- **≤ 300 行**：推奨
- **301–500 行**：許容
- **501–800 行**：責務境界を検討
- **801–1000 行**：リファクタリングを検討すべき
- **> 1000 行**：通常は分割すべき
- **> 1500 行**：アーキテクチャ上の問題として扱うべき

生成ファイル、スナップショット、マイグレーション、スキーマ、その他機械生成のアーティファクトは、適切な場合に限り例外とする。

**目標は行数を減らすことではなく、認知境界を小さくすることである。**

---

# XIII. テスト

## 38. テストはナレッジレイヤーとコードレイヤーの橋

検証メカニズムであると同時に、**実行可能な知識（executable knowledge）**でもある。

## 39. テスト名は振る舞いを表現する

`test1()` ではなく `testNetworkFailureFallsBackToLocalRecognition()`。

## 40. まずローカルで検証し、次にグローバルで検証する

```text
変更 → focused unit test → integration test → （必要なら）full suite
```

トークン節約のために単一スクリプトだけを永続的に走らせない。

---

# XIV. 生成コンテンツ

## 41. Source of Truth は単一であること

自動生成物（`generated/`）は **DO NOT EDIT** と明記する。ソースを変更し、再生成する。

---

# XV. ドキュメントとコードの矛盾

## 42. ドキュメントは絶対的真理ではない

古くなりうる。真理の階層：

```text
実際のテスト / 実際の振る舞い
 → 現在の実装
 → Contract
 → ドキュメント
 → コメント
```

矛盾があるとき、片方をこっそり直さない。矛盾を特定し、正しい Source of Truth を修正する。

---

# XVI. 無意味なコンテキストの回避と Token 削減

## 43. 除外設定によるノイズの明示的隔離

`build/`、`DerivedData/`、`Pods/`、`node_modules/`、`.venv/`、`cache/`、`logs/`、
バイナリファイル（`.gguf`, `.bin`）、環境変数（`.env*`）は明示的に除外されなければならない。
除外には各 Runtime 固有の仕組みを使う：Claude Code は `permissions.deny` の `Read(...)` ルール、Cursor は `.cursorignore`、
Gemini CLI は `.geminiignore`。Runtime 横断の共通除外ファイルは存在しない（`.agentsignore` を読む主要 Runtime はなく、
Codex には除外ファイル自体がない）ため、シークレットは作業ツリーの外に置くこと。
コンパイラ出力やバイナリノイズでコンテキスト予算を消費してはならない。

## 43.1 マルチ AI アダプター体系 (Multi-Agent Adapters)

Claude Code、Gemini、Windsurf、Cursor などの異種 AI ツールが混在する現場では、各ツールが異なるルートファイルを読み込む（`CLAUDE.md`, `GEMINI.md`, `.cursor/rules/*.mdc`）。
原則として、**`AGENTS.md` を唯一の真実の源 (Single Source of Truth)** とし、その他のツール用ファイルは `@AGENTS.md` をインポートする軽量な「アダプター（Adapter）」として機能させ、モデル固有の回避指示のみを追記する。

## 43.2 人間と AI の責任境界 (MANUAL_TASKS.md)

AI は全能ではない。サードパーティ製コンソール設定（Cloudflare, Stripe, Apple Developer）、本番シークレットの注入、実機テストなどは、`MANUAL_TASKS.md` に明示的に分離し、透明性のある協調契約を結ぶ。

---

# XVII. AI ワークフロー

## 44. まず位置特定、次に深掘り、コマンド検証とドキュメント防腐化

```text
task → Agent Rules → Project Map → Domain → Interface → Invariant/ADR
     → 関連テスト → 依存/影響 → 実装 → 変更 → 検証コマンド(閉ループ自己診断) → Doc-Sync(知識更新)
```

## 44.1 実行可能な検証コマンドの必須化
コード変更後、AI は単に「完了した」と主張するのではなく、指定された検証コマンド（型チェック、ビルドなど）を実行して確認しなければならない。

## 44.2 ドキュメント防腐化メカニズム (Doc-Sync)
インターフェース、コントラクト、データベース構造を変更した場合は、インデックスとマップを同期更新し、ドキュメントの陳腐化を防ぐ。

## 45. 理由なくリポジトリ全体をスキャンしない

リポジトリ全体のコンテキストは、本当に必要なタスク（例：「プロジェクトの全依存関係を分析する」）のためにとっておく。

## 46. コンテキストは問いとともに漸進的に拡大する

```text
L0 問題がどこにあるか分からない
L1 Voice だと分かる
L2 VoiceSession だと分かる
L3 SpeechService だと分かる
L4 テスト失敗を発見
L5 その実装だけを読む
```

これが **Progressive Context Expansion**。

---

# XVIII. 知識は「問い」を中心に構成する

## 47. ドキュメントは AI が具体的な問いに答えられるようにする

```text
音声を変更       → voice.md
インターフェースを知る → interface
なぜかを知る      → ADR
何が凍結されているか → invariants
何が影響を受けるか  → dependency / impact
振る舞いを確認     → tests
```

これは「すべてを `architecture.md` に詰め込む」より AI-friendly。

---

# XIX. クロスプラットフォームプロジェクト

## 48. ナレッジレイヤーはプラットフォーム非依存

iOS のみ、FastAPI のみ、iOS + FastAPI —— ナレッジレイヤーの考え方は変わらない。

## 49. コードレイヤーは実在するシステムに応じて増減する

```text
iOS のみ:   docs/ ios/
バックエンド: docs/ backend/
フルスタック: docs/ ios/ backend/ web/
```

## 50. システム横断のビジネスは 1 つのドメインを共有する

`docs/domains/voice.md` は `iOS Voice → API → FastAPI Voice → LLM` を一箇所で記述できる。
ドメイン知識は特定の言語に縛られない。

---

# XX. 自動化

## 51. 機械が知りうるものは、機械に任せる

機械：シンボル、参照、インポート、依存、ファイル位置、コールグラフ、テストマッピング。
人間：Why、意図、ビジネスルール、アーキテクチャ決定。

## 52. ドキュメントシステムは自動検証可能であるべき

将来の `anr validate`：Interface は存在するか？各ドメインにドキュメントはあるか？
`AGENTS.md` は有効か？ADR は完全か？アーキテクチャに違反するディレクトリはないか？
依存はレイヤーをまたいでいないか？

## 53. ドキュメントシステムは自動生成可能であるべき

将来の `anr index`：`context-index.md`、`symbol-index.md`、`dependency-map.md` を生成。

## 54. 初期化機能を提供する

将来の `anr init`：`AGENTS.md`、`.agents/`、`docs/` を生成し、どんなプロジェクトも
すぐに AI-friendly 構造へ移行できるようにする。

---

# XXI. 最も重要なアーキテクチャの考え方

## 55–59. AI に推測させない

| 従来 | AI-Friendly |
|---|---|
| コード → AI が推測 → アーキテクチャ | アーキテクチャ → コード |
| ビジネスルールがコードに隠れている | invariants + domain knowledge |
| 「なぜこうなっている？」—— 誰も知らない | ADR |
| どこにあるかをグローバル検索 | Context Index |
| 小さな問題の理解に大きなコンテキスト | Progressive Disclosure |

---

# XXII. 最終モデル

```text
                    AI-Friendly Repo
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

Cognitive Architecture（エージェントの理解）は Runtime Architecture（プログラムの動き）の上に載る：

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

> **AI-Friendly Repo は AI にコードを増やすことではなく、AI により良い構造を与えること。**
