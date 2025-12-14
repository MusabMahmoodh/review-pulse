"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChefHat, QrCode, LogOut, ChevronRight, Settings } from "lucide-react"
import Link from "next/link"
import type { CustomerFeedback, FeedbackStats, AIInsight } from "@/lib/types"
import { FeedbackList } from "@/components/feedback-list"
import { StatsCards } from "@/components/stats-cards"
import { RatingsChart } from "@/components/ratings-chart"
import { ExternalReviews } from "@/components/external-reviews"

export default function DashboardPage() {
  const [feedback, setFeedback] = useState<CustomerFeedback[]>([])
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null)
  const [loading, setLoading] = useState(true)

  const restaurantId = "demo-restaurant-1"

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [feedbackRes, statsRes, insightsRes] = await Promise.all([
          fetch(`/api/feedback/list?restaurantId=${restaurantId}`),
          fetch(`/api/feedback/stats?restaurantId=${restaurantId}`),
          fetch(`/api/ai/insights?restaurantId=${restaurantId}`),
        ])

        const feedbackData = await feedbackRes.json()
        const statsData = await statsRes.json()
        const insightsData = await insightsRes.json()

        setFeedback(feedbackData.feedback)
        setStats(statsData.stats)
        setAiInsight(insightsData.insight)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [restaurantId])

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ChefHat className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-base leading-tight">The Culinary Corner</h1>
                <p className="text-xs text-muted-foreground">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/settings">
                <Button size="sm" variant="ghost" className="h-10 w-10 p-0">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/qr-code">
                <Button size="sm" variant="ghost" className="h-10 w-10 p-0">
                  <QrCode className="h-5 w-5" />
                </Button>
              </Link>
              <Button size="sm" variant="ghost" className="h-10 w-10 p-0">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {stats && <StatsCards stats={stats} />}

        <Card className="overflow-hidden">
          <Link href="/dashboard/ai-insights">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">AI Insights</CardTitle>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Get AI-powered analysis and recommendations</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ratings Overview</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-4">
            <div className="px-6">
              <RatingsChart feedback={feedback} />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <FeedbackList feedback={feedback.slice(0, 3)} loading={loading} compact />
            {feedback.length > 3 && (
              <Link href="/dashboard/feedback">
                <div className="px-6 py-3 border-t text-center">
                  <span className="text-sm text-primary font-medium">View All Feedback</span>
                </div>
              </Link>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">External Reviews</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <ExternalReviews restaurantId={restaurantId} compact />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
