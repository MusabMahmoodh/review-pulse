import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChefHat, QrCode, Sparkles, TrendingUp, Brain } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">FeedbackHub</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
            Understand your customers. Improve with AI. Grow your restaurant.
          </h1>
          <p className="text-xl text-muted-foreground text-pretty">
            Turn customer feedback into actionable insights that help your restaurant thrive.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 space-y-24">
        {/* Feature 1: Connect with Customers */}
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden">
            <CardHeader className="space-y-4 pb-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
                <QrCode className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl text-center text-balance">Connect with Your Customers</CardTitle>
              <CardDescription className="text-lg text-center text-pretty max-w-2xl mx-auto">
                Give customers an easy way to share their experience by scanning a QR code. Collect real feedback on
                food, staff, ambience, and overall service—directly from the people who matter most.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Quick feedback collection • Mobile-friendly forms • No app download required
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature 2: AI Insights */}
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden">
            <CardHeader className="space-y-4 pb-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl text-center text-balance">AI Creates Useful Insights</CardTitle>
              <CardDescription className="text-lg text-center text-pretty max-w-2xl mx-auto">
                Our AI analyzes feedback from your QR reviews, Google, Facebook, and Instagram to uncover patterns,
                trends, and customer sentiment—so you don't have to read hundreds of reviews.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Automatic sentiment analysis • Pattern detection • Multi-platform aggregation
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature 3: Smart Suggestions */}
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden">
            <CardHeader className="space-y-4 pb-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl text-center text-balance">Get Smart Suggestions from AI</CardTitle>
              <CardDescription className="text-lg text-center text-pretty max-w-2xl mx-auto">
                Let AI act as your restaurant consultant. Get clear, actionable suggestions based on real customer
                feedback—what to improve, what to keep, and what to fix first.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Prioritized recommendations • Data-driven advice • Continuous improvement guidance
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature 4: Growth */}
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden">
            <CardHeader className="space-y-4 pb-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl text-center text-balance">Take Your Business to the Next Level</CardTitle>
              <CardDescription className="text-lg text-center text-pretty max-w-2xl mx-auto">
                Turn feedback into action. Improve customer experience, increase ratings, and build stronger
                relationships that help your restaurant grow consistently.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Higher customer satisfaction • Better online ratings • Increased repeat business
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">Ready to understand your customers better?</h2>
            <p className="text-lg opacity-90 text-pretty max-w-2xl mx-auto">
              Start collecting feedback, get AI-powered insights, and watch your restaurant grow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <Link href="/demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-primary-foreground/20 hover:bg-primary-foreground/10 bg-transparent"
                >
                  View Demo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 FeedbackHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
