"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckSquare, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast-simple"
import { useCreateActionableItem } from "@/hooks"
import { useAuth } from "@/hooks/use-auth"
import { isPremiumFromAuth } from "@/lib/premium"
import { PremiumUpgrade } from "@/components/premium-upgrade"

interface ConvertToActionableProps {
  restaurantId: string
  sourceType: "comment" | "ai_suggestion"
  sourceId: string
  sourceText: string
  defaultTitle?: string
  trigger?: React.ReactNode
}

export function ConvertToActionable({
  restaurantId,
  sourceType,
  sourceId,
  sourceText,
  defaultTitle,
  trigger,
}: ConvertToActionableProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(defaultTitle || "")
  const [description, setDescription] = useState("")
  const createMutation = useCreateActionableItem()

  const hasPremium = isPremiumFromAuth(user?.subscription)

  const handleConvert = async () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for the actionable item",
        variant: "destructive",
      })
      return
    }

    createMutation.mutate(
      {
        restaurantId,
        title: title.trim(),
        description: description.trim() || undefined,
        sourceType,
        sourceId,
        sourceText,
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Actionable item created successfully",
          })
          setOpen(false)
          setTitle(defaultTitle || "")
          setDescription("")
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error?.data?.error || "Failed to create actionable item",
            variant: "destructive",
          })
        },
      }
    )
  }

  if (!hasPremium) {
    return (
      <div className="inline-block">
        <PremiumUpgrade
          feature="Actionable Items"
          description="Convert comments and AI suggestions into actionable items to track improvements."
          className="p-4"
        />
      </div>
    )
  }

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-2"
        >
          <CheckSquare className="h-4 w-4" />
          Convert to Actionable Item
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Actionable Item</DialogTitle>
            <DialogDescription>
              Convert this {sourceType === "comment" ? "comment" : "AI suggestion"} into an actionable item to track.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter actionable item title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="text-xs text-muted-foreground mb-1">Source:</p>
              <p className="line-clamp-2">{sourceText}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConvert}
              disabled={createMutation.isPending || !title.trim()}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

