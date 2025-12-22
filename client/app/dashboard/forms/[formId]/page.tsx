"use client"

import { useAuth, useForms, useFeedbackList, useFeedbackStats } from "@/hooks"
import { useRouter, useParams } from "next/navigation"
import { useMemo } from "react"
import { ArrowLeft, MessageSquare, BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { FeedbackList } from "@/components/feedback-list"
import { RatingsChart } from "@/components/ratings-chart"

export default function FormDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const formId = params.formId as string
  const isMobile = useIsMobile()
  const isOrganization = user?.userType === "organization"
  const teacherId = isOrganization ? null : (user?.id || null)
  const organizationId = isOrganization ? user?.id : undefined

  const { data: formsData } = useForms({
    teacherId: teacherId || undefined,
    organizationId: organizationId,
  })

  const form = formsData?.forms?.find(f => f.id === formId)

  // Get feedback for this form
  const { data: feedbackData, isLoading: feedbackLoading } = useFeedbackList(teacherId, null, null, formId)
  const { data: statsData, isLoading: statsLoading } = useFeedbackStats(teacherId)

  // Use feedback directly (already filtered by formId)
  const formFeedback = feedbackData?.feedback || []

  // Calculate stats for this form
  const formStats = useMemo(() => {
    if (formFeedback.length === 0) {
      return {
        totalFeedback: 0,
        averageRatings: {
          teaching: 0,
          communication: 0,
          material: 0,
          overall: 0,
        },
        recentTrend: "stable" as const,
      }
    }

    const total = formFeedback.length
    const avgTeaching = formFeedback.reduce((sum, f) => sum + f.teachingRating, 0) / total
    const avgCommunication = formFeedback.reduce((sum, f) => sum + f.communicationRating, 0) / total
    const avgMaterial = formFeedback.reduce((sum, f) => sum + f.materialRating, 0) / total
    const avgOverall = formFeedback.reduce((sum, f) => sum + f.overallRating, 0) / total

    // Calculate trend (compare last 7 days vs previous 7 days)
    const now = new Date()
    const last7Days = formFeedback.filter(f => {
      const date = new Date(f.createdAt)
      return date >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    })
    const previous7Days = formFeedback.filter(f => {
      const date = new Date(f.createdAt)
      return date >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) &&
             date < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    })

    const last7Avg = last7Days.length > 0
      ? last7Days.reduce((sum, f) => sum + f.overallRating, 0) / last7Days.length
      : 0
    const prev7Avg = previous7Days.length > 0
      ? previous7Days.reduce((sum, f) => sum + f.overallRating, 0) / previous7Days.length
      : 0

    let trend: "improving" | "stable" | "declining" = "stable"
    if (last7Avg > prev7Avg + 0.2) trend = "improving"
    else if (last7Avg < prev7Avg - 0.2) trend = "declining"

    return {
      totalFeedback: total,
      averageRatings: {
        teaching: Math.round(avgTeaching * 100) / 100,
        communication: Math.round(avgCommunication * 100) / 100,
        material: Math.round(avgMaterial * 100) / 100,
        overall: Math.round(avgOverall * 100) / 100,
      },
      recentTrend: trend,
    }
  }, [formFeedback])

  if (!form) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#111b21] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#667781] dark:text-[#8696a0] mb-4">Form not found</p>
          <Button onClick={() => router.push("/dashboard")}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#111b21]">
      {/* Header - WhatsApp style */}
      <header className="sticky top-0 z-50 bg-[#008069] dark:bg-[#202c33] border-b border-[#008069]/20">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-white hover:bg-white/10"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold text-white truncate">
                {form.name}
              </h1>
              {form.description && (
                <p className="text-xs text-white/80 truncate">
                  {form.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6 pb-24">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white dark:bg-[#202c33] border-[#e9edef] dark:border-[#313d45]">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#111b21] dark:text-[#e9edef]">
                  {formStats.totalFeedback}
                </p>
                <p className="text-xs text-[#667781] dark:text-[#8696a0] mt-1">
                  Total Feedback
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-[#202c33] border-[#e9edef] dark:border-[#313d45]">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  {formStats.recentTrend === "improving" && (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  )}
                  {formStats.recentTrend === "declining" && (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  {formStats.recentTrend === "stable" && (
                    <Minus className="h-4 w-4 text-gray-500" />
                  )}
                  <p className="text-2xl font-bold text-[#111b21] dark:text-[#e9edef]">
                    {formStats.averageRatings.overall.toFixed(1)}
                  </p>
                </div>
                <p className="text-xs text-[#667781] dark:text-[#8696a0] mt-1">
                  Avg Rating
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ratings Breakdown */}
        <Card className="bg-white dark:bg-[#202c33] border-[#e9edef] dark:border-[#313d45]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Ratings Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#667781] dark:text-[#8696a0]">Teaching</span>
                  <span className="font-medium text-[#111b21] dark:text-[#e9edef]">
                    {formStats.averageRatings.teaching.toFixed(1)}
                  </span>
                </div>
                <div className="h-2 bg-[#e9edef] dark:bg-[#313d45] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#008069] rounded-full"
                    style={{ width: `${(formStats.averageRatings.teaching / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#667781] dark:text-[#8696a0]">Communication</span>
                  <span className="font-medium text-[#111b21] dark:text-[#e9edef]">
                    {formStats.averageRatings.communication.toFixed(1)}
                  </span>
                </div>
                <div className="h-2 bg-[#e9edef] dark:bg-[#313d45] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#008069] rounded-full"
                    style={{ width: `${(formStats.averageRatings.communication / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#667781] dark:text-[#8696a0]">Materials</span>
                  <span className="font-medium text-[#111b21] dark:text-[#e9edef]">
                    {formStats.averageRatings.material.toFixed(1)}
                  </span>
                </div>
                <div className="h-2 bg-[#e9edef] dark:bg-[#313d45] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#008069] rounded-full"
                    style={{ width: `${(formStats.averageRatings.material / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#667781] dark:text-[#8696a0]">Overall</span>
                  <span className="font-medium text-[#111b21] dark:text-[#e9edef]">
                    {formStats.averageRatings.overall.toFixed(1)}
                  </span>
                </div>
                <div className="h-2 bg-[#e9edef] dark:bg-[#313d45] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#008069] rounded-full"
                    style={{ width: `${(formStats.averageRatings.overall / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        {form.tags && form.tags.length > 0 && (
          <Card className="bg-white dark:bg-[#202c33] border-[#e9edef] dark:border-[#313d45]">
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {form.tags.map((formTag) => (
                  <Badge
                    key={formTag.id}
                    variant="outline"
                    style={{
                      borderColor: formTag.tag.color || undefined,
                      color: formTag.tag.color || undefined,
                    }}
                  >
                    {formTag.tag.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chart */}
        {formFeedback.length > 0 && (
          <Card className="bg-white dark:bg-[#202c33] border-[#e9edef] dark:border-[#313d45]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Ratings Chart
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RatingsChart feedback={formFeedback} />
            </CardContent>
          </Card>
        )}

        {/* Feedback List */}
        <Card className="bg-white dark:bg-[#202c33] border-[#e9edef] dark:border-[#313d45]">
          <CardHeader>
            <CardTitle className="text-base">Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <FeedbackList
              feedback={formFeedback.slice(0, 10)}
              loading={feedbackLoading}
              compact
              teacherId={teacherId}
              organizationId={organizationId}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

