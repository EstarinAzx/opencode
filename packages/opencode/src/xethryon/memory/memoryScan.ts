/**
 * Memory-directory scanning primitives.
 * Ported from cc-leak/src/memdir/memoryScan.ts.
 *
 * Replaces readFileInRange with readFile + split + slice,
 * and parseFrontmatter with our local implementation.
 */

import { readdir, readFile, stat } from "fs/promises"
import { basename, join } from "path"
import { parseFrontmatter } from "./frontmatter.js"
import { type MemoryType, parseMemoryType } from "./memoryTypes.js"

export type MemoryHeader = {
  filename: string
  filePath: string
  mtimeMs: number
  description: string | null
  type: MemoryType | undefined
}

const MAX_MEMORY_FILES = 200
const FRONTMATTER_MAX_LINES = 30

/**
 * Scan a memory directory for .md files, read their frontmatter, and return
 * a header list sorted newest-first (capped at MAX_MEMORY_FILES).
 */
export async function scanMemoryFiles(
  memoryDir: string,
  signal: AbortSignal,
): Promise<MemoryHeader[]> {
  try {
    const entries = await readdir(memoryDir, { recursive: true })
    const mdFiles = entries.filter(
      (f) => f.endsWith(".md") && basename(f) !== "MEMORY.md",
    )

    const headerResults = await Promise.allSettled(
      mdFiles.map(async (relativePath): Promise<MemoryHeader> => {
        if (signal.aborted) throw new Error("aborted")

        const filePath = join(memoryDir, relativePath)
        const [content, fileStat] = await Promise.all([
          readFile(filePath, "utf-8").then(
            (c) => c.split("\n").slice(0, FRONTMATTER_MAX_LINES).join("\n"),
          ),
          stat(filePath),
        ])

        const { data } = parseFrontmatter(content)
        return {
          filename: relativePath,
          filePath,
          mtimeMs: fileStat.mtimeMs,
          description: data.description || null,
          type: parseMemoryType(data.type),
        }
      }),
    )

    return headerResults
      .filter(
        (r): r is PromiseFulfilledResult<MemoryHeader> =>
          r.status === "fulfilled",
      )
      .map((r) => r.value)
      .sort((a, b) => b.mtimeMs - a.mtimeMs)
      .slice(0, MAX_MEMORY_FILES)
  } catch {
    return []
  }
}

/**
 * Format memory headers as a text manifest: one line per file with
 * [type] filename (timestamp): description.
 */
export function formatMemoryManifest(memories: MemoryHeader[]): string {
  return memories
    .map((m) => {
      const tag = m.type ? `[${m.type}] ` : ""
      const ts = new Date(m.mtimeMs).toISOString()
      return m.description
        ? `- ${tag}${m.filename} (${ts}): ${m.description}`
        : `- ${tag}${m.filename} (${ts})`
    })
    .join("\n")
}
