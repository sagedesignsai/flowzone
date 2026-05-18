import { AppLayout } from "@/components/layout/app-layout";
import { GlobalHeader } from "@/components/layout/global-header";
import { ChatPanel } from "@/components/chat/chat-panel";
import { EditorPanel } from "@/components/editor/editor-panel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { SidebarInset } from "@/components/ui/sidebar";
import { notFound } from "next/navigation";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ChatPageProps) {
  const { id } = await params;
  return {
    title: `Chat ${id} — Flowzone`,
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <AppLayout defaultSidebarOpen={false}>
      <SidebarInset className="overflow-hidden">
        <GlobalHeader breadcrumb="New chat" showViewTabs />

        <ResizablePanelGroup
          className="flex-1 overflow-hidden"
          orientation="horizontal"
        >
          {/* ── Chat ─────────────────────────────────────────────── */}
          <ResizablePanel
            defaultSize={35}
            maxSize={55}
            minSize={24}
          >
            <ChatPanel chatId={id} className="size-full" />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* ── Editor / Preview / Terminal ───────────────────────── */}
          <ResizablePanel defaultSize={65} minSize={30}>
            <EditorPanel className="size-full" />
          </ResizablePanel>
        </ResizablePanelGroup>
      </SidebarInset>
    </AppLayout>
  );
}
