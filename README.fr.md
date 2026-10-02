# AI-Native Repository Standard

[🇺🇸 English](README.md) | [🇨🇳 简体中文](README.zh-CN.md) | [🇹🇼 繁體中文](README.zh-TW.md) | [🇯🇵 日本語](README.ja.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇩🇪 Deutsch](README.de.md) | [🇷🇺 Русский](README.ru.md) | [🇺🇦 Українська](README.uk.md) | [🇧🇷 Português](README.pt-BR.md) | [🇰🇷 한국어](README.ko.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇸🇦 العربية](README.ar.md)

> **Don't just give AI more context. Give it a native workspace.**
> **Ne vous contentez pas de donner plus de contexte à l'IA. Donnez-lui un espace de travail natif.**

Un standard, un générateur CLI et une architecture de référence pour construire des dépôts que les agents de codage IA peuvent comprendre, naviguer, modifier et vérifier de manière autonome.

---

## 🚀 Démarrage rapide : Le générateur CLI

Vous n'avez plus besoin de copier manuellement des fichiers. Nous fournissons un puissant outil en ligne de commande (CLI) pour générer instantanément un espace de travail IA natif adapté à votre environnement d'agent et à la complexité de votre projet.

**Exécutez la commande suivante dans un répertoire vide :**

```bash
npx ai-native-repo init .
```

### La Matrice des 12 Modèles
La CLI vous demandera de choisir parmi notre matrice de 12 modèles (4 Runtimes × 3 Niveaux) :

**Étape 1 : Choisissez votre Agent Runtime**
- `claude-code` : Hooks et compétences de l'écosystème Anthropic.
- `codex` : Structure pure de l'agent OpenAI/Codex.
- `cursor` : Optimisé pour la correspondance globale `.cursor/rules/*.mdc`.
- `gemini-cli` : Environnement pur Google Gemini.

**Étape 2 : Choisissez votre niveau de complexité (Tier)**
- `light` : Les fichiers de contexte minimum pour des scripts simples.
- `standard` : Par défaut. Architecture complète pour les services en production.
- `full` : Niveau entreprise. Standard plus des garde-fous de chemins (fichiers en lecture seule / ajout seul, appliqués par hooks ou CI) et un vérificateur de fraîcheur du contexte.

*Alternativement, ignorez les invites avec les paramètres :*
```bash
npx ai-native-repo init . --runtime cursor --tier standard
npx ai-native-repo init . --runtime claude-code --tier full --lang zh-CN   # en (default) | zh-CN | ja
```

---

## 🎯 Avantage Clé : La Double Architecture "Progressive" (The Dual Progressive Architecture)

La plupart des modèles de prompts échouent sur des projets réels complexes pour deux raisons : **la saturation de contexte (Context Bloat) dégrade l'attention de l'IA**, et **les coûts initiaux élevés rendent l'adoption impossible sur les projets existants**. Le Standard de Dépôt Natif IA résout ces deux problèmes grâce à une conception progressive double :

### 1. Révélation Progressive du Contexte (Progressive Context Disclosure) — Préserver l'attention de l'IA
> **Context Must Be Earned (Le contexte doit être mérité à la demande).**

Ne donnez jamais à un agent un prompt monolithique de 100 000 mots. Le point d'entrée global (`AGENTS.md`) est strictement limité à **< 2 Ko** pour agir comme un contrôleur aérien ultra-léger. L'agent découvre le contexte couche par couche à la demande, sans jamais tout charger d'un coup :

* **L0: Agent Rules (< 2 Ko)** → Comment l'IA doit-elle se comporter ? (Règles globales et routage)
* **L1: Project Map (< 100 lignes)** → Quel est ce projet et où se trouvent les composants ? (Carte physique)
* **L2: Architecture / Domain** → Quel problème métier ce domaine résout-il ?
* **L3: Interface / Contract** → Comment les composants communiquent-ils entre eux ?
* **L4: Invariants / Tests** → Quelles règles ne doivent JAMAIS être enfreintes ? Comment vérifier ?
* **L5: Implementation** → Code source réel

**Seul le contexte nécessaire à la tâche courante est chargé.** Cela réduit considérablement l'usage de tokens et élimine la perte d'attention et les hallucinations.

### 2. Adoption Progressive du Dépôt (Progressive Repository Adoption) — Migration sans friction pour les projets existants
> **Pas besoin de repartir de zéro. Tout projet existant peut évoluer en 10 minutes.**

Vous n'avez pas besoin de documenter tout votre code hérité en une nuit. Grâce au **Modèle de Niveaux de Complexité (Tiers)**, un dépôt existant adopte les pratiques natives IA de manière progressive :

* **Jour 1 (Tier 1: Light) — Mise en place en 10 minutes** : Aucune réécriture de code. Générez un routeur de < 2 Ko, laissez l'IA scanner votre arborescence pour générer un `PROJECT_MAP.md` réaliste, et fixez des limites dans `MANUAL_TASKS.md`. L'IA cesse immédiatement de se perdre dans le projet.
* **Jour 30 (Tier 2: Standard) — Connaissance à la demande** : Ne documentez que ce que vous touchez. Lorsque l'IA modifie un module spécifique (ex. auth), ajoutez `domains/auth.md` dans cette PR et intégrez la boucle de test via le skill `verify`.
* **Jour 90 (Tier 3: Full) — Garde-fous d'entreprise** : Une fois l'équipe à l'aise, introduisez des garde-fous de chemins (fichiers en lecture seule/ajout seul) et des vérifications de fraîcheur dans la CI.

---

## ⚠️ Agnostique à la sémantique, Conscient de l'environnement, Ajustable au Modèle

À partir de 2026, l'industrie a réalisé que la construction d'un dépôt IA natif nécessite de séparer trois couches distinctes :
1. **Le Modèle / Fournisseur de Modèle** (ex. OpenAI, Anthropic, Google, DeepSeek, Qwen, Meta, Moonshot, Zhipu, MiniMax) : Détermine la capacité brute et le raisonnement du modèle sous-jacent. Ne codez jamais en dur une version de modèle spécifique ici — voir la [Matrice de Compatibilité des Modèles](spec/model-compatibility.md) pour le mapping complet Runtime × Fournisseur de Modèle.
2. **Le Runtime de l'Agent** (ex. Claude Code, Codex, Gemini CLI, Cursor) : Détermine *comment* les fichiers sont lus et *quand* les hooks sont exécutés.
3. **Le Standard du Dépôt** : La vérité sémantique universelle de votre projet.

Bien que la sémantique métier de votre projet soit **Agnostique au Modèle**, elle doit être **Consciente de l'Environnement**. 
- **Claude Code d'Anthropic** attend `.claude/settings.json`.
- **Cursor** attend `.cursor/rules/*.mdc`.

**Fournisseur de Modèle ≠ Runtime de l'Agent — ne les fusionnez pas en un seul axe.** Aucun runtime n'appartient à un seul fournisseur de modèle (Cursor et Claude Code peuvent tous deux être pilotés par Anthropic, OpenAI, ou des fournisseurs compatibles comme DeepSeek). C'est pourquoi le Fournisseur de Modèle est consigné séparément dans la [Matrice de Compatibilité des Modèles](spec/model-compatibility.md) plutôt que de devenir un Template à part entière.

### Dépôts de Référence vs Dépôts Consommateurs
- **Ce dépôt (Référence)** : Ce dépôt GitHub est le *dépôt de référence* global.
- **Votre Dépôt (Consommateur)** : Le dépôt généré par la CLI. Il doit contenir exactement **un** adaptateur d'environnement et **un** niveau, garantissant que l'agent IA n'est jamais confus par des règles concurrentes.

### Runtimes de Référence actuels vs Runtimes émergents
Ce dépôt fournit dès aujourd'hui des templates de première classe pour quatre **Runtimes de Référence** : `claude-code`, `codex`, `gemini-cli`, `cursor`. D'autres runtimes bien réels — Qwen Code, DeepSeek Harness, Windsurf, GitHub Copilot, etc. — sont recensés comme **Runtimes Émergents** dans la [Matrice de Compatibilité des Modèles](spec/model-compatibility.md) et pourront devenir des Runtimes de Référence une fois leurs conventions stabilisées.

---

## 🏗 Les 8 piliers de l'architecture IA Native

Ce standard élève le dépôt d'un "livre à lire pour l'IA" à un "espace de travail à opérer pour l'IA". Il définit 8 couches :

### 1. Contexte ("Quoi")
*`PROJECT_MAP`, `Domains`, `Architecture`*
Dit à l'IA ce qu'est le système, où se trouvent les choses et pourquoi elles ont été construites ainsi.

### 2. Règles ("Instructions & Contraintes")
*`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`*
Comment le code doit être formaté et quelles limites doivent être respectées.

### 3. Contrats ("Comment ils se connectent")
*`Protocols`, `Schemas`, `API Definitions`*
Frontières explicites entre les composants.

### 4. Compétences ("Comment faire une tâche spécifique")
*`SKILL.md`*
Capacités atomiques réutilisables.

### 5. Flux de travail ("Comment orchestrer")
*`SOPs`*
Procédures à plusieurs étapes.

### 6. Outils ("Comment interagir avec le monde")
*`MCP Servers`, `Scripts CLI`*
Capacités structurées que l'agent peut utiliser.

### 7. Vérification ("Les Preuves")
*`Tests`, `Validators`, `Hooks`*
Vérification du code + Vérification du comportement de l'agent. Le travail d'un agent n'est pas terminé tant que le script de validation ne renvoie pas le code 0.

### 8. Frontière Humain / Agent ("Barrière de confiance")
*`MANUAL_TASKS.md`*
Ce que l'IA peut faire de manière autonome vs ce qu'un humain doit faire.

---

## 📂 Guide du Développeur

Si vous souhaitez contribuer au Standard :

```text
AI-Native-Repo/
│
├── spec/                        # Le standard (philosophie)
├── cli/                         # Code source de la CLI
├── template-source/             # Source de vérité UNIQUE
│   ├── common/                  
│   └── runtimes/                
│
├── scripts/                     # Scripts de génération et de validation
└── anr.yaml                     # Manifeste lisible par machine
```
