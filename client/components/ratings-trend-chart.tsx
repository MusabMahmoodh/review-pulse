"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { CustomerFeedback } from "@/lib/types"

interface RatingsTrendChartProps {
  feedback: CustomerFeedback[]
  timePeriod: "1month" | "3months" | "6months" | "1year"
  ratingType: "food" | "staff" | "ambience" | "overall"
}

export function RatingsTrendChart({ feedback, timePeriod, ratingType }: RatingsTrendChartProps) {
  // Calculate date range based on time period
  const now = new Date()
  const periodMonths = {
    "1month": 1,
    "3months": 3,
    "6months": 6,
    "1year": 12,
  }
  const monthsBack = periodMonths[timePeriod]
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate())

  // Filter feedback by date range
  const filteredFeedback = feedback.filter((f) => new Date(f.createdAt) >= startDate)

  // Group by week or month based on period
  const groupBy = monthsBack <= 3 ? "week" : "month"
  
  // Create date groups
  const groups = new Map<string, { date: Date; ratings: number[] }>()

  filteredFeedback.forEach((f) => {
    const date = new Date(f.createdAt)
    let key: string
    let groupDate: Date

    if (groupBy === "week") {
      // Group by week
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0)
      key = weekStart.toISOString().split("T")[0]
      groupDate = weekStart
    } else {
      // Group by month
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      key = monthStart.toISOString().split("T")[0]
      groupDate = monthStart
    }

    if (!groups.has(key)) {
      groups.set(key, { date: groupDate, ratings: [] })
    }

    const rating = ratingType === "food" ? f.foodRating 
      : ratingType === "staff" ? f.staffRating
      : ratingType === "ambience" ? f.ambienceRating
      : f.overallRating

    groups.get(key)!.ratings.push(rating)
  })

  // Convert to chart data and sort by date
  const chartData = Array.from(groups.entries())
    .map(([key, { date, ratings }]) => {
      const avg = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
        : 0
      
      return {
        key,
        dateObj: date,
        date: groupBy === "week" 
          ? `${date.getMonth() + 1}/${date.getDate()}`
          : date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        rating: Number(avg.toFixed(2)),
        count: ratings.length,
      }
    })
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    .map(({ key, dateObj, ...rest }) => rest)

  const colors = {
    food: "#8b5cf6", // purple
    staff: "#ec4899", // pink
    ambience: "#3b82f6", // blue
    overall: "#6366f1", // indigo
  }

  const color = colors[ratingType]

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        <p>No data available for the selected period</p>
      </div>
    )
  }

  return (
    <ChartContainer
      config={{
        rating: {
          label: "Rating",
          color: color,
        },
      }}
      className="h-[300px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            className="text-xs" 
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            domain={[0, 5]} 
            className="text-xs" 
            width={30} 
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="text-xs text-muted-foreground">{data.date}</div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2.5 w-2.5 rounded-full" 
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm font-medium capitalize">{ratingType} Rating</span>
                      </div>
                      <div className="text-sm font-bold">
                        {data.rating.toFixed(2)} / 5.0
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {data.count} {data.count === 1 ? "review" : "reviews"}
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Line 
            type="monotone" 
            dataKey="rating" 
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

