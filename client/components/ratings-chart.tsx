"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { CustomerFeedback } from "@/lib/types"

interface RatingsChartProps {
  feedback: CustomerFeedback[]
}

export function RatingsChart({ feedback }: RatingsChartProps) {
  // Calculate average ratings
  const avgFood = feedback.length > 0 ? feedback.reduce((sum, f) => sum + f.foodRating, 0) / feedback.length : 0
  const avgStaff = feedback.length > 0 ? feedback.reduce((sum, f) => sum + f.staffRating, 0) / feedback.length : 0
  const avgAmbience = feedback.length > 0 ? feedback.reduce((sum, f) => sum + f.ambienceRating, 0) / feedback.length : 0
  const avgOverall = feedback.length > 0 ? feedback.reduce((sum, f) => sum + f.overallRating, 0) / feedback.length : 0

  const colors = ["#8b5cf6", "#ec4899", "#3b82f6", "#6366f1"] // purple, pink, blue, indigo

  const chartData = [
    { category: "Food", rating: Number(avgFood.toFixed(1)) },
    { category: "Staff", rating: Number(avgStaff.toFixed(1)) },
    { category: "Ambience", rating: Number(avgAmbience.toFixed(1)) },
    { category: "Overall", rating: Number(avgOverall.toFixed(1)) },
  ]

  return (
    <ChartContainer
      config={{
        rating: {
          label: "Rating",
          color: "hsl(var(--primary))",
        },
      }}
      className="h-[250px] w-full sm:h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="category" className="text-xs" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 5]} className="text-xs" width={30} tick={{ fontSize: 11 }} />
          <ChartTooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2.5 w-2.5 rounded-full" 
                          style={{ backgroundColor: payload[0].color }}
                        />
                        <span className="text-sm font-medium">{data.category}</span>
                      </div>
                      <div className="text-sm font-bold">
                        {data.rating.toFixed(1)} / 5.0
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          />
          <Bar dataKey="rating" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
