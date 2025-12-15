"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChefHat, QrCode, LogOut, ChevronRight, Settings, Sparkles } from "lucide-react"
import Link from "next/link"
import { FeedbackList } from "@/components/feedback-list"
import { StatsCards } from "@/components/stats-cards"
import { RatingsChart } from "@/components/ratings-chart"
import { ExternalReviews } from "@/components/external-reviews"
import { useFeedbackList, useFeedbackStats, useAIInsights } from "@/hooks"

export default function DashboardPage() {
  const restaurantId = "rest_1765777607402_t8kmpnz"

  const { data: feedbackData, isLoading: feedbackLoading } = useFeedbackList(restaurantId)
  const { data: statsData, isLoading: statsLoading } = useFeedbackStats(restaurantId)
  const { data: insightsData, isLoading: insightsLoading } = useAIInsights(restaurantId)

  const feedback = feedbackData?.feedback || []
  const stats = statsData?.stats || null
  const aiInsight = insightsData?.insight || null
  const loading = feedbackLoading || statsLoading || insightsLoading

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

        <Link href="/dashboard/ai-insights" className="block">
          <div className="group relative overflow-hidden rounded-xl border border-purple-200/50 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-purple-900/30 dark:from-purple-950/50 dark:via-blue-950/50 dark:to-indigo-950/50">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:animate-shimmer" />
            
            {/* Sparkle decoration */}
            <div className="absolute right-4 top-4">
              <Sparkles className="h-6 w-6 text-purple-400/60 transition-all duration-300 group-hover:text-purple-500 group-hover:scale-110 dark:text-purple-500/60 dark:group-hover:text-purple-400" />
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">AI Insights</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Powered by advanced AI</p>
                </div>
                <ChevronRight className="h-5 w-5 text-purple-500 transition-transform duration-300 group-hover:translate-x-1 dark:text-purple-400" />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Get AI-powered analysis and actionable recommendations to improve your restaurant
              </p>
            </div>
          </div>
        </Link>

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
