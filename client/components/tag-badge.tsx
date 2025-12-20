"use client";

import { Badge } from "@/components/ui/badge";
import { Tag as TagIcon } from "lucide-react";
import type { Tag } from "@/lib/types";

interface TagBadgeProps {
  tag: {
    id: string;
    name: string;
    color?: string;
    description?: string;
  };
  variant?: "default" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function TagBadge({
  tag,
  variant = "secondary",
  size = "sm",
  showIcon = true,
  className,
}: TagBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <Badge
      variant={variant}
      className={`gap-1 ${sizeClasses[size]} ${className || ""}`}
      style={
        tag.color
          ? {
              backgroundColor: `${tag.color}20`,
              borderColor: tag.color,
              color: tag.color,
            }
          : {}
      }
    >
      {showIcon && <TagIcon className="h-3 w-3" />}
      {tag.name}
    </Badge>
  );
}

