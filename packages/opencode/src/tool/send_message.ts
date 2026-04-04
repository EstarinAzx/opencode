/**
 * Swarm tool: send-message
 * Send a message to a teammate or broadcast to all teammates.
 */

import z from "zod"
import { Tool } from "./tool"

const parameters = z.object({
  team_name: z.string().describe("Team name"),
  to: z.string().describe("Recipient name, or 'all' to broadcast"),
  message: z.string().describe("Message text to send"),
})

export const SendMessageTool = Tool.define("send_message", {
  description:
    "Send a message to a teammate via the file-based mailbox. Use 'all' as recipient to broadcast to every teammate. Messages are stored in the team's inbox files.",
  parameters,
  async execute(params) {
    const swarm = await import("../xethryon/swarm/index.js")

    const team = await swarm.readTeamFileAsync(params.team_name)
    if (!team) {
      throw new Error(`Team "${params.team_name}" does not exist.`)
    }

    const msg = {
      from: "team-lead",
      text: params.message,
      timestamp: Date.now(),
    }

    if (params.to === "all") {
      let sent = 0
      for (const member of team.members) {
        await swarm.writeToMailbox(member.name, msg, params.team_name)
        sent++
      }
      return {
        title: `Broadcast to ${sent} teammates`,
        output: `Message broadcast to ${sent} teammate(s) on team "${params.team_name}".`,
        metadata: { teamName: params.team_name, to: "all", recipientCount: sent },
      }
    }

    await swarm.writeToMailbox(params.to, msg, params.team_name)

    const unread = await swarm.readUnreadMessages("team-lead", params.team_name)
    let inboxSummary = ""
    if (unread.length > 0) {
      await swarm.markMessagesAsRead("team-lead", params.team_name)
      inboxSummary = `\n\nYou have ${unread.length} new message(s):\n${unread.map((m) => `- [${m.from}]: ${m.summary ?? m.text.slice(0, 200)}`).join("\n")}`
    }

    return {
      title: `Message sent to ${params.to}`,
      output: `Message sent to "${params.to}" on team "${params.team_name}".${inboxSummary}`,
      metadata: { teamName: params.team_name, to: params.to, recipientCount: 1 },
    }
  },
})
