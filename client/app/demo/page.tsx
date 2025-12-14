"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DemoPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard (using demo account)
    router.push("/dashboard")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting to demo dashboard...</p>
    </div>
  )
}
