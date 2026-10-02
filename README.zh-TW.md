# AI-Native Repository Standard

[🇺🇸 English](README.md) | [🇨🇳 简体中文](README.zh-CN.md) | [🇹🇼 繁體中文](README.zh-TW.md) | [🇯🇵 日本語](README.ja.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇩🇪 Deutsch](README.de.md) | [🇷🇺 Русский](README.ru.md) | [🇺🇦 Українська](README.uk.md) | [🇧🇷 Português](README.pt-BR.md) | [🇰🇷 한국어](README.ko.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇸🇦 العربية](README.ar.md)

> **Don't just give AI more context. Give it a native workspace.**
> **不要只是給 AI 更多的上下文。給它一個原生的工作區。**

這是一個標準、CLI 腳手架和參考架構，用於構建 AI 編碼代理可以自主理解、導航、修改和驗證的代碼庫。

---

## 🚀 快速開始：CLI 腳手架

你不再需要手動複製文件。我們提供了一個強大的 CLI，可以根據你偏好的代理運行時 (Agent Runtime) 和項目複雜度，立即搭建一個 AI-Native 工作區。

**在任何空目錄中運行以下命令：**

```bash
npx ai-native-repo init .
```

### 12-模板矩陣
CLI 會互動式地要求你從我們的 12-模板矩陣（4 種運行時 × 3 種層級）中進行選擇：

**步驟 1：選擇你的代理運行時**
- `claude-code`: 純粹的 Anthropic 生態系統鉤子 (hooks) 和技能。
- `codex`: 純粹的 OpenAI/Codex 代理結構。
- `cursor`: 針對 Cursor 的 `.cursor/rules/*.mdc` 進行了全局匹配優化。
- `gemini-cli`: 純粹的 Google Gemini 環境。

**步驟 2：選擇你的複雜度層級**
- `light`: 用於簡單腳本或原型的最基本上下文文件（PROJECT_MAP + 核心規則）。
- `standard`: 默認選項。適用於生產服務的完整上下文、契約和規則架構。
- `full`: 企業級。在 standard 基礎上增加路徑護欄（唯讀 / 僅追加檔案，由鉤子或 CI 強制執行）與上下文新鮮度檢查腳本。

*或者，你可以通過參數跳過提示：*
```bash
npx ai-native-repo init . --runtime cursor --tier standard
npx ai-native-repo init . --runtime claude-code --tier full --lang zh-CN   # en (default) | zh-CN | ja
```

---

## 🎯 核心設計哲學：雙重「漸進式」架構 (The Dual Progressive Architecture)

市面上大多數 AI Prompt 範本在複雜專案中迅速失效，根源在於兩大痛點：**一次性塞入過多規則導致模型注意力崩潰（Context Bloat）**，以及**門檻過高導致已有老專案無法落地**。本標準透過兩層漸進式設計徹底解決這兩個問題：

### 1. 上下文漸進式披露 (Progressive Context Disclosure) —— 保護 AI 注意力
> **Context Must Be Earned（上下文必須按需獲取）。**

不要給 AI 塞入幾萬字的超級大文件。全域入口（`AGENTS.md`）嚴格限制在 **< 2 KB**，充當極簡的「空中交通管制員（Traffic Controller）」。AI 根據任務按需逐層展開上下文，絕不一次性全量載入：

* **L0: Agent Rules (< 2KB)** → AI 怎麼工作？（行為紅線與全域路由）
* **L1: Project Map (< 100行)** → 專案是什麼？核心組件在哪裡？（物理地圖）
* **L2: Architecture / Domain** → 這個具體業務領域在解決什麼問題？
* **L3: Interface / Contract** → 組件之間如何定義邊界與協議？
* **L4: Invariants / Tests** → 什麼規則絕對不能破壞？如何進行閉環驗證？
* **L5: Implementation** → 具體業務程式碼實現

**每次任務僅按需獲取當前層級上下文**，既大幅節省 Token 成本，又徹底消除了大模型在超長上下文中的注意力渙散與程式碼幻覺。

### 2. 倉庫漸進式採納 (Progressive Repository Adoption) —— 存量老專案零門檻落地
> **無需推倒重來，任何已寫好的老專案都能在 10 分鐘內漸進式進化。**

你完全不需要在一夜之間為整個老倉庫補齊所有架構文件。透過本標準的 **Tier 階梯複雜度模型**，已有專案可以自然生長：

* **Day 1（Tier 1: Light）極簡接入（10 分鐘）**：無需重構任何程式碼。生成 2KB 極簡路由，讓 AI 掃描現有目錄自動生成真實的 `PROJECT_MAP.md`，並在 `MANUAL_TASKS.md` 劃定敏感路徑紅線。AI 立即停止跨模組亂翻亂猜。
* **Day 30（Tier 2: Standard）按需沉澱**：不為寫文件而寫文件。僅當 AI 正在修改某具體業務模組時，順手沉澱出對應的 `domains/*.md`，並接入 `verify` 自動化測試閉環。
* **Day 90（Tier 3: Full）成熟護欄**：團隊完全建立信任後，配置唯讀/唯追加路徑攔截（Guardrails）與死鏈/新鮮度檢查（Freshness Check）。

---

## ⚠️ 語義無關，運行時感知，模型可調 (Semantic-Agnostic, Runtime-Aware, Model-Tunable)

**"語義是統一的，但運行時是碎片化的。"**

截至 2026 年，業界已經意識到，構建一個 AI-Native 代碼庫需要分離三個不同的層次：
1. **模型 / 模型提供商 (The Model / Model Provider)**（例如 OpenAI、Anthropic、Google、DeepSeek、Qwen、Meta、Moonshot、智譜 (Zhipu)、MiniMax）：決定底層模型的原始能力和推理水準。這裡絕不要寫死具體的模型版本號——完整的運行時 × 模型提供商對應關係請見[模型相容性矩陣](spec/model-compatibility.md)。
2. **代理運行時 (The Agent Runtime)**（例如 Claude Code, Codex, Gemini CLI, Cursor）：決定*如何*讀取文件、*何時*調用技能以及*執行什麼*鉤子。
3. **代碼庫標準 (The Repository Standard)**（例如上下文、契約、工作流）：你的項目的全局統一語義真相。

雖然你項目的業務語義是**模型無關**的（OpenAI 和 Anthropic 模型都能理解 `docs/domains/voice.md` 文件），但它們必須是**運行時感知**的。
- **Anthropic 的 Claude Code** 期望存在 `.claude/settings.json`（專注於生命周期鉤子）。
- **Cursor** 期望存在 `.cursor/rules/*.mdc`（專注於多模型全局匹配）。

**Model Provider ≠ Agent Runtime，兩者不可合併成同一個維度。** 一個 Runtime 從不專屬於某一個 Model Provider——Cursor 和 Claude Code 都能由 Anthropic、OpenAI，或是 DeepSeek 這類相容 API 的提供商驅動；同一個提供商的模型也可能出現在多個 Runtime 中。這正是 Model Provider 被單獨記錄在[模型相容性矩陣](spec/model-compatibility.md)、而非成為獨立 Template 的原因。

### 參考代碼庫 vs. 消費代碼庫
- **本代碼庫 (Reference)**：這個 GitHub 代碼庫是全局的*參考代碼庫*。它包含多個適配器、模板生成器和 CLI 代碼。
- **你的代碼庫 (Consumer)**：由 CLI 生成的代碼庫是*消費代碼庫*。它應該包含**恰好一個**運行時適配器和**一個**層級，確保 AI 代理永遠不會被相互衝突的規則集所困擾。

### 當前的參考運行時 (Reference Runtimes) 與新興運行時 (Emerging Runtimes)
本代碼庫目前為四種**參考運行時**提供開箱即用的模板：`claude-code`、`codex`、`gemini-cli`、`cursor`。其他真實存在的運行時——Qwen Code、DeepSeek Harness、Windsurf、GitHub Copilot 等——被記錄為[模型相容性矩陣](spec/model-compatibility.md)中的**新興運行時**，待其慣例穩定後可能升級為參考運行時。

---

## 🏗 8 大支柱的 AI-Native 架構

該標準將代碼庫從「供 AI 閱讀的書」提升為「供 AI 操作的工作區」。它定義了 8 個架構層次：

### 1. 上下文 (Context - "What")
*`PROJECT_MAP`, `Domains`, `Architecture`*
告訴 AI 系統是什麼、東西在哪裡，以及為什麼要這樣構建。

### 2. 規則 (Rules - "Instructions & Constraints")
*`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`*
代理的指令和聲明的約束。代碼必須如何格式化、導入必須如何處理，以及必須尊重哪些架構邊界。

### 3. 契約 (Contracts - "How they connect")
*`Protocols`, `Schemas`, `API Definitions`*
組件之間的明確邊界。AI 代理比人類更依賴於有意義的架構邊界處的明確接口。

### 4. 技能 (Skills - "How to do a specific task")
*`SKILL.md`*
可重用的原子能力（例如「如何在這個代碼庫中生成數據庫遷移」）。

### 5. 工作流 (Workflows - "How to orchestrate")
*`SOPs`*
多步程序（例如「計劃 -> 檢查不變量 -> 實現 -> 測試 -> 驗證 -> 更新文檔」）。

### 6. 工具 (Tools - "How to touch the world")
*`MCP Servers`, `Deterministic CLI Scripts`*
代理可以用來讀取數據庫、獲取日誌或編譯代碼的結構化能力。

### 7. 驗證 (Verification - "Evidence")
*`Tests`, `Validators`, `Hooks`*
自動化的閉環。代碼驗證 + 代理行為驗證。直到驗證腳本返回退出碼 0，代理的工作才算完成。

### 8. 人機邊界 (Human / Agent Boundary - "Trust barrier")
*`MANUAL_TASKS.md`*
權限的清晰界定：AI 可以自主做什麼，它必須請求許可做什麼（例如生產部署），以及人類必須手動做什麼。

---

## 📂 開發者指南

如果你想對 AI-Native Repository Standard 本身做出貢獻：

```text
AI-Native-Repo/ (Reference Repository)
│
├── spec/                        # 標準：與工具無關的理論和哲學
├── cli/                         # `npx ai-native-repo` 工具的源代碼
├── template-source/             # 所有模板的單一真相來源 (SINGLE Source of Truth)
│   ├── common/                  # 共享文檔 (Light, Standard, Full)
│   └── runtimes/                # 特定運行時的適配器 (Claude, Cursor 等)
│
├── scripts/
│   ├── generate-templates.js    # 將 12-矩陣組合構建到 cli/templates/
│   └── validate.sh              # CI 管道，用於驗證代碼庫標準完整性
└── anr.yaml                     # 機器可讀的清單 (Manifest)
```
