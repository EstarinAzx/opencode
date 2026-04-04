/**
 * Memory relevance engine for Xethryon.
 * Ported from cc-leak/src/memdir/findRelevantMemories.ts.
 *
 * Adaptation: Replaced sideQuery with a simpler keyword-based relevance
 * filter for the initial port. Can be upgraded to use LLM.stream later
 * when the integration is more established.
 */

import { readFile } from "fs/promises"
import { memoryAgeDays } from "./memoryAge.js"
import { type MemoryHeader, scanMemoryFiles } from "./memoryScan.js"

export type RelevantMemory = {
  path: string
  mtimeMs: number
}

/**
 * Maximum number of memories to surface per query.
 */
const MAX_RELEVANT = 5

/**
 * Find memory files relevant to a query by scanning memory file headers
 * and scoring them by keyword overlap + recency.
 *
 * Returns absolute file paths + mtime of the most relevant memories
 * (up to 5). Excludes MEMORY.md (already loaded in system prompt).
 *
 * For the initial port, this uses keyword matching + recency scoring.
 * TODO: Upgrade to LLM-powered selection via LLM.stream when the memory
 * system is fully integrated.
 */
export async function findRelevantMemories(
  query: string,
  memoryDir: string,
  signal: AbortSignal,
  recentTools: readonly string[] = [],
  alreadySurfaced: ReadonlySet<string> = new Set(),
): Promise<RelevantMemory[]> {
  const memories = (await scanMemoryFiles(memoryDir, signal)).filter(
    (m) => !alreadySurfaced.has(m.filePath),
  )
  if (memories.length === 0) return []

  // Score each memory by keyword overlap with the query
  const queryWords = extractKeywords(query)
  if (queryWords.length === 0) {
    // No meaningful keywords — return the most recent memories
    return memories
      .slice(0, MAX_RELEVANT)
      .map((m) => ({ path: m.filePath, mtimeMs: m.mtimeMs }))
  }

  const scored = memories
    .map((m) => {
      const descWords = extractKeywords(m.description ?? "")
      const filenameWords = extractKeywords(m.filename)
      const allMemWords = new Set([...descWords, ...filenameWords])

      // Keyword overlap score
      let keywordScore = 0
      for (const w of queryWords) {
        for (const mw of allMemWords) {
          if (mw.includes(w) || w.includes(mw)) {
            keywordScore++
            break
          }
        }
      }

      // Recency bonus: memories from today/yesterday get a boost
      const ageDays = memoryAgeDays(m.mtimeMs)
      const recencyBonus = ageDays === 0 ? 2 : ageDays === 1 ? 1 : 0

      // Type bonus: feedback and user memories are often more relevant
      const typeBonus = m.type === "feedback" || m.type === "user" ? 1 : 0

      return {
        memory: m,
        score: keywordScore + recencyBonus + typeBonus,
      }
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RELEVANT)

  return scored.map((s) => ({
    path: s.memory.filePath,
    mtimeMs: s.memory.mtimeMs,
  }))
}

/**
 * Find relevant memories and return their content.
 * Used for injecting into the system prompt context.
 */
export async function loadRelevantMemoryContent(
  query: string,
  memoryDir: string,
  signal: AbortSignal,
): Promise<string | null> {
  const relevant = await findRelevantMemories(query, memoryDir, signal)
  if (relevant.length === 0) return null

  const contents = await Promise.allSettled(
    relevant.map(async (r) => {
      const content = await readFile(r.path, "utf-8")
      return `--- ${r.path} ---\n${content.trim()}`
    }),
  )

  const loaded = contents
    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
    .map((r) => r.value)

  if (loaded.length === 0) return null
  return loaded.join("\n\n")
}

/**
 * Extract meaningful keywords from text for matching.
 * Strips common stop words and normalizes to lowercase.
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "can", "shall",
    "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "about",
    "between", "under", "above", "up", "down", "out", "off", "over",
    "and", "but", "or", "not", "no", "nor", "so", "yet", "both",
    "this", "that", "these", "those", "it", "its", "my", "your",
    "his", "her", "our", "their", "what", "which", "who", "whom",
    "how", "when", "where", "why", "all", "each", "every", "any",
    "few", "more", "most", "other", "some", "such", "than", "too",
    "very", "just", "also", "now", "then", "here", "there",
  ])

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
}
