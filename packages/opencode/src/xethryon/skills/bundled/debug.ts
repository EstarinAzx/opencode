/**
 * Debug skill — session diagnostics.
 * Ported from cc-leak/src/skills/bundled/debug.ts.
 * Adapted for Xethryon — no Anthropic-specific paths.
 */

import { registerBundledSkill } from "../registry.js"

export function registerDebugSkill(): void {
  registerBundledSkill({
    name: "debug",
    description: "Enable debug logging for this session and help diagnose issues.",
    argumentHint: "[issue description]",
    disableModelInvocation: true,
    userInvocable: true,
    async getPrompt(args) {
      const prompt = `# Debug Skill

Help the user debug an issue they're encountering in this Xethryon session.

## Issue Description

${args || "The user did not describe a specific issue. Check for recent errors and summarize any notable issues."}

## Investigation Steps

1. **Review the user's issue description**
2. **Check for error patterns** — Look for stack traces, error messages, and failure patterns
3. **Check configuration** — Verify the project's config files (.opencode/, AGENTS.md) for misconfigurations
4. **Check environment** — Verify API keys, providers, and tool availability
5. **Explain what you found** in plain language
6. **Suggest concrete fixes** or next steps

## Common Issues
- API key not set or invalid → check environment variables
- Provider not responding → check network and rate limits
- Tool execution failing → check permissions and paths
- Memory system not writing → check disk permissions and paths
- Build failures → check dependencies and TypeScript errors

## Rules
- Be thorough but concise
- Start with the most likely causes
- If you can't diagnose the issue, suggest what logs or information would help
`
      return prompt
    },
  })
}
