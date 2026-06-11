import { DesktopPageClient } from "@/components/workspace/desktop/desktop-page-client"
import { notFound } from "next/navigation"
import { loadChat } from "@/lib/chat/store"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

interface DesktopPageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ projectId?: string }>
}

export async function generateMetadata({ params }: DesktopPageProps) {
  const { id } = await params

  const chat = await prisma.chat.findUnique({
    where: { id },
    select: { title: true },
  })

  return {
    title: chat?.title ? `${chat.title} — Flowzone` : `Desktop — Flowzone`,
  }
}

export default async function DesktopPage({
  params,
  searchParams,
}: DesktopPageProps) {
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
      desktopOptOut: true,
    },
  })

  if (chat && chat.userId !== session?.user.id) {
    notFound()
  }

  const initialMessages = await loadChat(id)
  const projectId = projectIdFromQuery ?? chat?.projectId ?? undefined

  return (
    <DesktopPageClient
      chatId={id}
      initialMessages={initialMessages}
      projectId={projectId}
      title={chat?.title ?? "New chat"}
      desktopOptOut={chat?.desktopOptOut ?? false}
    />
  )
}
