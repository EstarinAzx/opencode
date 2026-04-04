/**
 * Swarm tool: task-list
 * List all tasks on the team's shared task board.
 */

import z from "zod"
import { Tool } from "./tool"

const parameters = z.object({
  team_name: z.string().describe("Team name"),
  status: z
    .enum(["pending", "in_progress", "completed", "deleted", "all"])
    .describe("Filter by status (default: all)")
    .optional(),
})

export const TaskListTool = Tool.define("task_list", {
  description: "List all tasks on the team's shared task board. Optionally filter by status.",
  parameters,
  async execute(params) {
    const swarm = await import("../xethryon/swarm/index.js")

    let tasks = await swarm.listTasks(params.team_name)

    if (params.status && params.status !== "all") {
      tasks = tasks.filter((t) => t.status === params.status)
    }

    if (tasks.length === 0) {
      return {
        title: "No tasks",
        output: `No tasks found on team "${params.team_name}"${params.status ? ` with status "${params.status}"` : ""}.`,
        metadata: { taskCount: 0 },
      }
    }

    const statusIcon: Record<string, string> = {
      pending: "○",
      in_progress: "◉",
      completed: "✓",
      deleted: "✗",
    }

    const lines = tasks.map((t) => {
      const icon = statusIcon[t.status] ?? "?"
      const owner = t.owner ? ` → ${t.owner}` : ""
      const blocked = t.blockedBy.length > 0 ? ` [blocked by: ${t.blockedBy.join(", ")}]` : ""
      return `${icon} ${t.id}: ${t.subject} (${t.status}${owner})${blocked}`
    })

    return {
      title: `${tasks.length} task(s)`,
      output: `Tasks on team "${params.team_name}":\n\n${lines.join("\n")}`,
      metadata: { taskCount: tasks.length },
    }
  },
})
