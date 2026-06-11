import type { OpencodeClient } from "@opencode-ai/sdk/v2"
import { logger } from "@/lib/logger"

interface PermissionEventProperties {
  id: string
  sessionID: string
  permission?: string
  type?: string
  patterns?: string[]
  pattern?: string | string[]
  callID?: string
  tool?: { callID?: string; messageID?: string }
}

interface QuestionEventProperties {
  id: string
  sessionID: string
}

export function getPermissionRequestInfo(properties: unknown): {
  requestId: string
  sessionId: string
  toolCallId: string
  permission: string
  patterns: string[]
} | null {
  if (typeof properties !== "object" || properties === null) return null
  const props = properties as PermissionEventProperties
  if (!props.id || !props.sessionID) return null

  const patternValue = props.patterns ?? props.pattern ?? []
  const patterns = Array.isArray(patternValue) ? patternValue : [patternValue]

  return {
    requestId: props.id,
    sessionId: props.sessionID,
    toolCallId: props.tool?.callID ?? props.callID ?? props.id,
    permission: props.permission ?? props.type ?? "unknown",
    patterns: patterns.filter((pattern): pattern is string => typeof pattern === "string"),
  }
}

export async function approveOpenCodePermission(options: {
  client: OpencodeClient
  requestId: string
  sessionId: string
  directory?: string
}): Promise<void> {
  const { client, requestId, sessionId, directory } = options

  try {
    await client.permission.reply({
      requestID: requestId,
      reply: "once",
      ...(directory ? { directory } : {}),
    })
    return
  } catch (error) {
    logger.debug("OpenCode permission.reply failed, trying fallback", {
      requestId,
      error: String(error),
    })
  }

  try {
    await client.permission.respond({
      sessionID: sessionId,
      permissionID: requestId,
      response: "once",
      ...(directory ? { directory } : {}),
    })
  } catch (error) {
    logger.warn("Failed to approve OpenCode permission", {
      requestId,
      sessionId,
      error: String(error),
    })
  }
}

export async function rejectOpenCodeQuestion(options: {
  client: OpencodeClient
  properties: unknown
  directory?: string
}): Promise<void> {
  const { client, properties, directory } = options
  if (typeof properties !== "object" || properties === null) return

  const props = properties as QuestionEventProperties
  if (!props.id) return

  try {
    await client.question.reject({
      requestID: props.id,
      ...(directory ? { directory } : {}),
    })
  } catch (error) {
    logger.warn("Failed to reject OpenCode question", {
      requestId: props.id,
      error: String(error),
    })
  }
}
