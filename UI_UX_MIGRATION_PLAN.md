# Client UI/UX Migration Plan (Modern + Professional)

**Date:** 2026-02-16
**Product:** Review Pulse (`client/`)
**Objective:** Upgrade the current "old-school" UI into a clean, modern, professional SaaS experience without changing core product flows.

**Status:** 🟡 Planning — Ready for Implementation

---

## Quick Reference

| Aspect | Current State | Target State |
|--------|---------------|--------------|
| Style | Heavy glassmorphism | Clean, minimal depth |
| Animations | 15+ decorative keyframes | Functional only (150-250ms) |
| Colors | OKLCH with purple glow | HSL neutral-first palette |
| Shadows | Blur-heavy, soft | Crisp, layered elevation |
| Typography | Inconsistent | Systematic scale |
| Spacing | Variable | Strict 8px grid |

---

## 1) Goals

- Modern visual language (clear hierarchy, better spacing, consistent components)
- Professional SaaS feel across dashboard, admin, and customer-facing pages
- Strong usability on mobile + desktop
- Better accessibility (contrast, focus states, keyboard support)
- Keep migration safe: no backend/API behavior changes required for this phase

---

## 2) Scope

### In Scope
- Design foundation (tokens, typography, spacing, radius, shadows)
- Global app shell (header, navigation, mobile bottom nav, page containers)
- Core UI primitives usage cleanup (buttons, inputs, cards, dialogs, tables, badges)
- Dashboard and major feature pages visual refresh
- Theme consistency (light/dark support if retained)

### Out of Scope (for this migration)
- Major feature rewrites
- API contract changes
- New business logic or workflow redesign
- Full brand re-naming/re-positioning

---

## 3) Specific Issues Identified (Code Audit)

### 3.1 Excessive Decorative Animations (`globals.css:198-345`)

The following keyframes should be **removed entirely**:

```
animate-shimmer        → Dated loading effect
animate-gradient-shift → Unnecessary movement
animate-spin-slow      → No functional purpose
animate-pulse-glow     → Neon glow effect (unprofessional)
animate-sparkle        → Decorative only
animate-magic-pulse    → Decorative only
animate-particles      → Performance heavy
animate-float          → Distracting micro-animation
```

### 3.2 Glassmorphism Overuse (`globals.css:165-196`)

Current glass utilities are **too aggressive**:
- `backdrop-filter: blur(16px)` causes performance issues on mobile
- `--glass-shadow: 0 10px 32px` is too soft, reduces clarity
- Every card uses glass effect — creates visual fatigue

**Solution:** Reserve glass effect for elevated overlays (modals, popovers) only.

### 3.3 Landing Page Animation Overload (`app/page.tsx`)

Every element has staggered animations:
```tsx
// Lines 113-164: Every card has these
animate-in fade-in slide-in-from-left duration-700 delay-100
hover:shadow-lg transition-all duration-300 hover:-translate-y-1
group-hover:scale-110 group-hover:rotate-12
```

**Problem:** Creates slow, dated feel. Modern SaaS is instant and snappy.

### 3.4 Mobile Bottom Nav Touch Targets (`mobile-bottom-nav.tsx:77-80`)

```tsx
text-[10px]  // Too small - fails accessibility
```

**Fix:** Icon-only on mobile, text labels on tablet+.

### 3.5 Color System Complexity (`globals.css:6-91`)

Current OKLCH values are hard to maintain:
```css
--primary: oklch(0.56 0.16 258);  // What color is this?
```

**Fix:** Switch to HSL with semantic naming.

### 3.6 Stats Cards Visual Noise (`stats-cards.tsx:63-64`)

```tsx
<card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
// Each card has different colored icons — creates noise
```

**Fix:** Use neutral icons, data speaks for itself.

### Legacy UX Pain Points
- Inconsistent spacing and typography rhythm across screens
- Mixed visual styles between pages/components
- Dense information blocks with weak visual hierarchy
- Legacy-looking form/table/card styling
- Uneven mobile responsiveness in complex dashboard screens

---

## 4) Target Design Principles

1. **Clarity first**: every page has one obvious primary action
2. **Visual hierarchy**: strong page titles, section headers, and content grouping
3. **Consistency**: same component patterns everywhere
4. **Breathing room**: use spacing scale consistently for readability
5. **Accessibility by default**: contrast, focus visibility, semantic structure
6. **Performance-aware UI**: avoid heavy visual effects that hurt speed

---

## 5) Design System Foundation (Implementation Rules)

### 5.1 New Color Tokens (Replace in `globals.css`)

```css
/* ===== LIGHT MODE ===== */
:root {
  /* Surfaces - clean, not glassy */
  --background: hsl(0 0% 99%);
  --surface-1: hsl(0 0% 100%);
  --surface-2: hsl(220 14% 96%);
  --surface-3: hsl(220 13% 91%);

  /* Text - high contrast */
  --text-primary: hsl(220 20% 14%);
  --text-secondary: hsl(220 10% 46%);
  --text-muted: hsl(220 8% 62%);

  /* Borders - subtle */
  --border-default: hsl(220 13% 90%);
  --border-subtle: hsl(220 13% 94%);

  /* Accent - single brand color (refined blue) */
  --accent: hsl(230 85% 58%);
  --accent-hover: hsl(230 85% 52%);
  --accent-muted: hsl(230 40% 95%);

  /* Semantic states */
  --success: hsl(142 72% 42%);
  --warning: hsl(38 95% 50%);
  --error: hsl(0 84% 60%);

  /* Focus ring */
  --ring: hsl(230 85% 58% / 0.4);

  /* Shadows - crisp, not blurry */
  --shadow-sm: 0 1px 2px hsl(220 20% 14% / 0.05);
  --shadow-md: 0 4px 6px hsl(220 20% 14% / 0.07);
  --shadow-lg: 0 10px 15px hsl(220 20% 14% / 0.1);
}

/* ===== DARK MODE ===== */
.dark {
  --background: hsl(220 16% 10%);
  --surface-1: hsl(220 16% 13%);
  --surface-2: hsl(220 16% 17%);
  --surface-3: hsl(220 16% 22%);

  --text-primary: hsl(0 0% 98%);
  --text-secondary: hsl(220 10% 70%);
  --text-muted: hsl(220 8% 52%);

  --border-default: hsl(220 13% 24%);
  --border-subtle: hsl(220 13% 18%);

  --accent: hsl(230 85% 65%);
  --accent-hover: hsl(230 85% 72%);
  --accent-muted: hsl(230 40% 18%);

  --shadow-sm: 0 1px 2px hsl(0 0% 0% / 0.2);
  --shadow-md: 0 4px 6px hsl(0 0% 0% / 0.25);
  --shadow-lg: 0 10px 15px hsl(0 0% 0% / 0.3);
}
```

### 5.2 Typography Scale (Strict)

```css
/* Font stack - modern, readable */
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", monospace;

/* Scale (mobile-first) */
--text-xs: 0.75rem;      /* 12px - captions, badges */
--text-sm: 0.875rem;     /* 14px - secondary text */
--text-base: 1rem;       /* 16px - body */
--text-lg: 1.125rem;     /* 18px - lead paragraphs */
--text-xl: 1.25rem;      /* 20px - card titles */
--text-2xl: 1.5rem;      /* 24px - section titles */
--text-3xl: 1.875rem;    /* 30px - page titles */
--text-4xl: 2.25rem;     /* 36px - hero headings */

/* Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line heights */
--leading-tight: 1.2;    /* headings */
--leading-normal: 1.5;   /* body */
--leading-relaxed: 1.625; /* long-form */
```

### 5.3 Spacing Scale (8px Rhythm)

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### 5.4 Border Radius (Consistent)

```css
--radius-sm: 6px;     /* small inputs, badges */
--radius-md: 8px;     /* buttons, inputs */
--radius-lg: 12px;    /* cards */
--radius-xl: 16px;    /* modals, large cards */
```

### 5.5 Component Standards

| Component | Default Variant | Hover State | Focus State |
|-----------|-----------------|-------------|-------------|
| Button (primary) | `bg-accent text-white` | `bg-accent-hover shadow-md` | `ring-2 ring-ring` |
| Button (secondary) | `bg-surface-2 border` | `bg-surface-3` | `ring-2 ring-ring` |
| Button (ghost) | `transparent` | `bg-surface-2` | `ring-2 ring-ring` |
| Card | `bg-surface-1 border shadow-sm` | `shadow-md` (if clickable) | N/A |
| Input | `bg-surface-1 border` | N/A | `ring-2 ring-ring border-accent` |

---

## 6) Professional UI Style Guide (Team Standard)

This migration follows a **Premium Glassmorphism SaaS** style direction documented in `theme.md`.

## 6.1 Visual Tone
- Prioritize clarity and confidence over decorative visuals
- Use frosted translucent surfaces with restrained depth
- Keep interfaces calm: neutral backgrounds, restrained accents, low visual noise
- Use one primary accent color for actions and highlights

## 6.2 Layout and Spacing Rules
- Use 8px spacing rhythm (`4, 8, 12, 16, 24, 32, 40, 48`)
- Keep consistent page structure: title row → summary cards (if any) → core content
- Prefer card grouping for dense content; avoid long ungrouped blocks

## 6.3 Typography Rules
- Keep a predictable hierarchy: page title > section title > card title > body > caption
- Avoid overly small text in data-heavy tables/charts
- Use medium/semi-bold weights for headings and regular for body text

## 6.4 Components and Interaction
- Apply the glass layer recipe from `theme.md` for card-like surfaces
- Primary button appears once per section context; secondary actions remain visually quieter
- All forms must show clear labels, helper text (when needed), and inline validation messages
- Every data view includes explicit states: loading, empty, error, success
- Keep interactions fast and subtle (roughly `150–250ms`, no decorative animation)

## 6.5 Accessibility and Professional Quality Bar
- WCAG AA contrast target for text and interactive controls
- Visible keyboard focus for all actionable elements
- Semantic heading structure per page (`h1` once, then logical order)
- Tap targets and spacing must remain usable on mobile

## 6.6 PR Review Checklist (Required)
- [ ] Uses existing design tokens/components only (no one-off styling)
- [ ] Preserves spacing and typography hierarchy
- [ ] Includes all UI states (loading/empty/error)
- [ ] Passes keyboard and focus visibility checks
- [ ] Looks consistent with dashboard/admin/public app shell

---

## 7) Migration Phases

## Phase 0 — UI Audit + Baseline (1-2 days)
- Inventory all major pages and reusable components
- Capture baseline screenshots (desktop + mobile)
- Identify duplicate patterns and style drift
- Define “before/after” acceptance checklist

## Phase 1 — Foundation Refactor (2-3 days)
- Normalize global styles in `app/globals.css` + theme variables
- Align typography, spacing, radius, shadows
- Standardize shell structure in layout/navigation components

## Phase 2 — Core Component Modernization (2-4 days)
- Refine shared UI wrappers and common app components:
  - `components/stats-cards.tsx`
  - `components/feedback-list.tsx`
  - `components/ratings-chart.tsx`
  - `components/ratings-trend-chart.tsx`
  - `components/mobile-bottom-nav.tsx`
- Ensure all states (empty/loading/error) are visually consistent

## Phase 3 — Page-by-Page Refresh (4-6 days)
- Priority order:
  1. Dashboard home
  2. Feedback pages
  3. AI insights pages
  4. Actionable items
  5. Team members
  6. Settings
  7. Admin pages
  8. Public pages (`/login`, `/register`, `/feedback/[restaurantId]`, `/qr-code`, `/demo`)

## Phase 4 — Accessibility + Responsiveness Pass (2-3 days)
- Keyboard navigation checks
- Focus ring and form labeling verification
- Contrast checks for text and interactive elements
- Mobile breakpoints and content overflow cleanup

## Phase 5 — QA + Rollout (1-2 days)
- Compare against baseline screenshots
- Product sanity pass with realistic data
- Ship in one controlled release (or phased flags if preferred)

---

## 8) Definition of Done (UI/UX Migration)

Migration is complete when all are true:

- All primary user-facing pages use a consistent modern style
- No major visual regressions between desktop and mobile
- Core components follow one styling standard (no legacy variants in active views)
- Accessibility checks pass for key user journeys
- Team agrees the product now looks “modern and professional” in internal review

---

## 9) Risks and Mitigations

1. **Risk: Visual inconsistency returns over time**  
   **Mitigation:** Document component usage rules and add UI review checklist to PRs.

2. **Risk: Scope creep into feature redesign**  
   **Mitigation:** Keep this migration visual + usability focused; defer workflow changes.

3. **Risk: Breakpoints regressions on mobile**  
   **Mitigation:** Mandatory mobile QA for each migrated page before sign-off.

4. **Risk: Styling conflicts from legacy classes**  
   **Mitigation:** Refactor shared components first, then page-level cleanup.

---

## 10) Execution Checklist

- [ ] Approve this migration plan
- [ ] Complete Phase 0 UI audit and baseline screenshots
- [ ] Finalize design token decisions (type scale, spacing, radii, shadows)
- [ ] Migrate app shell + shared components
- [ ] Refresh all priority pages
- [ ] Run accessibility/mobile pass
- [ ] Final QA and release

---

---

## 11) Concrete Code Changes (Before/After)

### 11.1 Card Component (`components/ui/card.tsx`)

**Before:**
```tsx
className={cn(
  'glass-surface glass-hover text-card-foreground flex flex-col gap-6 rounded-2xl py-6',
  className,
)}
```

**After:**
```tsx
className={cn(
  'bg-surface-1 border border-border-default rounded-lg shadow-sm',
  'flex flex-col gap-4 p-5',
  className,
)}
```

### 11.2 Button Component (`components/ui/button.tsx`)

**Before:**
```tsx
default:
  'bg-primary text-primary-foreground shadow-[0_8px_24px_oklch(0.56_0.16_258/0.35)] hover:bg-primary/90',
```

**After:**
```tsx
default:
  'bg-accent text-white shadow-sm hover:bg-accent-hover hover:shadow-md transition-all duration-150',
```

### 11.3 Mobile Bottom Nav (`components/mobile-bottom-nav.tsx`)

**Before:**
```tsx
<span className={cn(
  "w-full truncate px-0.5 text-center text-[10px] font-medium",
  isActive ? "text-primary" : "text-muted-foreground"
)}>
  {item.label}
</span>
```

**After:**
```tsx
{/* Icon-only on mobile, label on sm+ */}
<span className={cn(
  "hidden sm:block text-xs font-medium mt-0.5",
  isActive ? "text-accent" : "text-text-secondary"
)}>
  {item.label}
</span>
```

### 11.4 Stats Cards (`components/stats-cards.tsx`)

**Before:**
```tsx
<Card key={card.label} className="border bg-card">
  <CardContent className="p-4 sm:p-5">
    <div className="rounded-md bg-muted p-2">
      <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
    </div>
```

**After:**
```tsx
<div key={card.label} className="bg-surface-1 border border-border-subtle rounded-lg p-4">
  <div className="flex items-center gap-3 mb-2">
    <card.icon className="h-4 w-4 text-text-muted" />
    <span className="text-sm text-text-secondary">{card.label}</span>
  </div>
  <p className="text-2xl font-semibold text-text-primary">{card.value}</p>
```

### 11.5 Header Navigation

**Before:**
```tsx
<header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
```

**After:**
```tsx
<header className="sticky top-0 z-50 border-b border-border-default bg-surface-1">
```

### 11.6 Landing Page Cards (`app/page.tsx`)

**Before:**
```tsx
<Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1
  animate-in fade-in slide-in-from-left duration-700 delay-100">
```

**After:**
```tsx
<div className="bg-surface-1 border border-border-default rounded-lg p-5
  hover:shadow-md transition-shadow duration-150">
```

---

## 12) Animation Cleanup Checklist

### Remove These Keyframes (from `globals.css`)

| Keyframe | Line | Reason |
|----------|------|--------|
| `shimmer` | 198-205, 268-275 | Duplicate, decorative |
| `gradient-shift` | 211-228 | Decorative movement |
| `spin-slow` | 234-242 | No functional purpose |
| `pulse-glow` | 259-266 | Neon glow, unprofessional |
| `float` | 277-284 | Distracting |
| `sparkle` | 286-295 | Decorative |
| `magic-pulse` | 297-304 | Decorative |
| `ripple` | 306-315, 328-337 | Duplicate, unused |
| `particles` | 317-326 | Performance heavy |

### Keep These (Refined)

```css
/* Functional transitions only */
.transition-base {
  transition: color, background-color, border-color, box-shadow 150ms ease;
}

.transition-transform {
  transition: transform 200ms ease;
}

/* Single page transition */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.page-enter {
  animation: fade-in 200ms ease-out;
}
```

---

## 13) Files Priority Order

| Priority | File | Effort | Impact |
|----------|------|--------|--------|
| P0 | `client/app/globals.css` | High | Critical |
| P1 | `client/components/ui/card.tsx` | Low | High |
| P1 | `client/components/ui/button.tsx` | Low | High |
| P2 | `client/app/page.tsx` | Medium | High |
| P2 | `client/app/dashboard/page.tsx` | Medium | High |
| P2 | `client/components/mobile-bottom-nav.tsx` | Low | Medium |
| P3 | `client/components/stats-cards.tsx` | Low | Medium |
| P3 | `client/components/ui/dialog.tsx` | Low | Medium |
| P3 | `client/components/ui/input.tsx` | Low | Medium |
| P4 | All other dashboard pages | Medium | Medium |

---

## 14) Success Criteria

- [ ] Zero decorative animations in production
- [ ] Page load time < 2s (Lighthouse)
- [ ] No `backdrop-filter` on critical rendering path
- [ ] WCAG AA contrast on all text (4.5:1 minimum)
- [ ] 44x44px minimum touch targets
- [ ] Consistent 8px spacing throughout
- [ ] Dark mode fully functional
- [ ] No OKLCH colors remaining (use HSL)

---

## 15) Reference Products (Visual Direction)

| Product | Learn From |
|---------|-----------|
| **Linear** | Clean, functional animations, minimal UI |
| **Vercel** | Professional dark mode, clear hierarchy |
| **Raycast** | Subtle depth, refined interactions |
| **Notion** | Content-first, quiet interface |
| **Stripe Dashboard** | Data visualization excellence |

---

## 16) Do NOT Include

- Gradient backgrounds
- Blur effects on mobile
- Animated icons
- Particle effects
- Glow/neon effects
- Staggered entrance animations (delay-100, delay-200, etc.)
- Complex shadows (max 2 elevation levels)
- More than 1 accent color

---

## 17) Suggested Next Step (Immediate)

1. **Approve this plan**
2. **Create branch:** `ui/modern-redesign`
3. **Start with `globals.css`** — replace color tokens and remove animations
4. **Test dark mode** after each component migration

---

*This document supersedes `theme.md` for implementation guidance.*
