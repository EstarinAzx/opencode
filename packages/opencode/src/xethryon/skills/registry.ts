/**
 * Bundled skill registry for Xethryon.
 * Ported from cc-leak/src/skills/bundledSkills.ts.
 *
 * Skills are prompt-based commands that ship with the CLI.
 * They register at startup and appear in the slash-command palette.
 *
 * NOTE: This module deliberately avoids importing @/util/log (which
 * transitively depends on @/global with a top-level await) so it can
 * be dynamically imported from the command registry Effect generator.
 */

import { constants as fsConstants } from "fs"
import { mkdir, open } from "fs/promises"
import { dirname, isAbsolute, join, normalize, sep as pathSep } from "path"
import os from "os"

const DEBUG = process.env.XETHRYON_DEBUG === "true"
function logDebug(msg: string, data?: Record<string, unknown>) {
  if (DEBUG) console.log(`[xethryon:skills] ${msg}`, data ?? "")
}

/**
 * Definition for a bundled skill that ships with the CLI.
 */
export type BundledSkillDefinition = {
  name: string
  description: string
  aliases?: string[]
  /** Hint shown in the command palette about what args the skill accepts */
  argumentHint?: string
  /** When should the model auto-invoke this skill */
  whenToUse?: string
  /** If true, the model can invoke this skill on its own */
  disableModelInvocation?: boolean
  /** If true, the user can invoke via /name */
  userInvocable?: boolean
  /** Runtime enable/disable check */
  isEnabled?: () => boolean
  /** Whether this skill runs as a subtask */
  subtask?: boolean
  /**
   * Reference files to extract to disk on first invocation.
   * Keys are relative paths, values are file content.
   */
  files?: Record<string, string>
  /**
   * Generate the prompt text for this skill.
   * `args` is the user's input after the slash command name.
   */
  getPrompt: (args: string) => Promise<string>
}

/**
 * Internal registered skill — includes computed fields.
 */
export type RegisteredSkill = BundledSkillDefinition & {
  source: "bundled"
  skillRoot?: string
}

// Internal registry
const _skills: Map<string, RegisteredSkill> = new Map()
const _aliases: Map<string, string> = new Map()

/**
 * Register a bundled skill.
 */
export function registerBundledSkill(definition: BundledSkillDefinition): void {
  const { files } = definition

  let skillRoot: string | undefined
  let getPrompt = definition.getPrompt

  // If the skill has reference files, set up lazy extraction
  if (files && Object.keys(files).length > 0) {
    skillRoot = getBundledSkillExtractDir(definition.name)
    let extractionPromise: Promise<string | null> | undefined
    const inner = definition.getPrompt
    getPrompt = async (args: string) => {
      extractionPromise ??= extractBundledSkillFiles(definition.name, files)
      const extractedDir = await extractionPromise
      const text = await inner(args)
      if (extractedDir === null) return text
      return `Base directory for this skill: ${extractedDir}\n\n${text}`
    }
  }

  const skill: RegisteredSkill = {
    ...definition,
    getPrompt,
    source: "bundled",
    skillRoot,
  }

  _skills.set(definition.name, skill)
  logDebug("skill registered", { name: definition.name })

  // Register aliases
  if (definition.aliases) {
    for (const alias of definition.aliases) {
      _aliases.set(alias, definition.name)
    }
  }
}

/**
 * Get a registered skill by name or alias.
 */
export function getSkill(name: string): RegisteredSkill | undefined {
  const resolved = _aliases.get(name) ?? name
  return _skills.get(resolved)
}

/**
 * Get all registered skills.
 */
export function getAllSkills(): RegisteredSkill[] {
  return [..._skills.values()]
}

/**
 * Get all enabled skills (filters by isEnabled callback).
 */
export function getEnabledSkills(): RegisteredSkill[] {
  return [..._skills.values()].filter((s) => {
    if (s.isEnabled && !s.isEnabled()) return false
    return true
  })
}

/**
 * Clear all registered skills (for testing).
 */
export function clearSkills(): void {
  _skills.clear()
  _aliases.clear()
}

// ---------------------------------------------------------------------------
// File extraction for skills with reference files
// ---------------------------------------------------------------------------

function getBundledSkillsRoot(): string {
  return join(os.tmpdir(), `xethryon-skills-${process.pid}`)
}

function getBundledSkillExtractDir(skillName: string): string {
  return join(getBundledSkillsRoot(), skillName)
}

async function extractBundledSkillFiles(
  skillName: string,
  files: Record<string, string>,
): Promise<string | null> {
  const dir = getBundledSkillExtractDir(skillName)
  try {
    await writeSkillFiles(dir, files)
    return dir
  } catch {
    logDebug("failed to extract skill files", { skill: skillName })
    return null
  }
}

async function writeSkillFiles(
  dir: string,
  files: Record<string, string>,
): Promise<void> {
  const byParent = new Map<string, [string, string][]>()
  for (const [relPath, content] of Object.entries(files)) {
    const target = resolveSkillFilePath(dir, relPath)
    const parent = dirname(target)
    const entry: [string, string] = [target, content]
    const group = byParent.get(parent)
    if (group) group.push(entry)
    else byParent.set(parent, [entry])
  }
  await Promise.all(
    [...byParent].map(async ([parent, entries]) => {
      await mkdir(parent, { recursive: true })
      await Promise.all(entries.map(([p, c]) => safeWriteFile(p, c)))
    }),
  )
}

// On Windows, use string flags — numeric O_EXCL can produce EINVAL through libuv.
const SAFE_WRITE_FLAGS =
  process.platform === "win32"
    ? "wx"
    : fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL

async function safeWriteFile(p: string, content: string): Promise<void> {
  try {
    const fh = await open(p, SAFE_WRITE_FLAGS, 0o600)
    try {
      await fh.writeFile(content, "utf8")
    } finally {
      await fh.close()
    }
  } catch (e: unknown) {
    // EEXIST is fine — file was already extracted
    if ((e as NodeJS.ErrnoException)?.code === "EEXIST") return
    throw e
  }
}

function resolveSkillFilePath(baseDir: string, relPath: string): string {
  const normalized = normalize(relPath)
  if (
    isAbsolute(normalized) ||
    normalized.split(pathSep).includes("..") ||
    normalized.split("/").includes("..")
  ) {
    throw new Error(`bundled skill file path escapes skill dir: ${relPath}`)
  }
  return join(baseDir, normalized)
}
