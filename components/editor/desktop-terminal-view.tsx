"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { useIdeStore } from "@/hooks/use-ide-store"
import { cn } from "@/lib/utils"

interface DesktopTerminalViewProps {
  chatId: string
  sandboxId: string
  ptyPid?: number
  className?: string
}

type ConnState = "connecting" | "connected" | "reconnecting" | "error"

export function DesktopTerminalView({
  chatId,
  className,
}: DesktopTerminalViewProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const termInstanceRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptRef = useRef(0)
  const mountedRef = useRef(true)

  const [connState, setConnState] = useState<ConnState>("connecting")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const setTerminalStreaming = useIdeStore((s) => s.setTerminalStreaming)

  const sendInput = useCallback(
    async (data: string) => {
      try {
        await fetch("/api/desktop/terminal", {
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
        await fetch("/api/desktop/terminal", {
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
    setConnState("connecting")
    setErrorMsg(null)

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

    setTerminalStreaming(true)

    function connect() {
      if (!mountedRef.current) return

      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      const es = new EventSource(
        `/api/desktop/terminal?chatId=${encodeURIComponent(chatId)}`,
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
          } else if (msg.type === "error") {
            term.writeln(`\r\n\x1b[31mError: ${msg.data}\x1b[0m`)
          } else if (msg.type === "ready") {
            setConnState("connected")
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
        const maxRetries = 5

        if (attempt >= maxRetries) {
          setConnState("error")
          setErrorMsg("Terminal connection failed after multiple retries")
          return
        }

        setConnState("reconnecting")

        const delay = Math.min(1000 * 2 ** attempt, 30_000)
        reconnectAttemptRef.current = attempt + 1

        term.writeln(
          `\r\n\x1b[33mConnection lost. Reconnecting in ${Math.round(delay / 1000)}s...\x1b[0m`,
        )

        reconnectTimerRef.current = setTimeout(connect, delay)
      }

      eventSourceRef.current = es
    }

    connect()

    // Handle user input
    const inputDispose = term.onData((data) => {
      sendInput(data)
    })

    // Handle resize
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
      setTerminalStreaming(false)
    }
  }, [chatId, sendInput, sendResize, setTerminalStreaming])

  return (
    <div className={cn("relative size-full", className)}>
      {/* Terminal canvas */}
      <div
        ref={terminalRef}
        className="size-full overflow-hidden bg-[#0a0a0b]"
      />

      {/* Loading / error overlay */}
      {(connState === "connecting" || connState === "reconnecting" || connState === "error") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0a0a0b]/90">
          {connState === "connecting" && (
            <>
              <div className="size-5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
              <p className="text-xs text-zinc-400">Connecting to terminal...</p>
            </>
          )}
          {connState === "reconnecting" && (
            <>
              <div className="size-5 animate-spin rounded-full border-2 border-amber-600 border-t-amber-400" />
              <p className="text-xs text-amber-400">Reconnecting...</p>
            </>
          )}
          {connState === "error" && (
            <>
              <p className="text-xs text-red-400">Connection failed</p>
              {errorMsg && (
                <p className="max-w-xs text-center text-xs text-zinc-500">
                  {errorMsg}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
