/**
 * Memory retrieval bridge for Xethryon.
 *
 * Connects the prompt pipeline to the memory relevance engine.
 * Given the user's latest query, retrieves and formats relevant
 * memories for injection into the system prompt.
 */

import { Log } from "@/util/log"
import { getAutoMemPath, isAutoMemoryEnabled } from "./paths.js"
import { loadRelevantMemoryContent } from "./findRelevantMemories.js"
import { getSessionMemoryContent } from "./sessionMemoryUtils.js"

const log = Log.create({ service: "xethryon.retrieveMemories" })

/**
 * Retrieve memories relevant to the user's current query.
 *
 * Returns a formatted string containing:
 * 1. Session memory (current conversation summary)
 * 2. Relevant topic memories from past sessions
 *
 * Returns null if memory is disabled or nothing is relevant.
 */
export async function retrieveRelevantMemories(
  query: string,
  signal?: AbortSignal,
): Promise<string | null> {
  if (!isAutoMemoryEnabled()) return null
  if (!query || query.trim().length < 5) return null

  const memoryDir = getAutoMemPath()
  const sections: string[] = []

  // 1. Session memory — running summary of the current conversation
  try {
    const sessionMemory = await getSessionMemoryContent()
    if (sessionMemory && sessionMemory.trim().length > 50) {
      sections.push(
        "## Current Session Context",
        "",
        sessionMemory.trim(),
      )
    }
  } catch (e) {
    log.warn("failed to load session memory", { error: e })
  }

  // 2. Relevant topic memories from past sessions
  try {
    const abortSignal = signal ?? new AbortController().signal
    const relevant = await loadRelevantMemoryContent(
      query,
      memoryDir,
      abortSignal,
    )
    if (relevant) {
      sections.push(
        "## Relevant Memories",
        "",
        "The following memories from past sessions may be relevant to the current conversation:",
        "",
        relevant,
      )
    }
  } catch (e) {
    log.warn("failed to retrieve relevant memories", { error: e })
  }

  if (sections.length === 0) return null

  const result = [
    "<recalled_memories>",
    ...sections,
    "</recalled_memories>",
  ].join("\n")

  log.info("retrieved relevant memories", {
    queryLength: query.length,
    resultLength: result.length,
  })

  return result
}
