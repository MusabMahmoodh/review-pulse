"use client"

import { usePathname, useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useIsMobile()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex w-full overflow-x-hidden">
      {/* Desktop Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-200 w-full",
        !isMobile && "ml-64"
      )}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}

