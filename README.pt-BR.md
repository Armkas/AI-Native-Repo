# AI-Native Repository Standard & Reference Implementation

[🇺🇸 English](README.md) | [🇨🇳 简体中文](README.zh-CN.md) | [🇹🇼 繁體中文](README.zh-TW.md) | [🇯🇵 日本語](README.ja.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇩🇪 Deutsch](README.de.md) | [🇷🇺 Русский](README.ru.md) | [🇺🇦 Українська](README.uk.md) | [🇧🇷 Português](README.pt-BR.md) | [🇰🇷 한국어](README.ko.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇸🇦 العربية](README.ar.md)

> **"Os provedores padronizam como a IA entra no repositório. O ANR padroniza como o próprio repositório é projetado como um ativo de engenharia durável para agentes de IA."**

Um padrão entre agentes, arquitetura de referência e plataforma de governança do ciclo de vida para estruturar, verificar e manter repositórios de software preparados para IA.

---

## 🤔 Você precisa do ANR? (Dois caminhos para um repositório AI-Friendly)

**Você NÃO precisa obrigatoriamente instalar o ANR para criar um repositório preparado para IA.**  
Os ambientes de agentes modernos (Claude Code, OpenAI Codex, Cursor, Gemini CLI, Copilot) já oferecem instruções, regras, hooks e habilidades nativas. O ANR separa claramente a **Capacidade de Execução do Agente (o sistema operacional)** da **Arquitetura e Governança do Contexto do Repositório (a organização durável do código)**.

### Caminho A: Configuração Manual Sem Ferramentas (Recomendado para desenvolvedores individuais e protótipos)
Se você mantém um projeto pessoal ou um repositório pequeno, não precisa de nenhuma CLI externa. Basta seguir os princípios fundamentais do ANR:
1. **Roteador Global Mínimo**: Mantenha um `AGENTS.md` (ou `CLAUDE.md`, `GEMINI.md`) na raiz limitado a um orçamento de `<= 2048 bytes (2 KiB)`. Ele atua como controlador de tráfego aéreo, roteando para o contexto em vez de carregar uma enciclopédia inteira na memória do prompt.
2. **Fluxos de Trabalho Modulares via Agent Skills**: Coloque procedimentos repetíveis no formato aberto [Agent Skills](https://agentskills.io) em `.agents/skills/<nome>/SKILL.md`.
3. **Camadas Estruturadas de Domínios e Contratos**: Isole a arquitetura de negócios em `docs/domains/` e esquemas de banco de dados / contratos de API em `docs/contracts/`.
4. **Divulgação Progressiva do Contexto**: Garanta que o agente leia apenas a documentação relevante para a tarefa atual.
5. **Verificação Determinística**: Defina comandos explícitos de teste e build que devem ser aprovados antes que o agente declare o trabalho concluído.
6. **Limites Humanos Executáveis**: Proteja configurações críticas ou scripts de release via hooks ou verificações de CI.

---

### Caminho B: Plataforma de Ciclo de Vida Padronizada (ANR CLI — Para equipes e ambientes multiagente)
Ao gerenciar sistemas de produção em equipe ou com múltiplos agentes de IA, o ANR oferece uma estrutura auditada e automatizada:
- **Portabilidade entre Agentes**: Mapeie uma fonte única da verdade semântica (`docs/`, `.agents/skills/`) de forma limpa entre Claude Code, Codex, Cursor e Gemini CLI sem duplicar regras.
- **Governança Multirrepositorio**: Aplique padrões estruturais, contratos e limites de permissão consistentes em dezenas de microsserviços.
- **Manutenção e Evolução (Dia 2)**: Use `anr update` com mesclagem profunda de JSON consciente de autoria e detecção de obsoletos com `--prune`, e execute `anr doctor` para auditar links quebrados e conformidade de skills.

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

## 🎯 Vantagem Principal: A Dupla Arquitetura "Progressiva" (The Dual Progressive Architecture)

A maioria dos templates de prompts para IA falha em projetos complexos por dois motivos: **o inchaço de contexto (Context Bloat) degrada a atenção da IA**, e **o alto custo inicial inviabiliza a adoção em projetos existentes**. O Padrão de Repositório Nativo de IA resolve ambos através de um design progressivo duplo:

### 1. Revelação Progressiva de Contexto (Progressive Context Disclosure) — Preservando a Atenção da IA
> **Context Must Be Earned (O contexto deve ser conquistado sob demanda).**

Nunca forneça a um agente um prompt monolítico de 100.000 palavras. O ponto de entrada global (`AGENTS.md`) é estritamente limitado a **<= 2048 bytes (2 KiB)** para atuar como um controlador de tráfego aéreo leve. O agente descobre o contexto camada por camada sob demanda:

* **L0: Agent Rules (<= 2048 bytes)** → Como a IA deve se comportar? (Roteador global e limites)
* **L1: Project Map (< 100 linhas)** → O que é este projeto e onde está tudo? (Mapa físico)
* **L2: Architecture / Domain** → Que problema de negócio este domínio resolve?
* **L3: Interface / Contract** → Como os componentes se comunicam?
* **L4: Invariants / Tests** → Quais regras NUNCA devem ser quebradas? Como validar?
* **L5: Implementation** → Código-fonte real

**Apenas o contexto necessário para a tarefa atual é carregado.** Isso reduz drasticamente o consumo de tokens e elimina a perda de foco e as alucinações.

### 2. Adoção Progressiva do Repositório (Progressive Repository Adoption) — Migração sem Atrito para Projetos Existentes
> **Não é necessário recomeçar do zero. Qualquer código existente pode evoluir em 10 minutos.**

Você não precisa documentar todo o código legado de uma vez. Através do **Modelo de Níveis de Complexidade (Tiers)**, um repositório existente evolui naturalmente:

* **Dia 1 (Tier 1: Light) — Configuração em 10 minutos**: Nenhuma linha de código reescrita. Crie um roteador < 2KB, deixe a IA escanear sua árvore para gerar um `PROJECT_MAP.md` realista e defina limites em `MANUAL_TASKS.md`. A IA para imediatamente de se perder no projeto.
* **Dia 30 (Tier 2: Standard) — Conhecimento sob Demanda**: Documente apenas o que for alterado. Quando a IA trabalhar em um módulo (ex: auth), crie `domains/auth.md` nesse PR e adicione verificações de testes com a skill `verify`.
* **Dia 90 (Tier 3: Full) — Guardrails Corporativos**: Com a equipe confortável, introduza proteção de caminhos (arquivos somente-leitura/somente-adição) e checagens automáticas de integridade no CI.

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
