# Vercel Functions Migration Progress

## Status
- **Started:** 2026-02-16
- **Goal:** Migrate from separate `server/` backend to Vercel Route Handlers in `client/app/api/**`.
- **Auth Direction:** Supabase Auth fully managed.

## Progress Board
- [x] Draft migration architecture plan ([VERCEL_FUNCTIONS_MIGRATION_PLAN.md](VERCEL_FUNCTIONS_MIGRATION_PLAN.md))
- [x] Set up Supabase auth/server utilities in `client/lib/`
- [x] Migrate auth endpoints/flows to Supabase-auth model (initial slice)
- [x] Migrate Team Members routes to Vercel Functions
- [x] Migrate Actionable Items routes
- [x] Migrate Feedback routes
- [x] Migrate Restaurant settings/routes
- [x] Migrate Admin routes
- [x] Migrate External Reviews routes
- [x] Migrate AI routes (including stream)
- [x] Update setup docs for Vercel-only deployment
- [x] Remove remaining client auth callback backend dependency
- [ ] Decommission separate backend deployment

## Current Sprint (In Progress)
1. Decommission separate backend deployment

## Completed This Session
- Added Supabase utility layer:
	- `client/lib/supabase/config.ts`
	- `client/lib/supabase/browser.ts`
	- `client/lib/supabase/server.ts`
- Added shared server helpers:
	- `client/lib/server/auth.ts`
	- `client/lib/server/subscription.ts`
- Added migrated route handlers:
	- `client/app/api/auth/register/route.ts`
	- `client/app/api/auth/me/route.ts`
	- `client/app/api/team-members/route.ts`
	- `client/app/api/team-members/[id]/route.ts`
	- `client/app/api/actionable-items/route.ts`
	- `client/app/api/actionable-items/by-source/route.ts`
	- `client/app/api/actionable-items/[id]/route.ts`
	- `client/app/api/feedback/submit/route.ts`
	- `client/app/api/feedback/list/route.ts`
	- `client/app/api/feedback/stats/route.ts`
	- `client/app/api/restaurants/keywords/route.ts`
	- `client/app/api/restaurants/meta-integration/route.ts`
	- `client/app/api/restaurants/review-page-settings/route.ts`
	- `client/app/api/restaurants/google-place-id/route.ts`
	- `client/app/api/admin/login/route.ts`
	- `client/app/api/admin/restaurants/route.ts`
	- `client/app/api/admin/restaurants/status/route.ts`
	- `client/app/api/admin/restaurants/promote-premium/route.ts`
	- `client/app/api/admin/restaurants/cancel-subscription/route.ts`
	- `client/app/api/external-reviews/list/route.ts`
	- `client/app/api/external-reviews/sync/route.ts`
	- `client/app/api/ai/insights/route.ts`
	- `client/app/api/ai/generate-insights/route.ts`
	- `client/app/api/ai/chat/route.ts`
	- `client/app/api/ai/chat/stream/route.ts`
- Updated client integration:
	- `client/lib/api-client.ts` now defaults to same-origin and uses Supabase login flow
	- `client/hooks/use-auth.ts` now syncs with Supabase session and signs out from Supabase
	- `client/lib/server/external-reviews-sync.ts` added for Google/Meta ingestion via Supabase
	- `client/lib/server/ai.ts` added for insight generation and chat logic
	- `client/app/api/auth/meta/authorize/route.ts` added for first-party Meta OAuth start
	- `client/app/api/auth/meta/callback/route.ts` migrated to Supabase-backed in-app token exchange/storage
	- `client/app/api/auth/google/callback/route.ts` no longer proxies to external backend URL
	- `client/lib/server/encryption.ts` now includes `encrypt()` helper for secure token persistence
	- `dev-setup.md` and `prod-setup.md` now lead with Vercel-only + Supabase architecture

## Notes
- Keeping API contracts stable where practical to avoid frontend breakage.
- Migrating in vertical slices with incremental validation.
