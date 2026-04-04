/**
 * Initialize all bundled skills.
 * Ported from cc-leak/src/skills/bundled/index.ts.
 *
 * Call once at startup to register skills that ship with Xethryon.
 * Skills appear as slash commands in the command palette.
 *
 * Stripped: USER_TYPE gates, feature() flags, Claude-specific skills.
 * Kept: verify, batch, simplify, remember, debug, loop.
 */

import { registerVerifySkill } from "./verify.js"
import { registerBatchSkill } from "./batch.js"
import { registerSimplifySkill } from "./simplify.js"
import { registerRememberSkill } from "./remember.js"
import { registerDebugSkill } from "./debug.js"
import { registerLoopSkill } from "./loop.js"

let _initialized = false

/**
 * Initialize all bundled skills.
 * Safe to call multiple times — only runs once.
 */
export function initBundledSkills(): void {
  if (_initialized) return
  _initialized = true

  // Core skills — available to all users
  registerVerifySkill()
  registerSimplifySkill()
  registerBatchSkill()
  registerDebugSkill()
  registerLoopSkill()

  // Memory-dependent skills (Phase 1 integration)
  registerRememberSkill()
}
