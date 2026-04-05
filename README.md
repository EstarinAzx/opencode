# XETHRYON

Xethryon is an advanced, terminal-based AI software engineering agent. Built as a powerful hybrid fork, it combines the robust terminal user interface (TUI) and dynamic session management of [OpenCode](https://opencode.ai) with the persistent memory, consolidation routines, and autonomous architectures inspired by Anthropic's [Claude Code](https://github.com/anthropics/claude-code).

The result is a contextually aware coding agent that remembers project details across multiple sessions, natively supports spawning parallel sub-agent teams, and seamlessly adapts to different workflows.

---

## Key Features

- 🧠 **Persistent Memory System**: Automatically extracts learnings, documentation, and context from every conversation into durable memory files, ensuring project context isn't lost between sessions.
- 🌙 **AutoDream Consolidation**: Runs background memory cleanup and optimization routines, consolidating notes when enough sessions accumulate.
- 🐝 **Local Swarm Teams**: Capable of spawning parallel AI teammates, utilizing file-based inter-process communication (IPC), and shared task boards to orchestrate complex operations concurrently.
- 🤖 **Autonomous Adapting**: Dynamically switches between specialized agent modes (`CONSTRUCT`, `ARCHITECT`, `RECON`, `COORDINATE`, `VALIDATOR`) based on the specific requirements of your prompts.
- ⚡ **Bundled Execution Skills**: Comes packed with advanced out-of-the-box skills: `/verify`, `/simplify`, `/batch`, `/remember`, `/debug`, and `/loop`.
- 🔍 **AI-Ranked Relevance**: Leverages intelligent, LLM-powered context ranking instead of primitive keyword matching to pull the exact memory needed for the task.
- 🔌 **Provider Agnostic**: Bring your own keys. Natively supports Anthropic, OpenAI, Google, OpenRouter, and local models.
- 🎨 **Immersive TUI Design**: Highly customizable, smooth terminal interface shipping by default with an aesthetic, dark-themed Cyberpunk color palette.

---

## Quick Install

### Prerequisites

- [Bun](https://bun.sh) (v1.1+)
- Git
- Target LLM API Key (OpenRouter, Anthropic, OpenAI, Google, etc.)

### Build from Source (Recommended)

1. **Clone the repository and install dependencies:**

   ```bash
   git clone https://github.com/EstarinAzx/XETHRYON.git
   cd XETHRYON
   bun install
   ```

2. **Build the binary executable:**

   ```bash
   cd packages/opencode
   bun run build --single --skip-embed-web-ui
   ```

   *The compiled binary will be output to `dist/opencode-<platform>-<arch>/bin/xethryon` (or `xethryon.exe` on Windows).*

### Adding to PATH

To use `xethryon` across your entire system, add it to your PATH:

**Windows (PowerShell — run as admin):**

```powershell
$dest = "$env:LOCALAPPDATA\Programs\xethryon"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item "packages\opencode\dist\opencode-windows-x64\bin\xethryon.exe" -Destination "$dest\xethryon.exe"
[Environment]::SetEnvironmentVariable("Path", "$env:Path;$dest", "User")

# Launch anywhere
xethryon
```

**Linux / macOS:**

```bash
sudo cp packages/opencode/dist/opencode-$(uname -s | tr A-Z a-z)-$(uname -m)/bin/xethryon /usr/local/bin/

# Launch anywhere
xethryon
```

---

## Configuration

Xethryon connects to inference providers using standard environment variables. You can supply them by creating a `.env` file in your project root, exporting them in your profile, or configuring them via the TUI (Press `Ctrl+P` → Commands → Provider Settings).

```env
# OpenRouter (Great for accessing multiple model families)
OPENROUTER_API_KEY=sk-or-...

# Direct Provider Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

---

## Core Systems Overview

### Persistent Memory Workflow

The memory subsystem is entirely hands-off and runs automatically in the background.

1. **Session Summary:** The LLM summarizes every active session post-turn.
2. **Context Extraction:** Key durable learnings are extracted automatically.
3. **AutoDream Consolidation:** Memory states are optimized when 24 hours pass or 5 sessions accumulate.

Memories are securely stored at `~/.xethryon/projects/<project>/memory/` maintaining your continuous project architecture mapping (`architecture.md`), preferences (`user_prefs.md`), and overall memory index (`MEMORY.md`).

### Swarm orchestration

Parallel workflows can be orchestrated via the `COORDINATE` agent or manually via skills. The Swarm sub-system spins up isolated environment states (`sub-sess`) with interconnected file-based inbox systems.

**Available Swarm Tools:**
`team_create`, `team_delete`, `send_message`, `task_create`, `task_get`, `task_update`, `task_list`, `task_stop`.

### Agent Architecture

You can manually switch your active companion utilizing `Tab`, or rely on Xethryon's intrinsic autonomy to pivot appropriately. 

| Role | Codename | Primary Function |
|---|---|---|
| **Build** | `CONSTRUCT` | Full-access agent for direct code implementation and development. |
| **Plan** | `ARCHITECT` | Read-only agent optimized for deep architectural analysis and exploration. |
| **Manage** | `COORDINATE` | Team-lead agent specifically tuned for orchestrating parallel sub-agents. |
| **Search** | `RECON` | Wide-lens code exploration and codebase searching. |
| **Review** | `VALIDATOR` | Dedicated focus for code verification, test validation, and PR reviews. |

### Command Reference

Access the command palette in the TUI (`Ctrl+P`) or type directly into the prompt box utilizing the slash (`/`) prefix:

| Command | Action |
|---|---|
| `/commit` | Git commit and push with conventional prefixing. |
| `/verify` | Validate code changes via test running and edge case checking. |
| `/batch` | Parallel work orchestration sequence. |
| `/simplify` | Complex three-pass code review (reuse, quality, efficiency). |
| `/review` | Review uncommitted project changes. |
| `/dream` | Force memory consolidation into durable knowledge files. |
| `/learn` | Extract arbitrary non-obvious learnings to `AGENTS.md`. |
| `/debug` | Diagnostics for session states, context windows, and history mapping. |
| `/loop` | Recurring prompt scheduler. |

---

## Theme Customization

The aesthetic is modular. Edit `packages/opencode/src/cli/cmd/tui/context/theme/xethryon.json` to alter the syntax, terminal colors, highlights, and borders. The TUI reloads styles instantly on next launch—no compilation needed.

---

## Credits & Attribution

- Base terminal interface and interaction layers built upon [OpenCode](https://github.com/anomalyco/opencode) by Anomaly.
- Memory handling strategy and context loop inspired by Anthropic's [Claude Code](https://github.com/anthropics/claude-code). 
- Maintained, extended, and designed by [@EstarinAzx](https://github.com/EstarinAzx).
