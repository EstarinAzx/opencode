# XETHRYON Modifications from Upstream OpenCode

> **Purpose**: This document tracks every modification made to the upstream [OpenCode](https://github.com/anomalyco/opencode) codebase. Use this as a checklist when rebasing onto a newer upstream version.
>
> **Fork point**: Commit `a18bc735b` on upstream `dev` branch
> **Upstream remote**: `https://github.com/anomalyco/opencode.git` (branch: `dev`)

---

## 1. Theme System

### Default Theme → Xethryon
**File**: `packages/opencode/src/cli/cmd/tui/context/theme.tsx`
**Change**: Set default theme to `xethryon` instead of upstream default for new users.

### Xethryon Theme Definition
**File**: `packages/opencode/src/cli/cmd/tui/context/theme/xethryon.json` *(NEW)*
**Change**: Custom "Netrunner" dark theme with:
- Background: `#0a0b08` (near-black with green tint)
- Primary: `#d4ed26` (acid yellow)
- Secondary: `#00e5ff` (electric cyan)
- Accent: `#e5a700` (warm amber)
- Text: `#c8cbb8`
- Muted: `#6b6e5a`

---

## 2. Branding & Logo

### ASCII Logo
**File**: `packages/opencode/src/cli/logo.ts`
**Change**: Replaced OpenCode logo with XETHRYON block ASCII art.

### Logo Renderer
**File**: `packages/opencode/src/cli/cmd/tui/component/logo.tsx`
**Change**: Updated renderer for new flat array logo format. Renders with theme primary color.

### Home Screen
**File**: `packages/opencode/src/cli/cmd/tui/routes/home.tsx`
**Change**: 
- "NEURAL INTERFACE" subtitle
- Removed upstream tips/branding
- Clean centered layout

---

## 3. Status Bar & Agent Codenames

### Prompt Status Bar
**File**: `packages/opencode/src/cli/cmd/tui/component/prompt/index.tsx`
**Change**: Custom status bar format:
```
BUILD: XETHRYON  CORE: [AGENT]  MODEL: [MODEL]
```
Agent names mapped to codenames:
| Internal Name | Display Name |
|---|---|
| build | CONSTRUCT |
| plan | STRATAGEM |
| coordinator | COORDINATE |
| explore | RECON |
| verification | VALIDATOR |

### Session Footer
**File**: `packages/opencode/src/cli/cmd/tui/routes/session/index.tsx`
**Change**: 
- Same codename mapping in response footer
- Agent metadata footer rendering block removed for cleaner UI

---

## 4. Built-in Agents (Baked into Binary)

### Coordinator Agent
**Files**:
- `packages/opencode/src/agent/agent.ts` — Added `coordinator` to agents record
- `packages/opencode/src/agent/prompt/coordinator.txt` *(NEW)* — System prompt

**Config**:
- Mode: `primary`
- Permissions: read/search/task only (no edit/write/bash)
- Purpose: Orchestrates complex tasks by delegating to worker subagents

### Verification Agent
**Files**:
- `packages/opencode/src/agent/agent.ts` — Added `verification` to agents record
- `packages/opencode/src/agent/prompt/verification.txt` *(NEW)* — System prompt

**Config**:
- Mode: `subagent`
- Permissions: read/search/bash only (no edit/write)
- Purpose: Adversarial testing — runs builds, tests, tries to break implementations

---

## 5. Built-in Commands (Baked into Binary)

### `/dream`
**Files**:
- `packages/opencode/src/command/index.ts` — Registered as `Default.DREAM`
- `packages/opencode/src/command/template/dream.txt` *(NEW)*

**Purpose**: Consolidate memories from recent sessions into `.opencode/memory/` files.

### `/learn`
**Files**:
- `packages/opencode/src/command/index.ts` — Registered as `Default.LEARN`
- `packages/opencode/src/command/template/learn.txt` *(NEW)*

**Purpose**: Extract non-obvious learnings from session to AGENTS.md files.

### `/commit`
**Files**:
- `packages/opencode/src/command/index.ts` — Registered as `Default.COMMIT`
- `packages/opencode/src/command/template/commit.txt` *(NEW)*

**Purpose**: Git commit and push with conventional commit prefixes.

### `/spellcheck`
**Files**:
- `packages/opencode/src/command/index.ts` — Registered as `Default.SPELLCHECK`
- `packages/opencode/src/command/template/spellcheck.txt` *(NEW)*

**Purpose**: Spellcheck all changed markdown files.

---

## 6. Build System Fix

### cross-spawn-spawner require() → import()
**File**: `packages/opencode/src/effect/cross-spawn-spawner.ts`
**Change**: Replaced `require("cross-spawn")` with dynamic `import("cross-spawn")` to fix standalone Windows binary compilation. 
> **Note**: Upstream has since merged this same fix in commit `e148b318b`.

---

## 7. UI Layout & Styling

### Border Component
**File**: `packages/opencode/src/cli/cmd/tui/component/border.tsx`
**Change**: Custom border styling for prompt box and message containers.

### Dialog Provider
**File**: `packages/opencode/src/cli/cmd/tui/component/dialog-provider.tsx`
**Change**: Rebranded dialog text references from "OpenCode" to "Xethryon".

### App Shell
**File**: `packages/opencode/src/cli/cmd/tui/app.tsx`
**Change**: Terminal title set to "XETHRYON".

### CLI UI
**File**: `packages/opencode/src/cli/ui.ts`
**Change**: CLI text references rebranded.

### Tips View
**File**: `packages/opencode/src/cli/cmd/tui/feature-plugins/home/tips-view.tsx`
**Change**: Rebranded tips text.

### Permission Dialog
**File**: `packages/opencode/src/cli/cmd/tui/routes/session/permission.tsx`
**Change**: Rebranded permission dialog text.

### Sidebar Components
**Files**:
- `packages/opencode/src/cli/cmd/tui/routes/session/sidebar.tsx`
- `packages/opencode/src/cli/cmd/tui/feature-plugins/sidebar/context.tsx`
- `packages/opencode/src/cli/cmd/tui/feature-plugins/sidebar/files.tsx`
- `packages/opencode/src/cli/cmd/tui/feature-plugins/sidebar/footer.tsx`
- `packages/opencode/src/cli/cmd/tui/feature-plugins/sidebar/lsp.tsx`
- `packages/opencode/src/cli/cmd/tui/feature-plugins/sidebar/mcp.tsx`
- `packages/opencode/src/cli/cmd/tui/feature-plugins/sidebar/todo.tsx`

**Change**: Style adjustments and branding updates.

---

## 8. Distribution

### Windows Install Script
**File**: `install.ps1` *(NEW)*
**Change**: PowerShell one-liner installer that:
- Downloads latest release from GitHub
- Extracts to `%LOCALAPPDATA%\xethryon\bin\`
- Adds to user PATH
- Handles VS Code terminal PATH refresh

### Linux/macOS Install Script
**File**: `install.sh` *(NEW)* (placeholder)

### Batch Launcher
**File**: `xethryon.bat` *(NEW)*
**Change**: Dev launcher for running from the repo directory via `bun run dev`.

### README
**File**: `README.md`
**Change**: Complete rewrite with XETHRYON branding, install instructions, agent/command documentation.

### .gitignore
**File**: `.gitignore`
**Change**: Added entries for build artifacts and local binaries.

---

## Rebase Checklist

When rebasing onto a newer upstream version, re-apply modifications in this order:

1. **Theme**: Copy `xethryon.json`, set default in `theme.tsx`
2. **Logo**: Update `logo.ts` and `logo.tsx`
3. **Branding**: Search-replace "OpenCode" → "Xethryon" in dialog/tip text
4. **Status bar**: Update `prompt/index.tsx` with codename mapping and status format
5. **Session footer**: Update `session/index.tsx` with codename mapping
6. **Agents**: Add coordinator + verification to `agent.ts`, copy prompt `.txt` files
7. **Commands**: Add dream/learn/commit/spellcheck to `command/index.ts`, copy template `.txt` files
8. **Build fix**: Check if `cross-spawn-spawner.ts` still needs the require→import fix
9. **Distribution**: Copy `install.ps1`, `install.sh`, `xethryon.bat`, `README.md`

---

## File Summary

### New Files (14)
| File | Purpose |
|---|---|
| `packages/opencode/src/cli/cmd/tui/context/theme/xethryon.json` | Theme definition |
| `packages/opencode/src/agent/prompt/coordinator.txt` | Coordinator system prompt |
| `packages/opencode/src/agent/prompt/verification.txt` | Verification system prompt |
| `packages/opencode/src/command/template/dream.txt` | /dream command template |
| `packages/opencode/src/command/template/learn.txt` | /learn command template |
| `packages/opencode/src/command/template/commit.txt` | /commit command template |
| `packages/opencode/src/command/template/spellcheck.txt` | /spellcheck command template |
| `install.ps1` | Windows installer |
| `install.sh` | Linux/macOS installer |
| `xethryon.bat` | Dev launcher |
| `README.md` | Documentation (rewritten) |
| `XETHRYON_MODS.md` | This file |
| `.gitignore` | Updated ignores |

### Modified Files (20)
| File | Category |
|---|---|
| `packages/opencode/src/agent/agent.ts` | Agents |
| `packages/opencode/src/command/index.ts` | Commands |
| `packages/opencode/src/effect/cross-spawn-spawner.ts` | Build fix |
| `packages/opencode/src/cli/cmd/tui/context/theme.tsx` | Theme |
| `packages/opencode/src/cli/cmd/tui/component/logo.tsx` | Branding |
| `packages/opencode/src/cli/cmd/tui/component/prompt/index.tsx` | Status bar |
| `packages/opencode/src/cli/cmd/tui/component/border.tsx` | UI |
| `packages/opencode/src/cli/cmd/tui/component/dialog-provider.tsx` | Branding |
| `packages/opencode/src/cli/cmd/tui/routes/home.tsx` | Home screen |
| `packages/opencode/src/cli/cmd/tui/routes/session/index.tsx` | Session UI |
| `packages/opencode/src/cli/cmd/tui/routes/session/permission.tsx` | Branding |
| `packages/opencode/src/cli/cmd/tui/routes/session/sidebar.tsx` | UI |
| `packages/opencode/src/cli/cmd/tui/feature-plugins/home/tips-view.tsx` | Branding |
| `packages/opencode/src/cli/cmd/tui/feature-plugins/sidebar/*.tsx` | UI (6 files) |
| `packages/opencode/src/cli/cmd/tui/app.tsx` | Terminal title |
| `packages/opencode/src/cli/logo.ts` | Logo data |
| `packages/opencode/src/cli/ui.ts` | CLI text |
