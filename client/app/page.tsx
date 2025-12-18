"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  QrCode,
  Sparkles,
  Brain,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Users,
  Clock,
  Target,
  Star,
  ArrowRight,
  Zap,
  BarChart3,
  Lightbulb,
  Building2,
  Briefcase,
  Shield,
} from "lucide-react"
import { Logo } from "@/components/logo"
import { useEffect, useState } from "react"

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-gradient-shift" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-gradient-shift delay-1000" />
      </div>

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 animate-in fade-in slide-in-from-top duration-500">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="animate-in slide-in-from-left duration-700 delay-100">
            <Logo width={32} height={32} showText className="animate-in zoom-in duration-700" />
          </div>
          <nav className="flex items-center gap-4 animate-in slide-in-from-right duration-700 delay-200">
            <Link href="/login">
              <Button variant="ghost" className="transition-all hover:scale-105">Login</Button>
            </Link>
            <Link href="/register">
              <Button className="transition-all hover:scale-105 hover:shadow-lg">Start Free</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* 1️⃣ HERO SECTION */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Main heading with animation */}
          <h1
            className={`text-4xl md:text-6xl font-bold tracking-tight text-balance transition-all duration-1000 ${
              mounted
                ? "animate-in fade-in slide-in-from-bottom-4 duration-1000"
                : "opacity-0 translate-y-4"
            }`}
          >
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Stop collecting reviews.
            </span>
            <br />
            <span
              className={`inline-block transition-all duration-1000 delay-300 ${
                mounted
                  ? "animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300"
                  : "opacity-0 translate-y-4"
              }`}
            >
              Start fixing what matters.
            </span>
          </h1>

          {/* Subtitle with animation */}
          <p
            className={`text-xl text-muted-foreground text-pretty max-w-3xl mx-auto transition-all duration-1000 delay-500 ${
              mounted
                ? "animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500"
                : "opacity-0 translate-y-4"
            }`}
          >
            Guestra helps restaurants turn customer feedback into AI-powered, actionable insights — so you know exactly
            what to improve.
          </p>

          {/* CTA Buttons with animation */}
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center pt-4 transition-all duration-1000 delay-700 ${
              mounted
                ? "animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700"
                : "opacity-0 translate-y-4"
            }`}
          >
            <Link href="/register">
              <Button
                size="lg"
                className="w-full sm:w-auto group relative overflow-hidden transition-all hover:scale-105 hover:shadow-xl"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-transparent transition-all hover:scale-105 hover:bg-accent"
              >
                See How It Works
              </Button>
            </Link>
          </div>

          {/* Features list with staggered animation */}
          <div
            className={`flex flex-wrap justify-center gap-6 pt-8 text-sm text-muted-foreground transition-all duration-1000 delay-1000 ${
              mounted
                ? "animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-1000"
                : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-center gap-2 group">
              <CheckCircle2 className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
              <span className="transition-colors group-hover:text-foreground">QR-based customer reviews</span>
            </div>
            <div className="flex items-center gap-2 group">
              <CheckCircle2 className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
              <span className="transition-colors group-hover:text-foreground">AI-generated insights & priorities</span>
            </div>
            <div className="flex items-center gap-2 group">
              <CheckCircle2 className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
              <span className="transition-colors group-hover:text-foreground">Turn feedback into action items</span>
            </div>
          </div>
        </div>

        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 opacity-10 animate-spin-slow hidden lg:block">
          <QrCode className="w-full h-full text-primary" />
        </div>
        <div className="absolute bottom-20 right-10 w-16 h-16 opacity-10 animate-spin-slow hidden lg:block" style={{ animationDirection: "reverse" }}>
          <Brain className="w-full h-full text-primary" />
        </div>
      </section>

      {/* 2️⃣ PROBLEM SECTION */}
      <section className="container mx-auto px-4 py-16 md:py-24 bg-muted/30 relative">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">Reviews are everywhere. Clarity is nowhere.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-left duration-700 delay-100">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5 transition-transform group-hover:scale-110" />
                  <div>
                    <h3 className="font-semibold mb-2">Customers leave reviews on multiple platforms</h3>
                    <p className="text-sm text-muted-foreground">
                      Feedback scattered across Google{/*, Facebook, Instagram*/}, and more. Impossible to track.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-right duration-700 delay-200">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5 transition-transform group-hover:scale-110" />
                  <div>
                    <h3 className="font-semibold mb-2">Managers don't have time to read everything</h3>
                    <p className="text-sm text-muted-foreground">
                      Hundreds of reviews pile up. No time to analyze, prioritize, or act on them.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-left duration-700 delay-300">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5 transition-transform group-hover:scale-110" />
                  <div>
                    <h3 className="font-semibold mb-2">Feedback is repetitive, emotional, and unstructured</h3>
                    <p className="text-sm text-muted-foreground">
                      Same complaints repeated. Hard to spot patterns or understand what really matters.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-right duration-700 delay-400">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5 transition-transform group-hover:scale-110" />
                  <div>
                    <h3 className="font-semibold mb-2">Important issues get buried</h3>
                    <p className="text-sm text-muted-foreground">
                      Critical problems hidden among noise. Urgent fixes missed until it's too late.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="text-center pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <p className="text-lg font-semibold text-muted-foreground">
              Reading reviews doesn't improve your business. Acting on them does.
            </p>
          </div>
        </div>
      </section>

      {/* 3️⃣ SOLUTION / VALUE PROPOSITION */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">Guestra turns feedback into decisions.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <CardHeader>
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 transition-all group-hover:bg-primary/20 group-hover:scale-110">
                  <QrCode className="h-8 w-8 text-primary transition-transform group-hover:rotate-12" />
                </div>
                <CardTitle className="text-2xl">Collect</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Customers leave feedback instantly via QR</p>
              </CardContent>
            </Card>
            <Card className="text-center group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <CardHeader>
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 transition-all group-hover:bg-primary/20 group-hover:scale-110">
                  <Brain className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                </div>
                <CardTitle className="text-2xl">Analyze</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">AI clusters reviews, detects patterns, and finds real issues</p>
              </CardContent>
            </Card>
            <Card className="text-center group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <CardHeader>
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 transition-all group-hover:bg-primary/20 group-hover:scale-110">
                  <Target className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                </div>
                <CardTitle className="text-2xl">Act</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Clear, prioritized action items for your team</p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="group transition-all hover:scale-105">
                See It in Action
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4️⃣ HOW IT WORKS */}
      <section id="how-it-works" className="container mx-auto px-4 py-16 md:py-24 bg-muted/30">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">
              From customer voice to team action — in minutes
            </h2>
          </div>
          <div className="space-y-8">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-left duration-700 delay-100">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl transition-transform group-hover:scale-110 group-hover:rotate-6">
                    1
                  </div>
                  <CardTitle className="text-2xl">Collect</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2 group/item">
                    <CheckCircle2 className="h-4 w-4 text-primary transition-transform group-hover/item:scale-110" />
                    <span>QR on tables, bills, or counters</span>
                  </li>
                  <li className="flex items-center gap-2 group/item">
                    <CheckCircle2 className="h-4 w-4 text-primary transition-transform group-hover/item:scale-110" />
                    <span>No app needed for customers</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-right duration-700 delay-200">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl transition-transform group-hover:scale-110 group-hover:rotate-6">
                    2
                  </div>
                  <CardTitle className="text-2xl">Understand</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2 group/item">
                    <CheckCircle2 className="h-4 w-4 text-primary transition-transform group-hover/item:scale-110" />
                    <span>AI identifies common complaints & praise</span>
                  </li>
                  <li className="flex items-center gap-2 group/item">
                    <CheckCircle2 className="h-4 w-4 text-primary transition-transform group-hover/item:scale-110" />
                    <span>Sentiment, themes, and urgency scored</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-left duration-700 delay-300">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl transition-transform group-hover:scale-110 group-hover:rotate-6">
                    3
                  </div>
                  <CardTitle className="text-2xl">Improve</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2 group/item">
                    <CheckCircle2 className="h-4 w-4 text-primary transition-transform group-hover/item:scale-110" />
                    <span>Actionable tasks</span>
                  </li>
                  <li className="flex items-center gap-2 group/item">
                    <CheckCircle2 className="h-4 w-4 text-primary transition-transform group-hover/item:scale-110" />
                    <span>Track what's fixed and what's pending</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 5️⃣ CORE BENEFITS */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">Why restaurants choose Guestra</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-primary transition-transform group-hover:scale-110 group-hover:rotate-12" />
                  <CardTitle>Save time</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No more reading hundreds of reviews</p>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
                  <CardTitle>Fix the right problems</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">AI highlights what impacts customers most</p>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Star className="h-6 w-6 text-primary transition-transform group-hover:scale-110 group-hover:rotate-12" />
                  <CardTitle>Improve ratings organically</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Fix issues before they hit public platforms</p>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
                  <CardTitle>Align your team</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Everyone knows what to improve next</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 6️⃣ USE CASES / WHO IT'S FOR */}
      <section className="container mx-auto px-4 py-16 md:py-24 bg-muted/30">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">Built for real restaurant teams</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <CardHeader>
                <Building2 className="h-8 w-8 text-primary mx-auto mb-2 transition-transform group-hover:scale-110 group-hover:rotate-6" />
                <CardTitle>Single-location owners</CardTitle>
              </CardHeader>
            </Card>
            <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <CardHeader>
                <Briefcase className="h-8 w-8 text-primary mx-auto mb-2 transition-transform group-hover:scale-110 group-hover:rotate-6" />
                <CardTitle>Multi-outlet chains</CardTitle>
              </CardHeader>
            </Card>
            <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2 transition-transform group-hover:scale-110 group-hover:rotate-6" />
                <CardTitle>Operations managers</CardTitle>
              </CardHeader>
            </Card>
            <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mx-auto mb-2 transition-transform group-hover:scale-110 group-hover:rotate-6" />
                <CardTitle>Customer experience teams</CardTitle>
              </CardHeader>
            </Card>
          </div>
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <p className="text-lg text-muted-foreground">If customer experience matters, Guestra fits.</p>
          </div>
        </div>
      </section>

      {/* 7️⃣ AI DIFFERENTIATION */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">AI that works like a smart manager</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-left duration-700 delay-100">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                  <div>
                    <h3 className="font-semibold mb-1">Groups similar feedback</h3>
                    <p className="text-sm text-muted-foreground">Finds patterns across hundreds of reviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-right duration-700 delay-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-primary mt-0.5 transition-transform group-hover:scale-110" />
                  <div>
                    <h3 className="font-semibold mb-1">Detects recurring problems</h3>
                    <p className="text-sm text-muted-foreground">Spots issues before they escalate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-left duration-700 delay-300">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5 transition-transform group-hover:scale-110" />
                  <div>
                    <h3 className="font-semibold mb-1">Highlights urgent vs minor issues</h3>
                    <p className="text-sm text-muted-foreground">Prioritizes what needs attention now</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-right duration-700 delay-400">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5 transition-transform group-hover:scale-110" />
                  <div>
                    <h3 className="font-semibold mb-1">Learns over time</h3>
                    <p className="text-sm text-muted-foreground">Gets smarter with your feedback</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="text-center pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <p className="text-lg font-semibold">No black box. Just clear insights you can act on.</p>
          </div>
        </div>
      </section>

      {/* 8️⃣ SOCIAL PROOF */}
      <section className="container mx-auto px-4 py-16 md:py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">Trusted by restaurant teams</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 animate-in fade-in slide-in-from-left duration-700 delay-100">
              <CardContent className="p-6 text-center space-y-4">
                <div className="text-3xl font-bold text-primary transition-transform group-hover:scale-110">32%</div>
                <p className="text-muted-foreground">Reduced negative reviews</p>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 animate-in fade-in slide-in-from-right duration-700 delay-200">
              <CardContent className="p-6 text-center space-y-4">
                <div className="text-3xl font-bold text-primary transition-transform group-hover:scale-110">5+ hours</div>
                <p className="text-muted-foreground">Saved per week on review analysis</p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <p className="text-muted-foreground">Early access partners shaping the future of feedback</p>
          </div>
        </div>
      </section>

      {/* 9️⃣ PRICING TEASER */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">Simple pricing. No surprises.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="h-6 w-6 text-primary mx-auto mb-2 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                <p className="font-semibold">Start free</p>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2 transition-transform group-hover:scale-110" />
                <p className="font-semibold">Scale as you grow</p>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <CardContent className="p-6 text-center">
                <Shield className="h-6 w-6 text-primary mx-auto mb-2 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                <p className="font-semibold">No long-term contracts</p>
              </CardContent>
            </Card>
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
            <Link href="/register">
              <Button size="lg" className="group transition-all hover:scale-105 hover:shadow-xl">
                <span className="flex items-center gap-2">
                  Start Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 🔟 FINAL CTA */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <Card className="bg-primary text-primary-foreground group hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CardContent className="p-8 md:p-12 text-center space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <h2 className="text-3xl md:text-4xl font-bold text-balance relative z-10">Your customers are already talking.</h2>
            <p className="text-lg opacity-90 text-pretty max-w-2xl mx-auto relative z-10">
              Guestra tells you what to do next.
            </p>
            <div className="pt-2 relative z-10">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto group/btn transition-all hover:scale-105 hover:shadow-xl">
                  <span className="flex items-center gap-2">
                    Get Started Free
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Guestra. All rights reserved.</p>
          <p className="mt-2 text-xs">every review is a growth opportunity</p>
        </div>
      </footer>
    </div>
  )
}

