/**
 * Remember skill — memory review and promotion.
 * Ported from cc-leak/src/skills/bundled/remember.ts.
 * Wires into Phase 1 memory system.
 * Removed USER_TYPE === 'ant' gate.
 */

import { registerBundledSkill } from "../registry.js"

/** Inline check — avoids importing memory/paths.ts (has transitive top-level await) */
function isAutoMemoryEnabled(): boolean {
  return process.env.XETHRYON_DISABLE_AUTO_MEMORY !== "true"
}

const REMEMBER_PROMPT = `# Memory Review

## Goal
Review your memory landscape and produce a clear report of proposed changes, grouped by action type. Do NOT apply changes — present proposals for user approval.

## Steps

### 1. Gather all memory layers
Read AGENTS.md and any project-local config from the project root (if they exist). Your auto-memory content is already in your system prompt — review it there.

**Success criteria**: You have the contents of all memory layers and can compare them.

### 2. Classify each auto-memory entry
For each substantive entry in auto-memory, determine the best destination:

| Destination | What belongs there | Examples |
|---|---|---|
| **AGENTS.md** | Project conventions that all contributors should follow | "use bun not npm", "API routes use kebab-case", "test command is bun test" |
| **AGENTS.local.md** | Personal instructions specific to this user | "I prefer concise responses", "always explain trade-offs", "don't auto-commit" |
| **Stay in auto-memory** | Working notes, temporary context, or entries that don't clearly fit | Session-specific observations, uncertain patterns |

**Important distinctions:**
- AGENTS.md contains instructions for the AI, not user preferences for external tools
- When unsure, ask rather than guess

**Success criteria**: Each entry has a proposed destination or is flagged as ambiguous.

### 3. Identify cleanup opportunities
Scan across all layers for:
- **Duplicates**: Auto-memory entries already captured in AGENTS.md → propose removing from auto-memory
- **Outdated**: AGENTS.md entries contradicted by newer auto-memory entries → propose updating
- **Conflicts**: Contradictions between layers → propose resolution, noting which is more recent

**Success criteria**: All cross-layer issues identified.

### 4. Present the report
Output a structured report grouped by action type:
1. **Promotions** — entries to move, with destination and rationale
2. **Cleanup** — duplicates, outdated entries, conflicts to resolve
3. **Ambiguous** — entries where you need the user's input on destination
4. **No action needed** — brief note on entries that should stay put

If auto-memory is empty, say so and offer to review AGENTS.md for cleanup.

**Success criteria**: User can review and approve/reject each proposal individually.

## Rules
- Present ALL proposals before making any changes
- Do NOT modify files without explicit user approval
- Do NOT create new files unless the target doesn't exist yet
- Ask about ambiguous entries — don't guess
`

export function registerRememberSkill(): void {
  registerBundledSkill({
    name: "remember",
    description: "Review auto-memory entries and propose promotions to AGENTS.md. Detects outdated, conflicting, and duplicate entries across memory layers.",
    whenToUse: "Use when the user wants to review, organize, or promote their auto-memory entries.",
    userInvocable: true,
    isEnabled: () => isAutoMemoryEnabled(),
    async getPrompt(args) {
      let prompt = REMEMBER_PROMPT
      if (args) {
        prompt += `\n## Additional context from user\n\n${args}`
      }
      return prompt
    },
  })
}
