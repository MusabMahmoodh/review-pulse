"use client"

import { AIChatWidget } from "@/components/ai-chat-widget"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useAuth } from "@/hooks/use-auth"
import { useIsMobile } from "@/hooks/use-mobile"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ChatPage() {
  const { user, isLoading: authLoading } = useAuth()
  const restaurantId = user?.id || null
  const isMobile = useIsMobile()

  // Show loading state while authenticating
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!restaurantId) {
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    return null
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-200 flex flex-col",
        !isMobile && "ml-64"
      )}>
        {isMobile ? (
          // Mobile: Full page chat
          <div className="flex-1 flex flex-col pb-20">
            <div className="border-b px-4 py-3 flex-shrink-0">
              <h1 className="text-xl font-bold">AI Chat</h1>
              <p className="text-muted-foreground text-xs mt-1">
                Ask questions about your feedback and get AI-powered insights
              </p>
            </div>
            <div className="flex-1 min-h-0">
              <AIChatWidget restaurantId={restaurantId} isMobile={true} fullPage={true} />
            </div>
          </div>
        ) : (
          // Desktop: Fixed full-height chat
          <div className="flex-1 flex flex-col min-h-0">
            <div className="border-b px-6 py-4 flex-shrink-0">
              <h1 className="text-2xl font-bold">AI Chat</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Ask questions about your feedback and get AI-powered insights
              </p>
            </div>
            <div className="flex-1 min-h-0 p-6">
              <AIChatWidget restaurantId={restaurantId} fullPage={true} />
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}

