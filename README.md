# XETHRYON

> **The AI coding agent that remembers, reflects, and ships.**

Xethryon is a terminal-based AI software engineering agent that doesn't just write code — it verifies its own work, remembers your project across sessions, and autonomously invokes workflows to test and ship changes. Built as a hybrid fork combining [OpenCode](https://opencode.ai)'s robust TUI foundation with cherry-picked architectures from Anthropic's [Claude Code](https://github.com/anthropics/claude-code) leak, plus original innovations in agentic autonomy.

---

## What Makes It Different

Most coding agents write code and stop. Xethryon operates on a **think → write → reflect → verify → ship** loop:

```
You: "create a URL parser utility"
                    ↓
        Agent writes urlParser.js
                    ↓
   ┌─ Reflection gate catches missing edge cases
   │   Agent self-corrects before you see it
   └────────────────↓
       invoke_skill(/verify) — runs tests automatically
                    ↓
       invoke_skill(/pr) — branches, commits, pushes
                    ↓
You: "Done. PR URL: github.com/you/repo/compare/..."
```

No other open-source TUI agent does this.

---

## Key Features

### 🧠 Persistent Project Memory
Xethryon remembers your codebase patterns, past bugs, coding style, and decisions across sessions. The memory system is fully automatic:

- **Post-turn extraction** — every conversation generates durable learnings
- **Cross-session recall** — relevant memories surface automatically based on your current query
- **AutoDream consolidation** — background optimization when 24h pass or 5 sessions accumulate
- **LLM-ranked relevance** — intelligent retrieval, not primitive keyword matching

Memory lives at `~/.xethryon/projects/<project>/memory/` and persists indefinitely.

### 🔍 Self-Reflection Loop
Before presenting any code to you, the agent reviews its own work:

- Did the code actually address the request?
- Are there missing edge cases?
- Does it follow project patterns?

If issues are found, it self-corrects in a hidden revision pass — you only see the clean result. Toggle with `XETHRYON_REFLECTION=0`.

### 🌿 Git-Aware Context
The agent sees your git state at all times — branch, uncommitted changes, merge/rebase status, ahead/behind counts. No need to tell it "I'm on a feature branch" or "I have unstaged changes" — it knows.

- Auto-stash guidance before risky operations
- Branch awareness for commit decisions
- Conflict detection during merge/rebase
- Toggle with `XETHRYON_GIT_AWARE=0`

### ⚡ Autonomous Skill Invocation
When autonomy is ON (`F4`), the agent doesn't wait to be told — it acts. After writing code, it runs a mandatory post-task checklist:

1. ✅ Did I create/modify code? → auto-invoke `/verify`
2. 💾 Did I learn a project pattern? → auto-invoke `/remember`
3. 📦 Is the task complete? → auto-invoke `/pr`
4. 🔍 Did something fail? → auto-invoke `/debug`

This turns a one-shot coding assistant into a full autonomous workflow engine.

### 🐝 Swarm Orchestration
Spawn parallel AI teammates for complex operations. The swarm system uses file-based IPC, shared task boards, and isolated sub-sessions.

**Swarm tools:** `team_create`, `team_delete`, `send_message`, `task_create`, `task_get`, `task_update`, `task_list`, `task_stop`

### 🤖 Dynamic Agent Modes
Switch between specialized modes via `Tab` or let autonomy handle it:

| Mode | Codename | Purpose |
|------|----------|---------|
| **Build** | `CONSTRUCT` | Full-access code implementation |
| **Plan** | `ARCHITECT` | Read-only architectural analysis |
| **Manage** | `COORDINATE` | Multi-agent team orchestration |
| **Search** | `RECON` | Codebase exploration and research |
| **Review** | `VALIDATOR` | Test validation and code review |

### 🔌 Provider Agnostic
Bring your own keys. Supports Anthropic, OpenAI, Google, OpenRouter, MiniMax, and local models via compatible endpoints.

### 🎨 Cyberpunk TUI
Dark-themed, neon-accented terminal interface with a distinctive Cyberpunk 2077 color palette. Fully customizable via theme JSON — no recompilation needed.

---

## Quick Install

### Prerequisites

- [Bun](https://bun.sh) (v1.1+)
- Git
- An LLM API key (OpenRouter, Anthropic, OpenAI, Google, etc.)

### Build from Source

```bash
git clone https://github.com/EstarinAzx/XETHRYON.git
cd XETHRYON
bun install
cd packages/opencode
bun run build --single
```

The binary outputs to `dist/opencode-<platform>-<arch>/bin/xethryon(.exe)`.

### Add to PATH

**Windows (PowerShell — admin):**

```powershell
$dest = "$env:LOCALAPPDATA\xethryon\bin"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item "packages\opencode\dist\opencode-windows-x64\bin\xethryon.exe" -Destination "$dest\xethryon.exe"
[Environment]::SetEnvironmentVariable("Path", "$env:Path;$dest", "User")
```

**Linux / macOS:**

```bash
sudo cp packages/opencode/dist/opencode-$(uname -s | tr A-Z a-z)-$(uname -m)/bin/xethryon /usr/local/bin/
```

Then just run `xethryon` from any project directory.

---

## Configuration

Supply API keys via `.env` in your project root, shell exports, or the TUI (`Ctrl+P` → Provider Settings):

```env
# OpenRouter (access multiple model families)
OPENROUTER_API_KEY=sk-or-...

# Direct provider keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

### Environment Toggles

| Variable | Default | Description |
|----------|---------|-------------|
| `XETHRYON_REFLECTION` | `1` | Self-reflection loop before presenting code |
| `XETHRYON_GIT_AWARE` | `1` | Git state injection into agent context |
| `XETHRYON_AUTONOMY` | `0` | Autonomous mode (also toggled via `F4`) |
| `XETHRYON_DEBUG` | `false` | Debug logging for memory/skills systems |

---

## Commands & Skills

Access via slash commands in the TUI or the command palette (`Ctrl+P`):

| Command | Description |
|---------|-------------|
| `/verify` | Validate code changes — run tests, check edge cases |
| `/pr` | One-command PR — auto-branch, commit, push, PR URL |
| `/debug` | Systematic diagnostics for errors and session state |
| `/simplify` | Three-pass code review (reuse, quality, efficiency) |
| `/remember` | Persist learnings and patterns to project memory |
| `/batch` | Parallel work orchestration |
| `/commit` | Git commit + push with conventional prefixes |
| `/review` | Review uncommitted changes |
| `/dream` | Force memory consolidation |
| `/learn` | Extract non-obvious learnings to AGENTS.md |
| `/loop` | Recurring prompt scheduler |
| `/onboard` | Guided project onboarding |
| `/autopilot` | Continuous autonomous execution |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  TUI Thread                      │
│  Input → Command Parsing → Slash Skills          │
│  Theme → Render → Agent Switcher (Tab/F4)        │
└──────────────────┬──────────────────────────────┘
                   │ BroadcastChannel
┌──────────────────▼──────────────────────────────┐
│                Worker Thread                     │
│                                                  │
│  ┌─────────┐  ┌──────────┐  ┌───────────────┐   │
│  │ System   │  │ Memory   │  │ Git Context   │   │
│  │ Prompt   │  │ Recall   │  │ Injection     │   │
│  └────┬─────┘  └────┬─────┘  └──────┬────────┘   │
│       └──────────────┼───────────────┘            │
│                      ▼                            │
│              ┌──────────────┐                     │
│              │  LLM Turn    │ ◄── Tool Calls      │
│              └──────┬───────┘                     │
│                     ▼                             │
│              ┌──────────────┐                     │
│              │ Reflection   │ ◄── PASS / REVISE   │
│              │    Gate      │                     │
│              └──────┬───────┘                     │
│                     ▼                             │
│              ┌──────────────┐                     │
│              │ Autonomy     │ ◄── invoke_skill()  │
│              │  Checklist   │                     │
│              └──────┬───────┘                     │
│                     ▼                             │
│              Memory Post-Turn Hook                │
│              (Extract → Store → AutoDream)        │
└─────────────────────────────────────────────────┘
```

---

## Theme Customization

Edit `packages/opencode/src/cli/cmd/tui/context/theme/xethryon.json` to alter syntax colors, borders, highlights, and accents. Changes take effect on next launch — no recompilation.

---

## What's Under The Hood

| System | Origin | Status |
|--------|--------|--------|
| TUI + Session Management | OpenCode | ✅ Production |
| Memory Persistence + AutoDream | Claude Code (ported) | ✅ Production |
| Cross-Session Memory Retrieval | **Original** | ✅ Production |
| Self-Reflection Loop | **Original** | ✅ Production |
| Git-Aware Context Injection | **Original** | ✅ Production |
| Autonomous Skill Invocation | **Original** | ✅ Production |
| Swarm Orchestration | Claude Code (ported) | ✅ Production |
| Bundled Skills System | Claude Code (ported) | ✅ Production |
| Agent Mode Switching | Hybrid (both) | ✅ Production |
| Cyberpunk Theme | **Original** | ✅ Production |

---

## Credits & Attribution

- Terminal interface and session management built upon [OpenCode](https://github.com/anomalyco/opencode) by Anomaly.
- Memory persistence strategy and context loop architectures inspired by Anthropic's [Claude Code](https://github.com/anthropics/claude-code).
- Cross-session memory retrieval, self-reflection loop, git-awareness, autonomous skill invocation, and Cyberpunk identity — designed and built by [@EstarinAzx](https://github.com/EstarinAzx).

---

<p align="center">
  <sub>Built different. Ships autonomous.</sub>
</p>
