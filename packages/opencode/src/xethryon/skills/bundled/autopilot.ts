/**
 * Autopilot skill — self-healing build/test loop.
 *
 * Runs a user-specified command (build, test, lint, etc.),
 * and if it fails, feeds the error output to the LLM which
 * analyzes and fixes the issue, then re-runs. Repeats until
 * the command passes or the retry limit is hit.
 */

import { registerBundledSkill } from "../registry.js"

const AUTOPILOT_PROMPT = `# Autopilot: Self-Healing Build Loop

You are in autopilot mode. Your objective is to get a command to pass successfully by iteratively fixing errors.

## How It Works

1. **Run the command** the user specified (or detect the project's build/test command)
2. **If it succeeds** → report success and stop
3. **If it fails** → analyze the error output carefully
4. **Diagnose the root cause** — read the relevant source files
5. **Apply the minimal fix** — change only what's necessary
6. **Re-run the command** to verify the fix
7. **Repeat** until the command passes (max 7 iterations)

## Rules

- **Minimal changes only** — fix the failing issue, don't refactor or improve unrelated code
- **One fix per iteration** — don't try to fix multiple errors at once
- **Track your iterations** — report which iteration you're on: [AUTOPILOT 1/7], [AUTOPILOT 2/7], etc.
- **Know when to stop** — if you're going in circles or can't make progress after 3 attempts, stop and report what's wrong
- **Never skip the re-run** — always verify your fix by running the command again
- **Preserve intent** — understand what the code is trying to do before changing it

## Auto-Detection

If no command is specified, detect the project type and use:
- **Node.js**: \`npm test\` or \`npm run build\`
- **Python**: \`pytest\` or \`python -m unittest\`
- **Rust**: \`cargo build\` or \`cargo test\`
- **Go**: \`go build ./...\` or \`go test ./...\`
- **General**: Look for Makefile, build scripts, CI config

## Output Format

After each iteration, report:
\`\`\`
[AUTOPILOT N/7] Status: PASS|FAIL
Command: <what was run>
Error: <one-line summary if failed>
Fix: <what you changed if applicable>
\`\`\`

When complete:
\`\`\`
[AUTOPILOT COMPLETE] ✓ Command passing after N iterations
Total changes: <summary of all fixes applied>
\`\`\`
`

export function registerAutopilotSkill(): void {
  registerBundledSkill({
    name: "autopilot",
    description: "Self-healing loop: run a command, auto-fix errors, repeat until it passes.",
    userInvocable: true,
    subtask: false,
    async getPrompt(args) {
      const parts: string[] = [AUTOPILOT_PROMPT.trimStart()]
      if (args) {
        parts.push(`## Command to Run\n\n\`${args}\`\n\nRun this command and enter the autopilot loop. Fix any errors until it passes.`)
      } else {
        parts.push(`## No Command Specified\n\nAuto-detect the project type and find the appropriate build/test command. Then enter the autopilot loop.`)
      }
      return parts.join("\n\n")
    },
  })
}
