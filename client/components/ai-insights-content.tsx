"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PremiumUpgrade } from "@/components/premium-upgrade"
import { useAuth } from "@/hooks/use-auth"
import { isPremiumFromAuth } from "@/lib/premium"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Users,
  Loader2,
  Calendar,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  Target,
  BarChart3,
  Clock,
  AlertCircle,
  Wand2,
} from "lucide-react"
import type { AIInsight } from "@/lib/types"
import { useToast } from "@/hooks/use-toast-simple"
import { useGenerateInsights, useFeedbackStats } from "@/hooks"
import type { TimePeriod } from "@/lib/api-client"
import { ConvertToActionable } from "@/components/convert-to-actionable"

interface AIInsightsContentProps {
  restaurantId: string
  insight: AIInsight | null
  onInsightUpdate: (insight: AIInsight) => void
}

const TIME_PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: "2days", label: "Last 2 Days" },
  { value: "week", label: "Last Week" },
  { value: "month", label: "Last Month" },
  { value: "2months", label: "Last 2 Months" },
  { value: "3months", label: "Last 3 Months" },
  { value: "4months", label: "Last 4 Months" },
  { value: "5months", label: "Last 5 Months" },
  { value: "6months", label: "Last 6 Months" },
]

export function AIInsightsContent({ restaurantId, insight, onInsightUpdate }: AIInsightsContentProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month")
  const [filter, setFilter] = useState<"external" | "internal" | "overall">("overall")
  const [premiumError, setPremiumError] = useState(false)
  const generateInsightsMutation = useGenerateInsights()
  const { data: statsData } = useFeedbackStats(restaurantId)

  const stats = statsData?.stats
  const hasPremium = isPremiumFromAuth(user?.subscription)

  const generateInsights = () => {
    generateInsightsMutation.mutate(
      { restaurantId, timePeriod, filter },
      {
        onSuccess: (data) => {
          // Convert API response to AIInsight type (generatedAt is string from API, needs to be Date)
          if (data.insight) {
            const convertedInsight: AIInsight = {
              ...data.insight,
              generatedAt: new Date(data.insight.generatedAt)
            }
            onInsightUpdate(convertedInsight)
          }
          toast({
            title: "Insights Generated",
            description: `AI has analyzed your feedback for ${TIME_PERIOD_OPTIONS.find((opt) => opt.value === timePeriod)?.label.toLowerCase()}`,
          })
        },
        onError: (error: any) => {
          if (error?.data?.requiresPremium || error?.requiresPremium) {
            setPremiumError(true)
            toast({
              title: "Premium Required",
              description: "AI features require a premium subscription. Please contact admin to upgrade.",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Error",
              description: error?.data?.error || "Failed to generate insights",
              variant: "destructive",
            })
          }
        },
      }
    )
  }

  // Calculate critical issues and warnings
  const criticalIssues = (() => {
    if (!insight || !stats) return []
    
    const issues: Array<{ 
      title: string
      description: string
      priority: "critical" | "high" | "medium"
      category: string
    }> = []

    const ratings = stats.averageRatings
    
    // Skip rating-based warnings if there's no internal feedback (ratings are from external reviews only)
    // Only show these warnings when we have actual internal feedback data
    const hasInternalFeedback = stats.totalFeedback > 0
    
    // Check for low ratings (below 3.5) - only if we have internal feedback
    if (hasInternalFeedback && ratings.food < 3.5) {
      issues.push({
        title: "Food Quality Concerns",
        description: `Food rating is ${ratings.food.toFixed(1)}/5.0 - significantly below acceptable standards. This is a critical operational issue that needs immediate attention.`,
        priority: "critical",
        category: "Food Quality"
      })
    }
    
    if (hasInternalFeedback && ratings.staff < 3.5) {
      issues.push({
        title: "Staff Service Issues",
        description: `Staff service rating is ${ratings.staff.toFixed(1)}/5.0 - customer service quality is below expectations.`,
        priority: "critical",
        category: "Service"
      })
    }
    
    if (hasInternalFeedback && ratings.ambience < 3.5) {
      issues.push({
        title: "Ambience Problems",
        description: `Ambience rating is ${ratings.ambience.toFixed(1)}/5.0 - dining environment needs improvement.`,
        priority: "high",
        category: "Ambience"
      })
    }
    
    // Check for declining trend - only if we have internal feedback
    if (hasInternalFeedback && stats.recentTrend === "declining") {
      issues.push({
        title: "Declining Customer Satisfaction",
        description: "Recent feedback shows a declining trend in customer satisfaction. Immediate action required to reverse this trend.",
        priority: "critical",
        category: "Overall Performance"
      })
    }
    
    // Check for negative sentiment (this applies to both internal and external reviews)
    if (insight.sentiment === "negative") {
      issues.push({
        title: "Negative Customer Sentiment",
        description: "Overall customer sentiment is negative. Critical issues need to be addressed to improve customer experience.",
        priority: "critical",
        category: "Customer Satisfaction"
      })
    }
    
    // Check overall rating - only if we have internal feedback
    if (hasInternalFeedback && ratings.overall < 3.5) {
      issues.push({
        title: "Low Overall Rating",
        description: `Overall rating is ${ratings.overall.toFixed(1)}/5.0 - this impacts your restaurant's reputation and customer retention.`,
        priority: "critical",
        category: "Overall Performance"
      })
    }
    
    return issues
  })()

  // Calculate key strengths
  const keyStrengths = (() => {
    if (!insight || !stats) return []
    
    const strengths: Array<{ 
      title: string
      description: string
      rating?: number
    }> = []

    const ratings = stats.averageRatings
    
    // Find strengths (ratings above 4.0)
    if (ratings.food >= 4.0) {
      strengths.push({
        title: "Excellent Food Quality",
        description: `Food quality is highly rated at ${ratings.food.toFixed(1)}/5.0. This is a key strength to maintain and leverage.`,
        rating: ratings.food
      })
    }
    
    if (ratings.staff >= 4.0) {
      strengths.push({
        title: "Outstanding Service",
        description: `Staff service is excellent at ${ratings.staff.toFixed(1)}/5.0. Your team is delivering great customer experiences.`,
        rating: ratings.staff
      })
    }
    
    if (ratings.ambience >= 4.0) {
      strengths.push({
        title: "Great Ambience",
        description: `Ambience is well-received at ${ratings.ambience.toFixed(1)}/5.0. The dining environment is appreciated by customers.`,
        rating: ratings.ambience
      })
    }
    
    if (stats.recentTrend === "improving") {
      strengths.push({
        title: "Improving Trend",
        description: "Customer satisfaction is improving. Your recent efforts are paying off.",
      })
    }
    
    if (insight.sentiment === "positive") {
      strengths.push({
        title: "Positive Customer Sentiment",
        description: "Overall customer sentiment is positive. Keep up the great work!",
      })
    }
    
    return strengths
  })()

  // Identify unaddressed concerns
  const unaddressedConcerns = (() => {
    if (!insight || !stats) return []
    
    const concerns: Array<{ 
      concern: string
      impact: string
    }> = []

    const ratings = stats.averageRatings
    
    // Identify areas that are mentioned but have low ratings
    if (insight.keyTopics.length > 0) {
      const lowRatedTopics: string[] = []
      
      // Check if key topics relate to low-rated areas
      insight.keyTopics.forEach(topic => {
        const lowerTopic = topic.toLowerCase()
        if ((lowerTopic.includes("food") || lowerTopic.includes("menu") || lowerTopic.includes("taste")) && ratings.food < 3.5) {
          lowRatedTopics.push(topic)
        }
        if ((lowerTopic.includes("service") || lowerTopic.includes("staff") || lowerTopic.includes("wait")) && ratings.staff < 3.5) {
          lowRatedTopics.push(topic)
        }
        if ((lowerTopic.includes("ambience") || lowerTopic.includes("atmosphere") || lowerTopic.includes("environment")) && ratings.ambience < 3.5) {
          lowRatedTopics.push(topic)
        }
      })
      
      lowRatedTopics.forEach(topic => {
        concerns.push({
          concern: topic,
          impact: "This topic is frequently mentioned by customers but ratings remain low, indicating the issue hasn't been fully addressed."
        })
      })
    }
    
    // Check for negative sentiment with recommendations
    if (insight.sentiment === "negative" && insight.recommendations.length > 0) {
      concerns.push({
        concern: "Multiple Improvement Areas",
        impact: "Several recommendations have been identified but may not yet be implemented, as negative sentiment persists."
      })
    }
    
    return concerns
  })()

  // Get worst performing aspect
  const worstAspect = stats ? (() => {
    const ratings = stats.averageRatings
    const aspects = [
      { name: "Food Quality", rating: ratings.food, icon: "🍽️" },
      { name: "Staff Service", rating: ratings.staff, icon: "👥" },
      { name: "Ambience", rating: ratings.ambience, icon: "🏛️" }
    ]
    return aspects.reduce((worst, current) => 
      current.rating < worst.rating ? current : worst
    )
  })() : null

  // Get best performing aspect
  const bestAspect = stats ? (() => {
    const ratings = stats.averageRatings
    const aspects = [
      { name: "Food Quality", rating: ratings.food, icon: "🍽️" },
      { name: "Staff Service", rating: ratings.staff, icon: "👥" },
      { name: "Ambience", rating: ratings.ambience, icon: "🏛️" }
    ]
    return aspects.reduce((best, current) => 
      current.rating > best.rating ? current : best
    )
  })() : null

  // Show premium upgrade if premium error occurred or user doesn't have premium
  if (premiumError || (!hasPremium && !insight)) {
    return (
      <PremiumUpgrade 
        feature="AI Insights"
        description="Unlock AI-powered insights and recommendations to understand your customer feedback better."
      />
    )
  }

  return (
    <div className="space-y-6">
      {!insight ? (
        <Card className="border-2 border-dashed">
          <CardHeader className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl mb-2">AI-Powered Insights</CardTitle>
            <CardDescription className="text-base">
              Let AI analyze your feedback and provide actionable recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-12">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Time Period:</span>
              </div>
              <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Source:</span>
              </div>
              <Select value={filter} onValueChange={(value) => setFilter(value as "external" | "internal" | "overall")}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">Overall (Both)</SelectItem>
                  <SelectItem value="internal">Internal Feedback</SelectItem>
                  <SelectItem value="external">External Reviews</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={generateInsights}
              disabled={generateInsightsMutation.isPending}
              size="lg"
              className="w-full sm:w-auto mx-auto block relative overflow-visible bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-[length:200%_100%] hover:from-purple-500 hover:via-pink-500 hover:to-blue-500 text-white shadow-lg hover:shadow-2xl group cursor-pointer active:scale-95 transition-all duration-200"
              style={{
                animation: 'gradient 3s ease infinite, pulse-glow 2s ease-in-out infinite, float 3s ease-in-out infinite, magic-pulse 2s ease-in-out infinite',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.transition = 'transform 0.2s ease';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
            >
              {/* Ripple effect on click */}
              <div className="absolute inset-0 rounded-md overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-active:opacity-100 group-active:animate-ripple" />
              </div>
              
              {/* Shimmer effect */}
              <div 
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
                style={{
                  animation: 'shimmer 3s infinite',
                }}
              />
              
              {/* Enhanced sparkle effects */}
              <div 
                className="absolute top-2 left-4 w-1.5 h-1.5 bg-white rounded-full shadow-lg shadow-white/50 pointer-events-none"
                style={{
                  animation: 'sparkle 2s infinite',
                  animationDelay: '0s',
                }}
              />
              <div 
                className="absolute top-3 right-6 w-1.5 h-1.5 bg-white rounded-full shadow-lg shadow-white/50 pointer-events-none"
                style={{
                  animation: 'sparkle 2s infinite',
                  animationDelay: '0.5s',
                }}
              />
              <div 
                className="absolute bottom-2 left-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-lg shadow-white/50 pointer-events-none"
                style={{
                  animation: 'sparkle 2s infinite',
                  animationDelay: '1s',
                }}
              />
              <div 
                className="absolute top-1/2 right-4 w-1 h-1 bg-white rounded-full shadow-lg shadow-white/50 pointer-events-none"
                style={{
                  animation: 'sparkle 2.5s infinite',
                  animationDelay: '1.5s',
                }}
              />
              
              {/* Magic particles on hover */}
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div 
                  className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full"
                  style={{
                    animation: 'particles 1s ease-out infinite',
                    '--tx': '20px',
                  } as React.CSSProperties}
                />
                <div 
                  className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full"
                  style={{
                    animation: 'particles 1s ease-out infinite',
                    animationDelay: '0.2s',
                    '--tx': '-20px',
                  } as React.CSSProperties}
                />
                <div 
                  className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full"
                  style={{
                    animation: 'particles 1s ease-out infinite',
                    animationDelay: '0.4s',
                    '--tx': '0px',
                  } as React.CSSProperties}
                />
              </div>
              
              {generateInsightsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin relative z-20 text-white" />
                  <span className="relative z-20 text-white font-semibold">Analyzing Feedback...</span>
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5 relative z-20 text-white group-hover:rotate-12 group-active:rotate-24 transition-transform duration-300 group-hover:scale-110" />
                  <div className="relative z-20 flex flex-col items-start">
                    <span className="text-white font-semibold group-hover:tracking-wide transition-all duration-300 leading-tight">Generate Insights</span>
                    <span className="text-white/90 text-xs font-medium mt-1 leading-tight drop-shadow-sm">Click to generate</span>
                  </div>
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Analysis Period:</span>
                  </div>
                  <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_PERIOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Source:</span>
                  </div>
                  <Select value={filter} onValueChange={(value) => setFilter(value as "external" | "internal" | "overall")}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overall">Overall (Both)</SelectItem>
                      <SelectItem value="internal">Internal Feedback</SelectItem>
                      <SelectItem value="external">External Reviews</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={generateInsights}
                  disabled={generateInsightsMutation.isPending}
                  variant="outline"
                  size="sm"
                  className="relative overflow-visible border-purple-300 dark:border-purple-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-gradient-to-r hover:from-purple-50 hover:via-pink-50 hover:to-blue-50 dark:hover:from-purple-950 dark:hover:via-pink-950 dark:hover:to-blue-950 hover:bg-[length:200%_100%] transition-all group cursor-pointer active:scale-95 px-3"
                  style={{
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.animation = 'gradient 3s ease infinite, pulse-glow 2s ease-in-out infinite';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.animation = 'none';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.95)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                >
                  {/* Shimmer effect */}
                  <div 
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-purple-200/30 to-transparent dark:via-purple-400/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      animation: 'shimmer 2s infinite',
                    }}
                  />
                  
                  {/* Sparkle effects */}
                  <div 
                    className="absolute top-1 left-2 w-1 h-1 bg-purple-500 dark:bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      animation: 'sparkle 2s infinite',
                      animationDelay: '0s',
                    }}
                  />
                  <div 
                    className="absolute bottom-1 right-2 w-1 h-1 bg-pink-500 dark:bg-pink-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      animation: 'sparkle 2s infinite',
                      animationDelay: '0.5s',
                    }}
                  />
                  
                  {generateInsightsMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin relative z-20 mr-2" />
                      <span className="relative z-20 text-xs font-medium">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 relative z-20 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 group-hover:rotate-12 group-active:rotate-24 transition-all duration-300 mr-2" />
                      <div className="relative z-20 flex flex-col items-start">
                        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 leading-tight">Generate</span>
                        <span className="text-[10px] font-medium text-purple-600/80 dark:text-purple-400/80 leading-tight">Click to generate</span>
                      </div>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Executive Summary */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Executive Summary</CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className={
                    insight.sentiment === "positive"
                      ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                      : insight.sentiment === "negative"
                      ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                      : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                  }
                >
                  {insight.sentiment.charAt(0).toUpperCase() + insight.sentiment.slice(1)} Sentiment
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base leading-relaxed text-foreground font-medium">{insight.summary}</p>
              
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Overall Rating</p>
                    <p className="text-2xl font-bold">{stats.averageRatings.overall.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">/ 5.0</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total Feedback</p>
                    <p className="text-2xl font-bold">{stats.totalFeedback}</p>
                    <p className="text-xs text-muted-foreground">responses</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Trend</p>
                    <div className="flex items-center gap-1">
                      {stats.recentTrend === "improving" ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : stats.recentTrend === "declining" ? (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      ) : (
                        <Minus className="h-5 w-5 text-yellow-500" />
                      )}
                      <p className="text-lg font-semibold capitalize">{stats.recentTrend}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">External Reviews</p>
                    <p className="text-2xl font-bold">
                      {stats.externalReviewsCount.google + stats.externalReviewsCount.facebook + stats.externalReviewsCount.instagram}
                    </p>
                    <p className="text-xs text-muted-foreground">across platforms</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Critical Issues & Warnings */}
          {criticalIssues.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <CardTitle className="text-lg">Critical Issues & Warnings</CardTitle>
                </div>
                <CardDescription>
                  These issues require immediate attention to maintain customer satisfaction and restaurant reputation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {criticalIssues.map((issue, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border bg-background ${
                      issue.priority === "critical"
                        ? "border-destructive/30 border-2"
                        : "border-destructive/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                        issue.priority === "critical" ? "text-destructive" : "text-orange-500"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold">{issue.title}</p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              issue.priority === "critical"
                                ? "bg-destructive/10 text-destructive border-destructive/30"
                                : "bg-orange-500/10 text-orange-700 border-orange-500/30"
                            }`}
                          >
                            {issue.priority === "critical" ? "Critical" : "High Priority"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{issue.description}</p>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {issue.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Performance Metrics */}
          {stats && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                </div>
                <CardDescription>
                  Detailed breakdown of customer ratings across key areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Food Quality</span>
                      <span className="text-2xl font-bold">{stats.averageRatings.food.toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          stats.averageRatings.food >= 4.0
                            ? "bg-green-500"
                            : stats.averageRatings.food >= 3.0
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${(stats.averageRatings.food / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Staff Service</span>
                      <span className="text-2xl font-bold">{stats.averageRatings.staff.toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          stats.averageRatings.staff >= 4.0
                            ? "bg-green-500"
                            : stats.averageRatings.staff >= 3.0
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${(stats.averageRatings.staff / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Ambience</span>
                      <span className="text-2xl font-bold">{stats.averageRatings.ambience.toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          stats.averageRatings.ambience >= 4.0
                            ? "bg-green-500"
                            : stats.averageRatings.ambience >= 3.0
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${(stats.averageRatings.ambience / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                {worstAspect && bestAspect && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Needs Improvement</p>
                        <p className="text-sm font-semibold">{worstAspect.name}</p>
                        <p className="text-xs text-muted-foreground">{worstAspect.rating.toFixed(1)}/5.0</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Top Performer</p>
                        <p className="text-sm font-semibold">{bestAspect.name}</p>
                        <p className="text-xs text-muted-foreground">{bestAspect.rating.toFixed(1)}/5.0</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Key Strengths */}
          {keyStrengths.length > 0 && (
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg">Key Strengths</CardTitle>
                </div>
                <CardDescription>
                  Areas where your restaurant is excelling - maintain and leverage these strengths
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {keyStrengths.map((strength, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border bg-background border-green-500/20 flex items-start gap-3"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold mb-1">{strength.title}</p>
                      <p className="text-sm text-muted-foreground">{strength.description}</p>
                      {strength.rating && (
                        <Badge variant="outline" className="mt-2 text-xs bg-green-500/10 text-green-700 border-green-500/20">
                          {strength.rating.toFixed(1)}/5.0 Rating
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Areas for Improvement */}
          {insight.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Areas for Improvement</CardTitle>
                </div>
                <CardDescription>
                  Actionable recommendations to enhance customer experience and satisfaction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {insight.recommendations.map((rec, index) => (
                  <div key={index} className="flex gap-3 p-3 rounded-lg border bg-muted/30">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{rec}</p>
                      {hasPremium && (
                        <div className="flex justify-end mt-2 pt-2 border-t">
                          <ConvertToActionable
                            restaurantId={restaurantId}
                            sourceType="ai_suggestion"
                            sourceId={insight.id}
                            sourceText={rec}
                            defaultTitle={rec.substring(0, 50) + (rec.length > 50 ? "..." : "")}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Unaddressed Concerns */}
          {unaddressedConcerns.length > 0 && (
            <Card className="border-orange-500/50 bg-orange-500/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-lg">Unaddressed Concerns</CardTitle>
                </div>
                <CardDescription>
                  Issues that customers frequently mention but may not yet be fully resolved
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {unaddressedConcerns.map((concern, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border bg-background border-orange-500/20 flex items-start gap-3"
                  >
                    <Clock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold mb-1">{concern.concern}</p>
                      <p className="text-sm text-muted-foreground">{concern.impact}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Key Topics & Themes */}
          {insight.keyTopics.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Key Topics & Themes</CardTitle>
                </div>
                <CardDescription>
                  What customers are talking about most frequently
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {insight.keyTopics.map((topic, index) => (
                    <Badge key={index} variant="secondary" className="text-sm py-1.5 px-3">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}