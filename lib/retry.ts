import { logger } from "@/lib/logger"

export interface RetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  /** Return true to retry, false to give up */
  shouldRetry?: (error: unknown, attempt: number) => boolean
  onRetry?: (error: unknown, attempt: number) => void
}

const defaultOpts: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 200,
  maxDelayMs: 5_000,
  shouldRetry: () => true,
  onRetry: () => {},
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Wrap an async function with exponential backoff retry.
 *
 * Example:
 *   const result = await retry(() => client.session.get(...))
 */
export async function retry<T>(
  fn: () => Promise<T>,
  opts?: RetryOptions,
): Promise<T> {
  const { maxAttempts, baseDelayMs, maxDelayMs, shouldRetry, onRetry } = {
    ...defaultOpts,
    ...opts,
  }

  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
        throw error
      }

      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs)
      onRetry(error, attempt)
      await sleep(delay)
    }
  }

  throw lastError
}

/**
 * Reject a promise after `ms` milliseconds.
 * Returns a promise that rejects with TimeoutError.
 */
export function timeoutSignal(ms: number): AbortSignal {
  const ctrl = new AbortController()
  setTimeout(() => ctrl.abort(), ms)
  return ctrl.signal
}

export class TimeoutError extends Error {
  constructor(ms: number, label?: string) {
    super(label ? `${label} timed out after ${ms}ms` : `Timed out after ${ms}ms`)
    this.name = "TimeoutError"
  }
}

/**
 * Race a promise against a timeout.
 * If the promise doesn't settle within `ms`, rejects with TimeoutError.
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  ms: number,
  label?: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new TimeoutError(ms, label)), ms)
      }),
    ])
    return result
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/**
 * Call `fn` with retry and timeout.
 */
export async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  label: string,
  retryOpts?: RetryOptions,
): Promise<T> {
  return retry(
    () => withTimeout(fn, timeoutMs, label),
    {
      ...retryOpts,
      onRetry: (error, attempt) => {
        logger.warn(`${label} attempt ${attempt} failed, retrying`, {
          error: String(error),
        })
        retryOpts?.onRetry?.(error, attempt)
      },
    },
  )
}
