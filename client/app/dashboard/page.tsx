"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QrCode, LogOut, ChevronRight, Settings, Sparkles, BarChart3, MessageSquare, Star, CheckSquare, Users } from "lucide-react"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { FeedbackList } from "@/components/feedback-list"
import { StatsCards } from "@/components/stats-cards"
import { RatingsChart } from "@/components/ratings-chart"
import { ExternalReviews } from "@/components/external-reviews"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { useFeedbackList, useFeedbackStats, useAIInsights } from "@/hooks"
import { useIsMobile } from "@/hooks/use-mobile"

export default function DashboardPage() {
  const restaurantId = "rest_1765777607402_t8kmpnz"
  const isMobile = useIsMobile()

  const { data: feedbackData, isLoading: feedbackLoading } = useFeedbackList(restaurantId)
  const { data: statsData, isLoading: statsLoading } = useFeedbackStats(restaurantId)
  const { data: insightsData, isLoading: insightsLoading } = useAIInsights(restaurantId)

  const feedback = feedbackData?.feedback || []
  const stats = statsData?.stats || null
  const aiInsight = insightsData?.insight || null
  const loading = feedbackLoading || statsLoading || insightsLoading

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo width={40} height={40} />
              <div>
                <h1 className="text-lg font-semibold leading-none">The Culinary Corner</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Dashboard Overview</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/dashboard/settings">
                <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/qr-code">
                <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                  <QrCode className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-6">
        {/* Stats Cards */}
        {stats && (
          <div className="w-full overflow-hidden">
            <StatsCards stats={stats} />
          </div>
        )}

        {/* Quick Actions - Hidden on mobile since these are in bottom nav */}
        {!isMobile && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* AI Insights Card */}
            <Link href="/dashboard/ai-insights" className="block">
            <Card className="group relative overflow-hidden border-2 border-purple-200/50 dark:border-purple-800/50 shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:border-purple-300/70 dark:hover:border-purple-700/70">
            {/* Main highlighted gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100/80 via-pink-100/80 via-blue-100/60 to-indigo-100/80 dark:from-purple-950/80 dark:via-pink-950/80 dark:via-blue-950/60 dark:to-indigo-950/80 animate-gradient-shift" />
            
            {/* Secondary gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-200/40 via-transparent to-pink-200/40 dark:from-purple-800/40 dark:to-pink-800/40" />
            
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/10" />
            
            {/* Floating particles/glow effects - more prominent */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-400/40 dark:bg-purple-600/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0s' }} />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-400/40 dark:bg-pink-600/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-indigo-400/30 dark:bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
            
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-4">
                {/* Animated icon container */}
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 opacity-75 animate-pulse" />
                  <Sparkles className="h-7 w-7 text-white relative z-10 animate-spin-slow" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 dark:from-purple-400 dark:via-pink-400 dark:to-indigo-400 bg-clip-text text-transparent">
                      AI-Powered Insights
                    </h3>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-300 border border-purple-300/50 dark:border-purple-500/50">
                      NEW
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Get intelligent analysis and actionable recommendations
                  </p>
                </div>
                
                <ChevronRight className="h-5 w-5 text-purple-600 dark:text-purple-400 transition-all duration-300 group-hover:translate-x-2 group-hover:scale-110 shrink-0" />
              </div>
            </CardContent>
          </Card>
          </Link>

          {/* Actionable Items Card */}
          <Link href="/dashboard/actionable-items" className="block">
            <Card className="group relative overflow-hidden border-2 border-blue-200/50 dark:border-blue-800/50 shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:border-blue-300/70 dark:hover:border-blue-700/70">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/80 via-cyan-100/80 to-indigo-100/80 dark:from-blue-950/80 dark:via-cyan-950/80 dark:to-indigo-950/80" />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-200/40 via-transparent to-cyan-200/40 dark:from-blue-800/40 dark:to-cyan-800/40" />
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/10" />
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-blue-500/20 dark:bg-blue-400/20">
                        <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-bold text-lg text-blue-900 dark:text-blue-100">
                        Actionable Items
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      Track and manage improvement tasks
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-blue-600 dark:text-blue-400 transition-all duration-300 group-hover:translate-x-2 group-hover:scale-110 shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
          </div>
        )}

        {/* Team Members Card - Hidden on mobile since it's in bottom nav */}
        {!isMobile && (
          <Link href="/dashboard/team-members" className="block">
            <Card className="group relative overflow-hidden border-2 border-green-200/50 dark:border-green-800/50 shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:border-green-300/70 dark:hover:border-green-700/70">
              <div className="absolute inset-0 bg-gradient-to-br from-green-100/80 via-emerald-100/80 to-teal-100/80 dark:from-green-950/80 dark:via-emerald-950/80 dark:to-teal-950/80" />
              <div className="absolute inset-0 bg-gradient-to-tr from-green-200/40 via-transparent to-emerald-200/40 dark:from-green-800/40 dark:to-emerald-800/40" />
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/10" />
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-green-500/20 dark:bg-green-400/20">
                        <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="font-bold text-lg text-green-900 dark:text-green-100">
                        Team Members
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      Manage your team and assign tasks
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-green-600 dark:text-green-400 transition-all duration-300 group-hover:translate-x-2 group-hover:scale-110 shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Charts and Analytics Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Ratings Chart */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Ratings Overview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-6">
              <div className="w-full overflow-x-auto -mx-2 px-2">
                <div className="min-w-[280px]">
                  <RatingsChart feedback={feedback} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Feedback */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Recent Feedback</CardTitle>
                </div>
                {feedback.length > 3 && (
                  <Link href="/dashboard/feedback" className="text-xs text-primary hover:underline">
                    View all
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <FeedbackList feedback={feedback.slice(0, 3)} loading={loading} compact restaurantId={restaurantId} />
              {feedback.length > 3 && (
                <Link href="/dashboard/feedback">
                  <div className="px-6 py-4 border-t text-center hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium text-primary">View All Feedback</span>
                  </div>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* External Reviews */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">External Reviews</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <ExternalReviews restaurantId={restaurantId} compact />
          </CardContent>
        </Card>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
