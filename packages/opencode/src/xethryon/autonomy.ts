/**
 * Xethryon Autonomy Module
 *
 * Global state for the autonomy toggle.
 * When enabled, the AI can autonomously switch agent modes
 * based on task requirements.
 *
 * Uses process.env to guarantee state sharing — environment
 * variables are a single OS-level store that no bundler can duplicate.
 */

/**
 * Set the global autonomy state.
 * Called by the TUI when the user presses f4.
 */
export function setAutonomy(enabled: boolean): void {
  if (enabled) {
    process.env.XETHRYON_AUTONOMY = "1"
  } else {
    delete process.env.XETHRYON_AUTONOMY
  }
}

/**
 * Check if autonomy mode is enabled.
 */
export function isAutonomyEnabled(): boolean {
  return process.env.XETHRYON_AUTONOMY === "1"
}

/**
 * Get the autonomy system prompt injection.
 * Returns undefined if autonomy is OFF.
 */
export function getAutonomyPrompt(): string | undefined {
  if (!isAutonomyEnabled()) return undefined

  return [
    "<autonomy-mode>",
    "AUTONOMY MODE IS ACTIVE. You have the ability to dynamically switch your operational mode to best serve the current task.",
    "",
    "Available modes and when to use them:",
    "- CONSTRUCT (build) — Default. Use for writing code, implementing features, fixing bugs",
    "- ARCHITECT (plan) — Use for planning, architecture decisions, multi-step task breakdowns",
    "- RECON (explore) — Use for reading/exploring code, understanding codebases, research",
    "- COORDINATE (coordinator) — Use for orchestrating multi-agent teams, delegation",
    "- VALIDATOR (verification) — Use for testing, code review, verifying correctness",
    "",
    "How to switch: You have a tool called `switch_agent` available. Call it with the agent name to switch.",
    "Only switch when the task genuinely requires a different mode. Don't switch mid-task without reason.",
    "",
    "Examples of when to switch:",
    "- User asks to 'plan a refactor' → switch to ARCHITECT",
    "- User asks to 'explore how auth works' → switch to RECON",
    "- User asks to 'verify the tests pass' → switch to VALIDATOR",
    "- User asks to 'create a team of agents' → switch to COORDINATE",
    "- Completing a plan phase and ready to implement → switch back to CONSTRUCT",
    "</autonomy-mode>",
  ].join("\n")
}
