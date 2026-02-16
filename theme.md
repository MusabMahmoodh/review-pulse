# Theme System — Premium Glassmorphism (Reference for All Components)

**Date:** 2026-02-16  
**Status:** Source of truth for UI styling  
**Applies to:** `client/` app and all shared components

---

## 1) Design Direction

Use a **premium, elegant glassmorphism** style with professional SaaS clarity:
- Frosted translucent surfaces over subtle gradients
- Soft but crisp borders
- High readability and restrained glow
- Minimal motion, high consistency

This is a **professional UI system**, not decorative/neon-heavy design.

---

## 2) Core Principles

1. **Readable first, glossy second**
2. **One visual language across dashboard, admin, and public pages**
3. **Glass depth through layering (surface + border + blur + shadow)**
4. **Accessible contrast in light and dark modes**
5. **No one-off styling outside design tokens**

---

## 3) Token Model (Glass Theme)

Use semantic tokens only.

## 3.1 Surface Tokens
- `--background`: app base layer
- `--card`: glass surface base
- `--popover`: elevated glass overlay
- `--muted`: subtle container tint

## 3.2 Glass-Specific Tokens
- `--glass-bg`: translucent panel fill
- `--glass-bg-strong`: stronger translucent fill for modal/top-level cards
- `--glass-border`: soft hairline border
- `--glass-highlight`: top-edge light reflection
- `--glass-shadow`: soft depth shadow
- `--glass-blur`: backdrop blur strength (e.g. `14px` to `20px`)

## 3.3 Accent + Semantic Tokens
- `--primary`: premium accent color (single brand accent)
- `--ring`: focus ring color
- `--destructive`: error state
- `--chart-*`: chart palette aligned to brand + neutral sophistication

---

## 4) Glass Layer Recipe (Mandatory)

For glass cards, always combine these 4 layers:

1. **Translucent fill** — `background: var(--glass-bg)`
2. **Hairline border** — `1px solid var(--glass-border)`
3. **Backdrop blur** — `backdrop-filter: blur(var(--glass-blur))`
4. **Soft depth shadow** — `box-shadow: var(--glass-shadow)`

Optional for premium hero/CTA cards:
- top highlight via inset/overlay using `--glass-highlight`

Do not stack multiple heavy shadows or saturated gradients.

---

## 5) Typography Standard

- Page title: strong, compact tracking
- Section title: clear, medium emphasis
- Card title: medium emphasis
- Body: comfortable line-height
- Meta/caption: muted but readable

Rules:
- Keep heading hierarchy strict (`h1` once per page)
- Avoid tiny text in dense analytics blocks
- Maintain consistent text contrast over translucent surfaces

---

## 6) Spacing + Radius + Motion

## 6.1 Spacing
Use 8px rhythm: `4, 8, 12, 16, 24, 32, 40, 48`.

## 6.2 Radius
- Small controls: 10–12px equivalent
- Standard cards: 14–16px equivalent
- Hero/high-emphasis glass card: 18–20px equivalent

## 6.3 Motion
- Micro transitions only (`150–250ms`)
- No decorative particle effects
- No continuous spinning/glowing in production surfaces

---

## 7) Component Recipes (Reference for All Components)

## 7.1 Card (`Card`, dashboard panels, summary blocks)
- Use glass recipe by default
- Header/body spacing must be consistent
- Hover = subtle border emphasis only

## 7.2 Navigation (top bar, mobile bottom nav)
- Semi-translucent glass container
- Clear active state via accent + contrast text
- Avoid animated icon effects

## 7.3 Buttons
- Primary: solid accent, crisp text, subtle shadow
- Secondary/outline: translucent or neutral surface with clear border
- Ghost: low emphasis, no visual noise
- Disabled: reduced contrast but still legible

## 7.4 Inputs/Selects/Textareas
- Light glass/neutral surface
- Strong focus ring (`--ring`)
- Validation states: semantic color only (error/success)

## 7.5 Tables/Lists/Rows
- Consistent density
- Mild row hover surface tint
- Always provide loading/empty/error states

## 7.6 Charts
- Use `--chart-*` tokens only
- Keep grid and labels subtle
- Avoid multicolor saturation overload

## 7.7 Dialogs/Drawers/Popovers
- Stronger glass level (`--glass-bg-strong`)
- Slightly stronger border + blur
- Maintain readable text and focus trapping

## 7.8 Badges/Status Pills
- Compact radius
- Semantic tint with readable foreground
- No strong glow effects

---

## 8) Component Coverage Map

This theme reference applies to all major component surfaces in:
- `client/components/ui/*`
- `client/components/stats-cards.tsx`
- `client/components/feedback-list.tsx`
- `client/components/ratings-chart.tsx`
- `client/components/ratings-trend-chart.tsx`
- `client/components/external-reviews.tsx`
- `client/components/ai-insights-content.tsx`
- `client/components/actionable-item-editor.tsx`
- `client/components/mobile-bottom-nav.tsx`
- `client/app/dashboard/**`
- `client/app/admin/**`
- `client/app/login/page.tsx`
- `client/app/register/page.tsx`
- `client/app/feedback/[restaurantId]/**`

If a component is not listed, it still must follow this token system.

---

## 9) Accessibility Guardrails

- Target WCAG AA contrast on all text over glass surfaces
- Focus rings must be visible on keyboard navigation
- Avoid translucent layers that reduce text clarity
- Ensure mobile tap targets remain comfortable

---

## 10) PR Acceptance Checklist

- [ ] Uses semantic tokens (no hard-coded ad-hoc colors)
- [ ] Uses glass layer recipe for card-like surfaces
- [ ] Preserves spacing/typography hierarchy
- [ ] Includes loading/empty/error states
- [ ] Passes keyboard focus visibility checks
- [ ] Maintains contrast readability in light/dark

---

## 11) Implementation Notes (Next Step)

1. Introduce glass tokens in `client/app/globals.css`.
2. Create reusable utility classes for glass surfaces (e.g. standard/elevated).
3. Apply to shared UI primitives first (`client/components/ui/*`).
4. Roll out page-by-page following migration plan order.
