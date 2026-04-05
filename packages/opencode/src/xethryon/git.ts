/**
 * Git-Aware Workflows for Xethryon.
 *
 * Provides git state detection and context injection into the system prompt.
 * The agent automatically understands the current git state and can act
 * accordingly — stashing before risky operations, detecting uncommitted
 * changes, and providing branch context.
 */

import { Log } from "@/util/log"
import { Instance } from "@/project/instance"
import { Process } from "@/util/process"

const log = Log.create({ service: "xethryon.git" })

export type GitState = {
  isRepo: boolean
  branch: string | null
  /** Number of uncommitted changes (staged + unstaged) */
  changedFiles: number
  /** Number of staged files ready to commit */
  stagedFiles: number
  /** Number of unstaged modified files */
  unstagedFiles: number
  /** Number of untracked files */
  untrackedFiles: number
  /** Whether there's a merge in progress */
  isMerging: boolean
  /** Whether there's a rebase in progress */
  isRebasing: boolean
  /** Number of commits ahead of remote */
  ahead: number
  /** Number of commits behind remote */
  behind: number
  /** Number of stashes */
  stashCount: number
  /** Whether the working tree is clean */
  isClean: boolean
}

/**
 * Whether git-aware features are enabled.
 * Defaults to ON. Disable with XETHRYON_GIT_AWARE=0.
 */
export function isGitAwareEnabled(): boolean {
  const envVal = process.env.XETHRYON_GIT_AWARE
  if (envVal === "0" || envVal === "false") return false
  return true
}

/**
 * Run a git command and return the trimmed output.
 * Returns null if the command fails (e.g., not a git repo).
 */
async function git(args: string[], cwd?: string): Promise<string | null> {
  try {
    const result = await Process.text(["git", ...args], {
      cwd: cwd ?? Instance.directory,
      nothrow: true,
    })
    if (result.code !== 0) return null
    return result.text.trim()
  } catch {
    return null
  }
}

/**
 * Detect the current git state of the working directory.
 */
export async function getGitState(): Promise<GitState> {
  const defaultState: GitState = {
    isRepo: false,
    branch: null,
    changedFiles: 0,
    stagedFiles: 0,
    unstagedFiles: 0,
    untrackedFiles: 0,
    isMerging: false,
    isRebasing: false,
    ahead: 0,
    behind: 0,
    stashCount: 0,
    isClean: true,
  }

  // Check if we're in a git repo
  const isRepo = await git(["rev-parse", "--is-inside-work-tree"])
  if (isRepo !== "true") return defaultState

  const state: GitState = { ...defaultState, isRepo: true }

  // Get current branch
  const branch = await git(["branch", "--show-current"])
  state.branch = branch || null

  // Get status (porcelain v2 for machine-readable output)
  const status = await git(["status", "--porcelain=v1"])
  if (status) {
    const lines = status.split("\n").filter((l) => l.length > 0)
    for (const line of lines) {
      const x = line[0] // staged status
      const y = line[1] // unstaged status

      if (x === "?" && y === "?") {
        state.untrackedFiles++
      } else {
        if (x && x !== " " && x !== "?") state.stagedFiles++
        if (y && y !== " " && y !== "?") state.unstagedFiles++
      }
    }
    state.changedFiles = state.stagedFiles + state.unstagedFiles
  }

  // Check merge/rebase state
  const mergeHead = await git(["rev-parse", "--verify", "MERGE_HEAD"])
  state.isMerging = mergeHead !== null

  const rebaseDir = await git(["rev-parse", "--git-path", "rebase-merge"])
  if (rebaseDir) {
    const { existsSync } = await import("fs")
    const { join } = await import("path")
    const cwd = Instance.directory
    state.isRebasing = existsSync(join(cwd, rebaseDir)) ||
      existsSync(join(cwd, ".git", "rebase-apply"))
  }

  // Ahead/behind remote
  const upstreamStatus = await git(["rev-list", "--left-right", "--count", "@{upstream}...HEAD"])
  if (upstreamStatus) {
    const [behind, ahead] = upstreamStatus.split("\t").map(Number)
    state.behind = behind || 0
    state.ahead = ahead || 0
  }

  // Stash count
  const stashList = await git(["stash", "list"])
  state.stashCount = stashList ? stashList.split("\n").filter((l) => l.length > 0).length : 0

  state.isClean = state.changedFiles === 0 && state.untrackedFiles === 0

  return state
}

/**
 * Build the git context string for system prompt injection.
 */
export function buildGitContextPrompt(state: GitState): string | null {
  if (!state.isRepo) return null

  const lines: string[] = [
    "<git_context>",
    `  Branch: ${state.branch ?? "(detached HEAD)"}`,
  ]

  if (state.isClean) {
    lines.push("  Working tree: clean")
  } else {
    const parts: string[] = []
    if (state.stagedFiles > 0) parts.push(`${state.stagedFiles} staged`)
    if (state.unstagedFiles > 0) parts.push(`${state.unstagedFiles} modified`)
    if (state.untrackedFiles > 0) parts.push(`${state.untrackedFiles} untracked`)
    lines.push(`  Working tree: ${parts.join(", ")}`)
  }

  if (state.isMerging) lines.push("  ⚠ Merge in progress")
  if (state.isRebasing) lines.push("  ⚠ Rebase in progress")
  if (state.ahead > 0) lines.push(`  Ahead of remote: ${state.ahead} commit${state.ahead > 1 ? "s" : ""}`)
  if (state.behind > 0) lines.push(`  Behind remote: ${state.behind} commit${state.behind > 1 ? "s" : ""}`)
  if (state.stashCount > 0) lines.push(`  Stashes: ${state.stashCount}`)

  lines.push("</git_context>")

  // Only inject meaningful prompts
  if (!state.isClean || state.isMerging || state.isRebasing || state.ahead > 0 || state.behind > 0) {
    lines.push("")
    lines.push("You are aware of the user's git state shown above. Consider it when making decisions:")
    if (!state.isClean) {
      lines.push("- There are uncommitted changes. If you need to switch branches or do destructive git operations, stash changes first with `git stash`.")
    }
    if (state.isMerging) {
      lines.push("- A merge is in progress. Help resolve it if the user asks, or be careful not to interfere.")
    }
    if (state.isRebasing) {
      lines.push("- A rebase is in progress. Help complete it or abort if the user asks.")
    }
    if (state.behind > 0) {
      lines.push(`- The local branch is ${state.behind} commits behind remote. Consider pulling before making changes.`)
    }
  }

  return lines.join("\n")
}

/**
 * Combined function: get state + build prompt.
 * Returns null if git-aware is disabled or not in a git repo.
 */
export async function getGitContextPrompt(): Promise<string | null> {
  if (!isGitAwareEnabled()) return null

  try {
    const state = await getGitState()
    return buildGitContextPrompt(state)
  } catch (e) {
    log.warn("failed to get git context", { error: e })
    return null
  }
}
