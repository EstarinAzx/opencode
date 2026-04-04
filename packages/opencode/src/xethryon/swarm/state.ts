/**
 * Swarm state singleton.
 * Manages the active swarm runtime (teammates, abort controllers).
 */

import type { ActiveTeammate, TeammateStatus } from "./types.js"

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

const activeTeammates: Map<string, ActiveTeammate> = new Map()
let activeTeamName: string | null = null

// ---------------------------------------------------------------------------
// Team state
// ---------------------------------------------------------------------------

export function setActiveTeam(teamName: string): void {
  activeTeamName = teamName
}

export function getActiveTeam(): string | null {
  return activeTeamName
}

export function clearActiveTeam(): void {
  activeTeamName = null
}

// ---------------------------------------------------------------------------
// Teammate tracking
// ---------------------------------------------------------------------------

export function registerTeammate(teammate: ActiveTeammate): void {
  activeTeammates.set(teammate.agentId, teammate)
}

export function unregisterTeammate(agentId: string): void {
  activeTeammates.delete(agentId)
}

export function getTeammate(agentId: string): ActiveTeammate | undefined {
  return activeTeammates.get(agentId)
}

export function getAllTeammates(): ActiveTeammate[] {
  return [...activeTeammates.values()]
}

export function getTeammatesForTeam(teamName: string): ActiveTeammate[] {
  return [...activeTeammates.values()].filter((t) => t.teamName === teamName)
}

export function updateTeammateStatus(agentId: string, status: TeammateStatus): void {
  const t = activeTeammates.get(agentId)
  if (t) t.status = status
}

/**
 * Abort a teammate (signal its abort controller).
 */
export function abortTeammate(agentId: string): boolean {
  const t = activeTeammates.get(agentId)
  if (!t) return false
  t.abortController.abort()
  t.status = "stopped"
  return true
}

/**
 * Abort all teammates for a given team.
 */
export function abortAllTeammates(teamName: string): number {
  let count = 0
  for (const t of activeTeammates.values()) {
    if (t.teamName === teamName && t.status !== "stopped") {
      t.abortController.abort()
      t.status = "stopped"
      count++
    }
  }
  return count
}

/**
 * Cleanup all active teammates (abort and unregister).
 */
export function cleanupAllTeammates(): void {
  for (const t of activeTeammates.values()) {
    if (t.status !== "stopped") {
      t.abortController.abort()
    }
  }
  activeTeammates.clear()
  activeTeamName = null
}
