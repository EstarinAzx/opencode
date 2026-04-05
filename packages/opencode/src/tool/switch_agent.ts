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
import { isAutonomyEnabled } from "../xethryon/autonomy"

// Accept both internal names AND display names
const AGENT_ALIASES: Record<string, string> = {
  build: "build",
  construct: "build",
  plan: "plan",
  architect: "plan",
  explore: "explore",
  recon: "explore",
  coordinator: "coordinator",
  coordinate: "coordinator",
  verification: "verification",
  validator: "verification",
}

const parameters = z.object({
  agent: z
    .string()
    .transform((val) => AGENT_ALIASES[val.toLowerCase()] ?? val)
    .pipe(z.enum(["build", "plan", "explore", "coordinator", "verification"]))
    .describe(
      "The agent mode to switch to. Accepts: build/construct (CONSTRUCT), plan/architect (ARCHITECT), explore/recon (RECON), coordinator/coordinate (COORDINATE), verification/validator (VALIDATOR)",
    ),
  reason: z.string().describe("Brief reason for switching modes").optional(),
})

export const SwitchAgentTool = Tool.define("switch_agent", {
  description: [
    "Switch the current agent mode to better match the task at hand.",
    "Each mode has specific capabilities — if the current task falls outside your mode's scope, you MUST switch BEFORE attempting it.",
    "",
    "=== AGENT VALUES (use any of these) ===",
    "build OR construct → CONSTRUCT mode",
    "plan OR architect → ARCHITECT mode",
    "explore OR recon → RECON mode",
    "coordinator OR coordinate → COORDINATE mode",
    "verification OR validator → VALIDATOR mode",
    "",
    "=== MANDATORY TRIGGERS — switch IMMEDIATELY when you detect these ===",
    "→ User mentions 'subagent', 'sub-agent', 'team', 'spawn', 'summon', 'parallel agents', 'delegate to agents' → switch to coordinator",
    "→ User asks to 'plan', 'design', 'architect', 'break down', 'roadmap', 'strategy' → switch to architect",
    "→ User asks to 'explore', 'find', 'search code', 'how does X work', 'understand' → switch to recon",
    "→ User asks to 'test', 'verify', 'check', 'validate', 'review code' → switch to validator",
    "→ User asks to 'build', 'implement', 'fix', 'create', 'code', 'write' → switch to construct",
    "→ After finishing planning/architecture → switch to construct to execute",
    "→ After team work completes and only simple tasks remain → switch to construct",
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
    if (!isAutonomyEnabled()) {
      return {
        output: "ERROR: Autonomy mode is currently DISABLED by the user. You are not allowed to switch agent modes. You must proceed with the task in your current mode, and inform the user that you cannot switch.",
        title: `❌ Switch rejected (Autonomy OFF)`,
        metadata: {
          agent: args.agent,
          switched: false,
        },
      }
    }

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
