"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  QrCode,
  Sparkles,
  Brain,
  TrendingUp,
  CheckCircle2,
  Users,
  Clock,
  Target,
  Star,
  ArrowRight,
  BarChart3,
  Building2,
  Briefcase,
  Shield,
} from "lucide-react"
import { Logo } from "@/components/logo"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo width={32} height={32} showText />
          <nav className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Start Free</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section - Cinematic */}
      <section className="relative pt-32 pb-24 md:pt-44 md:pb-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Stop collecting reviews.
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                Start fixing what matters.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Review Pulse helps restaurants turn customer feedback into AI-powered,
              actionable insights — so you know exactly what to improve.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 text-base">
                  Start Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>

          {/* Feature pills */}
          <div className="mt-16 flex flex-wrap justify-center gap-3">
            {[
              "QR-based customer reviews",
              "AI-generated insights",
              "Turn feedback into action",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="border-y border-border bg-muted/30 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Reviews are everywhere.
              <br />
              <span className="text-muted-foreground">Clarity is nowhere.</span>
            </h2>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-4 md:grid-cols-2">
            {[
              { title: "Feedback scattered across platforms", desc: "Google, Facebook, Instagram — impossible to track everything." },
              { title: "No time to read everything", desc: "Hundreds of reviews pile up with no time to analyze them." },
              { title: "Repetitive and unstructured", desc: "Hard to spot patterns or understand what really matters." },
              { title: "Important issues get buried", desc: "Critical problems missed until it's too late to fix them." },
            ].map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
              >
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-12 max-w-xl text-center text-lg font-medium text-muted-foreground">
            Reading reviews doesn't improve your business.
            <span className="text-foreground"> Acting on them does.</span>
          </p>
        </div>
      </section>

      {/* Solution Section - 3 Pillars */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Review Pulse turns feedback
              <br />
              <span className="text-primary">into decisions.</span>
            </h2>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
            {[
              { icon: QrCode, title: "Collect", desc: "Customers leave feedback instantly via QR code — no app needed." },
              { icon: Brain, title: "Analyze", desc: "AI clusters reviews, detects patterns, and finds real issues." },
              { icon: Target, title: "Act", desc: "Get clear, prioritized action items for your team." },
            ].map((item, i) => (
              <div key={item.title} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="mt-3 text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Timeline */}
      <section id="how-it-works" className="border-y border-border bg-muted/30 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              From customer voice to team action
              <br />
              <span className="text-muted-foreground">— in minutes.</span>
            </h2>
          </div>

          <div className="mx-auto mt-16 max-w-3xl space-y-6">
            {[
              { step: 1, title: "Collect", items: ["QR on tables, bills, or counters", "No app needed for customers"] },
              { step: 2, title: "Understand", items: ["AI identifies common complaints & praise", "Sentiment, themes, and urgency scored"] },
              { step: 3, title: "Improve", items: ["Actionable tasks generated automatically", "Track what's fixed and what's pending"] },
            ].map((section) => (
              <div
                key={section.step}
                className="flex gap-6 rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                  {section.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground">{section.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Why restaurants choose
              <br />
              <span className="text-primary">Review Pulse</span>
            </h2>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-2">
            {[
              { icon: Clock, title: "Save time", desc: "No more reading hundreds of reviews manually." },
              { icon: Target, title: "Fix the right problems", desc: "AI highlights what impacts customers most." },
              { icon: Star, title: "Improve ratings organically", desc: "Fix issues before they hit public platforms." },
              { icon: Users, title: "Align your team", desc: "Everyone knows what to improve next." },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-5 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="border-y border-border bg-muted/30 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Built for real restaurant teams
            </h2>
          </div>

          <div className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-4">
            {[
              { icon: Building2, title: "Single-location owners" },
              { icon: Briefcase, title: "Multi-outlet chains" },
              { icon: BarChart3, title: "Operations managers" },
              { icon: Users, title: "Customer experience teams" },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3"
              >
                <item.icon className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              AI that works like
              <br />
              <span className="text-primary">a smart manager</span>
            </h2>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-4 md:grid-cols-2">
            {[
              { icon: Sparkles, title: "Groups similar feedback", desc: "Finds patterns across hundreds of reviews automatically." },
              { icon: TrendingUp, title: "Detects recurring problems", desc: "Spots issues before they escalate into crises." },
              { icon: Target, title: "Prioritizes by urgency", desc: "Highlights what needs your attention right now." },
              { icon: Brain, title: "Learns over time", desc: "Gets smarter with every piece of feedback." },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-2xl border border-border bg-card p-6"
              >
                <item.icon className="h-6 w-6 shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-12 max-w-lg text-center text-lg font-medium text-foreground">
            No black box. Just clear insights you can act on.
          </p>
        </div>
      </section>

      {/* Stats - Cinematic */}
      <section className="border-y border-border bg-muted/30 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Trusted by restaurant teams
            </h2>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-5xl font-bold text-primary md:text-6xl">32%</p>
              <p className="mt-3 text-lg text-muted-foreground">Reduced negative reviews</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-5xl font-bold text-primary md:text-6xl">5+</p>
              <p className="mt-3 text-lg text-muted-foreground">Hours saved per week</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Simple pricing.
              <br />
              <span className="text-muted-foreground">No surprises.</span>
            </h2>
          </div>

          <div className="mx-auto mt-12 flex max-w-2xl flex-wrap justify-center gap-4">
            {[
              { icon: CheckCircle2, text: "Start free" },
              { icon: TrendingUp, text: "Scale as you grow" },
              { icon: Shield, text: "No long-term contracts" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3"
              >
                <item.icon className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 text-base">
                Start Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA - Cinematic */}
      <section className="relative overflow-hidden bg-primary py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-foreground/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary-foreground md:text-4xl lg:text-5xl">
            Your customers are already talking.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-xl text-primary-foreground/80">
            Review Pulse tells you what to do next.
          </p>
          <div className="mt-10">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="h-12 px-8 text-base">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <Logo width={28} height={28} className="mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">
            © 2026 Review Pulse. All rights reserved.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Every review is a growth opportunity.
          </p>
        </div>
      </footer>
    </div>
  )
}
