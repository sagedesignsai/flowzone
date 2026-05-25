const PREFIX = "[flowzone]"

export type LogLevel = "debug" | "info" | "warn" | "error"

const LEVEL_NUM: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function shouldLog(level: LogLevel): boolean {
  const min = (process.env.LOG_LEVEL as LogLevel) ?? "info"
  return LEVEL_NUM[level] >= LEVEL_NUM[min]
}

function formatMeta(meta?: Record<string, unknown>): string {
  if (!meta || Object.keys(meta).length === 0) return ""
  try {
    return ` ${JSON.stringify(meta)}`
  } catch {
    return ""
  }
}

export const logger = {
  debug(msg: string, meta?: Record<string, unknown>) {
    if (!shouldLog("debug")) return
    console.debug(`${PREFIX} [debug] ${msg}${formatMeta(meta)}`)
  },

  info(msg: string, meta?: Record<string, unknown>) {
    if (!shouldLog("info")) return
    console.info(`${PREFIX} ${msg}${formatMeta(meta)}`)
  },

  warn(msg: string, meta?: Record<string, unknown>) {
    if (!shouldLog("warn")) return
    console.warn(`${PREFIX} [warn] ${msg}${formatMeta(meta)}`)
  },

  error(msg: string, meta?: Record<string, unknown>) {
    if (!shouldLog("error")) return
    console.error(`${PREFIX} [error] ${msg}${formatMeta(meta)}`)
  },
}
