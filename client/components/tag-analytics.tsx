"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tag as TagIcon, TrendingUp, MessageSquare, Star } from "lucide-react";
import { useTagStats } from "@/hooks";
import { TagBadge } from "@/components/tag-badge";
import type { Tag } from "@/lib/types";

interface TagAnalyticsProps {
  tag: Tag;
  totalFeedback: number;
}

export function TagAnalytics({ tag, totalFeedback }: TagAnalyticsProps) {
  const { data: statsData, isLoading } = useTagStats(tag.id);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-8 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = statsData?.stats;
  if (!stats) return null;

  const usagePercentage = totalFeedback > 0 
    ? (stats.feedbackCount / totalFeedback) * 100 
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-end gap-2 min-w-0">
          <div className="flex-shrink-0 min-w-0 max-w-full">
            <TagBadge tag={tag} size="sm" className="w-full" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Usage</span>
            <span className="font-medium">
              {stats.feedbackCount} / {totalFeedback} feedback
            </span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {usagePercentage.toFixed(1)}% of all feedback
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>Feedback</span>
            </div>
            <p className="text-2xl font-bold">{stats.feedbackCount}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4" />
              <span>Avg Rating</span>
            </div>
            <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
          </div>
        </div>

        {/* Rating Indicator */}
        {stats.averageRating >= 4 && (
          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-md">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-300">
              Positive feedback trend
            </span>
          </div>
        )}
        {stats.averageRating < 3 && (
          <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 rounded-md">
            <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400 rotate-180" />
            <span className="text-sm text-red-700 dark:text-red-300">
              Needs attention
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

