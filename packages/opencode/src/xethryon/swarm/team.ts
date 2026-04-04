/**
 * Team file CRUD operations.
 * Ported from cc-leak/src/utils/swarm/teamHelpers.ts.
 * Manages .opencode/swarm/{team}/config.json files.
 */

import fs from "fs/promises"
import path from "path"
import type { TeamFile, TeamMember } from "./types.js"
import { getTeamDir, getTeamFilePath, getInboxDir, getTasksDir } from "./paths.js"
import { sanitizeName } from "./identity.js"

/**
 * Read a team file from disk. Returns null if not found.
 */
export function readTeamFile(teamName: string): TeamFile | null {
  try {
    const raw = require("fs").readFileSync(getTeamFilePath(teamName), "utf-8")
    return JSON.parse(raw) as TeamFile
  } catch {
    return null
  }
}

/**
 * Read a team file asynchronously. Returns null if not found.
 */
export async function readTeamFileAsync(teamName: string): Promise<TeamFile | null> {
  try {
    const raw = await fs.readFile(getTeamFilePath(teamName), "utf-8")
    return JSON.parse(raw) as TeamFile
  } catch {
    return null
  }
}

/**
 * Write a team file to disk. Creates directories if needed.
 */
export async function writeTeamFileAsync(teamName: string, file: TeamFile): Promise<void> {
  const dir = getTeamDir(teamName)
  await fs.mkdir(dir, { recursive: true })
  await fs.mkdir(getInboxDir(teamName), { recursive: true })
  await fs.mkdir(getTasksDir(teamName), { recursive: true })
  await fs.writeFile(getTeamFilePath(teamName), JSON.stringify(file, null, 2), "utf-8")
}

/**
 * Add a member to a team's config file.
 */
export async function addMemberToTeam(teamName: string, member: TeamMember): Promise<void> {
  const file = await readTeamFileAsync(teamName)
  if (!file) throw new Error(`Team '${teamName}' not found`)

  // Replace if exists, otherwise append
  const idx = file.members.findIndex((m) => m.agentId === member.agentId)
  if (idx >= 0) {
    file.members[idx] = member
  } else {
    file.members.push(member)
  }

  await writeTeamFileAsync(teamName, file)
}

/**
 * Remove a member from a team. Returns true if found and removed.
 */
export async function removeMemberFromTeam(teamName: string, agentId: string): Promise<boolean> {
  const file = await readTeamFileAsync(teamName)
  if (!file) return false

  const before = file.members.length
  file.members = file.members.filter((m) => m.agentId !== agentId)

  if (file.members.length < before) {
    await writeTeamFileAsync(teamName, file)
    return true
  }
  return false
}

/**
 * Set a member's active status.
 */
export async function setMemberActive(
  teamName: string,
  memberName: string,
  isActive: boolean,
): Promise<void> {
  const file = await readTeamFileAsync(teamName)
  if (!file) return

  const member = file.members.find(
    (m) => m.name === memberName || m.agentId.startsWith(sanitizeName(memberName)),
  )
  if (member) {
    member.isActive = isActive
    await writeTeamFileAsync(teamName, file)
  }
}

/**
 * Delete a team's entire directory tree.
 */
export async function cleanupTeamDirectories(teamName: string): Promise<void> {
  const dir = getTeamDir(teamName)
  await fs.rm(dir, { recursive: true, force: true })
}

/**
 * Generate a unique team name by appending a number if the name already exists.
 */
export function generateUniqueTeamName(providedName: string): string {
  const base = sanitizeName(providedName)
  let candidate = base
  let counter = 1

  while (readTeamFile(candidate) !== null) {
    candidate = `${base}-${counter}`
    counter++
  }

  return candidate
}

/**
 * List all teams in the swarm directory.
 */
export async function listTeams(): Promise<string[]> {
  const swarmRoot = path.join(process.cwd(), ".opencode", "swarm")
  try {
    const entries = await fs.readdir(swarmRoot, { withFileTypes: true })
    return entries.filter((e) => e.isDirectory()).map((e) => e.name)
  } catch {
    return []
  }
}
