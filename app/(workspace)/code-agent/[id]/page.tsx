import { CodeAgentPageClient } from "@/components/workspace/code-agent/code-agent-client"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { loadChat } from "@/lib/chat/store"

interface CodeAgentPageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ projectId?: string }>
}

export async function generateMetadata({ params }: CodeAgentPageProps) {
  const { id } = await params

  const chat = await prisma.chat.findUnique({
    where: { id },
    select: { title: true },
  })

  return {
    title: chat?.title
      ? `${chat.title} — Flowzone (Code Agent)`
      : `Code Agent — Flowzone`,
  }
}

export default async function CodeAgentPage({
  params,
  searchParams,
}: CodeAgentPageProps) {
  const { id } = await params
  const { projectId: projectIdFromQuery } = (await searchParams) ?? {}

  if (!id) {
    notFound()
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const chat = await prisma.chat.findUnique({
    where: { id },
    select: {
      userId: true,
      title: true,
      projectId: true,
    },
  })

  if (chat && chat.userId !== session?.user.id) {
    notFound()
  }

  const initialMessages = await loadChat(id)
  const projectId = projectIdFromQuery ?? chat?.projectId ?? undefined

  return (
    <CodeAgentPageClient
      chatId={id}
      initialMessages={initialMessages}
      projectId={projectId}
      title={chat?.title ?? "New chat"}
    />
  )
}
