"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  MessageCircle,
  Send,
  Loader2,
  X,
  Minimize2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast-simple"
import { useAIChatStream } from "@/hooks"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/hooks/use-auth"
import { isPremiumFromAuth } from "@/lib/premium"
import { PremiumUpgrade } from "@/components/premium-upgrade"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AIChatWidgetProps {
  restaurantId: string
  isMobile?: boolean
}

export function AIChatWidget({ restaurantId, isMobile: isMobileProp }: AIChatWidgetProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const mobileHook = useIsMobile()
  const isMobile = useMemo(() => mobileHook || isMobileProp, [mobileHook, isMobileProp])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [premiumError, setPremiumError] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const streamingContentRef = useRef<string>("")

  const { chatStream } = useAIChatStream()
  const [isStreaming, setIsStreaming] = useState(false)
  const hasPremium = isPremiumFromAuth(user?.subscription)

  // Initialize with welcome message
  useEffect(() => {
    if (hasPremium) {
      setChatMessages((prev) => {
        if (prev.length === 0) {
          const welcomeMessage: ChatMessage = {
            role: "assistant",
            content: "👋 Welcome! I'm your AI assistant for Guestra. I'm here to help you understand your customer feedback better.\n\nYou can ask me questions like:\n• What are customers saying about our food quality?\n• How can we improve our service?\n• What are the main complaints we're receiving?\n• What trends do you see in our reviews?\n\nFeel free to ask me anything about your feedback data!",
            timestamp: new Date(),
          }
          return [welcomeMessage]
        }
        return prev
      })
    }
  }, [hasPremium]) // Only run when premium status is determined

  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages, isOpen])

  const sendChatMessage = useCallback(async () => {
    if (!inputMessage.trim() || isStreaming) return

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    const messageToSend = inputMessage
    setInputMessage("")

    // Create a placeholder assistant message that we'll update as chunks arrive
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }
    setChatMessages((prev) => [...prev, assistantMessage])
    setIsStreaming(true)
    streamingContentRef.current = "" // Reset streaming content

    try {
      await chatStream(restaurantId, messageToSend, (chunk: string) => {
        // Accumulate chunks in ref to avoid state update issues
        streamingContentRef.current += chunk
        
        // Update the last message (assistant message) with accumulated chunks
        setChatMessages((prev) => {
          const newMessages = [...prev]
          const lastIndex = newMessages.length - 1
          const lastMessage = newMessages[lastIndex]
          if (lastMessage && lastMessage.role === "assistant") {
            // Create a new message object with the accumulated content
            newMessages[lastIndex] = {
              ...lastMessage,
              content: streamingContentRef.current,
            }
          }
          return newMessages
        })
      })
    } catch (error: any) {
      // Remove the empty assistant message on error
      setChatMessages((prev) => prev.slice(0, -1))
      
      if (error?.data?.requiresPremium || error?.requiresPremium) {
        setPremiumError(true)
        toast({
          title: "Premium Required",
          description: "AI chat requires a premium subscription. Please contact admin to upgrade.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error?.data?.error || error?.message || "Failed to get AI response",
          variant: "destructive",
        })
      }
    } finally {
      setIsStreaming(false)
    }
  }, [inputMessage, restaurantId, chatStream, isStreaming, toast])

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendChatMessage()
    }
  }, [sendChatMessage])

  const markdownComponents = useMemo(() => ({
    p: ({ children }: { children: React.ReactNode }) => <p className="mb-2 last:mb-0 text-foreground">{children}</p>,
    ul: ({ children }: { children: React.ReactNode }) => <ul className="mb-2 ml-4 list-disc space-y-1.5">{children}</ul>,
    ol: ({ children }: { children: React.ReactNode }) => <ol className="mb-2 ml-4 list-decimal space-y-1.5">{children}</ol>,
    li: ({ children }: { children: React.ReactNode }) => <li className="text-sm text-foreground">{children}</li>,
    strong: ({ children }: { children: React.ReactNode }) => <strong className="font-semibold text-foreground">{children}</strong>,
    em: ({ children }: { children: React.ReactNode }) => <em className="italic">{children}</em>,
    code: ({ children }: { children: React.ReactNode }) => (
      <code className="bg-muted-foreground/20 px-1.5 py-0.5 rounded text-xs font-mono text-foreground">
        {children}
      </code>
    ),
    h1: ({ children }: { children: React.ReactNode }) => <h1 className="text-base font-bold mb-2 mt-3 first:mt-0 text-foreground">{children}</h1>,
    h2: ({ children }: { children: React.ReactNode }) => <h2 className="text-sm font-semibold mb-2 mt-3 first:mt-0 text-foreground">{children}</h2>,
    h3: ({ children }: { children: React.ReactNode }) => <h3 className="text-sm font-medium mb-1 mt-2 first:mt-0 text-foreground">{children}</h3>,
    blockquote: ({ children }: { children: React.ReactNode }) => (
      <blockquote className="border-l-4 border-muted-foreground/30 pl-3 italic my-2 text-muted-foreground">
        {children}
      </blockquote>
    ),
  }), [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value)
  }, [])

  // Show premium upgrade if premium error occurred or user doesn't have premium
  if (premiumError || !hasPremium) {
    const premiumContent = (
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <PremiumUpgrade 
          feature="AI Chat"
          description="Ask AI questions about your feedback and get intelligent insights. This feature requires a premium subscription."
          className="h-full"
        />
      </div>
    )
    
    if (isMobile) {
      return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="bottom" className="h-[90vh] p-0 flex flex-col">
            <SheetHeader className="px-4 py-3 border-b">
              <SheetTitle>AI Chat</SheetTitle>
            </SheetHeader>
            {premiumContent}
          </SheetContent>
        </Sheet>
      )
    }
    
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">AI Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          {premiumContent}
        </CardContent>
      </Card>
    )
  }

  const chatContent = (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scroll-smooth">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Ask AI Anything</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Get detailed answers about your feedback. Try asking:
            </p>
            <div className="mt-4 space-y-2 text-left">
              <p className="text-xs text-muted-foreground">• "What are customers saying about our food?"</p>
              <p className="text-xs text-muted-foreground">• "How can we improve service?"</p>
              <p className="text-xs text-muted-foreground">• "What are the main complaints?"</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatMessages.map((msg, index) => (
              <div key={`${msg.timestamp.getTime()}-${index}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="text-sm leading-relaxed markdown-content">
                      <ReactMarkdown components={markdownComponents}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isStreaming && chatMessages[chatMessages.length - 1]?.role === "assistant" && chatMessages[chatMessages.length - 1]?.content === "" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t p-4 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Ask a question..."
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            disabled={isStreaming}
            className="flex-1"
            autoFocus={!isMobile}
          />
          <Button
            onClick={sendChatMessage}
            disabled={isStreaming || !inputMessage.trim()}
            size="icon"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <>
        {/* Floating Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          aria-label="Open AI Chat"
        >
          {chatMessages.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center">
              {chatMessages.length}
            </span>
          )}
          <MessageCircle className="h-6 w-6" />
        </button>

        {/* Mobile Sheet */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col">
            <SheetHeader className="px-4 pt-4 pb-2 border-b">
              <div className="flex items-center justify-between">
                <SheetTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  AI Assistant
                </SheetTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>
            {chatContent}
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Desktop: Sidebar Chat
  return (
    <Card className="h-full flex flex-col shadow-lg">
      <CardHeader className="pb-3 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Assistant</CardTitle>
          </div>
          {chatMessages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setChatMessages([])}
              className="h-8 w-8"
              title="Clear chat"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
        {chatContent}
      </CardContent>
    </Card>
  )
}

