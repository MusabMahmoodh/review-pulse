"use client"

import { useState } from "react"
import { AIChatWidget } from "@/components/ai-chat-widget"
import { ChatSelectorSidebar } from "@/components/chat-selector-sidebar"
import { useAuth } from "@/hooks/use-auth"
import { useIsMobile } from "@/hooks/use-mobile"
import { Loader2, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export default function ChatPage() {
  const { user, isLoading: authLoading } = useAuth()
  const restaurantId = user?.id || null
  const isMobile = useIsMobile()
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  const handleFormSelect = (formId: string) => {
    setSelectedFormIds((prev) => [...prev, formId])
  }

  const handleFormRemove = (formId: string) => {
    setSelectedFormIds((prev) => prev.filter((id) => id !== formId))
  }

  const handleTagSelect = (tagId: string) => {
    setSelectedTagIds((prev) => [...prev, tagId])
  }

  const handleTagRemove = (tagId: string) => {
    setSelectedTagIds((prev) => prev.filter((id) => id !== tagId))
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

  return (
    <div className="flex-1 transition-all duration-200 flex w-full h-full min-h-0">
      {isMobile ? (
        // Mobile: Full page chat
        <div className="flex-1 flex flex-col h-full min-h-0">
          <AIChatWidget
            restaurantId={restaurantId}
            isMobile={true}
            fullPage={true}
            selectedFormIds={selectedFormIds}
            selectedTagIds={selectedTagIds}
            onFormSelect={handleFormSelect}
            onFormRemove={handleFormRemove}
            onTagSelect={handleTagSelect}
            onTagRemove={handleTagRemove}
          />
        </div>
      ) : (
        // Desktop: Sidebar + Chat layout
        <div className="flex-1 flex min-h-0 h-full">
          {/* Chat Selector Sidebar */}
          <div className="w-64 border-r flex-shrink-0">
            <ChatSelectorSidebar
              selectedFormIds={selectedFormIds}
              selectedTagIds={selectedTagIds}
              onFormSelect={handleFormSelect}
              onFormRemove={handleFormRemove}
              onTagSelect={handleTagSelect}
              onTagRemove={handleTagRemove}
            />
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0 h-full">
            <AIChatWidget
              restaurantId={restaurantId}
              fullPage={true}
              selectedFormIds={selectedFormIds}
              selectedTagIds={selectedTagIds}
            />
          </div>
        </div>
      )}
    </div>
  )
}

