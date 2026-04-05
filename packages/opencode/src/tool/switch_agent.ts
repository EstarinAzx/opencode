/**
 * Autonomy tool: switch_agent
 * Allows the AI to dynamically switch its agent mode.
 *
 * The tool itself is always functional — the autonomy toggle
 * in the TUI controls whether the AI is instructed to USE it
 * (via system prompt injection on the client side).
 */

import z from "zod"
import { Tool } from "./tool"

const parameters = z.object({
  agent: z
    .enum(["build", "plan", "explore", "coordinator", "verification"])
    .describe("The agent mode to switch to: build (CONSTRUCT), plan (ARCHITECT), explore (RECON), coordinator (COORDINATE), verification (VALIDATOR)"),
  reason: z.string().describe("Brief reason for switching modes").optional(),
})

export const SwitchAgentTool = Tool.define("switch_agent", {
  description: [
    "Switch the current agent mode to better match the task at hand.",
    "Each mode has specific capabilities — if the current task falls outside your mode's scope, you MUST switch BEFORE attempting it.",
    "",
    "=== MANDATORY TRIGGERS — switch IMMEDIATELY when you detect these ===",
    "→ User mentions 'subagent', 'sub-agent', 'team', 'spawn', 'summon', 'parallel agents', 'delegate to agents' → switch to COORDINATE",
    "→ User asks to 'plan', 'design', 'architect', 'break down', 'roadmap', 'strategy' → switch to ARCHITECT",
    "→ User asks to 'explore', 'find', 'search code', 'how does X work', 'understand' → switch to RECON",
    "→ User asks to 'test', 'verify', 'check', 'validate', 'review code' → switch to VALIDATOR",
    "→ User asks to 'build', 'implement', 'fix', 'create', 'code', 'write' → switch to CONSTRUCT",
    "→ After finishing planning/architecture → switch to CONSTRUCT to execute",
    "→ After team work completes and only simple tasks remain → switch to CONSTRUCT",
    "",
    "=== MODE CAPABILITIES ===",
    "CONSTRUCT (build) — Writing code, implementing features, fixing bugs, editing files, running commands.",
    "ARCHITECT (plan) — Architecture decisions, multi-step planning, designing approaches. Cannot spawn teams.",
    "RECON (explore) — Reading/exploring code, understanding codebases, research. Read-only.",
    "COORDINATE (coordinator) — Spawning subagents, creating teams, delegating parallel tasks. The ONLY mode that should use team_create/send_message.",
    "VALIDATOR (verification) — Running tests, code review, verifying correctness.",
    "",
    "CRITICAL: Do NOT use team_create, send_message, or spawn subagents unless you are in COORDINATE mode. Switch first, then spawn.",
  ].join("\n"),
  parameters,
  async execute(args, ctx) {
    const cyberNames: Record<string, string> = {
      build: "CONSTRUCT",
      plan: "ARCHITECT",
      explore: "RECON",
      coordinator: "COORDINATE",
      verification: "VALIDATOR",
    }

    const displayName = cyberNames[args.agent] ?? args.agent.toUpperCase()

    return {
      output: JSON.stringify({
        type: "agent_switch",
        agent: args.agent,
        displayName,
        reason: args.reason ?? "Task requires different capabilities",
      }),
      title: `⚡ Switching to ${displayName}`,
      metadata: {
        agent: args.agent,
        switched: true,
      },
    }
  },
})
