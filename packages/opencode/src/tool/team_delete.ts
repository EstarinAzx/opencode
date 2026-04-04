/**
 * Swarm tool: team-delete
 * Deletes a team, aborts all active teammates, cleans up files.
 */

import z from "zod"
import { Tool } from "./tool"

const parameters = z.object({
  team_name: z.string().describe("Name of the team to delete"),
})

export const TeamDeleteTool = Tool.define("team_delete", {
  description:
    "Delete a team, stopping all active teammates and cleaning up all team files (config, inboxes, tasks).",
  parameters,
  async execute(params) {
    const swarm = await import("../xethryon/swarm/index.js")

    const team = await swarm.readTeamFileAsync(params.team_name)
    if (!team) {
      throw new Error(`Team "${params.team_name}" does not exist.`)
    }

    // Abort all active teammates for this team
    const aborted = swarm.abortAllTeammates(params.team_name)

    // Cleanup directories
    await swarm.cleanupTeamDirectories(params.team_name)

    // Clear team context if this was the active team
    if (swarm.getActiveTeam() === params.team_name) {
      swarm.clearActiveTeam()
      swarm.clearTeamContext()
    }

    return {
      title: `Deleted team: ${params.team_name}`,
      output: `Team "${params.team_name}" deleted. ${aborted} active teammate(s) stopped. All files cleaned up.`,
      metadata: { teamName: params.team_name, abortedCount: aborted },
    }
  },
})
