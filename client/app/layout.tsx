import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { ToasterSimple } from "@/components/ui/toaster-simple"
import { ReactQueryProvider } from "@/lib/react-query"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Review Pulse - Restaurant Customer Insights",
  description: "Collect customer feedback, track trends, and improve restaurant performance.",
  generator: "v0.app",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <ReactQueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <ToasterSimple />
          </ThemeProvider>
        </ReactQueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
