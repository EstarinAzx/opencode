/**
 * Session Memory service for Xethryon.
 * Ported from cc-leak/src/services/SessionMemory/sessionMemory.ts.
 *
 * Heavy adaptation:
 * - Replaced runForkedAgent with a stub that writes session notes directly
 * - Replaced registerPostSamplingHook with an explicit function call
 * - Stripped GrowthBook gates, analytics, remote config
 * - TODO: Wire into OpenCode's Session.create + prompt pattern for full subagent
 */

import { writeFile, mkdir, readFile } from "fs/promises"
import { dirname } from "path"
import { Log } from "@/util/log"
import {
  buildSessionMemoryUpdatePrompt,
  loadSessionMemoryTemplate,
} from "./sessionMemoryPrompts.js"
import {
  DEFAULT_SESSION_MEMORY_CONFIG,
  getSessionMemoryPath,
  getToolCallsBetweenUpdates,
  hasMetInitializationThreshold,
  hasMetUpdateThreshold,
  isSessionMemoryInitialized,
  markExtractionCompleted,
  markExtractionStarted,
  markSessionMemoryInitialized,
  recordExtractionTokenCount,
  setLastSummarizedMessageId,
  setSessionMemoryConfig,
} from "./sessionMemoryUtils.js"

const log = Log.create({ service: "xethryon.sessionMemory" })

// Module state
let lastMemoryMessageId: string | undefined
let _initialized = false

// Simple sequential execution guard
let _running = false

/**
 * Rough token count from message parts.
 * Approximates the context window size for threshold checks.
 */
function estimateTokenCount(messages: Array<{ tokens?: { input: number; output: number } }>): number {
  let total = 0
  for (const msg of messages) {
    if (msg.tokens) {
      total += msg.tokens.input + msg.tokens.output
    }
  }
  return total || messages.length * 500 // fallback: ~500 tokens per message
}

/**
 * Count tool calls in messages since a given message ID.
 */
function countToolCallsSince(
  messages: Array<{ id: string; role: string; parts?: Array<{ type: string }> }>,
  sinceId: string | undefined,
): number {
  let toolCallCount = 0
  let foundStart = sinceId === null || sinceId === undefined

  for (const message of messages) {
    if (!foundStart) {
      if (message.id === sinceId) foundStart = true
      continue
    }
    if (message.role === "assistant" && message.parts) {
      toolCallCount += message.parts.filter((p) => p.type === "tool").length
    }
  }
  return toolCallCount
}

/**
 * Check if the last assistant message has pending tool calls.
 */
function hasToolCallsInLastAssistantTurn(
  messages: Array<{ role: string; parts?: Array<{ type: string }> }>,
): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role === "assistant") {
      return msg.parts?.some((p) => p.type === "tool") ?? false
    }
    if (msg.role === "user") return false
  }
  return false
}

/**
 * Determine whether session memory should be extracted based on thresholds.
 */
export function shouldExtractMemory(
  messages: Array<{ id: string; role: string; tokens?: { input: number; output: number }; parts?: Array<{ type: string }> }>,
): boolean {
  const currentTokenCount = estimateTokenCount(messages)

  if (!isSessionMemoryInitialized()) {
    if (!hasMetInitializationThreshold(currentTokenCount)) return false
    markSessionMemoryInitialized()
  }

  const hasMetTokenThreshold = hasMetUpdateThreshold(currentTokenCount)
  const toolCallsSinceLastUpdate = countToolCallsSince(messages, lastMemoryMessageId)
  const hasMetToolCallThreshold = toolCallsSinceLastUpdate >= getToolCallsBetweenUpdates()
  const hasToolCallsInLast = hasToolCallsInLastAssistantTurn(messages)

  const shouldExtract =
    (hasMetTokenThreshold && hasMetToolCallThreshold) ||
    (hasMetTokenThreshold && !hasToolCallsInLast)

  if (shouldExtract) {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.id) lastMemoryMessageId = lastMessage.id
    return true
  }

  return false
}

/**
 * Set up the session memory file, creating it with template if it doesn't exist.
 */
async function setupSessionMemoryFile(): Promise<{
  memoryPath: string
  currentMemory: string
}> {
  const memoryPath = getSessionMemoryPath()
  const memoryDir = dirname(memoryPath)

  // Ensure directory exists
  await mkdir(memoryDir, { recursive: true })

  // Try to read existing file
  let currentMemory = ""
  try {
    currentMemory = await readFile(memoryPath, "utf-8")
  } catch (e: unknown) {
    const code = (e as NodeJS.ErrnoException)?.code
    if (code === "ENOENT") {
      // File doesn't exist — create with template
      const template = await loadSessionMemoryTemplate()
      await writeFile(memoryPath, template, { encoding: "utf-8" })
      currentMemory = template
    } else {
      throw e
    }
  }

  return { memoryPath, currentMemory }
}

/**
 * Execute session memory extraction.
 * For the initial port, this sets up the file and logs the extraction prompt.
 * Full subagent execution via Session.create will be wired in Phase 2.
 */
export async function executeSessionMemoryExtraction(
  messages: Array<{ id: string; role: string; tokens?: { input: number; output: number }; parts?: Array<{ type: string }> }>,
): Promise<void> {
  if (_running) return
  _running = true

  try {
    markExtractionStarted()

    const { memoryPath, currentMemory } = await setupSessionMemoryFile()
    const _updatePrompt = await buildSessionMemoryUpdatePrompt(currentMemory, memoryPath)

    // TODO: Wire this into OpenCode's Session.create + SessionPrompt.prompt()
    // For now, the session memory file is created and ready for manual or
    // subagent-driven updates. The extraction prompt is built but not yet
    // sent to an LLM subagent.
    log.info("session memory extraction ready", {
      memoryPath,
      contentLength: currentMemory.length,
      messageCount: messages.length,
    })

    // Record extraction state
    const currentTokenCount = estimateTokenCount(messages)
    recordExtractionTokenCount(currentTokenCount)

    // Update lastSummarizedMessageId if safe
    if (!hasToolCallsInLastAssistantTurn(messages)) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage?.id) setLastSummarizedMessageId(lastMessage.id)
    }
  } catch (e) {
    log.error("session memory extraction failed", { error: e })
  } finally {
    markExtractionCompleted()
    _running = false
  }
}

/**
 * Initialize session memory system.
 * Sets default config and prepares the extraction infrastructure.
 */
export function initSessionMemory(): void {
  if (_initialized) return
  _initialized = true
  setSessionMemoryConfig({ ...DEFAULT_SESSION_MEMORY_CONFIG })
  log.info("session memory initialized")
}

/**
 * Reset module state (for testing).
 */
export function resetSessionMemory(): void {
  lastMemoryMessageId = undefined
  _initialized = false
  _running = false
}
