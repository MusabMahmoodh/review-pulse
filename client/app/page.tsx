import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChefHat, QrCode, Sparkles, TrendingUp, Brain } from "lucide-react"

const PRICING_PLANS = [
  {
    id: "free",
    name: "Free",
    price: "LKR 0",
    highlight: "Perfect for getting started",
    features: ["Collect feedback with QR codes", "Basic dashboard", "Unlimited responses"],
  },
  {
    id: "premium",
    name: "Premium",
    price: "LKR 10,000 / month",
    highlight: "AI + social media insights and consultations",
    features: [
      "Everything in Free",
      "AI insights on all feedback",
      "Google, Facebook & Instagram reviews",
      "AI-powered strategy consultations",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Talk to us",
    highlight: "For multi-location restaurant groups",
    features: ["Custom onboarding", "Dedicated support", "Advanced reporting & integrations"],
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Review Pulse</span>
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

      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-balance">Choose the right plan for your restaurant</h2>
          <p className="text-muted-foreground text-pretty max-w-2xl mx-auto">
            Start free to collect feedback, upgrade to unlock AI and social media insights, or talk to us for
            enterprise needs.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`flex flex-col h-full ${
                plan.popular ? "border-primary shadow-lg shadow-primary/10 relative" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold shadow-sm">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="pt-6 pb-4 space-y-2">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.highlight}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4 pb-6">
                <div className="text-left">
                  <div className="text-2xl font-bold">{plan.price}</div>
                </div>
                <ul className="space-y-2 text-sm text-left text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4 mt-auto">
                  {plan.id === "enterprise" ? (
                    <Link href="/contact">
                      <Button className="w-full" variant="outline">
                        Talk to us
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/register">
                      <Button className="w-full" variant={plan.id === "premium" ? "default" : "outline"}>
                        {plan.id === "free" ? "Get started free" : "Start Premium"}
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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
          <p>© 2025 Review Pulse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}