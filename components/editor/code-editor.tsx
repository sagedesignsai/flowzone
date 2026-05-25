"use client"

import { type LanguageName, loadLanguage } from "@uiw/codemirror-extensions-langs"
import { oneDark } from "@codemirror/theme-one-dark"
import { EditorView } from "@codemirror/view"
import CodeMirror from "@uiw/react-codemirror"
import { useTheme } from "next-themes"
import { useMemo } from "react"

interface CodeEditorProps {
  value: string
  language?: string
  onChange?: (value: string) => void
  readOnly?: boolean
  className?: string
}

const EXTENSION_MAP: Record<string, LanguageName> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  json: "json",
  css: "css",
  html: "html",
  md: "markdown",
  mdx: "markdown",
  py: "python",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
}

function detectLanguage(filename: string): LanguageName {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  return EXTENSION_MAP[ext] ?? "markdown"
}

export function CodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  className,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const lang = language ?? "markdown"
  const extensions = useMemo(
    () => [loadLanguage(detectLanguage(lang))!, EditorView.lineWrapping].filter(Boolean),
    [lang]
  )

  return (
    <CodeMirror
      className={className}
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme={isDark ? oneDark : undefined}
      readOnly={readOnly}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLineGutter: true,
        highlightActiveLine: true,
        foldGutter: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: false,
        indentOnInput: true,
        tabSize: 2,
      }}
    />
  )
}
