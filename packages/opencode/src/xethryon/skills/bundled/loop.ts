/**
 * Loop skill — recurring prompt scheduling.
 * Ported from cc-leak/src/skills/bundled/loop.ts.
 * Note: Requires cron tools (Phase 4) to be fully functional.
 * For now, registers the skill with manual re-invocation guidance.
 */

import { registerBundledSkill } from "../registry.js"

const DEFAULT_INTERVAL = "10m"

const USAGE_MESSAGE = `Usage: /loop [interval] <prompt>

Run a prompt or slash command on a recurring interval.

Intervals: Ns, Nm, Nh, Nd (e.g. 5m, 30m, 2h, 1d). Minimum granularity is 1 minute.
If no interval is specified, defaults to ${DEFAULT_INTERVAL}.

Examples:
  /loop 5m check the build
  /loop 30m run tests
  /loop 1h check deploy status
  /loop check the tests          (defaults to ${DEFAULT_INTERVAL})`

function buildPrompt(args: string): string {
  return `# /loop — Recurring Prompt

Parse the input below into \`[interval] <prompt…>\` and execute it.

## Parsing (in priority order)

1. **Leading token**: if the first whitespace-delimited token matches \`^\\d+[smhd]$\` (e.g. \`5m\`, \`2h\`), that's the interval; the rest is the prompt.
2. **Trailing "every" clause**: if the input ends with \`every <N><unit>\` or \`every <N> <unit-word>\`, extract that as the interval and strip it from the prompt.
3. **Default**: interval is \`${DEFAULT_INTERVAL}\` and the entire input is the prompt.

If the resulting prompt is empty, show usage and stop.

## Action

1. Execute the parsed prompt immediately
2. Report completion and the interval
3. Note: Automatic re-execution requires cron tools. For now, the user can re-invoke \`/loop\` manually.

## Input

${args}`
}

export function registerLoopSkill(): void {
  registerBundledSkill({
    name: "loop",
    description: "Run a prompt or slash command on a recurring interval (e.g. /loop 5m /foo, defaults to 10m).",
    whenToUse: "When the user wants to run something repeatedly on an interval.",
    argumentHint: "[interval] <prompt>",
    userInvocable: true,
    async getPrompt(args) {
      const trimmed = args.trim()
      if (!trimmed) {
        return USAGE_MESSAGE
      }
      return buildPrompt(trimmed)
    },
  })
}
