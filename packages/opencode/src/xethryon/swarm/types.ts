/**
 * Swarm type definitions.
 * Ported from cc-leak: swarm/backends/types.ts + teammateMailbox.ts types.
 *
 * Stripped: PermissionRequest/Response, SandboxPermission, PlanApproval
 * (pane-only message types not needed for in-process backend).
 */

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export interface TeamFile {
  name: string
  description?: string
  createdAt: number
  leadAgentId: string
  leadSessionId?: string
  members: TeamMember[]
}

export interface TeamMember {
  agentId: string
  name: string
  agentType?: string
  model?: string
  prompt?: string
  color?: string
  joinedAt: number
  cwd: string
  sessionId?: string
  isActive?: boolean
  backendType: "in-process"
}

// ---------------------------------------------------------------------------
// Mailbox messages
// ---------------------------------------------------------------------------

export interface TeammateMessage {
  from: string
  text: string // JSON string containing a typed message (or plain text)
  timestamp: number
  read: boolean
  color?: string
  summary?: string
}

/** Discriminated message types (parsed from `text` field) */

export interface IdleNotificationMessage {
  type: "idle_notification"
  from: string
  idleReason?: string
  completedTaskId?: string
}

export interface ShutdownRequestMessage {
  type: "shutdown_request"
  requestId: string
  from: string
  reason?: string
}

export interface ShutdownApprovedMessage {
  type: "shutdown_approved"
  requestId: string
  from: string
}

export interface ShutdownRejectedMessage {
  type: "shutdown_rejected"
  requestId: string
  from: string
  reason: string
}

export interface TaskAssignmentMessage {
  type: "task_assignment"
  taskId: string
  subject: string
  description: string
  assignedBy: string
}

export type TypedMessage =
  | IdleNotificationMessage
  | ShutdownRequestMessage
  | ShutdownApprovedMessage
  | ShutdownRejectedMessage
  | TaskAssignmentMessage

// ---------------------------------------------------------------------------
// Task board
// ---------------------------------------------------------------------------

export type TaskStatus = "pending" | "in_progress" | "completed" | "deleted"

export interface Task {
  id: string
  subject: string
  description: string
  status: TaskStatus
  owner?: string
  blocks: string[]
  blockedBy: string[]
  metadata?: Record<string, unknown>
  createdAt: number
  updatedAt: number
}

// ---------------------------------------------------------------------------
// Spawn
// ---------------------------------------------------------------------------

export interface TeammateSpawnConfig {
  name: string
  teamName: string
  prompt: string
  agentType?: string
  model?: string
  description?: string
  color?: string
}

export interface SpawnResult {
  success: boolean
  agentId: string
  sessionId: string
  error?: string
}

export type TeammateStatus = "running" | "idle" | "stopped"

export interface ActiveTeammate {
  agentId: string
  name: string
  teamName: string
  sessionId: string
  abortController: AbortController
  status: TeammateStatus
}
