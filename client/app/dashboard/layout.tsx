"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex w-full overflow-x-hidden">
      {/* Desktop Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-200 w-full h-full min-h-0",
        !isMobile && "ml-64"
      )}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}

