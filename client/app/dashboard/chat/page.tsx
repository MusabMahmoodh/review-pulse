"use client"

import { useState } from "react"
import { AIChatWidget } from "@/components/ai-chat-widget"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ChatSelectorSidebar } from "@/components/chat-selector-sidebar"
import { useAuth } from "@/hooks/use-auth"
import { useIsMobile } from "@/hooks/use-mobile"
import { Loader2, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
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
    <div className="min-h-screen bg-background flex w-full overflow-x-hidden">
      {/* Desktop Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-200 flex w-full",
        !isMobile && "ml-64"
      )}>
        {isMobile ? (
          // Mobile: Full page chat with sheet selector
          <div className="flex-1 flex flex-col pb-20">
            <div className="border-b px-4 py-3 flex-shrink-0 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">AI Chat</h1>
                <p className="text-muted-foreground text-xs mt-1">
                  Ask questions about your feedback and get AI-powered insights
                </p>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <Filter className="h-4 w-4" />
                    {(selectedFormIds.length > 0 || selectedTagIds.length > 0) && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                        {selectedFormIds.length + selectedTagIds.length}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <SheetHeader className="px-4 pt-4 pb-2 border-b">
                    <SheetTitle>Chat Context</SheetTitle>
                  </SheetHeader>
                  <ChatSelectorSidebar
                    selectedFormIds={selectedFormIds}
                    selectedTagIds={selectedTagIds}
                    onFormSelect={handleFormSelect}
                    onFormRemove={handleFormRemove}
                    onTagSelect={handleTagSelect}
                    onTagRemove={handleTagRemove}
                    className="border-0"
                  />
                </SheetContent>
              </Sheet>
            </div>
            <div className="flex-1 min-h-0">
              <AIChatWidget
                restaurantId={restaurantId}
                isMobile={true}
                fullPage={true}
                selectedFormIds={selectedFormIds}
                selectedTagIds={selectedTagIds}
              />
            </div>
          </div>
        ) : (
          // Desktop: Sidebar + Chat layout
          <div className="flex-1 flex min-h-0">
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
            <div className="flex-1 flex flex-col min-h-0">
              <div className="border-b px-6 py-4 flex-shrink-0">
                <h1 className="text-2xl font-bold">AI Chat</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Ask questions about your feedback and get AI-powered insights
                </p>
              </div>
              <div className="flex-1 min-h-0 p-6">
                <AIChatWidget
                  restaurantId={restaurantId}
                  fullPage={true}
                  selectedFormIds={selectedFormIds}
                  selectedTagIds={selectedTagIds}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}

