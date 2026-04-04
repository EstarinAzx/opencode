/**
 * Verify skill — review and validate code changes.
 * Ported from cc-leak/src/skills/bundled/verify.ts.
 * Removed USER_TYPE === 'ant' gate — available to all users.
 */

import { registerBundledSkill } from "../registry.js"

const VERIFY_PROMPT = `# Verify: Validate Code Changes

Verify that the current code changes work correctly by testing them systematically.

## Steps

1. **Identify what changed** — Run \`git diff\` to see current modifications
2. **Understand the change** — Read the relevant files to understand the intent
3. **Run existing tests** — Execute the project's test suite to catch regressions
4. **Test the specific change** — If the change is user-facing, test it manually (run the app, exercise the feature)
5. **Check for edge cases** — Think about what could go wrong and verify those paths
6. **Report findings** — Summarize what you tested, what passed, and any issues found

## Rules
- Don't modify any code — this is a read-only verification
- If tests fail, report the failure but don't fix it
- Be thorough but efficient — focus testing on the changed code paths
`

export function registerVerifySkill(): void {
  registerBundledSkill({
    name: "verify",
    description: "Verify a code change does what it should by running tests and checking edge cases.",
    userInvocable: true,
    subtask: true,
    async getPrompt(args) {
      const parts: string[] = [VERIFY_PROMPT.trimStart()]
      if (args) {
        parts.push(`## User Request\n\n${args}`)
      }
      return parts.join("\n\n")
    },
  })
}
