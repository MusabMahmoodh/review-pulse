"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QrCode, LogOut, ChevronRight, Settings, Sparkles, BarChart3, MessageSquare, CheckSquare, Users, Tag } from "lucide-react"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { FeedbackList } from "@/components/feedback-list"
import { StatsCards } from "@/components/stats-cards"
import { RatingsChart } from "@/components/ratings-chart"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { useFeedbackList, useFeedbackStats, useAIInsights, useAuth, useOrganizationFeedback, useOrganizationStats, useOrganizationTeachers, useActionableItems } from "@/hooks"
import { useIsMobile } from "@/hooks/use-mobile"
import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const isOrganization = user?.userType === "organization"
  const teacherId = isOrganization ? null : (user?.id || null)
  const organizationId = isOrganization ? user?.id : undefined
  const isMobile = useIsMobile()
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null)

  // Use organization hooks if organization, otherwise teacher hooks
  // For organization, fetch all feedback first (without filter) to show counts in chips
  const { data: orgFeedbackAllData } = useOrganizationFeedback({})
  const { data: orgFeedbackData, isLoading: orgFeedbackLoading } = useOrganizationFeedback({ 
    teacherId: selectedTeacherId === "org" ? undefined : (selectedTeacherId || undefined) 
  })
  const { data: orgStatsData, isLoading: orgStatsLoading } = useOrganizationStats()
  const { data: orgTeachersData, isLoading: orgTeachersLoading } = useOrganizationTeachers()
  const { data: orgActionableItems, isLoading: orgActionableLoading } = useActionableItems(null, undefined, organizationId)
  
  const { data: teacherFeedbackData, isLoading: teacherFeedbackLoading } = useFeedbackList(teacherId)
  const { data: teacherStatsData, isLoading: teacherStatsLoading } = useFeedbackStats(teacherId)
  const { data: insightsData, isLoading: insightsLoading } = useAIInsights(teacherId, undefined, organizationId)
  const { data: teacherActionableItems, isLoading: teacherActionableLoading } = useActionableItems(teacherId)

  // For organization, use filtered feedback, but use all feedback for grouping
  const allFeedback = isOrganization ? (orgFeedbackAllData?.feedback || []) : (teacherFeedbackData?.feedback || [])
  const feedback = isOrganization ? (orgFeedbackData?.feedback || []) : (teacherFeedbackData?.feedback || [])
  
  // Filter feedback based on selectedTeacherId for organization
  const displayFeedback = useMemo(() => {
    if (!isOrganization) return feedback
    if (selectedTeacherId === "org") {
      // Show only organization-level feedback (no teacherId)
      return feedback.filter(item => !item.teacherId && item.organizationId)
    } else if (selectedTeacherId) {
      // Show only selected teacher's feedback
      return feedback.filter(item => item.teacherId === selectedTeacherId)
    }
    // Show all feedback
    return feedback
  }, [feedback, selectedTeacherId, isOrganization])
  
  const stats = isOrganization ? orgStatsData?.stats : teacherStatsData?.stats
  const aiInsight = insightsData?.insight || null
  const actionableItems = isOrganization ? (orgActionableItems?.items || []) : (teacherActionableItems?.items || [])
  const teachers = orgTeachersData?.teachers || []
  
  const loading = isOrganization 
    ? (orgFeedbackLoading || orgStatsLoading || orgTeachersLoading || orgActionableLoading) 
    : (teacherFeedbackLoading || teacherStatsLoading || insightsLoading || teacherActionableLoading)

  // Group feedback by teacher for organization view (using allFeedback for counts)
  const feedbackByTeacher = useMemo(() => {
    if (!isOrganization) return { grouped: {}, orgLevelFeedback: [] }
    const grouped: Record<string, typeof allFeedback> = {}
    const orgLevelFeedback: typeof allFeedback = []
    
    allFeedback.forEach((item) => {
      if (item.teacherId && (item as any).teacher) {
        if (!grouped[item.teacherId]) {
          grouped[item.teacherId] = []
        }
        grouped[item.teacherId].push(item)
      } else if (item.organizationId && !item.teacherId) {
        orgLevelFeedback.push(item)
      }
    })
    
    return { grouped, orgLevelFeedback }
  }, [allFeedback, isOrganization])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Logo width={isMobile ? 32 : 40} height={isMobile ? 32 : 40} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-lg font-semibold leading-none truncate">{user?.name || (isOrganization ? (isMobile ? "Organization" : "Organization Dashboard") : (isMobile ? "Dashboard" : "Teacher Dashboard"))}</h1>
                <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{isOrganization ? "Organization Overview" : "Dashboard Overview"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
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
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-9 w-9 p-0"
                onClick={() => {
                  logout()
                  router.push("/login")
                }}
              >
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
            {/* Teachers Management Card - Only for organizations */}
            {isOrganization && (
              <Link href="/dashboard/teachers" className="block">
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
                            Manage Teachers
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          Add, edit, and manage teachers in your organization
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-green-600 dark:text-green-400 transition-all duration-300 group-hover:translate-x-2 group-hover:scale-110 shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}
            
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

        {/* Organization-specific: Teachers Feedback Chips */}
        {isOrganization && teachers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Feedback by Teacher</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">Click on a teacher to filter their feedback</p>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto -mx-1 px-1 pb-2 sm:overflow-visible sm:mx-0 sm:px-0">
                <div className="flex gap-2 min-w-max sm:min-w-0 sm:flex-wrap">
                  <Badge
                    variant={selectedTeacherId === null ? "default" : "outline"}
                    className="cursor-pointer px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm whitespace-nowrap shrink-0"
                    onClick={() => setSelectedTeacherId(null)}
                  >
                    All ({allFeedback.length})
                  </Badge>
                  {feedbackByTeacher.orgLevelFeedback && feedbackByTeacher.orgLevelFeedback.length > 0 && (
                    <Badge
                      variant={selectedTeacherId === "org" ? "default" : "outline"}
                      className="cursor-pointer px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm whitespace-nowrap shrink-0"
                      onClick={() => setSelectedTeacherId("org")}
                    >
                      Org Level ({feedbackByTeacher.orgLevelFeedback.length})
                    </Badge>
                  )}
                  {teachers.map((teacher) => {
                    const teacherFeedback = feedbackByTeacher.grouped?.[teacher.id] || []
                    return (
                      <Badge
                        key={teacher.id}
                        variant={selectedTeacherId === teacher.id ? "default" : "outline"}
                        className="cursor-pointer px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm whitespace-nowrap shrink-0"
                        onClick={() => setSelectedTeacherId(teacher.id)}
                      >
                        {teacher.name} ({teacherFeedback.length})
                      </Badge>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Organization-specific: AI Insights Preview */}
        {isOrganization && aiInsight && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 min-w-0">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 shrink-0" />
                  <span className="truncate">AI Insights</span>
                </CardTitle>
                <Link href="/dashboard/ai-insights">
                  <Button variant="outline" size="sm" className="shrink-0 text-xs sm:text-sm">View Details</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Summary</p>
                  <p className="text-sm text-muted-foreground">{aiInsight.summary}</p>
                </div>
                {aiInsight.recommendations && aiInsight.recommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Top Recommendations</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {aiInsight.recommendations.slice(0, 3).map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant={aiInsight.sentiment === "positive" ? "default" : aiInsight.sentiment === "negative" ? "destructive" : "secondary"}>
                    {aiInsight.sentiment}
                  </Badge>
                  {aiInsight.keyTopics && aiInsight.keyTopics.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {aiInsight.keyTopics.slice(0, 3).map((topic, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Organization-specific: Actionable Items Preview */}
        {isOrganization && actionableItems.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 min-w-0">
                  <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0" />
                  <span className="truncate">Actionable Items</span>
                </CardTitle>
                <Link href="/dashboard/actionable-items">
                  <Button variant="outline" size="sm" className="shrink-0 text-xs sm:text-sm">View All ({actionableItems.length})</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {actionableItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                      item.completed ? "bg-primary border-primary" : "border-muted-foreground/30"
                    }`}>
                      {item.completed && <CheckSquare className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tags Card */}
        {!isMobile && (
          <Link href="/dashboard/tags" className="block">
            <Card className="group relative overflow-hidden border-2 border-indigo-200/50 dark:border-indigo-800/50 shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:border-indigo-300/70 dark:hover:border-indigo-700/70">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/80 via-violet-100/80 to-purple-100/80 dark:from-indigo-950/80 dark:via-violet-950/80 dark:to-purple-950/80" />
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-200/40 via-transparent to-violet-200/40 dark:from-indigo-800/40 dark:to-violet-800/40" />
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/10" />
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-indigo-500/20 dark:bg-indigo-400/20">
                        <Tag className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="font-bold text-lg text-indigo-900 dark:text-indigo-100">
                        Tags
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      Organize and categorize feedback with tags
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-indigo-600 dark:text-indigo-400 transition-all duration-300 group-hover:translate-x-2 group-hover:scale-110 shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Team Members Card - Hidden on mobile since it's in bottom nav, only for teachers */}
        {!isMobile && !isOrganization && (
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
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Ratings Chart */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <CardTitle className="text-base sm:text-lg">Ratings Overview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-4 md:px-6 pb-4 sm:pb-6">
              <div className="w-full overflow-x-auto -mx-2 px-2">
                <div className="min-w-[280px]">
                  <RatingsChart feedback={displayFeedback} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Feedback */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                  <CardTitle className="text-base sm:text-lg truncate">Recent Feedback</CardTitle>
                </div>
                {feedback.length > 3 && (
                  <Link href="/dashboard/feedback" className="text-xs text-primary hover:underline shrink-0">
                    View all
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <FeedbackList 
                feedback={displayFeedback.slice(0, 3)} 
                loading={loading} 
                compact 
                teacherId={teacherId}
                organizationId={organizationId}
              />
              {displayFeedback.length > 3 && (
                <Link href="/dashboard/feedback">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-t text-center hover:bg-muted/50 transition-colors">
                    <span className="text-xs sm:text-sm font-medium text-primary">View All Feedback</span>
                  </div>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
