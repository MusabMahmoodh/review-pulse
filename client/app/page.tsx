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
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo width={28} height={28} showText />
          <nav className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Start Free</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 md:py-24">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Stop collecting reviews.
            <br />
            <span className="text-primary">Start fixing what matters.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Review Pulse helps restaurants turn customer feedback into AI-powered,
            actionable insights — so you know exactly what to improve.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                See How It Works
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>QR-based customer reviews</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>AI-generated insights</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Turn feedback into action</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            Reviews are everywhere. Clarity is nowhere.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              { title: "Feedback scattered across platforms", desc: "Google, Facebook, Instagram — impossible to track." },
              { title: "No time to read everything", desc: "Hundreds of reviews pile up with no analysis." },
              { title: "Repetitive and unstructured", desc: "Hard to spot patterns or what really matters." },
              { title: "Important issues get buried", desc: "Critical problems missed until it's too late." },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-medium text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center font-medium text-muted-foreground">
            Reading reviews doesn't improve your business. Acting on them does.
          </p>
        </div>
      </section>

      {/* Solution Section */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            Review Pulse turns feedback into decisions.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: QrCode, title: "Collect", desc: "Customers leave feedback instantly via QR" },
              { icon: Brain, title: "Analyze", desc: "AI clusters reviews, detects patterns, finds issues" },
              { icon: Target, title: "Act", desc: "Clear, prioritized action items for your team" },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            From customer voice to team action — in minutes
          </h2>
          <div className="mt-10 space-y-4">
            {[
              { step: 1, title: "Collect", items: ["QR on tables, bills, or counters", "No app needed for customers"] },
              { step: 2, title: "Understand", items: ["AI identifies common complaints & praise", "Sentiment, themes, and urgency scored"] },
              { step: 3, title: "Improve", items: ["Actionable tasks generated", "Track what's fixed and what's pending"] },
            ].map((section) => (
              <div key={section.step} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {section.step}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
                </div>
                <ul className="mt-3 space-y-1.5 pl-11">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            Why restaurants choose Review Pulse
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              { icon: Clock, title: "Save time", desc: "No more reading hundreds of reviews" },
              { icon: Target, title: "Fix the right problems", desc: "AI highlights what impacts customers most" },
              { icon: Star, title: "Improve ratings organically", desc: "Fix issues before they hit public platforms" },
              { icon: Users, title: "Align your team", desc: "Everyone knows what to improve next" },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 rounded-lg border border-border bg-card p-5">
                <item.icon className="h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="font-medium text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            Built for real restaurant teams
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { icon: Building2, title: "Single-location owners" },
              { icon: Briefcase, title: "Multi-outlet chains" },
              { icon: BarChart3, title: "Operations managers" },
              { icon: Users, title: "CX teams" },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-border bg-card p-4 text-center">
                <item.icon className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-2 text-sm font-medium text-foreground">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            AI that works like a smart manager
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              { icon: Sparkles, title: "Groups similar feedback", desc: "Finds patterns across hundreds of reviews" },
              { icon: TrendingUp, title: "Detects recurring problems", desc: "Spots issues before they escalate" },
              { icon: Target, title: "Prioritizes urgency", desc: "Highlights what needs attention now" },
              { icon: Brain, title: "Learns over time", desc: "Gets smarter with your feedback" },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 rounded-lg border border-border bg-card p-5">
                <item.icon className="h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="font-medium text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center font-medium text-foreground">
            No black box. Just clear insights you can act on.
          </p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            Trusted by restaurant teams
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <p className="text-3xl font-bold text-primary">32%</p>
              <p className="mt-1 text-sm text-muted-foreground">Reduced negative reviews</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <p className="text-3xl font-bold text-primary">5+ hours</p>
              <p className="mt-1 text-sm text-muted-foreground">Saved per week on analysis</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Simple pricing. No surprises.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: CheckCircle2, text: "Start free" },
              { icon: TrendingUp, text: "Scale as you grow" },
              { icon: Shield, text: "No long-term contracts" },
            ].map((item) => (
              <div key={item.text} className="rounded-lg border border-border bg-card p-4">
                <item.icon className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-2 font-medium text-foreground">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/register">
              <Button size="lg">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl">
            Your customers are already talking.
          </h2>
          <p className="mt-2 text-lg text-primary-foreground/80">
            Review Pulse tells you what to do next.
          </p>
          <div className="mt-6">
            <Link href="/register">
              <Button size="lg" variant="secondary">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center sm:px-6">
          <p className="text-sm text-muted-foreground">
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
