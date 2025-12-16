"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, TrendingUp, Lightbulb, Tag, Loader2 } from "lucide-react"
import type { AIInsight } from "@/lib/types"
import { useToast } from "@/hooks/use-toast-simple"
import { useAIInsights, useGenerateInsights } from "@/hooks/use-ai"

interface AIInsightsProps {
  restaurantId: string
  initialInsight?: AIInsight | null
}

export function AIInsights({ restaurantId, initialInsight }: AIInsightsProps) {
  const { toast } = useToast()
  const { data: insightsData, isLoading: isLoadingInsights } = useAIInsights(restaurantId)
  const generateMutation = useGenerateInsights()
  
  const insight = insightsData?.insight || initialInsight || null

  const generateInsights = async () => {
    try {
      const result = await generateMutation.mutateAsync({ restaurantId })
      toast({
        title: "Insights Generated",
        description: "AI has analyzed your feedback and created new insights",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.error || error?.message || "Failed to generate insights",
        variant: "destructive",
      })
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
      case "negative":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
      default:
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
    }
  }

  if (!insight) {
    return (
      <Card>
        <CardHeader className="text-center">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-2" />
          <CardTitle>AI-Powered Insights</CardTitle>
          <CardDescription>Let AI analyze your feedback and provide actionable recommendations</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={generateInsights} disabled={generateMutation.isPending} size="lg">
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Feedback...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Insights
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">AI Summary</CardTitle>
            </div>
            <Badge className={getSentimentColor(insight.sentiment)} variant="outline">
              {insight.sentiment.charAt(0).toUpperCase() + insight.sentiment.slice(1)}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Generated {new Date(insight.generatedAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{insight.summary}</p>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </div>
          <CardDescription>Actionable steps to improve your service</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {insight.recommendations.map((rec, index) => (
              <li key={index} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <p className="text-sm flex-1 pt-0.5">{rec}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Key Topics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Key Topics</CardTitle>
          </div>
          <CardDescription>What customers are talking about</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {insight.keyTopics.map((topic, index) => (
              <Badge key={index} variant="secondary">
                {topic}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Regenerate Button */}
      <Button onClick={generateInsights} disabled={generateMutation.isPending} variant="outline" className="w-full bg-transparent">
        {generateMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Regenerating...
          </>
        ) : (
          <>
            <TrendingUp className="mr-2 h-4 w-4" />
            Regenerate Insights
          </>
        )}
      </Button>
    </div>
  )
}
