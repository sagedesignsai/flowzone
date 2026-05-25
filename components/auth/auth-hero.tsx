"use client"

import { Logomark } from "@/components/brand/logomark"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { Users, Sparkle, ShieldCheck } from "@phosphor-icons/react"

interface AuthHeroProps {
  className?: string
}

export function AuthHero({ className }: AuthHeroProps) {
  return (
    <div
      className={cn(
        "relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-12 text-white lg:flex",
        className
      )}
    >
      {/* ── Background Effects ───────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* ── Header ───────────────────────────────────────────── */}
      <motion.div
        className="relative z-10 flex items-center gap-2.5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 backdrop-blur-sm">
          <Logomark size={24} variant="pulse" />
        </div>
        <span className="text-xl font-bold tracking-tight">Flowzone</span>
      </motion.div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="relative z-10 max-w-lg space-y-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "circOut" }}
        >
          <h1 className="text-5xl leading-[1.1] font-semibold tracking-tight">
            Step into the <br />
            <span className="text-primary italic">Flow State</span>
          </h1>
          <p className="mt-6 text-lg tracking-wide text-zinc-400">
            Build production-ready applications through natural conversations
            with our advanced AI development agents.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-6 pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          <FeatureItem
            icon={Sparkle}
            title="AI-Powered Context"
            description="Deep understanding of your codebase and requirements."
          />
          <FeatureItem
            icon={ShieldCheck}
            title="Secure Sandboxes"
            description="Run and test code safely in isolated E2B cloud environments."
          />
          <FeatureItem
            icon={Users}
            title="Community Driven"
            description="Join 10k+ developers building the future of software."
          />
        </motion.div>
      </div>

      {/* ── Footer / Social Proof ────────────────────────────── */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-center gap-4 text-xs font-medium tracking-widest text-zinc-500 uppercase">
          <div className="h-px w-8 bg-zinc-800" />
          <span>Trust by the modern web</span>
          <div className="h-px w-8 bg-zinc-800" />
        </div>
      </motion.div>
    </div>
  )
}

function FeatureItem({
  icon: Icon,
  title,
  description,
}: {
  icon: any
  title: string
  description: string
}) {
  return (
    <div className="group flex items-start gap-4 transition-colors hover:text-white">
      <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 ring-1 ring-zinc-800 transition-colors group-hover:bg-primary/20 group-hover:ring-primary/40">
        <Icon className="size-3.5 text-zinc-300 transition-colors group-hover:text-primary" />
      </div>
      <div>
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-sm leading-relaxed text-zinc-500">{description}</p>
      </div>
    </div>
  )
}
