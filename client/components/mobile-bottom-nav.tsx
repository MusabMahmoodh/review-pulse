"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageSquare, Sparkles, CheckSquare, Users, QrCode } from "lucide-react"
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
    href: "/dashboard/team-members",
    label: "Team",
    icon: Users,
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background safe-area-inset-bottom">
      <div className="mx-auto max-w-lg px-2">
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-[48px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-2 transition-colors",
                  "active:bg-muted",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isActive && "text-primary"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[11px] font-medium leading-tight">
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

