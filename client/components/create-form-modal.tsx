"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TagSelector } from "@/components/tag-selector"
import { useCreateForm, useTags } from "@/hooks"
import { useToast } from "@/hooks/use-toast-simple"

interface CreateFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacherId?: string
  organizationId?: string
}

export function CreateFormModal({
  open,
  onOpenChange,
  teacherId,
  organizationId,
}: CreateFormModalProps) {
  const [formName, setFormName] = useState("")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const { toast } = useToast()
  const createForm = useCreateForm()

  // Fetch available tags
  const { data: tagsData } = useTags({
    teacherId: teacherId || null,
    organizationId: organizationId || null,
  })
  const availableTags = tagsData?.tags || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formName.trim()) {
      toast({
        title: "Error",
        description: "Form name is required",
        variant: "destructive",
      })
      return
    }

    try {
      await createForm.mutateAsync({
        name: formName.trim(),
        teacherId: teacherId || undefined,
        organizationId: organizationId || undefined,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      })

      toast({
        title: "Success",
        description: "Form created successfully",
      })

      // Reset form
      setFormName("")
      setSelectedTagIds([])
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to create form",
        variant: "destructive",
      })
    }
  }

  const handleClose = () => {
    setFormName("")
    setSelectedTagIds([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Form</DialogTitle>
          <DialogDescription>
            Create a custom feedback form. You can attach tags to organize it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="formName">Form Name *</Label>
            <Input
              id="formName"
              placeholder="e.g., Course Evaluation, Mid-term Feedback"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              disabled={createForm.isPending}
            />
          </div>

          <TagSelector
            tags={availableTags}
            selectedTagIds={selectedTagIds}
            onSelectionChange={setSelectedTagIds}
            disabled={createForm.isPending}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createForm.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createForm.isPending}>
              {createForm.isPending ? "Creating..." : "Create Form"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}



