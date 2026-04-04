/**
 * Swarm tool: task-update
 * Update a task's status, owner, or description.
 */

import z from "zod"
import { Tool } from "./tool"

const parameters = z.object({
  team_name: z.string().describe("Team name"),
  task_id: z.string().describe("ID of the task to update"),
  status: z
    .enum(["pending", "in_progress", "completed", "deleted"])
    .describe("New status")
    .optional(),
  owner: z.string().describe("New owner (teammate name)").optional(),
  description: z.string().describe("Updated description").optional(),
  subject: z.string().describe("Updated subject").optional(),
})

export const TaskUpdateTool = Tool.define("task_update", {
  description: "Update a task on the team's shared task board. Can change status, owner, description, or subject.",
  parameters,
  async execute(params) {
    const swarm = await import("../xethryon/swarm/index.js")

    const updates: Record<string, unknown> = {}
    if (params.status) updates.status = params.status
    if (params.owner) updates.owner = params.owner
    if (params.description) updates.description = params.description
    if (params.subject) updates.subject = params.subject

    if (Object.keys(updates).length === 0) {
      throw new Error("No fields to update. Provide at least one of: status, owner, description, subject.")
    }

    const task = await swarm.updateTask(params.team_name, params.task_id, updates)
    if (!task) {
      throw new Error(`Task "${params.task_id}" not found on team "${params.team_name}".`)
    }

    const changed = Object.keys(updates).join(", ")
    return {
      title: `Updated task: ${task.id}`,
      output: `Task "${task.subject}" (${task.id}) updated: ${changed}. Status: ${task.status}.`,
      metadata: { task },
    }
  },
})
