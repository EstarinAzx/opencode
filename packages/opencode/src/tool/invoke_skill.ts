/**
 * Invoke Skill Tool — Autonomous Skill Invocation.
 *
 * When autonomy mode is enabled, this tool allows the AI agent to
 * autonomously invoke bundled skills (like /verify, /pr, /debug)
 * without the user explicitly typing a slash command.
 *
 * The tool loads the skill's prompt and injects it as tool output,
 * so the agent follows the skill's workflow within the current turn.
 *
 * Only skills that haven't set `disableModelInvocation: true` are available.
 */

import z from "zod"
import { Tool } from "./tool"

export const InvokeSkillTool = Tool.define("invoke_skill", async () => {
  // Dynamic import to avoid circular dependency
  const { getEnabledSkills, initBundledSkills } = await import("@/xethryon/skills/index.js")
  initBundledSkills()

  const available = getEnabledSkills().filter((s) => !s.disableModelInvocation)
  const skillNames = available.map((s) => s.name)
  const catalog = available
    .map((s) => `- **${s.name}**: ${s.description}`)
    .join("\n")

  const description = [
    "Autonomously invoke a bundled skill/workflow. Use this when you determine a skill would help complete the current task.",
    "This is only available in autonomy mode.",
    "",
    "Available skills:",
    catalog,
    "",
    "Guidelines:",
    "- Invoke /verify after making code changes to validate correctness",
    "- Invoke /pr when the user's task is complete and changes should be committed",
    "- Invoke /debug when encountering unexpected errors",
    "- Don't invoke skills the user has already explicitly triggered",
    "- Don't invoke /autopilot or /loop (those are user-controlled)",
  ].join("\n")

  return {
    description,
    parameters: z.object({
      name: z
        .string()
        .describe(`The name of the skill to invoke. One of: ${skillNames.join(", ")}`),
      arguments: z
        .string()
        .describe("Context or arguments to pass to the skill (e.g., what to verify, what to debug)")
        .optional(),
    }),
    async execute(params, ctx) {
      const { getSkill } = await import("@/xethryon/skills/index.js")
      const skill = getSkill(params.name)

      if (!skill) {
        throw new Error(
          `Skill "${params.name}" not found. Available: ${skillNames.join(", ")}`,
        )
      }

      if (skill.disableModelInvocation) {
        throw new Error(
          `Skill "${params.name}" cannot be invoked autonomously — it requires explicit user invocation.`,
        )
      }

      // Let the permission system handle it
      await ctx.ask({
        permission: "skill",
        patterns: [params.name],
        always: [params.name],
        metadata: { autonomous: true },
      })

      const prompt = await skill.getPrompt(params.arguments ?? "")

      return {
        title: `⚡ Auto-invoked skill: /${params.name}`,
        output: [
          `<autonomous_skill name="${params.name}">`,
          prompt.trim(),
          "</autonomous_skill>",
          "",
          "The skill instructions above have been loaded. Follow them to complete the task.",
        ].join("\n"),
        metadata: {
          name: params.name,
          autonomous: true,
        },
      }
    },
  }
})
