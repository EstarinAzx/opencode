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
    "Each mode has specific capabilities — if the current task falls outside your mode's scope, switch BEFORE attempting it.",
    "",
    "CONSTRUCT (build) — The default workhorse. USE FOR: writing code, implementing features, fixing bugs, editing files, running commands.",
    "NOT FOR: multi-step planning, spawning subagents/teams, deep codebase exploration.",
    "",
    "ARCHITECT (plan) — Strategic planning. USE FOR: architecture decisions, multi-step task breakdowns, designing approaches, creating implementation plans.",
    "NOT FOR: spawning teams/subagents, writing code directly, running tests. If you need to execute a plan, switch to CONSTRUCT. If you need parallel workers, switch to COORDINATE.",
    "",
    "RECON (explore) — Read-only reconnaissance. USE FOR: reading/exploring code, understanding codebases, finding patterns, research, answering 'how does X work'.",
    "NOT FOR: writing code, creating teams, making architectural decisions.",
    "",
    "COORDINATE (coordinator) — Team orchestration. USE FOR: spawning subagents, creating teams, delegating parallel tasks, managing multi-agent workflows.",
    "NOT FOR: basic single-file coding, planning, or exploration. If the task doesn't need parallel workers or teams, use CONSTRUCT instead.",
    "",
    "VALIDATOR (verification) — Quality assurance. USE FOR: running tests, code review, verifying correctness, checking outputs, validation.",
    "NOT FOR: writing new features, planning, or team management.",
    "",
    "RULES: Always switch to the right mode BEFORE doing work. If you realize mid-task you're in the wrong mode, switch immediately.",
    "Don't stay in COORDINATE for simple tasks. Don't stay in ARCHITECT when you need to execute. Don't stay in CONSTRUCT when you need to plan.",
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
