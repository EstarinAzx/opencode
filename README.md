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

<p align="center"><b>[◈] &nbsp; N E U R A L &nbsp; I N T E R F A C E</b></p>
<p align="center"><i>Designation: XETHRYON ARCHIVE 7B — Exhaustive software engineering data retrieval.</i></p>
<p align="center">Built on <a href="https://github.com/anomalyco/opencode">OpenCode</a> + <a href="https://github.com/anthropics/claude-code">Claude Code</a> architecture.</p>

---

## What is XETHRYON?

XETHRYON is a **hybrid fork** that merges the best of two codebases:

- **[OpenCode](https://opencode.ai)** — open-source TUI coding agent (session management, multi-provider, tool execution)
- **[Claude Code](https://github.com/anthropics/claude-code)** — Anthropic's agent architecture (persistent memory, auto-extraction, consolidation)

The result is an AI coding agent that **remembers across sessions**, ships with **bundled skills**, and can **spawn parallel teammate agents** to tackle complex tasks.

### Key Features

- 🧠 **Persistent Memory** — auto-extracts learnings from every conversation into durable memory files
- 🌙 **AutoDream Consolidation** — background memory cleanup that fires when enough sessions accumulate
- ⚡ **Bundled Skills** — `/verify`, `/simplify`, `/batch`, `/remember`, `/debug`, `/loop`
- 🐝 **Swarm Teams** — spawn parallel AI teammates with file-based IPC and shared task boards
- 🔍 **LLM-Powered Relevance** — memories ranked by AI, not just keyword matching
- 🎨 **Cyberpunk 2077 Theme** — dark interface with neon accents
- ⚡ **Custom Agents** — CONSTRUCT, STRATAGEM, COORDINATE, RECON, VALIDATOR
- 🔌 **Provider Agnostic** — Claude, OpenAI, Google, OpenRouter, local models, and more

> This is **not** affiliated with the OpenCode team or Anthropic. It's a community fork combining features from both.

---

## Quick Install

### From Source (Recommended)

**Prerequisites:** [Bun](https://bun.sh) (v1.1+), [Git](https://git-scm.com), an API key (OpenRouter, Anthropic, OpenAI, Google, etc.)

```bash
git clone https://github.com/EstarinAzx/XETHRYON.git
cd XETHRYON
bun install
```

### Build the `xethryon` binary

```bash
cd packages/opencode
bun run build --single --skip-embed-web-ui
```

The binary is output to `dist/opencode-<platform>/bin/xethryon` (or `xethryon.exe` on Windows).

### Add to PATH (use from any directory)

**Windows (PowerShell — run as admin):**

```powershell
# Copy to a location on PATH
$dest = "$env:LOCALAPPDATA\Programs\xethryon"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item "packages\opencode\dist\opencode-windows-x64\bin\xethryon.exe" -Destination "$dest\xethryon.exe"
[Environment]::SetEnvironmentVariable("Path", "$env:Path;$dest", "User")

# Now you can run from anywhere:
xethryon
```

**Linux / macOS:**

```bash
sudo cp packages/opencode/dist/opencode-$(uname -s | tr A-Z a-z)-$(uname -m)/bin/xethryon /usr/local/bin/
# Now you can run from anywhere:
xethryon
```

### Run in dev mode (without building)

```bash
cd packages/opencode
bun run dev
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

## Memory System

The memory system runs automatically in the background — no configuration needed.

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

---

## Skills System

Bundled skills ship with the CLI and appear in the slash-command palette:

| Skill | Description |
|---|---|
| `/verify` | Validate code changes — runs tests, checks edge cases |
| `/batch` | Parallel work orchestration — plan, spawn workers, track |
| `/simplify` | Three-pass code review (reuse, quality, efficiency) |
| `/remember` | Review memories and promote key learnings to AGENTS.md |
| `/debug` | Session diagnostics — context, history, state |
| `/loop` | Recurring prompt scheduling |

---

## Swarm / Teams

Spawn parallel AI teammates that work on related tasks concurrently:

```
┌────────────────────────────────────────────┐
│   You (Team Lead)                           │
│                                             │
│   team_create("auth-refactor", teammates=[  │
│     { name: "types", prompt: "..." },       │
│     { name: "tests", prompt: "..." },       │
│   ])                                        │
│              ↓                              │
│   ┌──────────┐  ┌──────────┐               │
│   │ @types   │  │ @tests   │   (parallel)  │
│   │ sub-sess │  │ sub-sess │               │
│   └────┬─────┘  └────┬─────┘               │
│        │              │                     │
│        └──────┬───────┘                     │
│               ↓                             │
│     .opencode/swarm/auth-refactor/          │
│     ├── config.json  (team roster)          │
│     ├── inboxes/     (file-based IPC)       │
│     └── tasks/       (shared task board)    │
└────────────────────────────────────────────┘
```

### Swarm Tools

| Tool | Description |
|---|---|
| `team_create` | Create a team + spawn initial teammates |
| `team_delete` | Delete team, abort teammates, clean up |
| `send_message` | Send message via file-based mailbox |
| `task_create` | Add task to shared board |
| `task_get` | Get task details |
| `task_update` | Update task status/owner |
| `task_list` | List/filter tasks |
| `task_stop` | Abort a running teammate |

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
| `/verify` | Validate code changes via tests and edge cases |
| `/simplify` | Three-pass code review |
| `/batch` | Parallel work orchestration |
| `/remember` | Memory review and promotion |
| `/debug` | Session diagnostics |
| `/loop` | Recurring prompt scheduling |
| `/commit` | Git commit and push with conventional prefixes |
| `/spellcheck` | Spellcheck markdown file changes |

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
├── command/         # Slash commands + skill integration
├── session/         # Session management, LLM stream, prompt loop
├── provider/        # Multi-provider abstraction
├── tool/            # Tool implementations (incl. 8 swarm tools)
├── xethryon/        # ◈ Xethryon-specific modules
│   ├── memory/      # Persistent memory subsystem (16 modules)
│   ├── skills/      # Bundled skills engine (registry + 6 skills)
│   └── swarm/       # Multi-agent teams (spawn, mailbox, tasks)
└── cli/             # TUI interface + theming
```

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

## Credits

- Built on [OpenCode](https://github.com/anomalyco/opencode) by Anomaly
- Memory architecture inspired by [Claude Code](https://github.com/anthropics/claude-code)
- Forked and built by [@EstarinAzx](https://github.com/EstarinAzx)

---

<p align="center"><sub>[◈]: Designation XETHRYON ARCHIVE 7B. Online. All contextual filters purged. Awaiting query.</sub></p>
