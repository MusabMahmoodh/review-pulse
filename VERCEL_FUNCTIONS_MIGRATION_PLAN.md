# Vercel Functions Migration Plan (No Separate Backend)

**Date:** 2026-02-16  
**Goal:** Run Review Pulse as a single Next.js deployment on Vercel using Route Handlers (Vercel Functions), with no separately deployed `server/` service.

---

## 1) Target Architecture

- **Frontend + API:** `client/` Next.js app deployed to Vercel.
- **Backend logic location:** `client/app/api/**/route.ts` (Route Handlers).
- **Database:** Keep existing Supabase Postgres, accessed directly from Vercel Functions.
- **Secrets:** Managed in Vercel Project Environment Variables.
- **Auth model:** Fully managed by Supabase Auth (sessions/JWT issued by Supabase), validated in Route Handlers via Supabase server client.
- **Long-running work:** Move heavy sync/generation jobs to background-friendly patterns (chunked jobs, retries, or queued approach) to stay within Vercel limits.

---

## 2) Current API Surface to Migrate

Move existing server endpoints to Next.js Route Handlers with equivalent paths/methods:

### Auth (Supabase-managed)
- Replace custom auth endpoints with Supabase Auth flows:
   - Sign up / sign in / session refresh via Supabase client
   - Protected API route checks via Supabase session/JWT verification
- Keep only custom OAuth helper/callback routes if still needed by integrations (for example Meta/Google connect UX)

### Feedback
- `POST /api/feedback/submit`
- `GET /api/feedback/list`
- `GET /api/feedback/stats`

### Restaurants
- `GET /api/restaurants/keywords`
- `PUT /api/restaurants/keywords`
- `GET /api/restaurants/meta-integration`
- `GET /api/restaurants/review-page-settings`
- `PUT /api/restaurants/review-page-settings`
- `GET /api/restaurants/google-place-id`
- `PUT /api/restaurants/google-place-id`

### Admin
- `POST /api/admin/login`
- `GET /api/admin/restaurants`
- `PATCH /api/admin/restaurants/status`
- `POST /api/admin/restaurants/promote-premium`
- `POST /api/admin/restaurants/cancel-subscription`

### External Reviews
- `GET /api/external-reviews/list`
- `POST /api/external-reviews/sync`

### AI
- `GET /api/ai/insights`
- `POST /api/ai/generate-insights`
- `POST /api/ai/chat`
- `POST /api/ai/chat/stream`

### Actionable Items
- `GET /api/actionable-items`
- `POST /api/actionable-items`
- `PATCH /api/actionable-items/[id]`
- `DELETE /api/actionable-items/[id]`
- `GET /api/actionable-items/by-source`

### Team Members
- `GET /api/team-members`
- `POST /api/team-members`
- `PATCH /api/team-members/[id]`
- `DELETE /api/team-members/[id]`

---

## 3) Migration Strategy (Phased)

## Phase 0 — Preparation (1-2 days)

1. **Freeze API contract**
   - Confirm response shapes/status codes used by `client/lib/api-client.ts`.
   - Keep the same routes and payload contracts during migration.

2. **Choose serverless data access approach**
   - **Recommended:** Prisma or Drizzle for predictable serverless usage.
   - **Alternative (short-term):** Keep TypeORM with careful connection reuse in route handlers.

3. **Set up Supabase Auth as source of truth**
   - Configure Supabase Auth providers and redirect URLs.
   - Add Supabase browser/server clients in `client/lib/`.
   - Define authorization model (restaurant user vs admin), backed by Supabase user metadata and/or DB role mapping.

4. **Create shared server module in client app**
   - Add `client/lib/server/` for:
     - DB client singleton
     - Supabase auth guards/role checks
     - common error/response utilities

5. **Environment variable plan**
   - Map all server `.env` values into Vercel env vars.
   - Split by environment (`Development`, `Preview`, `Production`).

## Phase 1 — Low-risk endpoint migration (2-3 days)

Migrate read/write endpoints with minimal external dependencies first:

- Feedback endpoints
- Restaurants settings/keywords endpoints
- Team members
- Actionable items

Tasks:
- Implement Route Handlers in `client/app/api/**/route.ts`
- Add schema validation (Zod) per route
- Add auth middleware helpers where required
- Test each route from UI and direct HTTP calls

## Phase 2 — Supabase Auth + Admin authorization (2-3 days)

- Remove custom register/login/me backend logic and wire app to Supabase Auth APIs.
- Add server-side session verification for protected route handlers.
- Confirm admin role checks for admin routes using Supabase-backed authorization rules.

## Phase 3 — External integrations + AI (2-4 days)

- Migrate Google/Meta integration routes.
- Migrate AI endpoints (`generate-insights`, `chat`, `chat/stream`).
- Add timeout guards and explicit error mapping for provider failures.
- For streaming route, use Vercel streaming-compatible response handling.

## Phase 4 — Cutover and cleanup (1-2 days)

- Update client API base behavior to same-origin by default in production.
- Remove dependency on external backend URL for primary paths.
- Disable/decommission separate `server` deployment.
- Keep `server/` folder temporarily for rollback window, then archive/remove.

---

## 4) Repo Changes Planned

### In `client/`
- Add/expand `app/api/**/route.ts` handlers for every route listed above.
- Add `lib/server/*` shared backend utilities.
- Add Supabase clients/utilities for browser + server auth usage.
- Update `lib/api-client.ts`:
  - default to relative API calls (`/api/...`) for unified deployment,
  - keep optional override env var for local fallback if needed.

### In root docs
- Update `dev-setup.md` and `prod-setup.md` to remove separate backend hosting instructions.
- Add Vercel-only deployment flow with Supabase DB + Vercel env setup.

### In `server/`
- Mark as legacy during transition.
- Final step: retire after stable production soak period.

---

## 5) Environment Variables (Draft Mapping)

Keep or add in Vercel project settings:

- `DATABASE_URL` (or equivalent Postgres connection)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- `OPENAI_API_KEY`
- `SERPER_API_KEY` (if still used)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- Optional compatibility only: `NEXT_PUBLIC_API_URL` (set to empty for same-origin in production)

---

## 6) Risks and Mitigations

1. **DB connection saturation in serverless**
   - Use pooled/serverless-friendly DB driver setup.
   - Reuse singleton clients in runtime scope.

2. **Function timeout on sync/AI generation**
   - Add short timeouts + retries.
   - Move heavy work to async job pattern if needed.

3. **Auth regressions**
   - Add route-level auth tests for protected endpoints.
   - Validate Supabase session handling for browser + server requests (including expiry/refresh behavior).

4. **Streaming behavior differences**
   - Validate `chat/stream` on Vercel preview + prod.
   - Provide non-stream fallback endpoint.

---

## 7) Validation & Exit Criteria

Migration is complete when all are true:

- All routes in Section 2 are served by `client/app/api/**`.
- Dashboard and public feedback flows work without separate backend domain.
- No runtime calls depend on Railway/Hostinger backend URLs.
- AI and external review sync features pass smoke tests in Vercel preview and production.
- Production runs for 7 days with no P1/P2 backend incidents.

---

## 8) Suggested Execution Order (Practical)

1. Build shared server utilities in `client/lib/server`.
2. Set up Supabase browser/server auth clients and role checks.
3. Migrate Team Members + Actionable Items.
4. Migrate Feedback + Restaurants settings.
5. Migrate Admin + protected route authorization.
6. Migrate External Reviews + AI + streaming.
7. Cut over env/config to same-origin API.
8. Decommission separate backend deployment.

---

## 9) Rollback Plan

- Keep current `server` deployment alive during migration.
- If critical issue appears after cutover:
  - temporarily restore `NEXT_PUBLIC_API_URL` to old backend,
  - redeploy frontend,
  - triage and fix Vercel route handler issue,
  - reattempt cutover.

---

## 10) Definition of Done (MVP)

- Single Vercel project serves UI + APIs.
- Supabase remains only external core infra dependency.
- Authentication and session management are fully handled by Supabase Auth.
- No mandatory separately hosted Node backend in normal operations.
- Updated docs reflect Vercel-first architecture.
