import { Card, CardContent } from "@/components/ui/card"
import { Star, MessageSquare, TrendingUp, Users } from "lucide-react"
import type { FeedbackStats } from "@/lib/types"

interface StatsCardsProps {
  stats: FeedbackStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      icon: Star,
      label: "Overall Rating",
      value: stats.averageRatings.overall.toFixed(1),
      suffix: "/5",
      color: "text-primary",
    },
    {
      icon: MessageSquare,
      label: "Total Feedback",
      value: stats.totalFeedback.toString(),
      suffix: "",
      color: "text-chart-2",
    },
    {
      icon: TrendingUp,
      label: "Trend",
      value: stats.recentTrend.charAt(0).toUpperCase() + stats.recentTrend.slice(1),
      suffix: "",
      color:
        stats.recentTrend === "improving"
          ? "text-green-500"
          : stats.recentTrend === "declining"
            ? "text-red-500"
            : "text-yellow-500",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">{card.label}</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {card.value}
                  <span className="text-sm sm:text-base font-normal text-muted-foreground ml-1">{card.suffix}</span>
                </p>
              </div>
              <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
