"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, CheckSquare, X, Loader2, Filter } from "lucide-react"
import Link from "next/link"
import { useActionableItems, useUpdateActionableItem, useDeleteActionableItem } from "@/hooks"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast-simple"
import { isPremiumFromAuth } from "@/lib/premium"
import { PremiumUpgrade } from "@/components/premium-upgrade"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import type { ActionableItem } from "@/lib/types"

export default function ActionableItemsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const restaurantId = user?.id || null
  const { toast } = useToast()
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all")
  
  const { data, isLoading } = useActionableItems(
    restaurantId,
    filter === "completed" ? true : filter === "pending" ? false : undefined
  )
  const updateMutation = useUpdateActionableItem()
  const deleteMutation = useDeleteActionableItem()

  const items = data?.items || []
  const hasPremium = isPremiumFromAuth(user?.subscription)

  const handleToggleComplete = async (item: ActionableItem) => {
    updateMutation.mutate(
      { id: item.id, data: { completed: !item.completed } },
      {
        onSuccess: () => {
          toast({
            title: item.completed ? "Marked as pending" : "Marked as completed",
            description: `"${item.title}" has been updated`,
          })
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error?.data?.error || "Failed to update item",
            variant: "destructive",
          })
        },
      }
    )
  }

  const handleDelete = async (item: ActionableItem) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return

    deleteMutation.mutate(item.id, {
      onSuccess: () => {
        toast({
          title: "Deleted",
          description: `"${item.title}" has been deleted`,
        })
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error?.data?.error || "Failed to delete item",
          variant: "destructive",
        })
      },
    })
  }

  // Show loading state while authenticating
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!restaurantId) {
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    return null
  }

  // Show premium upgrade if not premium
  if (!hasPremium) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-40 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 h-16">
              <Link href="/dashboard">
                <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="font-bold text-lg leading-tight">Actionable Items</h1>
                <p className="text-xs text-muted-foreground">Track and manage improvement tasks</p>
              </div>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <PremiumUpgrade
            feature="Actionable Items"
            description="Convert comments and AI suggestions into actionable items to track improvements and manage tasks."
          />
        </div>
      </div>
    )
  }

  const completedCount = items.filter((item) => item.completed).length
  const pendingCount = items.filter((item) => !item.completed).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            <Link href="/dashboard">
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="font-bold text-lg leading-tight">Actionable Items</h1>
              <p className="text-xs text-muted-foreground">Track and manage improvement tasks</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{items.length}</p>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter:</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={filter === "all" ? "default" : "outline"}
                    onClick={() => setFilter("all")}
                  >
                    All ({items.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={filter === "pending" ? "default" : "outline"}
                    onClick={() => setFilter("pending")}
                  >
                    Pending ({pendingCount})
                  </Button>
                  <Button
                    size="sm"
                    variant={filter === "completed" ? "default" : "outline"}
                    onClick={() => setFilter("completed")}
                  >
                    Completed ({completedCount})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actionable Items List */}
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Loading items...</p>
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No actionable items yet. Convert comments or AI suggestions to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <Card
                  key={item.id}
                  className={item.completed ? "opacity-75" : ""}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => handleToggleComplete(item)}
                        disabled={updateMutation.isPending}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3
                            className={`font-semibold text-base ${
                              item.completed ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {item.title}
                          </h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item)}
                            disabled={deleteMutation.isPending}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {item.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              item.sourceType === "comment" ? "secondary" : "outline"
                            }
                            className="text-xs"
                          >
                            {item.sourceType === "comment" ? "From Comment" : "From AI"}
                          </Badge>
                          {item.sourceText && (
                            <span className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                              {item.sourceText}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}

