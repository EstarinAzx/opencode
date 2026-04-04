/**
 * Minimal file lock utility.
 * Replaces cc-leak's `proper-lockfile` npm dependency.
 * Uses O_CREAT | O_EXCL for atomic lock acquisition.
 * Windows note: O_CREAT | O_EXCL is atomic on NTFS.
 */

import fs from "fs/promises"
import { constants as fsConstants } from "fs"

const LOCK_DEFAULTS = {
  retries: 10,
  minBackoff: 5,
  maxBackoff: 100,
}

/**
 * Acquire a file lock. Returns a release function.
 * Throws after max retries if lock can't be acquired.
 */
export async function acquireLock(
  lockPath: string,
  retries = LOCK_DEFAULTS.retries,
  backoff = { min: LOCK_DEFAULTS.minBackoff, max: LOCK_DEFAULTS.maxBackoff },
): Promise<() => Promise<void>> {
  // On Windows, use string flags — numeric O_EXCL can produce EINVAL through libuv.
  const flags =
    process.platform === "win32"
      ? "wx"
      : fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const fh = await fs.open(lockPath, flags, 0o600)
      await fh.writeFile(String(process.pid), "utf8")
      await fh.close()

      // Return release function
      return async () => {
        await fs.unlink(lockPath).catch(() => {})
      }
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException)?.code !== "EEXIST") {
        throw e
      }

      if (attempt < retries) {
        const delay = Math.min(
          backoff.min * Math.pow(2, attempt) + Math.random() * backoff.min,
          backoff.max,
        )
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }

  throw new Error(`Failed to acquire lock after ${retries} retries: ${lockPath}`)
}

/**
 * Force-release a lock (best-effort).
 */
export async function releaseLock(lockPath: string): Promise<void> {
  await fs.unlink(lockPath).catch(() => {})
}
