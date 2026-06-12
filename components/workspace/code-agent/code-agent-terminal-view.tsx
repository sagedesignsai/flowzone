"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { cn } from "@/lib/utils"

interface CodeAgentTerminalViewProps {
  chatId: string
  className?: string
}

type ConnState = "idle" | "connecting" | "connected" | "reconnecting" | "error"

/**
 * Terminal view for the Code Agent PTY workspace.
 *
 * Connects to /api/workspace/code-agent/terminal?chatId=xxx
 * for real-time PTY output streaming via SSE. The SSE endpoint
 * connects directly to the sandbox PTY via sandbox.pty.connect().
 *
 * Shows a "waiting for PTY session" state initially since
 * the PTY session is created lazily when the agent first runs.
 */
export function CodeAgentTerminalView({
  chatId,
  className,
}: CodeAgentTerminalViewProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const termInstanceRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptRef = useRef(0)
  const mountedRef = useRef(true)

  const [connState, setConnState] = useState<ConnState>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const sendInput = useCallback(
    async (data: string) => {
      try {
        await fetch("/api/workspace/code-agent/terminal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "input", chatId, data }),
        })
      } catch {
        // connection lost
      }
    },
    [chatId],
  )

  const sendResize = useCallback(
    async (cols: number, rows: number) => {
      try {
        await fetch("/api/workspace/code-agent/terminal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "resize", chatId, cols, rows }),
        })
      } catch {
        // ignore
      }
    },
    [chatId],
  )

  useEffect(() => {
    const container = terminalRef.current
    if (!container) return

    mountedRef.current = true
    reconnectAttemptRef.current = 0
    setConnState("idle")
    setErrorMsg(null)

    // ── Initialize xterm.js ─────────────────────────────
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "block",
      fontFamily:
        "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Menlo', monospace",
      fontSize: 13,
      theme: {
        background: "#0a0a0b",
        foreground: "#e4e4e7",
        cursor: "#e4e4e7",
        selectionBackground: "#3b3b3b",
        black: "#000000",
        red: "#e06c75",
        green: "#98c379",
        yellow: "#d19a66",
        blue: "#61afef",
        magenta: "#c678dd",
        cyan: "#56b6c2",
        white: "#abb2bf",
        brightBlack: "#5c6370",
        brightRed: "#e06c75",
        brightGreen: "#98c379",
        brightYellow: "#d19a66",
        brightBlue: "#61afef",
        brightMagenta: "#c678dd",
        brightCyan: "#56b6c2",
        brightWhite: "#ffffff",
      },
      allowProposedApi: true,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    term.open(container)
    fitAddon.fit()

    termInstanceRef.current = term
    fitAddonRef.current = fitAddon

    term.writeln("\x1b[33mWaiting for PTY session...\x1b[0m")
    term.writeln("Send a message to start the sandbox and terminal.\r\n")

    // ── Connect to SSE ──────────────────────────────────
    function connect() {
      if (!mountedRef.current) return

      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      setConnState("connecting")

      const es = new EventSource(
        `/api/workspace/code-agent/terminal?chatId=${encodeURIComponent(chatId)}`,
      )

      es.onopen = () => {
        if (!mountedRef.current) return
        setConnState("connected")
        setErrorMsg(null)
        reconnectAttemptRef.current = 0
        term.focus()
      }

      es.onmessage = (event) => {
        if (!mountedRef.current) return
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === "output") {
            term.write(msg.data)
          } else if (msg.type === "connected") {
            setConnState("connected")
            term.writeln(
              `\r\n\x1b[32mTerminal connected (sandbox: ${msg.sandboxId?.slice(0, 8)}...)\x1b[0m\r\n`,
            )
          } else if (msg.type === "error") {
            term.writeln(`\r\n\x1b[31mError: ${msg.data}\x1b[0m`)
          } else if (msg.type === "end") {
            term.writeln(`\r\n\x1b[33mPTY session ended.\x1b[0m`)
          }
        } catch {
          // ignore parse errors
        }
      }

      es.onerror = () => {
        if (!mountedRef.current) return

        es.close()
        eventSourceRef.current = null

        const attempt = reconnectAttemptRef.current
        const maxRetries = 10

        if (attempt >= maxRetries) {
          setConnState("error")
          setErrorMsg("Terminal connection failed after multiple retries")
          return
        }

        setConnState("reconnecting")

        // Exponential backoff: 2s → 4s → 8s → 16s → ... (capped at 30s)
        const delay = Math.min(2000 * 2 ** attempt, 30_000)
        reconnectAttemptRef.current = attempt + 1

        if (attempt > 0) {
          term.writeln(
            `\r\n\x1b[33mConnection lost. Reconnecting in ${Math.round(delay / 1000)}s...\x1b[0m`,
          )
        }

        reconnectTimerRef.current = setTimeout(connect, delay)
      }

      eventSourceRef.current = es
    }

    // ── Start connection cycle ──────────────────────────
    connect()

    // ── Handle user input ───────────────────────────────
    const inputDispose = term.onData((data) => {
      sendInput(data)
    })

    // ── Handle resize ───────────────────────────────────
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit()
        const dims = fitAddon.proposeDimensions()
        if (dims) {
          sendResize(dims.cols, dims.rows)
        }
      } catch {
        // ignore
      }
    })

    resizeObserver.observe(container)

    // Focus on mount
    setTimeout(() => term.focus(), 100)

    // ── Cleanup ──────────────────────────────────────────
    return () => {
      mountedRef.current = false
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      inputDispose.dispose()
      resizeObserver.disconnect()
      term.dispose()
      termInstanceRef.current = null
      fitAddonRef.current = null
    }
  }, [chatId, sendInput, sendResize])

  return (
    <div className={cn("relative size-full", className)}>
      {/* Terminal canvas */}
      <div
        ref={terminalRef}
        className="size-full overflow-hidden bg-[#0a0a0b]"
      />

      {/* Connecting overlay */}
      {connState === "connecting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0a0a0b]/60">
          <div className="size-5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
          <p className="text-xs text-zinc-400">
            Waiting for PTY session...
          </p>
        </div>
      )}

      {/* Reconnecting overlay */}
      {connState === "reconnecting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0a0a0b]/60">
          <div className="size-5 animate-spin rounded-full border-2 border-amber-600 border-t-amber-400" />
          <p className="text-xs text-amber-400">Reconnecting...</p>
        </div>
      )}

      {/* Error overlay */}
      {connState === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0a0a0b]/80">
          <p className="text-xs text-red-400">Connection failed</p>
          {errorMsg && (
            <p className="max-w-xs text-center text-xs text-zinc-500">
              {errorMsg}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              reconnectAttemptRef.current = 0
              setConnState("connecting")
              setErrorMsg(null)
              // Trigger reconnect
              if (eventSourceRef.current) {
                eventSourceRef.current.close()
              }
              const es = new EventSource(
                `/api/workspace/code-agent/terminal?chatId=${encodeURIComponent(chatId)}`,
              )
              eventSourceRef.current = es
            }}
            className="mt-1 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
