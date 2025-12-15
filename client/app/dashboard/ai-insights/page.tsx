"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { AIInsightsContent } from "@/components/ai-insights-content"
import { AIChatWidget } from "@/components/ai-chat-widget"
import { useAIInsights } from "@/hooks"
import { useIsMobile } from "@/hooks/use-mobile"
import type { AIInsight } from "@/lib/types"

export default function AIInsightsPage() {
  const restaurantId = "rest_1765777607402_t8kmpnz"
  const isMobile = useIsMobile()
  const { data: insightsData } = useAIInsights(restaurantId)
  const [insight, setInsight] = useState<AIInsight | null>(insightsData?.insight || null)

  // Update insight when data changes
  useEffect(() => {
    if (insightsData?.insight) {
      setInsight(insightsData.insight)
    }
  }, [insightsData])

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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isMobile ? (
          // Mobile: Single column with floating chat
          <div className="max-w-4xl mx-auto">
            <AIInsightsContent
              restaurantId={restaurantId}
              insight={insight}
              onInsightUpdate={setInsight}
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
    </div>
  )
}
