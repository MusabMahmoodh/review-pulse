"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageSquare, Sparkles, CheckSquare, Users, QrCode, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

const navItems = [
  {
    href: "/dashboard",
    label: "Home",
    icon: Home,
  },
  {
    href: "/dashboard/feedback",
    label: "Feedback",
    icon: MessageSquare,
  },
  {
    href: "/dashboard/tags",
    label: "Tags",
    icon: Tag,
  },
  {
    href: "/dashboard/ai-insights",
    label: "AI",
    icon: Sparkles,
  },
  {
    href: "/dashboard/actionable-items",
    label: "Tasks",
    icon: CheckSquare,
  },
  {
    href: "/qr-code",
    label: "QR",
    icon: QrCode,
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const isMobile = useIsMobile()

  if (!isMobile) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-2xl safe-area-inset-bottom">
      <div className="container mx-auto px-1">
        <div className="flex items-center justify-around h-[70px] gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
              (item.href !== "/dashboard" && pathname?.startsWith(item.href))
            const isAI = item.href === "/dashboard/ai-insights"
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-w-0 flex-1 h-full transition-all duration-200",
                  "hover:bg-muted/50 active:bg-muted rounded-lg",
                  isActive && "text-primary",
                  isAI && "relative"
                )}
              >
                <div className={cn(
                  "relative flex items-center justify-center transition-transform duration-200",
                  isActive && "scale-110"
                )}>
                  {/* Animated glow effect for AI button */}
                  {isAI && (
                    <>
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-indigo-500/20 blur-md animate-pulse" />
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-400/30 via-pink-400/30 to-indigo-400/30 blur-sm animate-pulse" style={{ animationDelay: '0.5s' }} />
                    </>
                  )}
                  <div className={cn(
                    "p-2 rounded-lg transition-colors duration-200 relative z-10",
                    isActive && "bg-primary/10",
                    isAI && !isActive && "bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-indigo-500/10"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5 transition-colors duration-200 relative z-10",
                      isActive ? "text-primary" : "text-muted-foreground",
                      isAI && !isActive && "text-purple-500 dark:text-purple-400",
                      isAI && !isActive && "animate-spin-slow"
                    )} />
                  </div>
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-pulse" />
                  )}
                  {/* Sparkle particles for AI button */}
                  {isAI && (
                    <>
                      <span className="absolute top-0 right-0 w-1 h-1 rounded-full bg-purple-400 animate-ping" style={{ animationDelay: '0s', animationDuration: '2s' }} />
                      <span className="absolute bottom-0 left-0 w-1 h-1 rounded-full bg-pink-400 animate-ping" style={{ animationDelay: '1s', animationDuration: '2s' }} />
                      <span className="absolute top-1/2 left-0 w-0.5 h-0.5 rounded-full bg-indigo-400 animate-ping" style={{ animationDelay: '0.5s', animationDuration: '1.5s' }} />
                    </>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-semibold leading-tight text-center truncate w-full px-0.5 transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground",
                  isAI && !isActive && "text-purple-600 dark:text-purple-400"
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

