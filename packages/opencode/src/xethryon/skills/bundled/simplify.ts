/**
 * Simplify skill — code review and cleanup.
 * Ported from cc-leak/src/skills/bundled/simplify.ts.
 */

import { registerBundledSkill } from "../registry.js"

const SIMPLIFY_PROMPT = `# Simplify: Code Review and Cleanup

Review all changed files for reuse, quality, and efficiency. Fix any issues found.

## Phase 1: Identify Changes

Run \`git diff\` (or \`git diff HEAD\` if there are staged changes) to see what changed. If there are no git changes, review the most recently modified files.

## Phase 2: Three Review Passes

### Pass 1: Code Reuse Review

For each change:

1. **Search for existing utilities and helpers** that could replace newly written code. Look for similar patterns elsewhere in the codebase.
2. **Flag any new function that duplicates existing functionality.** Suggest the existing function to use instead.
3. **Flag any inline logic that could use an existing utility** — hand-rolled string manipulation, manual path handling, custom environment checks, ad-hoc type guards.

### Pass 2: Code Quality Review

Review the same changes for hacky patterns:

1. **Redundant state**: state that duplicates existing state, cached values that could be derived
2. **Parameter sprawl**: adding new parameters instead of generalizing existing ones
3. **Copy-paste with slight variation**: near-duplicate code blocks that should be unified
4. **Leaky abstractions**: exposing internal details that should be encapsulated
5. **Stringly-typed code**: using raw strings where constants, enums, or branded types exist
6. **Unnecessary comments**: comments explaining WHAT the code does — delete; keep only non-obvious WHY

### Pass 3: Efficiency Review

Review the same changes for efficiency:

1. **Unnecessary work**: redundant computations, repeated file reads, duplicate network calls, N+1 patterns
2. **Missed concurrency**: independent operations run sequentially when they could run in parallel
3. **Hot-path bloat**: new blocking work added to startup or per-request hot paths
4. **Memory**: unbounded data structures, missing cleanup, event listener leaks
5. **Overly broad operations**: reading entire files when only a portion is needed

## Phase 3: Fix Issues

Aggregate findings and fix each issue directly. If a finding is a false positive, note it and move on.

When done, briefly summarize what was fixed (or confirm the code was already clean).
`

export function registerSimplifySkill(): void {
  registerBundledSkill({
    name: "simplify",
    description: "Review changed code for reuse, quality, and efficiency, then fix any issues found.",
    userInvocable: true,
    subtask: true,
    async getPrompt(args) {
      let prompt = SIMPLIFY_PROMPT
      if (args) {
        prompt += `\n\n## Additional Focus\n\n${args}`
      }
      return prompt
    },
  })
}
