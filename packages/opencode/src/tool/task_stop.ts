/**
 * Swarm tool: task-stop
 * Stop (abort) a running teammate.
 */

import z from "zod"
import { Tool } from "./tool"

const parameters = z.object({
  team_name: z.string().describe("Team name"),
  teammate_name: z.string().describe("Name of the teammate to stop"),
})

export const TaskStopTool = Tool.define("task_stop", {
  description:
    "Stop a running teammate by aborting their session. The teammate's current work will be interrupted.",
  parameters,
  async execute(params) {
    const swarm = await import("../xethryon/swarm/index.js")

    const agentId = swarm.formatAgentId(params.teammate_name, params.team_name)
    const teammate = swarm.getTeammate(agentId)

    if (!teammate) {
      throw new Error(`No active teammate "${params.teammate_name}" found on team "${params.team_name}".`)
    }

    if (teammate.status === "stopped") {
      throw new Error(`Teammate "${params.teammate_name}" is already stopped.`)
    }

    const stopped = swarm.stopTeammate(agentId)
    await swarm.setMemberActive(params.team_name, params.teammate_name, false)

    return {
      title: `Stopped: ${params.teammate_name}`,
      output: stopped
        ? `Teammate "${params.teammate_name}" stopped successfully.`
        : `Failed to stop teammate "${params.teammate_name}".`,
      metadata: { agentId, stopped },
    }
  },
})
