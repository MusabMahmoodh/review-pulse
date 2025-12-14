"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
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

  const chartData = [
    { category: "Food", rating: Number(avgFood.toFixed(1)) },
    { category: "Staff", rating: Number(avgStaff.toFixed(1)) },
    { category: "Ambience", rating: Number(avgAmbience.toFixed(1)) },
    { category: "Overall", rating: Number(avgOverall.toFixed(1)) },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Average Ratings</CardTitle>
        <CardDescription>Breakdown by category</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            rating: {
              label: "Rating",
              color: "hsl(var(--primary))",
            },
          }}
          className="h-[250px] sm:h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="category" className="text-xs" />
              <YAxis domain={[0, 5]} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="rating" fill="var(--color-rating)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
