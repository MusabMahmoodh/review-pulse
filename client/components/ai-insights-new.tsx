"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  MessageCircle,
  Send,
  Lightbulb,
  Users,
  Clock,
  Loader2,
} from "lucide-react"
import type { AIInsight } from "@/lib/types"
import { useToast } from "@/hooks/use-toast-simple"

interface AIInsightsNewProps {
  restaurantId: string
  initialInsight?: AIInsight | null
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function AIInsightsNew({ restaurantId, initialInsight }: AIInsightsNewProps) {
  const { toast } = useToast()
  const [insight, setInsight] = useState<AIInsight | null>(initialInsight || null)
  const [loading, setLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const generateInsights = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/ai/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId }),
      })

      if (!response.ok) throw new Error("Failed to generate insights")

      const data = await response.json()
      setInsight(data.insight)

      toast({
        title: "Insights Generated",
        description: "AI has analyzed your feedback",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate insights",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const sendChatMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setChatLoading(true)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          message: inputMessage,
          conversationHistory: chatMessages,
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }

      setChatMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive",
      })
    } finally {
      setChatLoading(false)
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
          <Button onClick={generateInsights} disabled={loading} size="lg" className="w-full">
            {loading ? (
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
    <div className="space-y-4">
      {/* Warnings Section */}
      <Card className="border-destructive/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-base">Attention Needed</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {warnings.map((warning, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border bg-destructive/5 border-destructive/20 flex items-start gap-3"
            >
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{warning.message}</p>
                <Badge variant="outline" className="mt-1 text-xs">
                  {warning.priority === "high" ? "High Priority" : "Medium Priority"}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* General Insights */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">General Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {generalInsights.map((item, index) => {
            const Icon = item.icon
            return (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <p className="text-xs text-primary font-medium mt-1">{item.trend}</p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* AI Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">AI Summary</CardTitle>
            </div>
            <Badge
              variant="outline"
              className={
                insight.sentiment === "positive"
                  ? "bg-green-500/10 text-green-700 border-green-500/20"
                  : "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
              }
            >
              {insight.sentiment.charAt(0).toUpperCase() + insight.sentiment.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">{insight.summary}</p>

          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Key Recommendations</p>
            {insight.recommendations.slice(0, 2).map((rec, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <p className="text-sm">{rec}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Ask AI for More Insights</CardTitle>
          </div>
          <CardDescription className="text-xs">Get detailed answers about your feedback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div ref={scrollRef} className="h-[300px] overflow-y-auto rounded-lg border p-3 bg-muted/20">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Ask questions like &quot;What are customers saying about our food?&quot; or &quot;How can we improve
                  service?&quot;
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Ask a question..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
              disabled={chatLoading}
            />
            <Button onClick={sendChatMessage} disabled={chatLoading || !inputMessage.trim()} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button onClick={generateInsights} disabled={loading} variant="outline" className="w-full bg-transparent">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Regenerating...
          </>
        ) : (
          <>
            <TrendingUp className="mr-2 h-4 w-4" />
            Regenerate All Insights
          </>
        )}
      </Button>
    </div>
  )
}
