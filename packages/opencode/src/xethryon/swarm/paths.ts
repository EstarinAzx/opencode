/**
 * Swarm path utilities.
 * Derived from cc-leak/src/utils/swarm/teamHelpers.ts path functions.
 * All paths are project-local under .opencode/swarm/.
 */

import path from "path"
import { SWARM_DIR_NAME, INBOXES_DIR_NAME, TASKS_DIR_NAME, TEAM_CONFIG_FILE, TASKS_FILE } from "./constants.js"
import { sanitizeName } from "./identity.js"

/**
 * Root directory for all swarm data: .opencode/swarm/
 */
export function getSwarmRoot(): string {
  return path.join(process.cwd(), ".opencode", SWARM_DIR_NAME)
}

/**
 * Directory for a specific team: .opencode/swarm/{team-name}/
 */
export function getTeamDir(teamName: string): string {
  return path.join(getSwarmRoot(), sanitizeName(teamName))
}

/**
 * Path to the team config file: .opencode/swarm/{team-name}/config.json
 */
export function getTeamFilePath(teamName: string): string {
  return path.join(getTeamDir(teamName), TEAM_CONFIG_FILE)
}

/**
 * Directory for team inboxes: .opencode/swarm/{team-name}/inboxes/
 */
export function getInboxDir(teamName: string): string {
  return path.join(getTeamDir(teamName), INBOXES_DIR_NAME)
}

/**
 * Path to an agent's inbox file: .opencode/swarm/{team-name}/inboxes/{agent}.json
 */
export function getInboxPath(agentName: string, teamName: string): string {
  return path.join(getInboxDir(teamName), sanitizeName(agentName) + ".json")
}

/**
 * Directory for team tasks: .opencode/swarm/{team-name}/tasks/
 */
export function getTasksDir(teamName: string): string {
  return path.join(getTeamDir(teamName), TASKS_DIR_NAME)
}

/**
 * Path to the tasks file: .opencode/swarm/{team-name}/tasks/tasks.json
 */
export function getTasksFilePath(teamName: string): string {
  return path.join(getTasksDir(teamName), TASKS_FILE)
}
