# AI-Native Repository Standard & Reference Implementation (AI-Native リポジトリ標準と参照実装)

[🇺🇸 English](README.md) | [🇨🇳 简体中文](README.zh-CN.md) | [🇹🇼 繁體中文](README.zh-TW.md) | [🇯🇵 日本語](README.ja.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇩🇪 Deutsch](README.de.md) | [🇷🇺 Русский](README.ru.md) | [🇺🇦 Українська](README.uk.md) | [🇧🇷 Português](README.pt-BR.md) | [🇰🇷 한국어](README.ko.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇸🇦 العربية](README.ar.md)

> **「ベンダー各社は AI がどのようにリポジトリへ入るかを標準化し、ANR はリポジトリ自体が AI にとって持続可能な資産としてどう設計されるべきかを標準化する。」**

AI コーディングエージェントが自律的に理解し、ナビゲートし、変更し、検証できるリポジトリを構築・維持するための、クロスエージェント標準、参照アーキテクチャ、およびライフサイクルガバナンスプラットフォーム。

---

## 🤔 ANR は必要ですか？（2つのパスの選択肢）

**AI フレンドリーなリポジトリを構築するために、ANR をインストールすることは必須ではありません。**  
現代のエージェントランタイム（Claude Code、OpenAI Codex、Cursor、Gemini CLI、Copilot）は、すでにネイティブな instructions、rules、hooks、skills 機構を提供しています。ANR の本質は、**ランタイム実行能力（エージェントがどう動作するか）**と**リポジトリコンテキストアーキテクチャ・ガバナンス（コードベースがどう資産として組織されるか）**を明確に分離することです。

### パス A：ツール不要の手動ミニマム構成 (Minimum Manual Setup — 個人開発・プロトタイプ向け)
個人プロジェクトや小規模リポジトリの場合、外部 CLI をインストールする必要は一切ありません。ANR のコア原則に従うだけで十分です：
1. **最小限のグローバルルーター**：ルート直下の `AGENTS.md`（または `CLAUDE.md` / `GEMINI.md`）を予算 `<= 2048 bytes (2 KiB)` に収め、航空管制官としてルーティングのみを行い、アーキテクチャ百科事典をプロンプトに詰め込まない。
2. **Agent Skills によるワークフローモジュール化**：再利用可能な手順をオープンな [Agent Skills](https://agentskills.io) 標準形式で `.agents/skills/<skill-name>/SKILL.md` に配置する。
3. **構造化されたドメインと契約層**：業務アーキテクチャは `docs/domains/` に、DB スキーマや API 契約は `docs/contracts/` に分離する。
4. **タスクに応じた漸進的コンテキスト開示**：エージェントに現在のタスクに関連するパスのみを読み込ませる。
5. **決定論的検証**：エージェントが完了を宣言する前に必ずパスすべきテストおよびビルドコマンドを定義する。
6. **執行可能な人間の権限境界**：機密設定やリリーススクリプトへの変更をフックや CI で確実にブロックする。

---

### パス B：標準化ライフサイクルプラットフォーム (ANR CLI — チーム・マルチエージェント環境向け)
複数の開発者や複数の AI エージェントが協調する本番リポジトリでは、ANR が監査済みのライフサイクルフレームワークを提供します：
- **クロスエージェントの移植性**：単一のセマンティックソース（`docs/`, `.agents/skills/`）を Claude Code、Codex、Cursor、Gemini CLI にルール重複なくクリーンにマッピング。
- **マルチリポジトリの統治**：数十のマイクロサービスやライブラリ間で、一貫した構造標準、契約仕様、権限境界を維持。
- **Day 2 のライフサイクル保守**：`anr update`（所有権を認識した JSON マージと `--prune` 廃止検知）と `anr doctor`（リンク切れ・スキル適合性診断）により、コンテキストの腐敗を防止。

---

## 🚀 クイックスタート: CLI スキャフォールド

手動でファイルをコピーする必要はもうありません。好みのエージェントランタイムとプロジェクトの複雑さに合わせた AI-Native ワークスペースを即座に構築するための強力な CLI を提供します。

**空のディレクトリで以下のコマンドを実行してください:**

```bash
npx ai-native-repo init .
```

### 12 のテンプレートマトリックス
CLI は、12 のテンプレートマトリックス（4 ランタイム × 3 ティア）から選択するように対話形式で求めます。

**ステップ 1: エージェントランタイムの選択**
- `claude-code`: 純粋な Anthropic エコシステムのフックとスキル。
- `codex`: 純粋な OpenAI/Codex エージェント構造。
- `cursor`: Cursor の `.cursor/rules/*.mdc` グローバルマッチングに最適化。
- `gemini-cli`: 純粋な Google Gemini 環境。

**ステップ 2: 複雑さのティア（階層）の選択**
- `light`: 単純なスクリプト用の最小限のコンテキストファイル。
- `standard`: デフォルト。本番サービス向けの完全なコンテキスト、契約、およびルールのアーキテクチャ。受け入れ基準、タスク計画、rubric に基づく独立レビューを含みます。
- `full`: 高成熟度のガードレール。standard に加え、パスガードレール（読み取り専用 / 追記のみのファイル。フックまたは CI で強制）、コンテキスト鮮度チェック、コンテキスト層の行動評価を含みます。

*または、フラグで対話プロンプトをスキップできます:*
```bash
npx ai-native-repo init . --runtime cursor --tier standard
npx ai-native-repo init . --runtime claude-code --tier full --lang zh-CN   # en (default) | zh-CN | ja
```

---

## 🎯 コア設計哲学：二重の「漸進的」アーキテクチャ (The Dual Progressive Architecture)

多くの AI プロンプトテンプレートが複雑なプロジェクトで失敗する理由は 2 つあります。**一度に大量のコンテキストを詰め込むことによる注意力の低下（Context Bloat）**、そして**導入ハードルの高さから既存プロジェクトへの適用が困難であること**です。本標準は 2 つの「漸進的（Progressive）」アプローチによってこれらを解決します。

### 1. 漸進的コンテキスト開示 (Progressive Context Disclosure) —— AI の注意力を保護
> **Context Must Be Earned（コンテキストは必要な時にのみ獲得されるべきである）。**

AI に何万語もの巨大なドキュメントを読ませてはいけません。グローバルエントリポイント（`AGENTS.md`）は厳格に **<= 2048 bytes (2 KiB)** に制限され、軽量な「航空管制官」として機能します。AI はタスクに応じて必要なコンテキストを階層的に展開し、決して一度にすべてをロードしません。

* **L0: Agent Rules (<= 2048 bytes)** → AI はどう動作すべきか？（行動規範とグローバルルーティング）
* **L1: Project Map (< 100行)** → プロジェクトの全体像と構成要素はどこにあるか？（物理マップ）
* **L2: Architecture / Domain** → このビジネス領域は何を解決するものか？
* **L3: Interface / Contract** → コンポーネント間の境界とインターフェースは何か？
* **L4: Invariants / Tests** → 破ってはならない不変条件は何か？どう検証するか？
* **L5: Implementation** → 実際のソースコード実装

**現在のタスクに必要なコンテキストのみを読み込む**ことで、トークンコストを大幅に削減し、長大なプロンプトによるモデルの注意力低下やハルシネーション（幻覚）を根本から防ぎます。

### 2. 漸進的リポジトリ導入 (Progressive Repository Adoption) —— 既存プロジェクトへの摩擦ゼロの導入
> **作り直す必要はありません。既存プロジェクトも 10 分で AI-Native に進化できます。**

一晩でレガシーコード全体のドキュメントを書き上げる必要はありません。本標準の **Tier（階層）モデル** により、プロジェクトは自然に進化します。

* **Day 1 (Tier 1: Light) — 10分で完了するミニマム導入**: コードの書き換えは不要。2KB 未満のルーターを配置し、AI に既存ディレクトリをスキャンさせてリアルな `PROJECT_MAP.md` を生成、`MANUAL_TASKS.md` で禁止事項を設定します。これだけで AI が迷子になるのを防ぎます。
* **Day 30 (Tier 2: Standard) — オンデマンドな知識蓄積**: 触る部分だけを文書化。AI が特定モジュール（例: 認証）を改修する際に `domains/auth.md` を整備し、`verify` スキルによるテスト閉ループを導入します。
* **Day 90 (Tier 3: Full) — エンタープライズガードレール**: チームの習熟に合わせて、読み取り専用/追記専用パスの保護（Guardrails）や CI でのコンテキスト鮮度チェックを導入します。

---

## ⚠️ 意味論に依存せず、ランタイムを認識し、モデルを調整可能 (Semantic-Agnostic, Runtime-Aware, Model-Tunable)

**「意味論（セマンティクス）は統一されているが、ランタイムは断片化している。」**

2026年現在、AI-Native リポジトリの構築には 3 つの異なる層を分離する必要があることが業界で認識されています。
1. **モデル / モデルプロバイダー** (例: OpenAI, Anthropic, Google, DeepSeek, Qwen, Meta, Moonshot, Zhipu, MiniMax): 基盤となるモデルの生の能力と推論力を決定します。ここに特定のモデルバージョンをハードコードしてはいけません — Runtime × Model Provider の全体像は [モデル互換性マトリックス](spec/model-compatibility.md) を参照してください。
2. **エージェントランタイム** (例: Claude Code, Codex, Gemini CLI, Cursor): ファイルが*どのように*読み取られ、スキルが*いつ*呼び出され、フックが*何を*実行するかを決定します。
3. **リポジトリ標準**: プロジェクトの普遍的な意味論的真実。

プロジェクトのビジネス意味論は**モデル非依存**ですが、**ランタイム認識**である必要があります。
- **Anthropic の Claude Code** は `.claude/settings.json`（ライフサイクルフック中心）を想定しています。
- **Cursor** は `.cursor/rules/*.mdc`（複数モデルにまたがるグロブマッチング中心）を想定しています。

**モデルプロバイダー ≠ エージェントランタイム — この2つを1つの軸に統合してはいけません。** 1つのランタイムが特定の1つのモデルプロバイダーに専属することはありません（Cursor と Claude Code はどちらも Anthropic、OpenAI、あるいは DeepSeek のような API 互換プロバイダーで駆動できます）。だからこそ、モデルプロバイダーは独立した Template にするのではなく、[モデル互換性マトリックス](spec/model-compatibility.md) に別途記録します。

### 参照リポジトリ (Reference) vs 消費リポジトリ (Consumer)
- **本リポジトリ (Reference)**: この GitHub リポジトリはグローバルな*参照リポジトリ*です。複数のアダプター、テンプレートジェネレーター、CLI のソースコードを含みます。
- **あなたのリポジトリ (Consumer)**: CLI によって生成されたリポジトリは*消費リポジトリ*です。AI エージェントが競合するルールセットに混乱しないよう、**1 つ**の Runtime アダプターと **1 つ**の Tier のみを含むべきです。

### 現在のリファレンスランタイム vs 新興ランタイム
本リポジトリは現在、4 つの**リファレンスランタイム**（`claude-code`、`codex`、`gemini-cli`、`cursor`）に一級のテンプレートを提供しています。Qwen Code、DeepSeek Harness、Windsurf、GitHub Copilot などその他の実在するランタイムは、[モデル互換性マトリックス](spec/model-compatibility.md) に**新興ランタイム**として記録されており、慣習が安定すればリファレンスランタイムに昇格する可能性があります。

---

## 🏗 AI-Native アーキテクチャの 8 つの柱

このスタンダードは、リポジトリを「AI が読むための本」から「AI が操作するためのワークスペース」へと引き上げます。8 つのアーキテクチャ層を定義します。

1. **コンテキスト (The "What")**: *`PROJECT_MAP`, `Domains`, `Architecture`*
2. **ルール (The "Instructions & Constraints")**: *`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`*
3. **契約 (The "How they connect")**: *`Protocols`, `Schemas`, `API Definitions`*
4. **スキル (The "How to do a specific task")**: *`SKILL.md`*
5. **ワークフロー (The "How to orchestrate")**: *`SOPs`, `Plans`*。受け入れ基準の定義から始まり、`docs/plans/` のバージョン管理されたタスク計画で次のセッションが続きから進める。
6. **ツール (The "How to touch the world")**: *`MCP Servers`, `Deterministic CLI Scripts`, `.agents/tools.md`*
7. **検証と評価 (The "Evidence")**: *`Tests`, `Validators`, `Hooks`, `Review`, `Evals`*。まず決定的チェック（exit 0 まで完了ではない）。その後、コマンドでは判定できない部分（受け入れ基準、範囲、ドキュメントの正しさ）だけを**制約された LLM-as-a-judge** がレビューする：バージョン管理された rubric、独立したコンテキスト、`UNKNOWN` を許容し、失敗したチェックを覆す権限はない。行動評価はコンテキスト層そのものを検証する。
8. **人間とエージェントの境界 (The "Trust barrier")**: *`MANUAL_TASKS.md`*

---

## 📂 開発者ガイド

AI-Native Repository Standard 自体に貢献したい場合:

```text
AI-Native-Repo/ (Reference Repository)
│
├── spec/                        # 標準：ツールに依存しない理論と哲学
├── cli/                         # `npx ai-native-repo` ツールのソースコード
├── template-source/             # すべてのテンプレートの唯一の信頼できる情報源
│   ├── common/                  # 共有ドキュメント (Light, Standard, Full)
│   └── runtimes/                # ランタイム固有のアダプター (Claude, Cursor など)
│
├── scripts/
│   ├── generate-templates.js    # 12 マトリックスの組み合わせを cli/templates/ にビルド
│   └── validate.sh              # リポジトリ標準の整合性を検証する CI パイプライン
└── anr.yaml                     # 機械可読なマニフェスト
```
