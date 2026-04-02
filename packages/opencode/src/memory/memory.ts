import * as fs from "node:fs"
import * as path from "node:path"
import { Instance } from "@/project/instance"
import { Log } from "@/util/log"

const log = Log.create({ service: "memory" })

export namespace Memory {
  /**
   * Memory scopes:
   * - project: .opencode/memory/ (committed, shared via git)
   * - local: .opencode/memory-local/ (machine-specific, gitignored)
   */
  type Scope = "project" | "local"

  function getMemoryDir(scope: Scope): string {
    const base = path.join(Instance.directory, ".opencode")
    switch (scope) {
      case "project":
        return path.join(base, "memory")
      case "local":
        return path.join(base, "memory-local")
    }
  }

  /**
   * Load all memory files from a scope and return as a formatted prompt string.
   * Returns undefined if no memories exist.
   */
  export async function loadPrompt(scope: Scope = "project"): Promise<string | undefined> {
    const dir = getMemoryDir(scope)

    if (!fs.existsSync(dir)) return undefined

    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"))
    if (files.length === 0) return undefined

    const parts: string[] = []

    for (const file of files) {
      const filepath = path.join(dir, file)
      try {
        const content = fs.readFileSync(filepath, "utf-8").trim()
        if (!content || content.includes("No memories consolidated yet")) continue
        parts.push(`<memory file="${file}">\n${content}\n</memory>`)
      } catch (err) {
        log.warn("failed to read memory file", { file, err })
      }
    }

    if (parts.length === 0) return undefined

    return [
      "<agent-memory>",
      "The following are durable memories from previous sessions. Use them to orient yourself quickly.",
      "You may update these memories by writing to the .opencode/memory/ directory.",
      "",
      ...parts,
      "</agent-memory>",
    ].join("\n")
  }

  /**
   * Load all memory across all scopes (project + local).
   */
  export async function loadAll(): Promise<string | undefined> {
    const [project, local] = await Promise.all([loadPrompt("project"), loadPrompt("local")])

    const parts = [project, local].filter(Boolean)
    if (parts.length === 0) return undefined
    return parts.join("\n\n")
  }

  /**
   * Get the scratchpad directory for a session.
   * Creates the directory if it doesn't exist.
   */
  export function scratchpadDir(sessionID: string): string {
    const dir = path.join(Instance.directory, ".opencode", "scratchpad", sessionID)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    return dir
  }

  /**
   * Clean up a scratchpad directory after a session ends.
   */
  export function cleanupScratchpad(sessionID: string): void {
    const dir = path.join(Instance.directory, ".opencode", "scratchpad", sessionID)
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true })
      }
    } catch (err) {
      log.warn("failed to cleanup scratchpad", { sessionID, err })
    }
  }
}
