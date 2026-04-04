/**
 * Memory post-turn hook for Xethryon.
 *
 * This module bridges the Effect-based prompt loop (prompt.ts)
 * with the async memory services. It's called after each LLM turn
 * completes and runs memory extraction in the background.
 *
 * Three subsystems are triggered:
 * 1. Session memory — maintains a running summary of the current conversation
 * 2. Extract memories — extracts durable learnings into MEMORY.md files
 * 3. AutoDream — periodic consolidation of memories across sessions
 */

import { Log } from "@/util/log"
import { writeFile, mkdir, readFile } from "fs/promises"
import { dirname } from "path"
import type { LLM } from "@/session/llm"
import type { Agent } from "@/agent/agent"
import type { Provider } from "@/provider/provider"
import type { MessageV2 } from "@/session/message-v2"
import {
  shouldExtractMemory,
  initSessionMemory,
  initExtractMemories,
  initAutoDream,
} from "./index.js"
import {
  getSessionMemoryPath,
  markExtractionStarted,
  markExtractionCompleted,
  recordExtractionTokenCount,
  setLastSummarizedMessageId,
  isSessionMemoryInitialized,
  markSessionMemoryInitialized,
  hasMetInitializationThreshold,
} from "./sessionMemoryUtils.js"
import {
  buildSessionMemoryUpdatePrompt,
  loadSessionMemoryTemplate,
} from "./sessionMemoryPrompts.js"
import { executeExtractMemories, type ExtractContext } from "./extractMemories.js"
import { executeAutoDream } from "./autoDream.js"

const log = Log.create({ service: "xethryon.memoryHook" })

let _servicesInitialized = false

/**
 * Initialize all memory subsystems. Called once during prompt layer setup.
 */
export function initMemoryServices(): void {
  if (_servicesInitialized) return
  _servicesInitialized = true
  initSessionMemory()
  initExtractMemories()
  initAutoDream()
  log.info("memory services initialized")
}

// Rough token estimation from model messages
function estimateTokensFromMessages(messages: Array<{ role: string; content: unknown }>): number {
  let total = 0
  for (const msg of messages) {
    if (typeof msg.content === "string") {
      total += Math.ceil(msg.content.length / 4)
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (typeof part === "object" && part !== null && "text" in part) {
          total += Math.ceil(String(part.text).length / 4)
        }
      }
    }
  }
  return total || messages.length * 500
}

/**
 * Adapt OpenCode MessageV2.WithParts into the simple message format
 * expected by the memory services.
 */
function adaptMessages(messages: MessageV2.WithParts[]): Array<{
  id: string
  role: string
  tokens?: { input: number; output: number }
  parts?: Array<{ type: string }>
}> {
  return messages.map((m) => {
    const info = m.info
    let tokens: { input: number; output: number } | undefined
    if (info.role === "assistant" && info.tokens) {
      tokens = {
        input: info.tokens.input + (info.tokens.cache?.read ?? 0),
        output: info.tokens.output,
      }
    }
    return {
      id: info.id,
      role: info.role,
      tokens,
      parts: m.parts.map((p) => ({ type: p.type })),
    }
  })
}

export type MemoryHookContext = {
  sessionID: string
  messages: MessageV2.WithParts[]
  /** Call LLM.stream for background queries */
  llmStream: typeof LLM.stream
  agent: Agent.Info
  model: Provider.Model
  user: MessageV2.User
}

/**
 * Post-turn memory hook — called after each LLM turn completes.
 * Designed to be called via Effect.promise + Effect.forkIn(scope)
 * so it runs in the background without blocking the main loop.
 */
export async function runMemoryPostTurnHook(ctx: MemoryHookContext): Promise<void> {
  if (!_servicesInitialized) return

  const adapted = adaptMessages(ctx.messages)

  try {
    // 1. Session memory extraction
    await runSessionMemoryExtraction(ctx, adapted)
  } catch (e) {
    log.error("session memory extraction failed", { error: e })
  }

  try {
    // 2. Auto-memory extraction (fires with trailing-run pattern)
    await executeExtractMemories({
      sessionID: ctx.sessionID,
      messages: adapted,
    })
  } catch (e) {
    log.error("extract memories failed", { error: e })
  }

  try {
    // 3. AutoDream consolidation check (fires if time+session gates pass)
    await executeAutoDream(ctx.sessionID)
  } catch (e) {
    log.error("autoDream check failed", { error: e })
  }
}

/**
 * Run session memory extraction using the LLM.
 * Creates/updates a session notes file with structured summary.
 */
async function runSessionMemoryExtraction(
  ctx: MemoryHookContext,
  adapted: ReturnType<typeof adaptMessages>,
): Promise<void> {
  // Check thresholds
  if (!shouldExtractMemory(adapted)) return

  markExtractionStarted()

  try {
    // Set up the session memory file
    const memoryPath = getSessionMemoryPath()
    const memoryDir = dirname(memoryPath)
    await mkdir(memoryDir, { recursive: true })

    let currentMemory = ""
    try {
      currentMemory = await readFile(memoryPath, "utf-8")
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException)?.code === "ENOENT") {
        const template = await loadSessionMemoryTemplate()
        await writeFile(memoryPath, template, { encoding: "utf-8" })
        currentMemory = template
      } else {
        throw e
      }
    }

    // Build the extraction prompt
    const updatePrompt = await buildSessionMemoryUpdatePrompt(currentMemory, memoryPath)

    // Convert messages to model format for context
    const modelMessages: Array<{ role: "user" | "assistant"; content: string }> = []
    for (const msg of ctx.messages) {
      const textParts: string[] = []
      for (const part of msg.parts) {
        if ("content" in part && typeof part.content === "string") {
          textParts.push(part.content)
        }
        if ("text" in part && typeof part.text === "string") {
          textParts.push(part.text)
        }
      }
      if (textParts.length > 0) {
        modelMessages.push({
          role: msg.info.role === "user" ? "user" : "assistant",
          content: textParts.join("\n"),
        })
      }
    }

    // Add the extraction instruction as the last user message
    modelMessages.push({ role: "user", content: updatePrompt })

    // Call LLM to generate updated session memory
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 60000) // 60s timeout

    try {
      const result = await ctx.llmStream({
        agent: ctx.agent,
        user: ctx.user,
        system: [
          "You are a session memory extraction agent. Your job is to analyze the conversation and update the session notes file. Only respond with the updated notes content, no explanations.",
        ],
        small: true,
        tools: {},
        model: ctx.model,
        abort: ctrl.signal,
        sessionID: ctx.sessionID,
        retries: 1,
        messages: modelMessages,
      })

      const text = await result.text
      if (text && text.trim().length > 100) {
        // Write the updated session memory
        await writeFile(memoryPath, text.trim(), { encoding: "utf-8" })
        log.info("session memory updated", {
          memoryPath,
          contentLength: text.trim().length,
        })
      }
    } finally {
      clearTimeout(timeout)
    }

    // Record extraction state
    const currentTokenCount = estimateTokensFromMessages(modelMessages)
    recordExtractionTokenCount(currentTokenCount)

    // Update last summarized message
    const lastMsg = adapted[adapted.length - 1]
    const hasToolCalls = lastMsg?.parts?.some((p) => p.type === "tool") ?? false
    if (!hasToolCalls && lastMsg?.id) {
      setLastSummarizedMessageId(lastMsg.id)
    }
  } finally {
    markExtractionCompleted()
  }
}
