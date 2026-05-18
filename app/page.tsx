import { AppLayout } from "@/components/layout/app-layout";
import { GlobalHeader } from "@/components/layout/global-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { PromptHero } from "@/components/landing/prompt-hero";

export const metadata = {
  title: "Flowzone — Where ideas become reality",
  description:
    "Build fully functional apps and websites through simple conversations with AI.",
};

export default function LandingPage() {
  return (
    <AppLayout defaultSidebarOpen={false}>
      <SidebarInset>
        <GlobalHeader />
        <main className="flex flex-1 overflow-hidden">
          <PromptHero />
        </main>
      </SidebarInset>
    </AppLayout>
  );
}
