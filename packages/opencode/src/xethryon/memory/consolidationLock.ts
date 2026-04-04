/**
 * Consolidation lock for Xethryon AutoDream.
 * Ported from cc-leak/src/services/autoDream/consolidationLock.ts.
 *
 * Lock file whose mtime IS lastConsolidatedAt. Body is the holder's PID.
 * Lives inside the memory dir (getAutoMemPath).
 */

import { mkdir, readFile, stat, unlink, utimes, writeFile } from "fs/promises"
import { join } from "path"
import { getAutoMemPath } from "./paths.js"

const LOCK_FILE = ".consolidate-lock"
const HOLDER_STALE_MS = 60 * 60 * 1000 // 1 hour

function lockPath(): string {
  return join(getAutoMemPath(), LOCK_FILE)
}

/**
 * Check if a process is still running by sending signal 0.
 */
function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

/**
 * mtime of the lock file = lastConsolidatedAt. 0 if absent.
 */
export async function readLastConsolidatedAt(): Promise<number> {
  try {
    const s = await stat(lockPath())
    return s.mtimeMs
  } catch {
    return 0
  }
}

/**
 * Acquire: write PID → mtime = now. Returns the pre-acquire mtime
 * (for rollback), or null if blocked / lost a race.
 */
export async function tryAcquireConsolidationLock(): Promise<number | null> {
  const path = lockPath()

  let mtimeMs: number | undefined
  let holderPid: number | undefined
  try {
    const [s, raw] = await Promise.all([stat(path), readFile(path, "utf8")])
    mtimeMs = s.mtimeMs
    const parsed = parseInt(raw.trim(), 10)
    holderPid = Number.isFinite(parsed) ? parsed : undefined
  } catch {
    // ENOENT — no prior lock.
  }

  if (mtimeMs !== undefined && Date.now() - mtimeMs < HOLDER_STALE_MS) {
    if (holderPid !== undefined && isProcessRunning(holderPid)) {
      return null
    }
  }

  // Memory dir may not exist yet.
  await mkdir(getAutoMemPath(), { recursive: true })
  await writeFile(path, String(process.pid))

  // Race check: re-read to verify we won
  let verify: string
  try {
    verify = await readFile(path, "utf8")
  } catch {
    return null
  }
  if (parseInt(verify.trim(), 10) !== process.pid) return null

  return mtimeMs ?? 0
}

/**
 * Rewind mtime to pre-acquire after a failed fork.
 * priorMtime 0 → unlink (restore no-file).
 */
export async function rollbackConsolidationLock(
  priorMtime: number,
): Promise<void> {
  const path = lockPath()
  try {
    if (priorMtime === 0) {
      await unlink(path)
      return
    }
    await writeFile(path, "")
    const t = priorMtime / 1000
    await utimes(path, t, t)
  } catch {
    // Rollback is best-effort
  }
}

/**
 * Record a consolidation timestamp.
 */
export async function recordConsolidation(): Promise<void> {
  try {
    await mkdir(getAutoMemPath(), { recursive: true })
    await writeFile(lockPath(), String(process.pid))
  } catch {
    // Best-effort
  }
}
