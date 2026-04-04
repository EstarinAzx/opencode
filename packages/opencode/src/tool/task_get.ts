/**
 * Swarm tool: task-get
 * Get details for a specific task on the team's task board.
 */

import z from "zod"
import { Tool } from "./tool"

const parameters = z.object({
  team_name: z.string().describe("Team name"),
  task_id: z.string().describe("ID of the task to retrieve"),
})

export const TaskGetTool = Tool.define("task_get", {
  description: "Get the full details of a specific task from the team's shared task board.",
  parameters,
  async execute(params) {
    const swarm = await import("../xethryon/swarm/index.js")

    const task = await swarm.getTask(params.team_name, params.task_id)
    if (!task) {
      throw new Error(`Task "${params.task_id}" not found on team "${params.team_name}".`)
    }

    const lines = [
      `ID: ${task.id}`,
      `Subject: ${task.subject}`,
      `Status: ${task.status}`,
      `Owner: ${task.owner ?? "(unassigned)"}`,
      `Description: ${task.description}`,
      `Blocks: ${task.blocks.length > 0 ? task.blocks.join(", ") : "none"}`,
      `Blocked by: ${task.blockedBy.length > 0 ? task.blockedBy.join(", ") : "none"}`,
      `Created: ${new Date(task.createdAt).toISOString()}`,
      `Updated: ${new Date(task.updatedAt).toISOString()}`,
    ]

    return {
      title: `Task: ${task.subject}`,
      output: lines.join("\n"),
      metadata: { task },
    }
  },
})
