"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Crown, Lock, Sparkles } from "lucide-react"

interface PremiumUpgradeProps {
  feature?: string
  description?: string
  className?: string
}

export function PremiumUpgrade({ 
  feature = "Premium Feature",
  description = "This feature requires a premium subscription. Please contact your admin to upgrade.",
  className = ""
}: PremiumUpgradeProps) {
  return (
    <Card className={`border-2 border-dashed ${className}`}>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
          <Crown className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-xl">Premium Feature</CardTitle>
        <CardDescription className="text-sm mt-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>AI-powered insights and recommendations</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Social media integration (Google{/*, Facebook, Instagram*/})</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Advanced analytics and reporting</span>
          </div>
        </div>
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-3">
            Contact your administrator to activate premium features
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Premium subscription required</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



