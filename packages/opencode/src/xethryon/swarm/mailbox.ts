/**
 * File-based mailbox IPC for swarm teammates.
 * Ported from cc-leak/src/utils/teammateMailbox.ts.
 *
 * Each agent has an inbox file: .opencode/swarm/{team}/inboxes/{agent}.json
 * Messages are JSON arrays of TeammateMessage[].
 * Locking via acquireLock prevents concurrent write corruption.
 */

import fs from "fs/promises"
import { getInboxPath, getInboxDir } from "./paths.js"
import { acquireLock } from "./lock.js"
import { TEAMMATE_MESSAGE_TAG } from "./constants.js"
import type {
  TeammateMessage,
  IdleNotificationMessage,
  ShutdownRequestMessage,
  ShutdownApprovedMessage,
  ShutdownRejectedMessage,
  TaskAssignmentMessage,
} from "./types.js"
import crypto from "crypto"

// ---------------------------------------------------------------------------
// Core mailbox CRUD
// ---------------------------------------------------------------------------

/**
 * Read all messages from an agent's inbox.
 */
export async function readMailbox(agentName: string, teamName: string): Promise<TeammateMessage[]> {
  const inboxPath = getInboxPath(agentName, teamName)
  try {
    const raw = await fs.readFile(inboxPath, "utf-8")
    return JSON.parse(raw) as TeammateMessage[]
  } catch {
    return []
  }
}

/**
 * Read only unread messages from an agent's inbox.
 */
export async function readUnreadMessages(
  agentName: string,
  teamName: string,
): Promise<TeammateMessage[]> {
  const all = await readMailbox(agentName, teamName)
  return all.filter((m) => !m.read)
}

/**
 * Write a message to a recipient's inbox.
 * Uses file locking to prevent concurrent write corruption.
 */
export async function writeToMailbox(
  recipientName: string,
  message: Omit<TeammateMessage, "read">,
  teamName: string,
): Promise<void> {
  const inboxPath = getInboxPath(recipientName, teamName)
  const lockPath = `${inboxPath}.lock`

  // Ensure the inboxes directory exists before acquiring the lock
  await fs.mkdir(getInboxDir(teamName), { recursive: true })
  const release = await acquireLock(lockPath)
  try {
    let messages: TeammateMessage[] = []
    try {
      const raw = await fs.readFile(inboxPath, "utf-8")
      messages = JSON.parse(raw) as TeammateMessage[]
    } catch {
      // File doesn't exist yet — start fresh
    }

    messages.push({ ...message, read: false })
    await fs.writeFile(inboxPath, JSON.stringify(messages, null, 2), "utf-8")
  } finally {
    await release()
  }
}

/**
 * Mark all messages in an agent's inbox as read.
 */
export async function markMessagesAsRead(
  agentName: string,
  teamName: string,
): Promise<void> {
  const inboxPath = getInboxPath(agentName, teamName)
  const lockPath = `${inboxPath}.lock`

  await fs.mkdir(getInboxDir(teamName), { recursive: true })
  const release = await acquireLock(lockPath)
  try {
    let messages: TeammateMessage[] = []
    try {
      const raw = await fs.readFile(inboxPath, "utf-8")
      messages = JSON.parse(raw) as TeammateMessage[]
    } catch {
      return
    }

    for (const m of messages) m.read = true
    await fs.writeFile(inboxPath, JSON.stringify(messages, null, 2), "utf-8")
  } finally {
    await release()
  }
}

/**
 * Clear an agent's inbox entirely.
 */
export async function clearMailbox(agentName: string, teamName: string): Promise<void> {
  const inboxPath = getInboxPath(agentName, teamName)
  await fs.writeFile(inboxPath, "[]", "utf-8").catch(() => {})
}

// ---------------------------------------------------------------------------
// Message formatting (for injection into session)
// ---------------------------------------------------------------------------

/**
 * Format teammate messages as XML blocks for injection into the conversation.
 */
export function formatTeammateMessages(messages: TeammateMessage[]): string {
  return messages
    .map((m) => {
      const ts = new Date(m.timestamp).toISOString()
      const text = m.summary ?? m.text
      return `<${TEAMMATE_MESSAGE_TAG} from="${m.from}" timestamp="${ts}">${text}</${TEAMMATE_MESSAGE_TAG}>`
    })
    .join("\n")
}

// ---------------------------------------------------------------------------
// Message constructors
// ---------------------------------------------------------------------------

export function createIdleNotification(
  from: string,
  options?: { idleReason?: string; completedTaskId?: string },
): IdleNotificationMessage {
  return {
    type: "idle_notification",
    from,
    idleReason: options?.idleReason,
    completedTaskId: options?.completedTaskId,
  }
}

export function createShutdownRequestMessage(
  from: string,
  reason?: string,
): ShutdownRequestMessage {
  return {
    type: "shutdown_request",
    requestId: crypto.randomUUID().slice(0, 8),
    from,
    reason,
  }
}

export function createShutdownApprovedMessage(
  from: string,
  requestId: string,
): ShutdownApprovedMessage {
  return { type: "shutdown_approved", requestId, from }
}

export function createShutdownRejectedMessage(
  from: string,
  requestId: string,
  reason: string,
): ShutdownRejectedMessage {
  return { type: "shutdown_rejected", requestId, from, reason }
}

// ---------------------------------------------------------------------------
// Message type guards (parse JSON text field)
// ---------------------------------------------------------------------------

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export function isIdleNotification(text: string): IdleNotificationMessage | null {
  const obj = tryParse(text) as Record<string, unknown> | null
  return obj?.type === "idle_notification" ? (obj as unknown as IdleNotificationMessage) : null
}

export function isShutdownRequest(text: string): ShutdownRequestMessage | null {
  const obj = tryParse(text) as Record<string, unknown> | null
  return obj?.type === "shutdown_request" ? (obj as unknown as ShutdownRequestMessage) : null
}

export function isShutdownApproved(text: string): ShutdownApprovedMessage | null {
  const obj = tryParse(text) as Record<string, unknown> | null
  return obj?.type === "shutdown_approved" ? (obj as unknown as ShutdownApprovedMessage) : null
}

export function isShutdownRejected(text: string): ShutdownRejectedMessage | null {
  const obj = tryParse(text) as Record<string, unknown> | null
  return obj?.type === "shutdown_rejected" ? (obj as unknown as ShutdownRejectedMessage) : null
}

export function isTaskAssignment(text: string): TaskAssignmentMessage | null {
  const obj = tryParse(text) as Record<string, unknown> | null
  return obj?.type === "task_assignment" ? (obj as unknown as TaskAssignmentMessage) : null
}
