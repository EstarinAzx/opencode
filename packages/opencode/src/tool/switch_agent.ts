/**
 * Autonomy tool: switch_agent
 * Allows the AI to dynamically switch its agent mode when autonomy is enabled.
 */

import z from "zod"
import { Tool } from "./tool"
import { isAutonomyEnabled } from "../xethryon/autonomy.js"

const parameters = z.object({
  agent: z
    .enum(["build", "plan", "explore", "coordinator", "verification"])
    .describe("The agent mode to switch to: build (CONSTRUCT), plan (ARCHITECT), explore (RECON), coordinator (COORDINATE), verification (VALIDATOR)"),
  reason: z.string().describe("Brief reason for switching modes").optional(),
})

export const SwitchAgentTool = Tool.define("switch_agent", {
  description: [
    "Switch the current agent mode to better match the task at hand.",
    "Only available when AUTONOMY mode is ON.",
    "Modes: build (CONSTRUCT), plan (ARCHITECT), explore (RECON), coordinator (COORDINATE), verification (VALIDATOR).",
  ].join(" "),
  parameters,
  async execute(args, ctx) {
    if (!isAutonomyEnabled()) {
      return {
        output: "Autonomy mode is OFF. Cannot switch agents. The user must press f4 to enable autonomy.",
        title: "Switch Agent — Blocked",
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
