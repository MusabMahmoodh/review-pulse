"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
        "flex-1 transition-all duration-200",
        !isMobile && "ml-64"
      )}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">AI Chat</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Ask questions about your feedback and get AI-powered insights
              </p>
            </div>

            {isMobile ? (
              // Mobile: Floating button (handled by AIChatWidget)
              <AIChatWidget restaurantId={restaurantId} isMobile={true} />
            ) : (
              // Desktop: Full chat interface
              <Card>
                <CardHeader>
                  <CardTitle>Chat with AI Assistant</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[calc(100vh-16rem)]">
                    <AIChatWidget restaurantId={restaurantId} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}

