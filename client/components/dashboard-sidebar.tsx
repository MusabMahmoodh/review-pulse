"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageSquare, MessageCircle, Tag, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Logo } from "@/components/logo"

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
    href: "/dashboard/chat",
    label: "Chat",
    icon: MessageCircle,
  },
  {
    href: "/dashboard/tags",
    label: "Tags",
    icon: Tag,
  },
  {
    href: "/dashboard/people",
    label: "People",
    icon: Users,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const isMobile = useIsMobile()

  // Only show on desktop
  if (isMobile) {
    return null
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-40 flex flex-col">
      {/* Logo */}
      <div className="h-16 border-b flex items-center px-6">
        <Logo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && pathname?.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "hover:bg-muted/50",
                isActive && "bg-primary/10 text-primary font-medium"
              )}
            >
              <Icon className={cn(
                "h-5 w-5",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-sm",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

