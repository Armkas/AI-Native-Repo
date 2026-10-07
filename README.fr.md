# AI-Native Repository Standard & Reference Implementation

[🇺🇸 English](README.md) | [🇨🇳 简体中文](README.zh-CN.md) | [🇹🇼 繁體中文](README.zh-TW.md) | [🇯🇵 日本語](README.ja.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇩🇪 Deutsch](README.de.md) | [🇷🇺 Русский](README.ru.md) | [🇺🇦 Українська](README.uk.md) | [🇧🇷 Português](README.pt-BR.md) | [🇰🇷 한국어](README.ko.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇸🇦 العربية](README.ar.md)

> **"Les fournisseurs standardisent la façon dont l'IA entre dans le dépôt. ANR standardise la façon dont le dépôt est conçu comme un actif d'ingénierie durable pour les agents d'IA."**

Un standard multi-agents, une architecture de référence et une plateforme de gouvernance du cycle de vie pour structurer, vérifier et maintenir des dépôts logiciels adaptés à l'IA.

---

## 🤔 Avez-vous besoin d'ANR ? (Deux chemins vers un dépôt AI-Friendly)

**Vous n'avez PAS besoin d'installer ANR pour construire un dépôt adapté à l'IA.**  
Les environnements d'agents modernes (Claude Code, OpenAI Codex, Cursor, Gemini CLI, Copilot) fournissent déjà des instructions, règles, hooks et compétences natifs. ANR sépare clairement **l'Exécution de l'Agent (le système d'exploitation)** de **l'Architecture et la Gouvernance du Contexte du Dépôt (l'organisation durable du code)**.

### Chemin A : Configuration Manuelle Sans Outils (Recommandé pour les développeurs solo et les prototypes)
Si vous maintenez un projet personnel ou un petit dépôt, vous n'avez besoin d'aucun CLI externe. Appliquez simplement les principes fondamentaux d'ANR :
1. **Routeur Global Minimal** : Conservez un `AGENTS.md` (ou `CLAUDE.md`, `GEMINI.md`) à la racine respectant un budget de `<= 2048 bytes (2 KiB)`. Il agit comme un contrôleur aérien, guidant vers le contexte plutôt que de charger une encyclopédie dans la mémoire de prompt.
2. **Flux de Travail Modulaires via Agent Skills** : Placez les actions procédurales réutilisables au format ouvert [Agent Skills](https://agentskills.io) sous `.agents/skills/<nom>/SKILL.md`.
3. **Couches Structurées de Domaines et de Contrats** : Déplacez l'architecture et la logique métier dans `docs/domains/`, et les schémas de base de données / API dans `docs/contracts/`.
4. **Divulgation Progressive du Contexte** : Assurez-vous que l'agent ne lit que la documentation pertinente pour sa tâche actuelle.
5. **Vérification Déterministe** : Définissez des commandes explicites de test et de compilation qui doivent réussir avant que l'agent ne déclare le travail terminé.
6. **Limites Humaines Applicables** : Protégez les configurations sensibles ou les scripts de déploiement via des hooks ou des vérifications CI.

---

### Chemin B : Plateforme de Cycle de Vie Standardisée (ANR CLI — Pour les équipes et environnements multi-agents)
Lors de la gestion de systèmes de production en équipe ou avec plusieurs agents d'IA, ANR offre un cadre audité et automatisé :
- **Portabilité Multi-Agents** : Mappez une source unique de vérité sémantique (`docs/`, `.agents/skills/`) proprement entre Claude Code, Codex, Cursor et Gemini CLI sans dupliquer de règles.
- **Gouvernance Multi-Dépôts** : Appliquez des standards structurels, des contrats et des limites de permissions cohérents sur des dizaines de microservices.
- **Maintenance et Évolution (Jour 2)** : Utilisez `anr update` avec fusion JSON respectueuse de la propriété et détection des fichiers obsolètes avec `--prune`, et exécutez `anr doctor` pour auditer la conformité des compétences.

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
- `standard` : Par défaut. Architecture complète pour les services en production, avec critères d'acceptation, plans de tâche et une revue indépendante fondée sur une grille.
- `full` : Garde-fous de haute maturité. Standard plus des garde-fous de chemins (fichiers en lecture seule / ajout seul, appliqués par hooks ou CI), un vérificateur de fraîcheur du contexte et des évaluations comportementales de la couche de contexte.

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

Ne donnez jamais à un agent un prompt monolithique de 100 000 mots. Le point d'entrée global (`AGENTS.md`) est strictement limité à **<= 2048 bytes (2 KiB)** pour agir comme un contrôleur aérien ultra-léger. L'agent découvre le contexte couche par couche à la demande, sans jamais tout charger d'un coup :

* **L0: Agent Rules (<= 2048 bytes)** → Comment l'IA doit-elle se comporter ? (Règles globales et routage)
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
*`SOPs`, `Plans`*
Procédures à plusieurs étapes (ex. « Définir les critères d'acceptation -> Vérifier les invariants -> Implémenter -> Tester -> Vérifier -> Relire -> Mettre à jour la doc »), plus des plans de tâche versionnés dans `docs/plans/` pour que la session suivante reprenne au lieu de repartir de zéro.

### 6. Outils ("Comment interagir avec le monde")
*`MCP Servers`, `Scripts CLI`, `.agents/tools.md`*
Capacités structurées que l'agent peut utiliser. Chaque outil est déclaré dans `.agents/tools.md` avec son niveau de risque, et aucun identifiant ne vit dans la configuration versionnée.

### 7. Vérification et évaluation ("Les Preuves")
*`Tests`, `Validators`, `Hooks`, `Review`, `Evals`*
Fermeture automatique de la boucle, ordonnée par fiabilité. D'abord les vérifications déterministes : le travail d'un agent n'est pas terminé tant qu'elles ne renvoient pas le code 0. Ensuite seulement, un **LLM-as-a-judge encadré** évalue ce qu'aucune commande ne peut trancher — critères d'acceptation atteints, périmètre respecté, documentation toujours exacte — avec une grille versionnée, un contexte indépendant, `UNKNOWN` comme réponse valide, et sans pouvoir annuler une vérification en échec. Les évaluations comportementales vérifient que la couche de contexte elle-même conduit les agents au bon comportement.

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
