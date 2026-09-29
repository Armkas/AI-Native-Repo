# AI-Native Repository Standard

[🇺🇸 English](README.md) | [🇨🇳 简体中文](README.zh-CN.md) | [🇹🇼 繁體中文](README.zh-TW.md) | [🇯🇵 日本語](README.ja.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇩🇪 Deutsch](README.de.md) | [🇷🇺 Русский](README.ru.md) | [🇺🇦 Українська](README.uk.md) | [🇧🇷 Português](README.pt-BR.md) | [🇰🇷 한국어](README.ko.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇸🇦 العربية](README.ar.md)

> **Don't just give AI more context. Give it a native workspace.**
> **Não dê apenas mais contexto à IA. Dê a ela um espaço de trabalho nativo.**

Um padrão, gerador CLI (scaffold) e arquitetura de referência para construir repositórios que agentes de codificação de IA podem entender, navegar, modificar e verificar de forma autônoma.

---

## 🚀 Início Rápido: O Scaffold CLI

Você não precisa mais copiar arquivos manualmente. Fornecemos uma CLI poderosa para gerar instantaneamente um espaço de trabalho AI-Native adaptado ao seu Agent Runtime e à complexidade do projeto.

**Execute o seguinte comando em qualquer diretório vazio:**

```bash
npx ai-native-repo init .
```

### A Matriz de 12 Modelos (Templates)
A CLI pedirá interativamente que você escolha nossa matriz de 12 modelos (4 Runtimes × 3 Níveis):

**Etapa 1: Escolha o seu Agent Runtime**
- `claude-code`: Ganchos e habilidades puras do ecossistema Anthropic.
- `codex`: Estrutura pura do agente OpenAI/Codex.
- `cursor`: Otimizado para correspondência global `.cursor/rules/*.mdc`.
- `gemini-cli`: Ambiente puro Google Gemini.

**Etapa 2: Escolha o seu nível de complexidade (Tier)**
- `light`: Arquivos de contexto mínimos para scripts simples ou protótipos.
- `standard`: O padrão. Arquitetura completa para serviços em produção.
- `full`: Nível empresarial. Standard mais proteções de caminhos (arquivos somente leitura / somente acréscimo, aplicadas por hooks ou CI) e um verificador de atualidade do contexto.

*Alternativamente, pule os prompts com sinalizadores:*
```bash
npx ai-native-repo init . --runtime cursor --tier standard
npx ai-native-repo init . --runtime claude-code --tier full --lang zh-CN   # en (default) | zh-CN | ja
```

---

## ⚠️ Agnóstico à Semântica, Ciente do Runtime, Ajustável ao Modelo

**"A semântica é unificada, mas os runtimes são fragmentados."**

A partir de 2026, a indústria percebeu que a construção de um repositório nativo de IA exige a separação de três camadas:
1. **O Modelo / Provedor de Modelo** (ex: OpenAI, Anthropic, Google, DeepSeek, Qwen, Meta, Moonshot, Zhipu, MiniMax): Determina a capacidade bruta e o raciocínio do modelo subjacente. Nunca fixe uma versão específica de modelo aqui — veja a [Matriz de Compatibilidade de Modelos](spec/model-compatibility.md) para o mapeamento completo Runtime × Provedor de Modelo.
2. **O Runtime do Agente** (ex: Claude Code, Codex, Gemini CLI, Cursor).
3. **O Padrão do Repositório**: A verdade semântica do seu projeto.

Embora a semântica seja **Agnóstica ao Modelo**, ela deve ser **Ciente do Runtime**. 
- **Claude Code (Anthropic)** espera `.claude/settings.json`.
- **Cursor** espera `.cursor/rules/*.mdc`.

**Provedor de Modelo ≠ Runtime do Agente — não os funda em um único eixo.** Nenhum runtime pertence a um único provedor de modelo (Cursor e Claude Code podem ser executados com Anthropic, OpenAI, ou provedores compatíveis como DeepSeek). Por isso o Provedor de Modelo é registrado separadamente na [Matriz de Compatibilidade de Modelos](spec/model-compatibility.md), em vez de se tornar um Template próprio.

### Repositório de Referência vs. Repositório Consumidor
- **Este repositório (Referência)**: Este repositório do GitHub é o *Repositório de Referência* global. Ele contém múltiplos adaptadores, o gerador de templates e o código do CLI.
- **Seu repositório (Consumidor)**: O repositório gerado pelo CLI é um *Repositório Consumidor*. Ele deve conter exatamente **um** adaptador de Runtime e **um** Tier, garantindo que o agente de IA nunca fique confuso com conjuntos de regras conflitantes.

### Runtimes de Referência atuais vs. Runtimes emergentes
Este repositório já oferece templates de primeira classe para quatro **Runtimes de Referência**: `claude-code`, `codex`, `gemini-cli`, `cursor`. Outros runtimes reais — Qwen Code, DeepSeek Harness, Windsurf, GitHub Copilot, entre outros — são registrados como **Runtimes Emergentes** na [Matriz de Compatibilidade de Modelos](spec/model-compatibility.md) e podem ser promovidos a Runtimes de Referência conforme suas convenções se estabilizarem.

---

## 🏗 Os 8 Pilares da Arquitetura AI-Native

1. **Contexto (O "O que")**: *`PROJECT_MAP`, `Domains`, `Architecture`*
2. **Regras (As "Instruções e Restrições")**: *`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`*
3. **Contratos (O "Como se conectam")**: *`Protocols`, `Schemas`, `API Definitions`*
4. **Habilidades (O "Como fazer uma tarefa específica")**: *`SKILL.md`*
5. **Workflows (O "Como orquestrar")**: *`SOPs`*
6. **Ferramentas (O "Como tocar o mundo")**: *`MCP Servers`, `Scripts CLI`*
7. **Verificação (A "Evidência")**: *`Tests`, `Validators`, `Hooks`*
8. **Limite Humano / Agente (A "Barreira de confiança")**: *`MANUAL_TASKS.md`*

---

## 📂 Guia do Desenvolvedor

```text
AI-Native-Repo/
│
├── spec/                        # O Padrão: Teorias e filosofia
├── cli/                         # Código-fonte para a ferramenta CLI
├── template-source/             # A ÚNICA Fonte de Verdade para os templates
│   ├── common/                  
│   └── runtimes/                
│
├── scripts/
│   ├── generate-templates.js    
│   └── validate.sh              
└── anr.yaml                     # O Manifesto legível por máquina
```
