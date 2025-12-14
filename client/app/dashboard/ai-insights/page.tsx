"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import type { AIInsight } from "@/lib/types"
import { AIInsightsNew } from "@/components/ai-insights-new"

export default function AIInsightsPage() {
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null)
  const [loading, setLoading] = useState(true)
  const restaurantId = "demo-restaurant-1"

  useEffect(() => {
    const fetchData = async () => {
      try {
        const insightsRes = await fetch(`/api/ai/insights?restaurantId=${restaurantId}`)
        const insightsData = await insightsRes.json()
        setAiInsight(insightsData.insight)
      } catch (error) {
        console.error("Error fetching AI insights:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [restaurantId])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button size="sm" variant="ghost" className="h-10 w-10 p-0">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-base leading-tight">AI Insights</h1>
              <p className="text-xs text-muted-foreground">Smart analysis & recommendations</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        <AIInsightsNew restaurantId={restaurantId} initialInsight={aiInsight} />
      </div>
    </div>
  )
}
