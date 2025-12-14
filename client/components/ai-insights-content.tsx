"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Clock,
  Loader2,
  Calendar,
} from "lucide-react"
import type { AIInsight } from "@/lib/types"
import { useToast } from "@/hooks/use-toast-simple"
import { useGenerateInsights } from "@/hooks"
import type { TimePeriod } from "@/lib/api-client"

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
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month")
  const generateInsightsMutation = useGenerateInsights()

  const generateInsights = () => {
    generateInsightsMutation.mutate(
      { restaurantId, timePeriod },
      {
        onSuccess: (data) => {
          onInsightUpdate(data.insight)
          toast({
            title: "Insights Generated",
            description: `AI has analyzed your feedback for ${TIME_PERIOD_OPTIONS.find((opt) => opt.value === timePeriod)?.label.toLowerCase()}`,
          })
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error?.data?.error || "Failed to generate insights",
            variant: "destructive",
          })
        },
      }
    )
  }

  if (!insight) {
    return (
      <div className="space-y-6">
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
            </div>
            <Button
              onClick={generateInsights}
              disabled={generateInsightsMutation.isPending}
              size="lg"
              className="w-full sm:w-auto mx-auto block"
            >
              {generateInsightsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing Feedback...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Insights
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const warnings = [
    {
      type: "urgent",
      message: "3 customers mentioned slow service in the past week",
      priority: "high",
    },
    {
      type: "attention",
      message: "Dessert menu variety needs improvement",
      priority: "medium",
    },
  ]

  const generalInsights = [
    {
      icon: Users,
      title: "Most Talked About",
      description: "Food quality & authenticity",
      trend: "+12% this week",
    },
    {
      icon: TrendingUp,
      title: "Trending Positive",
      description: "Staff friendliness",
      trend: "95% positive",
    },
    {
      icon: Clock,
      title: "Peak Feedback Time",
      description: "Weekend evenings",
      trend: "6 PM - 9 PM",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Time Period Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Analysis Period:</span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
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
              <Button
                onClick={generateInsights}
                disabled={generateInsightsMutation.isPending}
                variant="outline"
                size="sm"
              >
                {generateInsightsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-lg">Attention Needed</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {warnings.map((warning, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border bg-background border-destructive/20 flex items-start gap-3"
              >
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{warning.message}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {warning.priority === "high" ? "High Priority" : "Medium Priority"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* General Insights */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">General Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {generalInsights.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold mb-1">{item.title}</p>
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    <p className="text-xs text-primary font-medium">{item.trend}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Summary */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">AI Summary</CardTitle>
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
              {insight.sentiment.charAt(0).toUpperCase() + insight.sentiment.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-foreground">{insight.summary}</p>

          {insight.recommendations.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <p className="text-sm font-semibold text-foreground">Key Recommendations</p>
              <div className="space-y-2">
                {insight.recommendations.map((rec, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </div>
                    <p className="text-sm text-foreground flex-1">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insight.keyTopics.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm font-semibold text-foreground mb-3">Key Topics</p>
              <div className="flex flex-wrap gap-2">
                {insight.keyTopics.map((topic, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

