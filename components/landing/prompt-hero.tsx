"use client"

import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
} from "@/components/ai-elements/attachments"
import {
  PromptInput,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputActionMenuTrigger,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputActionAddScreenshot,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input"
import { Logomark } from "@/components/brand/logomark"
import { ProjectContextSelector } from "@/components/landing/project-context-selector"
import { EnvironmentSelector } from "@/components/landing/environment-selector"
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion"
import { useIdeStore } from "@/hooks/use-ide-store"
import type { ChatEnvironment } from "@/hooks/use-ide-store"
import { useSettingsStore } from "@/stores/settings-store"
import { cn } from "@/lib/utils"
import {
  ArrowCircleRight,
  DeviceTablet,
  Globe,
  Layout,
  Sparkle,
  Stack,
} from "@phosphor-icons/react"
import { motion, AnimatePresence } from "motion/react"
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input"
import { nanoid } from "nanoid"
import { useRouter } from "next/navigation"
import type { SubmitEvent } from "react"
import { useEffect, useState } from "react"

// ─── Quick-start suggestions ─────────────────────────────────────────────────

const SUGGESTIONS = [
  { label: "Full Stack App", icon: Stack },
  { label: "Mobile App", icon: DeviceTablet },
  { label: "Landing Page", icon: Layout },
  { label: "SaaS Dashboard", icon: Globe },
]

// ─── Inner: attachment preview inside PromptInput ────────────────────────────

function HeroAttachmentPreviews() {
  const attachments = usePromptInputAttachments()

  if (attachments.files.length === 0) return null

  return (
    <PromptInputHeader>
      <Attachments variant="inline">
        {attachments.files.map((file) => (
          <Attachment
            key={file.id}
            data={file}
            onRemove={() => attachments.remove(file.id)}
          >
            <AttachmentPreview />
            <AttachmentRemove />
          </Attachment>
        ))}
      </Attachments>
    </PromptInputHeader>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

interface PromptHeroProps {
  className?: string
}

export function PromptHero({ className }: PromptHeroProps) {
  const router = useRouter()
  const { addChatSession, setActiveChatId } = useIdeStore()
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [environment, setEnvironment] = useState<ChatEnvironment>("desktop")

  // Initialize from existing settings store on mount
  useEffect(() => {
    const gh = useSettingsStore.getState().github
    if (gh?.projectId && !activeProjectId) {
      setActiveProjectId(gh.projectId)
    }
  }, [activeProjectId])

  function chatRoute(id: string) {
    return environment === "opencode" ? `/workspace/code-agent/${id}` : `/workspace/desktop/${id}`
  }

  function navigateToChat(id: string, prompt: string) {
    const params = new URLSearchParams({ q: prompt, env: environment })
    if (activeProjectId) {
      params.set("projectId", activeProjectId)
    }
    router.push(`${chatRoute(id)}?${params}`)
  }

  function handleSubmit(
    message: PromptInputMessage,
    _event: SubmitEvent<HTMLFormElement>
  ) {
    if (!message.text.trim()) return

    const id = nanoid()
    addChatSession({
      id,
      title: message.text.slice(0, 60),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      environment,
    })
    setActiveChatId(id)
    navigateToChat(id, message.text)
  }

  function handleSuggestion(suggestion: string) {
    const id = nanoid()
    const prompt = `Build a ${suggestion.toLowerCase()}`
    addChatSession({
      id,
      title: prompt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      environment,
    })
    setActiveChatId(id)
    navigateToChat(id, prompt)
  }

  return (
    <PromptInputProvider>
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-8 px-4",
          className
        )}
      >
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="mb-2"
          initial={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Logomark size={80} variant="pulse" />
        </motion.div>

        {/* ── Hero text ──────────────────────────────────────────── */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2 text-center"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
            Where ideas become <span className="text-primary">reality</span>
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Build fully functional apps and websites through simple
            conversations
          </p>
        </motion.div>

        {/* ── Prompt input ───────────────────────────────────────── */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
          initial={{ opacity: 0, y: 12 }}
          transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
        >
          <PromptInput className="shadow-lg" onSubmit={handleSubmit}>
            <PromptInputTextarea
              className="min-h-[80px] text-sm"
              placeholder="Ask Flowzone to build…"
            />
            <HeroAttachmentPreviews />
            <PromptInputFooter>
              {/* Attachment action menu */}
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                  <PromptInputActionAddScreenshot />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>

              {/* Enviroment selector + Submit */}
              <div className="flex items-center gap-1">
                <EnvironmentSelector
                  value={environment}
                  onChange={setEnvironment}
                />
                <ProjectContextSelector
                  selectedProjectId={activeProjectId}
                  onSelectProject={setActiveProjectId}
                />
                <PromptInputSubmit>
                  <ArrowCircleRight className="size-4" />
                </PromptInputSubmit>
              </div>
            </PromptInputFooter>
          </PromptInput>
        </motion.div>

        {/* ── Quick suggestions ──────────────────────────────────── */}
        <motion.div
          animate={{ opacity: 1 }}
          className="w-full max-w-2xl"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
        >
          <Suggestions className="justify-center">
            {SUGGESTIONS.map(({ label, icon: Icon }) => (
              <Suggestion
                key={label}
                onClick={handleSuggestion}
                suggestion={label}
              >
                <Icon className="mr-1.5 size-3.5" />
                {label}
              </Suggestion>
            ))}
          </Suggestions>
        </motion.div>
      </div>
    </PromptInputProvider>
  )
}
