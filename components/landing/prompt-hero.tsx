"use client";

import {
  PromptInput,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputActionMenuTrigger,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputActionAddScreenshot,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { useIdeStore } from "@/hooks/use-ide-store";
import { cn } from "@/lib/utils";
import {
  ArrowCircleRight,
  DeviceTablet,
  Globe,
  Layout,
  Sparkle,
  Stack,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

// ─── Quick-start suggestions ─────────────────────────────────────────────────

const SUGGESTIONS = [
  { label: "Full Stack App",  icon: Stack        },
  { label: "Mobile App",     icon: DeviceTablet  },
  { label: "Landing Page",   icon: Layout        },
  { label: "SaaS Dashboard", icon: Globe         },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface PromptHeroProps {
  className?: string;
}

export function PromptHero({ className }: PromptHeroProps) {
  const router = useRouter();
  const { addChatSession, setActiveChatId } = useIdeStore();

  function handleSubmit(
    message: PromptInputMessage,
    _event: FormEvent<HTMLFormElement>
  ) {
    if (!message.text.trim()) return;

    const id = nanoid();
    addChatSession({
      id,
      title: message.text.slice(0, 60),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setActiveChatId(id);
    // Pass prompt as query param so ChatPanel auto-sends it
    router.push(`/chat/${id}?q=${encodeURIComponent(message.text)}`);
  }

  function handleSuggestion(suggestion: string) {
    const id = nanoid()
    const prompt = `Build a ${suggestion.toLowerCase()}`
    addChatSession({
      id,
      title: prompt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    setActiveChatId(id)
    router.push(`/chat/${id}?q=${encodeURIComponent(prompt)}`)
  }

  return (
    <PromptInputProvider>
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-8 px-4",
          className
        )}
      >
        {/* ── Hero text ──────────────────────────────────────────── */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2 text-center"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Where ideas become{" "}
            <span className="text-primary">reality</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
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
            <PromptInputFooter>
              {/* Attachment action menu */}
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                  <PromptInputActionAddScreenshot />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>

              {/* Submit */}
              <PromptInputSubmit>
                <ArrowCircleRight className="size-4" />
              </PromptInputSubmit>
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
  );
}
