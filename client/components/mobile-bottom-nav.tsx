"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageSquare, Sparkles, CheckSquare, Settings, QrCode } from "lucide-react"
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
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
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
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-w-0 flex-1 h-full transition-all duration-200",
                  "hover:bg-muted/50 active:bg-muted rounded-lg",
                  isActive && "text-primary"
                )}
              >
                <div className={cn(
                  "relative flex items-center justify-center transition-transform duration-200",
                  isActive && "scale-110"
                )}>
                  <div className={cn(
                    "p-2 rounded-lg transition-colors duration-200",
                    isActive && "bg-primary/10"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5 transition-colors duration-200",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-semibold leading-tight text-center truncate w-full px-0.5 transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
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

