/**
 * Swarm identity helpers.
 * Ported from cc-leak/src/utils/teammate.ts + swarm/teamHelpers.ts.
 */

import { TEAM_LEAD_NAME } from "./constants.js"

// ---------------------------------------------------------------------------
// Name sanitization
// ---------------------------------------------------------------------------

/**
 * Sanitize a name for use as a filesystem-safe identifier.
 */
export function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()
}

/**
 * Sanitize an agent name (strips @ symbols).
 */
export function sanitizeAgentName(name: string): string {
  return name.replace(/@/g, "-")
}

/**
 * Format a full agent ID: {sanitized-name}@{sanitized-team}
 */
export function formatAgentId(name: string, teamName: string): string {
  return `${sanitizeName(name)}@${sanitizeName(teamName)}`
}

/**
 * Parse an agent ID back into name + team.
 */
export function parseAgentId(agentId: string): { name: string; teamName: string } {
  const at = agentId.lastIndexOf("@")
  if (at === -1) return { name: agentId, teamName: "" }
  return {
    name: agentId.slice(0, at),
    teamName: agentId.slice(at + 1),
  }
}

// ---------------------------------------------------------------------------
// Team context (module-level state)
// ---------------------------------------------------------------------------

interface TeamContext {
  teamName: string
  leadAgentId: string
  teammates: Map<string, { agentId: string; name: string; color?: string; sessionId?: string }>
}

let activeTeamContext: TeamContext | null = null

export function setTeamContext(ctx: TeamContext): void {
  activeTeamContext = ctx
}

export function getTeamContext(): TeamContext | null {
  return activeTeamContext
}

export function clearTeamContext(): void {
  activeTeamContext = null
}

export function isTeamActive(): boolean {
  return activeTeamContext !== null
}

export function isTeamLead(agentId?: string): boolean {
  if (!activeTeamContext) return false
  if (!agentId) return true // If no agentId specified, assume current is lead
  return agentId === activeTeamContext.leadAgentId ||
    parseAgentId(agentId).name === TEAM_LEAD_NAME
}
