/**
 * AutoDream — background memory consolidation for Xethryon.
 * Ported from cc-leak/src/services/autoDream/autoDream.ts.
 *
 * Heavy adaptation:
 * - Replaced runForkedAgent with stub (will wire into Session.create)
 * - Stripped GrowthBook, analytics, DreamTask UI, KAIROS gate
 * - Preserved the time + session gatekeeping pattern
 * - Simplified session counting (checks memory dir mtime vs lock)
 */

import { readdir, stat } from "fs/promises"
import { join } from "path"
import { Log } from "@/util/log"
import { getAutoMemPath, isAutoMemoryEnabled } from "./paths.js"
import { buildConsolidationPrompt } from "./consolidationPrompt.js"
import {
  readLastConsolidatedAt,
  tryAcquireConsolidationLock,
  rollbackConsolidationLock,
} from "./consolidationLock.js"

const log = Log.create({ service: "xethryon.autoDream" })

// Scan throttle: when time-gate passes but session-gate doesn't
const SESSION_SCAN_INTERVAL_MS = 10 * 60 * 1000

type AutoDreamConfig = {
  minHours: number
  minSessions: number
}

const DEFAULTS: AutoDreamConfig = {
  minHours: 24,
  minSessions: 5,
}

// --- Module state ---
let _initialized = false
let _lastSessionScanAt = 0
let _config: AutoDreamConfig = { ...DEFAULTS }

/**
 * Configure autoDream thresholds.
 */
export function setAutoDreamConfig(config: Partial<AutoDreamConfig>): void {
  _config = { ..._config, ...config }
}

/**
 * Count memory files modified after a given timestamp.
 * This is a proxy for "sessions that generated new memories" —
 * simpler than scanning transcript directories.
 */
async function countRecentMemoryChanges(sinceMs: number): Promise<number> {
  const memDir = getAutoMemPath()
  try {
    const entries = await readdir(memDir)
    let count = 0
    for (const entry of entries) {
      if (!entry.endsWith(".md")) continue
      try {
        const s = await stat(join(memDir, entry))
        if (s.mtimeMs > sinceMs) count++
      } catch {
        // Skip unreadable files
      }
    }
    return count
  } catch {
    return 0
  }
}

/**
 * Check all gates and fire consolidation if warranted.
 * Gate order (cheapest first):
 *   1. Feature enabled
 *   2. Time: hours since lastConsolidatedAt >= minHours
 *   3. Scan throttle
 *   4. Session gate: enough recent activity
 *   5. Lock: no other process mid-consolidation
 */
export async function executeAutoDream(sessionID: string): Promise<void> {
  if (!isAutoMemoryEnabled()) return

  // --- Time gate ---
  let lastAt: number
  try {
    lastAt = await readLastConsolidatedAt()
  } catch (e) {
    log.warn("readLastConsolidatedAt failed", { error: e })
    return
  }
  const hoursSince = (Date.now() - lastAt) / 3_600_000
  if (hoursSince < _config.minHours) return

  // --- Scan throttle ---
  const sinceScanMs = Date.now() - _lastSessionScanAt
  if (sinceScanMs < SESSION_SCAN_INTERVAL_MS) return
  _lastSessionScanAt = Date.now()

  // --- Session/activity gate ---
  const recentChanges = await countRecentMemoryChanges(lastAt)
  if (recentChanges < _config.minSessions) {
    log.info("autoDream skip — not enough activity", {
      recentChanges,
      needed: _config.minSessions,
    })
    return
  }

  // --- Lock ---
  let priorMtime: number | null
  try {
    priorMtime = await tryAcquireConsolidationLock()
  } catch (e) {
    log.warn("lock acquire failed", { error: e })
    return
  }
  if (priorMtime === null) return

  log.info("autoDream firing", {
    hoursSince: hoursSince.toFixed(1),
    recentChanges,
  })

  try {
    const memoryRoot = getAutoMemPath()

    // Build consolidation prompt
    const extra = `
**Tool constraints for this run:** Bash is restricted to read-only commands (\`ls\`, \`find\`, \`grep\`, \`cat\`, \`stat\`, \`wc\`, \`head\`, \`tail\`, and similar). Anything that writes, redirects to a file, or modifies state will be denied.

Recent memory activity: ${recentChanges} files modified since last consolidation.`

    const _prompt = buildConsolidationPrompt(memoryRoot, memoryRoot, extra)

    // TODO: Wire into OpenCode's Session.create + SessionPrompt.prompt()
    // For now, the prompt is built but not sent to a subagent.
    log.info("autoDream prompt built", {
      sessionID,
      memoryRoot,
      promptLength: _prompt.length,
    })
  } catch (e) {
    log.error("autoDream failed", { error: e })
    await rollbackConsolidationLock(priorMtime)
  }
}

/**
 * Initialize autoDream service.
 */
export function initAutoDream(): void {
  if (_initialized) return
  _initialized = true
  log.info("autoDream initialized")
}

/**
 * Reset module state (for testing).
 */
export function resetAutoDream(): void {
  _initialized = false
  _lastSessionScanAt = 0
  _config = { ...DEFAULTS }
}
