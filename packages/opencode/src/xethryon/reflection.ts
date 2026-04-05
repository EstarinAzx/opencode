/**
 * Xethryon Self-Reflection System.
 *
 * After the LLM finishes a turn with tool calls (file edits, bash commands),
 * this module runs a quick self-review pass. If issues are found, it injects
 * a critique as a synthetic user message so the agent can self-correct
 * before the user sees the result.
 *
 * Design constraints:
 * - Max 1 reflection per turn (prevents infinite loops)
 * - Only triggers on turns with tool calls (skip pure text responses)
 * - Uses a small/fast model for the review (cheap + fast)
 * - Disabled for subagents and hidden agents (no recursive reflection)
 */

import { Log } from "@/util/log"
import type { MessageV2 } from "@/session/message-v2"
import type { LLM } from "@/session/llm"
import type { Agent } from "@/agent/agent"
import type { Provider } from "@/provider/provider"

const log = Log.create({ service: "xethryon.reflection" })

/**
 * Whether self-reflection is enabled.
 * Defaults to ON. Disable with XETHRYON_REFLECTION=0.
 */
export function isReflectionEnabled(): boolean {
  const envVal = process.env.XETHRYON_REFLECTION
  if (envVal === "0" || envVal === "false") return false
  return true
}

/**
 * Whether a turn qualifies for reflection.
 * Only reflects on turns that used tools (file edits, bash commands, etc).
 */
export function shouldReflect(
  messages: MessageV2.WithParts[],
  agent: Agent.Info,
): boolean {
  // Don't reflect on subagents, hidden agents, or the reflection agent itself
  if (agent.mode === "subagent") return false
  if (agent.hidden === true) return false
  if (agent.name === "reflection") return false

  // Only reflect when the assistant used tools
  const lastAssistant = messages.findLast((m) => m.info.role === "assistant")
  if (!lastAssistant) return false

  const hasToolCalls = lastAssistant.parts.some((p) => p.type === "tool")
  return hasToolCalls
}

export type ReflectionContext = {
  sessionID: string
  messages: MessageV2.WithParts[]
  llmStream: typeof LLM.stream
  agent: Agent.Info
  model: Provider.Model
  user: MessageV2.User
}

export type ReflectionVerdict = {
  action: "pass" | "revise"
  critique?: string
}

/**
 * Build the reflection prompt from the conversation history.
 * Includes the user's request and the assistant's response with tool results.
 */
function buildReflectionPrompt(messages: MessageV2.WithParts[]): string {
  // Find the last user message and all assistant messages after it
  const lastUserIdx = messages.findLastIndex((m) => m.info.role === "user")
  if (lastUserIdx === -1) return ""

  const userMsg = messages[lastUserIdx]
  const assistantMsgs = messages.slice(lastUserIdx + 1).filter((m) => m.info.role === "assistant")

  // Extract user request text
  const userText = userMsg.parts
    .filter((p): p is MessageV2.TextPart => p.type === "text" && !("synthetic" in p && p.synthetic))
    .map((p) => p.text)
    .join("\n")

  // Extract assistant response + tool results
  const assistantParts: string[] = []
  for (const msg of assistantMsgs) {
    for (const part of msg.parts) {
      if (part.type === "text" && "text" in part) {
        assistantParts.push(part.text)
      }
      if (part.type === "tool" && "state" in part) {
        const state = part.state
        if ("status" in state) {
          const toolName = "tool" in part ? part.tool : "unknown"
          if (state.status === "completed" && "output" in state) {
            const output = typeof state.output === "string"
              ? state.output.slice(0, 2000)
              : JSON.stringify(state.output).slice(0, 2000)
            assistantParts.push(`[Tool: ${toolName}] → ${output}`)
          } else if (state.status === "error" && "error" in state) {
            assistantParts.push(`[Tool: ${toolName}] ⚠ ERROR: ${state.error}`)
          }
        }
      }
    }
  }

  return [
    "## User Request",
    userText,
    "",
    "## Assistant Response & Tool Results",
    assistantParts.join("\n\n"),
    "",
    "Review the above and provide your verdict.",
  ].join("\n")
}

/**
 * Parse the reflection agent's response into a structured verdict.
 */
function parseVerdict(response: string): ReflectionVerdict {
  const cleaned = response
    .replace(/<think>[\s\S]*?<\/think>\s*/g, "")
    .trim()

  const firstLine = cleaned.split("\n")[0]?.toUpperCase() ?? ""

  if (firstLine.includes("VERDICT: REVISE") || firstLine.includes("VERDICT:REVISE")) {
    // Extract critique (everything after the verdict line)
    const critique = cleaned
      .split("\n")
      .slice(1)
      .join("\n")
      .trim()

    return {
      action: "revise",
      critique: critique || "Issues detected — please review your work.",
    }
  }

  // Default to pass (including malformed responses)
  return { action: "pass" }
}

/**
 * Run the self-reflection loop.
 *
 * Returns a verdict indicating whether the response should be presented
 * as-is (pass) or revised (revise + critique).
 */
export async function runReflection(ctx: ReflectionContext): Promise<ReflectionVerdict> {
  if (!isReflectionEnabled()) return { action: "pass" }
  if (!shouldReflect(ctx.messages, ctx.agent)) return { action: "pass" }

  const reflectionPrompt = buildReflectionPrompt(ctx.messages)
  if (!reflectionPrompt || reflectionPrompt.length < 50) return { action: "pass" }

  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), 30000) // 30s timeout

  try {
    log.info("running self-reflection", {
      sessionID: ctx.sessionID,
      promptLength: reflectionPrompt.length,
    })

    const result = await ctx.llmStream({
      agent: ctx.agent,
      user: ctx.user,
      system: [],
      small: true,
      tools: {},
      model: ctx.model,
      abort: ctrl.signal,
      sessionID: ctx.sessionID,
      retries: 1,
      messages: [{ role: "user", content: reflectionPrompt }],
    })

    const text = await result.text
    const verdict = parseVerdict(text)

    log.info("reflection verdict", {
      action: verdict.action,
      critiqueLength: verdict.critique?.length ?? 0,
    })

    return verdict
  } catch (e) {
    log.warn("reflection failed, defaulting to pass", { error: e })
    return { action: "pass" }
  } finally {
    clearTimeout(timeout)
  }
}
