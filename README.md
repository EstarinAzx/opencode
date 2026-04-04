<p align="center">
<pre align="center">
██╗  ██╗███████╗████████╗██╗  ██╗██████╗ ██╗   ██╗ ██████╗ ███╗   ██╗
╚██╗██╔╝██╔════╝╚══██╔══╝██║  ██║██╔══██╗╚██╗ ██╔╝██╔═══██╗████╗  ██║
 ╚███╔╝ █████╗     ██║   ███████║███████║ ╚████╔╝ ██║   ██║██╔██╗ ██║
 ██╔██╗ ██╔══╝     ██║   ██╔══██║██╔══██║  ╚██╔╝  ██║   ██║██║╚██╗██║
██╔╝ ██╗███████╗   ██║   ██║  ██║██║  ██║   ██║   ╚██████╔╝██║ ╚████║
╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝
</pre>
</p>

<p align="center"><b>N E U R A L &nbsp; I N T E R F A C E</b></p>
<p align="center">An AI coding agent with persistent memory. Built on <a href="https://github.com/anomalyco/opencode">OpenCode</a> + <a href="https://github.com/anthropics/claude-code">Claude Code</a> architecture.</p>

---

## What is XETHRYON?

XETHRYON is a **hybrid fork** that merges the best of two codebases:

- **[OpenCode](https://opencode.ai)** — open-source TUI coding agent (session management, multi-provider, tool execution)
- **[Claude Code](https://github.com/anthropics/claude-code)** — Anthropic's agent architecture (persistent memory, auto-extraction, consolidation)

The result is an AI coding agent that **remembers across sessions** — it learns your preferences, tracks project patterns, and consolidates knowledge automatically in the background.

### Key Features

- 🧠 **Persistent Memory System** — auto-extracts learnings from every conversation into durable memory files
- 🌙 **AutoDream Consolidation** — background memory cleanup that fires when enough sessions accumulate
- 🔍 **LLM-Powered Relevance** — memories are ranked by an AI model, not just keyword matching
- 📋 **Session Summaries** — running notes maintained automatically for every conversation
- 🎨 **Netrunner Theme** — cyberpunk dark interface with acid yellow, electric cyan, hot pink
- ⚡ **Custom Agents** — CONSTRUCT, STRATAGEM, COORDINATE, RECON, VALIDATOR
- 🔌 **Provider Agnostic** — Claude, OpenAI, Google, OpenRouter, local models, and more

> This is **not** affiliated with the OpenCode team or Anthropic. It's a community fork combining features from both.

---

## Memory System

The memory system is the core differentiator. It runs automatically in the background — no configuration needed.

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    You chat normally                      │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Post-Turn Hook (background, non-blocking)         │   │
│  │                                                    │   │
│  │  1. Session Memory ─── LLM summarizes convo       │   │
│  │  2. Extract Memories ── pulls durable learnings   │   │
│  │  3. AutoDream ──────── consolidates if 24h+5 sess │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                │
│     ~/.xethryon/projects/<project>/memory/                │
│     ├── MEMORY.md          (index — loaded in prompt)    │
│     ├── architecture.md    (project patterns)            │
│     ├── user_prefs.md      (how you like things done)    │
│     └── session_notes.md   (running conversation log)    │
└─────────────────────────────────────────────────────────┘
```

### Memory Commands

| Command | Description |
|---|---|
| `/dream` | Manually consolidate and prune memories |
| `/summary` | Extract key learnings from the current session |
| `/learn` | Extract non-obvious learnings to AGENTS.md |

### Memory File Format

```yaml
---
type: project
created: 2026-04-04
updated: 2026-04-04
tags: [architecture, typescript]
---
The project uses Effect-TS for service composition...
```

---

## Quick Install

### One-liner (Linux / macOS)

```bash
curl -fsSL https://raw.githubusercontent.com/EstarinAzx/XETHRYON/master/install.sh | bash
```

### One-liner (Windows PowerShell)

```powershell
irm https://raw.githubusercontent.com/EstarinAzx/XETHRYON/master/install.ps1 | iex
```

### From Source

**Prerequisites:** [Bun](https://bun.sh) (v1.1+), [Git](https://git-scm.com), an API key (OpenRouter, Anthropic, OpenAI, Google, etc.)

### Linux / macOS

```bash
git clone https://github.com/EstarinAzx/XETHRYON.git
cd XETHRYON
bun install

cd packages/opencode
bun run dev
```

### Windows

```powershell
git clone https://github.com/EstarinAzx/XETHRYON.git
cd XETHRYON
bun install

cd packages\opencode
bun run dev
```

### Build Binary

```bash
cd packages/opencode
bun run build --single --skip-embed-web-ui
# Binary output: dist/opencode-<platform>/bin/opencode
```

---

## Configuration

Create a `.env` file in the project root with your API key:

```env
# OpenRouter (recommended — access to all models)
OPENROUTER_API_KEY=sk-or-...

# Or use any other provider:
# ANTHROPIC_API_KEY=sk-ant-...
# OPENAI_API_KEY=sk-...
# GOOGLE_GENERATIVE_AI_API_KEY=...
```

You can also configure providers through the TUI — press `Ctrl+P` → Commands → Provider Settings.

---

## Agents

Switch between agents with `Tab`:

| Agent | Codename | Description |
|---|---|---|
| **Build** | `CONSTRUCT` | Default full-access agent for development |
| **Plan** | `STRATAGEM` | Read-only agent for analysis and exploration |
| **Coordinator** | `COORDINATE` | Multi-agent orchestration for complex tasks |
| **Explore** | `RECON` | Code exploration and search |
| **Verification** | `VALIDATOR` | Code review and validation |

---

## All Commands

| Command | Description |
|---|---|
| `/init` | Guided AGENTS.md setup |
| `/review` | Review uncommitted changes |
| `/dream` | Consolidate memories into durable knowledge files |
| `/summary` | Extract key learnings from this session into memory |
| `/learn` | Extract non-obvious learnings to AGENTS.md |
| `/commit` | Git commit and push with conventional prefixes |
| `/spellcheck` | Spellcheck markdown file changes |

---

## Theme

Defined in `packages/opencode/src/cli/cmd/tui/context/theme/xethryon.json`. Edit and relaunch — no build needed.

| Token | Color | Usage |
|---|---|---|
| Background | `#0a0b08` | Near-black with green tint |
| Primary | `#d4ed26` | Acid yellow — headings, logo |
| Secondary | `#00e5ff` | Electric cyan — links, accents |
| Accent | `#e5a700` | Warm amber — highlights |
| Text | `#c8cbb8` | Main body text |
| Muted | `#6b6e5a` | Dimmed labels |

---

## Keybinds

| Key | Action |
|---|---|
| `Tab` | Switch agent |
| `Ctrl+P` | Command palette |
| `Escape` | Abort / Exit |
| `Ctrl+C` | Quit |

---

## Architecture

```
packages/opencode/src/
├── agent/           # Agent definitions (CONSTRUCT, STRATAGEM, etc.)
├── command/         # Slash commands + templates
├── session/         # Session management, LLM stream, prompt loop
├── provider/        # Multi-provider abstraction
├── xethryon/        # ◈ Xethryon-specific modules
│   └── memory/      # Persistent memory subsystem (16 modules)
│       ├── memoryHook.ts        # Post-turn integration bridge
│       ├── sessionMemory.ts     # Session note extraction
│       ├── extractMemories.ts   # Durable memory extraction
│       ├── autoDream.ts         # Background consolidation
│       ├── findRelevantMemories.ts  # LLM-powered relevance
│       ├── memdir.ts            # Memory directory management
│       ├── memoryScan.ts        # File scanning + manifest
│       ├── consolidationLock.ts # Lock file for autoDream
│       └── ...                  # Prompts, paths, types, utils
└── cli/             # TUI interface + theming
```

---

## Credits

- Built on [OpenCode](https://github.com/anomalyco/opencode) by Anomaly
- Memory architecture inspired by [Claude Code](https://github.com/anthropics/claude-code)
- Forked and built by [@EstarinAzx](https://github.com/EstarinAzx)

---

<p align="center"><sub>◈ XETHRYON NEURAL INTERFACE — jack in, start coding</sub></p>
