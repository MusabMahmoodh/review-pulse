import { Star, MessageSquare, TrendingUp, Users } from "lucide-react"
import { cn } from "@/lib/utils"
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
    },
    {
      icon: MessageSquare,
      label: "Total Feedback",
      value: stats.totalFeedback.toString(),
      suffix: "",
    },
    {
      icon: TrendingUp,
      label: "Trend",
      value: stats.recentTrend.charAt(0).toUpperCase() + stats.recentTrend.slice(1),
      suffix: "",
      trendColor:
        stats.recentTrend === "improving"
          ? "text-green-600 dark:text-green-500"
          : stats.recentTrend === "declining"
            ? "text-red-600 dark:text-red-500"
            : "text-yellow-600 dark:text-yellow-500",
    },
    {
      icon: Users,
      label: "External Reviews",
      value: (
        stats.externalReviewsCount.google +
        stats.externalReviewsCount.facebook +
        stats.externalReviewsCount.instagram
      ).toString(),
      suffix: "",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <card.icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{card.label}</span>
          </div>
          <p className={cn(
            "text-2xl font-semibold tracking-tight",
            card.trendColor || "text-foreground"
          )}>
            {card.value}
            {card.suffix && (
              <span className="ml-0.5 text-base font-normal text-muted-foreground">
                {card.suffix}
              </span>
            )}
          </p>
        </div>
      ))}
    </div>
  )
}
