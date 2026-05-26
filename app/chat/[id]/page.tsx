import { ChatPageClient } from "./chat-page-client"
import { notFound, redirect } from "next/navigation"
import { loadChat } from "@/lib/chat/store"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

interface ChatPageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ projectId?: string }>
}

export async function generateMetadata({ params }: ChatPageProps) {
  const { id } = await params

  const chat = await prisma.chat.findUnique({
    where: { id },
    select: { title: true },
  })

  return {
    title: chat?.title ? `${chat.title} — Flowzone` : `Chat — Flowzone`,
  }
}

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const { id } = await params
  const { projectId: projectIdFromQuery } = (await searchParams) ?? {}

  if (!id) {
    notFound()
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  const chat = await prisma.chat.findUnique({
    where: { id },
    select: {
      userId: true,
      title: true,
      projectId: true,
      desktopOptOut: true,
    },
  })

  if (chat && chat.userId !== session.user.id) {
    notFound()
  }

  const initialMessages = await loadChat(id)
  const projectId = projectIdFromQuery ?? chat?.projectId ?? undefined

  return (
    <ChatPageClient
      chatId={id}
      initialMessages={initialMessages}
      projectId={projectId}
      title={chat?.title ?? "New chat"}
      desktopOptOut={chat?.desktopOptOut ?? false}
    />
  )
}
