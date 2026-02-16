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

  const quickActions = [
    {
      href: "/dashboard/ai-insights",
      title: "AI Insights",
      description: aiInsight ? "Latest AI summary is available" : "Generate smart trends and recommendations",
      icon: Sparkles,
    },
    {
      href: "/dashboard/actionable-items",
      title: "Actionable Items",
      description: "Track and prioritize improvement tasks",
      icon: CheckSquare,
    },
    {
      href: "/dashboard/team-members",
      title: "Team Members",
      description: "Manage staff access and accountability",
      icon: Users,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo width={32} height={32} />
            <div>
              <p className="text-sm font-semibold leading-none text-foreground">The Culinary Corner</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/dashboard/settings">
              <Button size="icon-sm" variant="ghost">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/qr-code">
              <Button size="icon-sm" variant="ghost">
                <QrCode className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="icon-sm" variant="ghost">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 pb-24 sm:px-6 md:pb-8">
        {stats && (
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Performance Snapshot</h2>
              <p className="text-sm text-muted-foreground">Key metrics for the current period</p>
            </div>
            <StatsCards stats={stats} />
          </section>
        )}

        {!isMobile && (
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Quick Actions</h2>
              <p className="text-sm text-muted-foreground">Jump to common workflows</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {quickActions.map((item) => {
                const ActionIcon = item.icon
                return (
                  <Link key={item.href} href={item.href} className="group block">
                    <div className="flex h-full items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <ActionIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-medium">Ratings Overview</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <div className="min-w-[280px]">
                  <RatingsChart feedback={feedback} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base font-medium">Recent Feedback</CardTitle>
                </div>
                {feedback.length > 3 && (
                  <Link href="/dashboard/feedback" className="text-xs font-medium text-primary hover:underline">
                    View all
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <FeedbackList feedback={feedback.slice(0, 3)} loading={loading} compact restaurantId={restaurantId} />
              {feedback.length > 3 && (
                <Link href="/dashboard/feedback">
                  <div className="border-t border-border px-5 py-3 text-center transition-colors hover:bg-muted">
                    <span className="text-sm font-medium text-primary">View All Feedback</span>
                  </div>
                </Link>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-medium">External Reviews</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ExternalReviews restaurantId={restaurantId} compact />
            </CardContent>
          </Card>
        </section>
      </main>

      <MobileBottomNav />
    </div>
  )
}
