"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
  onClose: () => void
}

export function ToastSimple({ id, title, description, variant = "default", onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={cn(
        "pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all animate-in slide-in-from-top-full",
        variant === "destructive"
          ? "border-destructive bg-destructive text-destructive-foreground"
          : "border bg-background text-foreground",
      )}
    >
      <div className="grid gap-1">
        {title && <div className="text-sm font-semibold">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      <button
        onClick={onClose}
        className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-70 transition-opacity hover:text-foreground hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
