/**
 * Auto memory extraction service for Xethryon.
 * Ported from cc-leak/src/services/extractMemories/extractMemories.ts.
 *
 * Heavy adaptation:
 * - Replaced runForkedAgent with stub (same as sessionMemory)
 * - Stripped GrowthBook flags, analytics
 * - Preserved the trailing-run pattern (inProgress guard + pendingContext)
 * - TODO: Wire into OpenCode's Session.create for real subagent execution
 */

import { Log } from "@/util/log"
import { getAutoMemPath, isAutoMemoryEnabled } from "./paths.js"
import { formatMemoryManifest, scanMemoryFiles } from "./memoryScan.js"
import { buildExtractAutoOnlyPrompt } from "./extractMemoriesPrompts.js"

const log = Log.create({ service: "xethryon.extractMemories" })

// --- Module state ---
let _initialized = false
let _inProgress = false
let _pendingContext: ExtractContext | null = null
let _lastExtractedMessageId: string | undefined

export interface ExtractContext {
  sessionID: string
  messages: Array<{
    id: string
    role: string
    parts?: Array<{ type: string }>
  }>
}

/**
 * Check if any messages since lastExtractedMessageId wrote to the memory directory.
 * If yes, skip extraction (the main agent already handled it).
 */
function hasMemoryWritesSince(
  messages: ExtractContext["messages"],
  sinceId: string | undefined,
): boolean {
  if (!sinceId) return false

  let foundStart = false
  for (const msg of messages) {
    if (!foundStart) {
      if (msg.id === sinceId) foundStart = true
      continue
    }
    // Check if any tool parts reference the memory directory
    if (msg.parts) {
      for (const part of msg.parts) {
        if (part.type === "tool") {
          // Simplified check — in the full version this would inspect
          // tool args for memory directory paths
          // For now, we don't skip (conservative: always extract)
        }
      }
    }
  }
  return false
}

/**
 * Count new messages since last extraction.
 */
function countNewMessages(
  messages: ExtractContext["messages"],
  sinceId: string | undefined,
): number {
  if (!sinceId) return messages.length

  let count = 0
  let foundStart = false
  for (const msg of messages) {
    if (!foundStart) {
      if (msg.id === sinceId) foundStart = true
      continue
    }
    count++
  }
  return count || messages.length
}

/**
 * Execute memory extraction for the given context.
 * Uses the trailing-run pattern to avoid overlapping extractions
 * while ensuring no turns are missed.
 */
export async function executeExtractMemories(
  context: ExtractContext,
): Promise<void> {
  if (!isAutoMemoryEnabled()) return

  if (_inProgress) {
    // Stash the latest context for a trailing run
    _pendingContext = context
    return
  }

  _inProgress = true
  let currentContext: ExtractContext | null = context

  try {
    while (currentContext) {
      await doExtraction(currentContext)
      // Check if a newer context was stashed while we were running
      currentContext = _pendingContext
      _pendingContext = null
    }
  } finally {
    _inProgress = false
  }
}

/**
 * Perform the actual extraction for a given context.
 */
async function doExtraction(context: ExtractContext): Promise<void> {
  const { sessionID, messages } = context

  // Skip if main agent already wrote memories
  if (hasMemoryWritesSince(messages, _lastExtractedMessageId)) {
    _lastExtractedMessageId = messages[messages.length - 1]?.id
    return
  }

  const newMessageCount = countNewMessages(messages, _lastExtractedMessageId)
  if (newMessageCount < 2) return // Need at least a user-assistant pair

  const memoryDir = getAutoMemPath()
  const abort = new AbortController()

  try {
    // Scan existing memories for the manifest
    const memories = await scanMemoryFiles(memoryDir, abort.signal)
    const manifest = formatMemoryManifest(memories)

    // Build the extraction prompt
    const _extractPrompt = buildExtractAutoOnlyPrompt(
      newMessageCount,
      manifest,
    )

    // TODO: Wire into OpenCode's Session.create + SessionPrompt.prompt()
    // For now, log that extraction was triggered
    log.info("memory extraction triggered", {
      sessionID,
      newMessageCount,
      existingMemoryCount: memories.length,
    })

    // Update last extracted message
    _lastExtractedMessageId = messages[messages.length - 1]?.id
  } catch (e) {
    log.error("memory extraction failed", { error: e, sessionID })
  }
}

/**
 * Initialize the extract memories service.
 */
export function initExtractMemories(): void {
  if (_initialized) return
  _initialized = true
  log.info("extract memories initialized")
}

/**
 * Reset module state (for testing).
 */
export function resetExtractMemories(): void {
  _initialized = false
  _inProgress = false
  _pendingContext = null
  _lastExtractedMessageId = undefined
}
