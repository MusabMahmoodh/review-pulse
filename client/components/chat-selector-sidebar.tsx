"use client"

import { useState } from "react"
import { X, FileText, Tag as TagIcon, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useForms, useTags } from "@/hooks"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

interface ChatSelectorSidebarProps {
  selectedFormIds: string[]
  selectedTagIds: string[]
  onFormSelect: (formId: string) => void
  onFormRemove: (formId: string) => void
  onTagSelect: (tagId: string) => void
  onTagRemove: (tagId: string) => void
  className?: string
}

export function ChatSelectorSidebar({
  selectedFormIds,
  selectedTagIds,
  onFormSelect,
  onFormRemove,
  onTagSelect,
  onTagRemove,
  className,
}: ChatSelectorSidebarProps) {
  const { user } = useAuth()
  const teacherId = user?.type === "teacher" ? user.id : undefined
  const organizationId = user?.type === "organization" ? user.id : undefined

  const { data: formsData } = useForms({
    teacherId: teacherId || undefined,
    organizationId: organizationId || undefined,
  })

  const { data: tagsData } = useTags({
    teacherId: teacherId || null,
    organizationId: organizationId || null,
  })

  const forms = formsData?.forms || []
  const tags = tagsData?.tags || []

  // Filter out already selected items
  const availableForms = forms.filter((form) => !selectedFormIds.includes(form.id))
  const availableTags = tags.filter((tag) => !selectedTagIds.includes(tag.id))

  const selectedForms = forms.filter((form) => selectedFormIds.includes(form.id))
  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id))

  return (
    <div className={cn("flex flex-col h-full bg-card border-r", className)}>
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-1">Chat Context</h2>
        <p className="text-xs text-muted-foreground">
          Select forms and tags to focus the conversation
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Forms Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Forms</h3>
            </div>
            
            {availableForms.length > 0 && (
              <Select
                value=""
                onValueChange={(value) => {
                  if (value) onFormSelect(value)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Add a form..." />
                </SelectTrigger>
                <SelectContent>
                  {availableForms.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedForms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedForms.map((form) => (
                  <Badge
                    key={form.id}
                    variant="secondary"
                    className="flex items-center gap-1.5 pr-1"
                  >
                    <FileText className="h-3 w-3" />
                    <span className="text-xs">{form.name}</span>
                    <button
                      onClick={() => onFormRemove(form.id)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                      aria-label={`Remove ${form.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {availableForms.length === 0 && selectedForms.length === 0 && (
              <p className="text-xs text-muted-foreground">No forms available</p>
            )}
          </div>

          <Separator />

          {/* Tags Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Tags</h3>
            </div>

            {availableTags.length > 0 && (
              <Select
                value=""
                onValueChange={(value) => {
                  if (value) onTagSelect(value)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Add a tag..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        {tag.color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                        )}
                        <span>{tag.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="flex items-center gap-1.5 pr-1"
                  >
                    {tag.color && (
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                    )}
                    <span className="text-xs">{tag.name}</span>
                    <button
                      onClick={() => onTagRemove(tag.id)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                      aria-label={`Remove ${tag.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {availableTags.length === 0 && selectedTags.length === 0 && (
              <p className="text-xs text-muted-foreground">No tags available</p>
            )}
          </div>
        </div>
      </ScrollArea>

      {(selectedFormIds.length > 0 || selectedTagIds.length > 0) && (
        <div className="p-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              selectedFormIds.forEach(onFormRemove)
              selectedTagIds.forEach(onTagRemove)
            }}
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  )
}




