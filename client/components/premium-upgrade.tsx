"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Check, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PremiumUpgradeProps {
  description?: string
  className?: string
}

export function PremiumUpgrade({
  description = "Upgrade to access advanced capabilities and unlock the full potential of Review Pulse.",
  className = ""
}: PremiumUpgradeProps) {
  const features = [
    "AI-powered insights and recommendations",
    "Google Reviews integration",
    "Advanced analytics dashboard",
    "Priority support",
  ]

  return (
    <Card className={cn("border border-border", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-medium">Upgrade to Premium</CardTitle>
            <CardDescription className="text-sm">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {features.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="pt-2">
          <Button className="w-full" size="sm">
            View Plans
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
