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
<p align="center">A cyberpunk-themed AI coding agent for the terminal. Built on <a href="https://github.com/anomalyco/opencode">OpenCode</a>.</p>

---

## What is XETHRYON?

XETHRYON is a **heavily customized fork** of [OpenCode](https://opencode.ai) — an open-source AI coding agent that runs in your terminal. It's been overhauled with:

- 🎨 **Netrunner dark theme** — acid yellow, electric cyan, hot pink on ultra-dark backgrounds
- 🖥️ **Bespoke TUI layout** — clean centered interface, message bubbles, custom borders
- ⚡ **Cyberpunk identity** — custom ASCII logo, agent codenames (CONSTRUCT, STRATAGEM, NEXUS), neural interface branding
- 🧠 **Persistent memory** — AI remembers context across sessions
- 🤖 **Multi-agent system** — Coordinator, Verification, and specialized agents built-in
- 🔌 **Provider agnostic** — Works with Claude, OpenAI, Google, OpenRouter, local models, and more

> This is **not** affiliated with the OpenCode team. It's a community fork with a different aesthetic and feature set.

---

## Quick Install

### Prerequisites

- [Bun](https://bun.sh) (v1.1+)
- [Git](https://git-scm.com)
- An API key from any supported provider (OpenRouter, Anthropic, OpenAI, Google, etc.)

### Linux / macOS

```bash
# Clone the repo
git clone https://github.com/EstarinAzx/XETHRYON.git
cd XETHRYON

# Install dependencies
bun install

# Run
cd packages/opencode
bun run dev
```

### Windows

```powershell
# Clone the repo
git clone https://github.com/EstarinAzx/XETHRYON.git
cd XETHRYON

# Install dependencies
bun install

# Run
cd packages\opencode
bun run dev
```

### Run from Anywhere (Windows)

After cloning, add the repo to your PATH so you can launch from any directory:

```powershell
# Add to PATH (run once)
[Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path", "User") + ";C:\path\to\XETHRYON", "User")

# Then from any directory, just run:
xethryon
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

You can also configure providers through the TUI itself — press `Ctrl+P` → Commands → Provider Settings.

---

## Agents

XETHRYON includes specialized agents you can switch between with `Tab`:

| Agent | Codename | Description |
|---|---|---|
| **Build** | `CONSTRUCT` | Default full-access agent for development |
| **Plan** | `STRATAGEM` | Read-only agent for analysis and exploration |
| **Coordinator** | `NEXUS` | Multi-agent orchestration for complex tasks |
| **Explore** | `RECON` | Code exploration and search |
| **Verification** | `VALIDATOR` | Code review and validation |

---

## Theme

The XETHRYON theme is defined in:
```
packages/opencode/src/cli/cmd/tui/context/theme/xethryon.json
```

You can customize colors by editing this file directly. Changes take effect on next launch — no build needed.

### Current Palette

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

## Credits

- Built on [OpenCode](https://github.com/anomalyco/opencode) by Anomaly
- Forked and reskinned by [@EstarinAzx](https://github.com/EstarinAzx)

---

<p align="center"><sub>◈ XETHRYON NEURAL INTERFACE — jack in, start coding</sub></p>
