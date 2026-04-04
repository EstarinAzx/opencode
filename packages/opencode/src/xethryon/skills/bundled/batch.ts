/**
 * Batch skill — parallel work orchestration.
 * Ported from cc-leak/src/skills/bundled/batch.ts.
 * Adapted: tool name references mapped to OpenCode's tool IDs.
 */

import { registerBundledSkill } from "../registry.js"

const WORKER_INSTRUCTIONS = `After you finish implementing the change:
1. **Simplify** — Review and clean up your changes for code quality.
2. **Run unit tests** — Run the project's test suite. If tests fail, fix them.
3. **Test end-to-end** — Follow the e2e test recipe from the coordinator's prompt. If no recipe, skip.
4. **Commit and push** — Commit all changes with a clear message, push the branch, and create a PR with \`gh pr create\`. If \`gh\` is not available, note it in your final message.
5. **Report** — End with a single line: \`PR: <url>\` so the coordinator can track it. If no PR was created, end with \`PR: none — <reason>\`.`

function buildPrompt(instruction: string): string {
  return `# Batch: Parallel Work Orchestration

You are orchestrating a large, parallelizable change across this codebase.

## User Instruction

${instruction}

## Phase 1: Research and Plan

1. **Understand the scope.** Deeply research what this instruction touches. Find all the files, patterns, and call sites that need to change. Understand the existing conventions so the migration is consistent.

2. **Decompose into independent units.** Break the work into 5–30 self-contained units. Each unit must:
   - Be independently implementable
   - Be mergeable on its own without depending on another unit landing first
   - Be roughly uniform in size (split large units, merge trivial ones)

   Scale the count to the actual work: few files → closer to 5; hundreds of files → closer to 30. Prefer per-directory or per-module slicing.

3. **Determine the e2e test recipe.** Figure out how a worker can verify its change runs correctly end-to-end.

4. **Write the plan.** Include:
   - A summary of what you found during research
   - A numbered list of work units — for each: a short title, the files/directories it covers, and a one-line description
   - The e2e test recipe (or "skip e2e because …")
   - The worker instructions template

## Phase 2: Spawn Workers (After Approval)

Once the plan is approved, spawn one background agent per work unit. Launch them all in parallel.

For each agent, the prompt must be fully self-contained. Include:
- The overall goal (the user's instruction)
- This unit's specific task (copied from your plan)
- Any codebase conventions discovered
- The e2e test recipe
- The worker instructions:

\`\`\`
${WORKER_INSTRUCTIONS}
\`\`\`

## Phase 3: Track Progress

After launching all workers, render a status table:

| # | Unit | Status | PR |
|---|------|--------|----| 
| 1 | <title> | running | — |
| 2 | <title> | running | — |

Update as workers complete. When all are done, render the final table with a summary.
`
}

const MISSING_INSTRUCTION_MESSAGE = `Provide an instruction describing the batch change you want to make.

Examples:
  /batch migrate from react to vue
  /batch replace all uses of lodash with native equivalents
  /batch add type annotations to all untyped function parameters`

export function registerBatchSkill(): void {
  registerBundledSkill({
    name: "batch",
    description: "Research, plan, and execute a large-scale change in parallel across 5–30 agents that each open a PR.",
    whenToUse: "Use when the user wants to make a sweeping, mechanical change across many files (migrations, refactors, bulk renames) that can be decomposed into independent parallel units.",
    argumentHint: "<instruction>",
    userInvocable: true,
    disableModelInvocation: true,
    subtask: true,
    async getPrompt(args) {
      const instruction = args.trim()
      if (!instruction) {
        return MISSING_INSTRUCTION_MESSAGE
      }
      return buildPrompt(instruction)
    },
  })
}
