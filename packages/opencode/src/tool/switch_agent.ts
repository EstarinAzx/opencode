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
    "Modes: build (CONSTRUCT), plan (ARCHITECT), explore (RECON), coordinator (COORDINATE), verification (VALIDATOR).",
  ].join(" "),
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
