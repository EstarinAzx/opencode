/**
 * Auto memory extraction service for Xethryon.
 * Ported from cc-leak/src/services/extractMemories/extractMemories.ts.
 *
 * Phase 3: Wired into LLM.stream for actual subagent execution.
 * - Uses the LLM callback from memoryHook to generate extraction results
 * - Writes memory files + updates MEMORY.md index
 * - Preserved trailing-run pattern (inProgress guard + pendingContext)
 */

import { Log } from "@/util/log"
import { writeFile, readFile, mkdir } from "fs/promises"
import { join, dirname, basename } from "path"
import { getAutoMemPath, isAutoMemoryEnabled, getAutoMemEntrypoint } from "./paths.js"
import { formatMemoryManifest, scanMemoryFiles } from "./memoryScan.js"
import { buildExtractAutoOnlyPrompt } from "./extractMemoriesPrompts.js"
import { ENTRYPOINT_NAME } from "./memdir.js"

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
  /** Optional LLM callback for executing the extraction. When provided,
   *  the service will use it to actually call the model; otherwise it logs only. */
  llmCall?: (prompt: string) => Promise<string>
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
    if (msg.parts) {
      for (const part of msg.parts) {
        if (part.type === "tool") {
          // Conservative — don't skip. Let the extraction run.
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
 * Parse LLM response to extract memory file operations.
 * The LLM responds with structured blocks that we parse into file writes.
 *
 * Expected format:
 * === WRITE: filename.md ===
 * <content>
 * === END ===
 *
 * === INDEX ===
 * <MEMORY.md content>
 * === END ===
 */
function parseExtractionResponse(response: string): {
  files: Array<{ filename: string; content: string }>
  index?: string
} {
  const files: Array<{ filename: string; content: string }> = []
  let index: string | undefined

  // Parse WRITE blocks
  const writeRegex = /=== WRITE:\s*(.+?)\s*===\n([\s\S]*?)(?:=== END ===|$)/g
  let match: RegExpExecArray | null
  while ((match = writeRegex.exec(response)) !== null) {
    files.push({
      filename: match[1].trim(),
      content: match[2].trim(),
    })
  }

  // Parse INDEX block
  const indexRegex = /=== INDEX ===\n([\s\S]*?)(?:=== END ===|$)/
  const indexMatch = response.match(indexRegex)
  if (indexMatch) {
    index = indexMatch[1].trim()
  }

  return { files, index }
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
  const { sessionID, messages, llmCall } = context

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
    const extractPrompt = buildExtractAutoOnlyPrompt(
      newMessageCount,
      manifest,
    )

    if (llmCall) {
      // Phase 3: Actually call the LLM with the extraction prompt
      const augmentedPrompt = [
        extractPrompt,
        "",
        "Respond with structured file operations using this format:",
        "",
        "=== WRITE: filename.md ===",
        "---",
        "type: project|user|session",
        `created: ${new Date().toISOString().split("T")[0]}`,
        `updated: ${new Date().toISOString().split("T")[0]}`,
        "tags: [tag1, tag2]",
        "---",
        "<memory content>",
        "=== END ===",
        "",
        "For the MEMORY.md index update:",
        "=== INDEX ===",
        "<full MEMORY.md content with one-line entries>",
        "=== END ===",
        "",
        "If nothing worth remembering was found, respond with just: NO_MEMORIES",
      ].join("\n")

      const response = await llmCall(augmentedPrompt)

      if (response.includes("NO_MEMORIES")) {
        log.info("LLM found no memories to extract", { sessionID })
      } else {
        // Parse and write memory files
        const { files, index } = parseExtractionResponse(response)

        await mkdir(memoryDir, { recursive: true })

        for (const file of files) {
          const filePath = join(memoryDir, file.filename)
          await mkdir(dirname(filePath), { recursive: true })
          await writeFile(filePath, file.content, { encoding: "utf-8" })
          log.info("memory file written", { filePath, size: file.content.length })
        }

        if (index) {
          const entrypoint = getAutoMemEntrypoint()
          await writeFile(entrypoint, index, { encoding: "utf-8" })
          log.info("MEMORY.md index updated", { entrypoint })
        }

        log.info("memory extraction complete", {
          sessionID,
          filesWritten: files.length,
          indexUpdated: !!index,
        })
      }
    } else {
      // No LLM callback — log that extraction was triggered
      log.info("memory extraction triggered (no LLM callback)", {
        sessionID,
        newMessageCount,
        existingMemoryCount: memories.length,
      })
    }

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
