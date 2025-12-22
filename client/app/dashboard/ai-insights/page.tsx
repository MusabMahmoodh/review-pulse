"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { AIInsightsContent } from "@/components/ai-insights-content"
import { AIChatWidget } from "@/components/ai-chat-widget"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { useAIInsights, useAuth } from "@/hooks"
import { useIsMobile } from "@/hooks/use-mobile"
import type { AIInsight } from "@/lib/types"

export default function AIInsightsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const restaurantId = user?.id || null
  const isMobile = useIsMobile()
  // Get global insights (formId = null/undefined for overall performance)
  const { data: insightsData } = useAIInsights(restaurantId, undefined, undefined, undefined)
  
  // Convert API response to AIInsight type (generatedAt is string from API, needs to be Date)
  const convertInsight = (apiInsight: any): AIInsight | null => {
    if (!apiInsight) return null
    return {
      ...apiInsight,
      generatedAt: new Date(apiInsight.generatedAt)
    }
  }
  
  const [insight, setInsight] = useState<AIInsight | null>(
    insightsData?.insight ? convertInsight(insightsData.insight) : null
  )

  // Update insight when data changes
  useEffect(() => {
    if (insightsData?.insight) {
      setInsight(convertInsight(insightsData.insight))
    }
  }, [insightsData])

  // Show loading state while authenticating
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            <Link href="/dashboard">
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="font-bold text-lg leading-tight">AI Insights</h1>
              <p className="text-xs text-muted-foreground">Smart analysis & recommendations</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        {isMobile ? (
          // Mobile: Single column with floating chat
          <div className="max-w-4xl mx-auto">
            <AIInsightsContent
              restaurantId={restaurantId}
              insight={insight}
              onInsightUpdate={setInsight}
              formId={undefined} // Global insights (overall performance)
            />
            <AIChatWidget restaurantId={restaurantId} isMobile={true} />
          </div>
        ) : (
          // Desktop: Two column layout
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Left Column: Insights Content */}
            <div className="lg:col-span-2 space-y-6">
              <AIInsightsContent
                restaurantId={restaurantId}
                insight={insight}
                onInsightUpdate={setInsight}
              />
            </div>

            {/* Right Column: Chat Widget */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 h-[calc(100vh-8rem)]">
                <AIChatWidget restaurantId={restaurantId} />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
