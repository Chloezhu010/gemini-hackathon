# Plan: Open-Source WonderComic for Gemini Hackathon

## Context

WonderComic needs a public repo for the Gemini 3 hackathon (deadline Feb 9). The current codebase has Supabase Auth, Stripe payments, a credit system, and PostgreSQL — all proprietary features that shouldn't be open-sourced. We'll create a clean copy with those stripped out, replacing the DB with SQLite and removing auth entirely (single-user local app). Landing page removed — users go straight to the app.

---

## Step 1: Create New Repo & Copy Files

Create a new directory (or new git repo) and copy everything except:
- `.git/`, `node_modules/`, `__pycache__/`, `.venv/`, `dist/`, `uv.lock`, `package-lock.json`
- `.env` (contains secrets)
- `backend/wondercomic.db` (test artifact)

```bash
mkdir wondercomic-oss && cd wondercomic-oss
git init
# Copy backend/ and frontend/ from the original repo
# Create fresh .env.example, .gitignore, README.md
```

---

## Step 2: Backend — Delete Payment/Auth Files

**Delete entirely:**
- `backend/credit_routes.py`
- `backend/credit_crud.py`
- `backend/stripe_credits_routes.py`
- `backend/auth.py`
- `backend/storage.py` (Supabase Storage)
- `backend/migrations/003_add_credits.sql`
- `backend/migrations/004_add_purchase_idempotency.sql`
- `backend/migrations/005_add_unlock_recovery.sql`
- All credit/stripe tests: `tests/test_credits.py`, `tests/test_api_stripe.py`, `tests/test_panel_edit_credits.py`

---

## Step 3: Backend — Rewrite `database.py` (asyncpg → aiosqlite)

Replace the PostgreSQL connection pool with a single SQLite connection via `aiosqlite`. Create tables inline on startup:
- `kid_profiles` (keep as-is, `user_id` defaults to `'local-user'`)
- `stories` (keep, remove unlock fields, `is_unlocked` always `1`)
- `panels` (keep as-is)

Remove tables: `user_credits`, `credit_transactions`, `orders`, `processed_webhooks`

**File:** `backend/database.py`

---

## Step 4: Backend — Simplify `config.py`

Only require `GEMINI_API_KEY`. Add optional `DB_PATH` (default `wondercomic.db`) and `FRONTEND_URL`. Remove all Supabase/Stripe env vars.

**File:** `backend/config.py`

---

## Step 5: Backend — Rewrite `crud.py` (PostgreSQL → SQLite)

Key syntax changes:
- `$1, $2` → `?, ?`
- `fetchrow()` / `fetch()` → `cursor.fetchone()` / `cursor.fetchall()`
- `RETURNING id` → `cursor.lastrowid`
- `NOW()` → `CURRENT_TIMESTAMP`
- Replace Supabase Storage uploads with local file saves to `backend/images/`
- Replace Supabase Storage deletes with `os.unlink()`
- Hardcode `user_id = "local-user"` (or just ignore user filtering)

**File:** `backend/crud.py`

---

## Step 6: Backend — Rewrite `main.py`

Changes:
1. **Remove imports:** `credit_crud`, `auth`, `credit_routes`, `stripe_credit_routes`, `UnlockStoryRequest/Response`
2. **Remove router registrations:** `credit_router`, `stripe_credit_router`
3. **Remove `Depends(get_current_user)`** from all endpoints — use `user_id = "local-user"`
4. **Replace `asyncpg.Connection`** with `aiosqlite.Connection` in Depends
5. **Lifespan:** call `init_db()` / `close_db()` instead of `init_pool()` / `close_pool()`
6. **Add static file mount:** `app.mount("/images", StaticFiles(directory="images"), name="images")`
7. **Delete price constants** (`PREVIEW_PRICE`, `FULL_PRICES`)
8. **Simplify `generate_and_save_story`:** Remove all credit deduction/refund logic. Remove `is_preview` — always generate all panels. Always set `is_unlocked = True`. Response is just `{ story }`.
9. **Delete `/api/stories/{story_id}/unlock`** endpoint entirely
10. **Delete `/api/auth/me`** endpoint
11. **Simplify `/api/generate/edit-image`:** Remove credit deduction/refund — just call `edit_image()` and return
12. **Simplify health check:** `SELECT 1` via aiosqlite instead of asyncpg

**File:** `backend/main.py`

---

## Step 7: Backend — Update `models.py`

- Remove `credits_deducted` and `remaining_balance` from `GenerateAndSaveStoryResponse`
- Remove `UnlockStoryRequest` and `UnlockStoryResponse`
- Remove or default `is_preview` in `GenerateAndSaveStoryRequest`

**File:** `backend/models.py`

---

## Step 8: Backend — Update `pyproject.toml`

Remove: `asyncpg`, `cryptography`, `httpx`, `pyjwt`, `stripe`, `supabase`
Add: `aiosqlite>=0.20.0`

**File:** `backend/pyproject.toml`

---

## Step 9: Frontend — Delete Payment/Auth Files

**Delete entirely:**
- `services/creditService.ts`
- `services/paymentService.ts`
- `services/storageService.ts` (if only used for Supabase signed URLs)
- `contexts/CreditContext.tsx`
- `contexts/AuthContext.tsx`
- `constants/pricing.ts`
- `lib/supabase.ts`
- `hooks/useStorageImage.ts`
- `components/PricingPage.tsx`
- `components/PaymentSuccess.tsx`
- `components/PaymentCancel.tsx`
- `components/PackageCard.tsx`
- `components/CreditDisplay.tsx`
- `components/OrderHistoryPage.tsx`
- `components/LoginPage.tsx`
- `components/ProtectedRoute.tsx`
- `components/ProfilePage.tsx`
- `components/LandingPage/PricingSection.tsx`
- `tests/creditService.test.ts`
- `tests/paymentService.test.ts`
- `tests/panelEditCredits.test.ts`

---

## Step 10: Frontend — Modify `index.tsx`

Remove `AuthProvider` and `CreditProvider` wrappers. Just `BrowserRouter` > `App` > `Toaster`.

**File:** `frontend/index.tsx`

---

## Step 11: Frontend — Modify `App.tsx`

- Remove imports: `CreditDisplay`, `AvatarDropdown`, `ProtectedRoute`, `LoginPage`, `PricingPage`, `PaymentSuccess`, `PaymentCancel`, `OrderHistoryPage`, `ProfilePage`, `useAuth`, `LandingPage`, `PrivacyPolicyPage`, `TermsOfUsePage`
- Remove `loading` state / `useAuth()` from `AppLayout`
- Header: just logo + "My Library" link (remove `CreditDisplay` + `AvatarDropdown`)
- Routes: `/ → MainPage (create)`, `/book/:id → MainPage`, `/gallery → GalleryPage`
- Remove `/login`, `/pricing`, `/payment/*`, `/orders`, `/profile`, `/privacy`, `/terms` routes
- Remove all `<ProtectedRoute>` wrappers

**File:** `frontend/App.tsx`

---

## Step 12: Frontend — Modify `services/backendApi.ts`

- Replace `authFetch` (Supabase token headers) with plain `fetch` wrapper
- Remove `supabase` import
- Add `getImageUrl(path)` → `${API_BASE_URL}/images/${path}` (replaces Supabase signed URLs)
- Remove `unlockStoryApi` function
- Simplify `GenerateAndSaveStoryResponse` (remove `credits_deducted`, `remaining_balance`)
- Always pass `is_preview: false` in `generateAndSaveStory`

**File:** `frontend/services/backendApi.ts`

---

## Step 13: Frontend — Modify `components/MainPage.tsx`

- Remove `useCredits` import and all credit-related logic
- Remove `handleUnlock` function
- Always generate full stories (no preview mode)
- Remove credit error messages ("Not enough credits!")
- Remove locked back cover / unlock button UI

**File:** `frontend/components/MainPage.tsx`

---

## Step 14: Frontend — Modify `components/ComicPanel.tsx`

- Remove `useCredits` and `EDIT_COST` constant
- Remove credit balance check before editing
- Remove credit display in edit modal
- Replace `useStorageImage` with `getImageUrl()` from backendApi

**File:** `frontend/components/ComicPanel.tsx`

---

## Step 15: Frontend — Modify `components/KidWizard.tsx`

- Remove `useCredits` and credit-related state
- Remove the pricing/plan step and the "Ready" confirmation step with price display
- Keep story length selection but without credit prices
- Change submit button from "Summon Comic — {price} credits" → "Create My Story"
- Change `onSubmit` signature from `(profile, isPreview)` → `(profile)`

**File:** `frontend/components/KidWizard.tsx`

---

## Step 16: Frontend — Simplify `StorageImage.tsx`

Replace Supabase signed URL resolution with simple backend URL:
```tsx
const url = src.startsWith('data:') ? src : getImageUrl(src);
return <img src={url} alt={alt} className={className} />;
```

**File:** `frontend/components/StorageImage.tsx`

---

## Step 17: Frontend — Other File Updates

- `hooks/useStoryGenerator.ts` — Remove `unlockStory`, always generate full, remove credit refetch
- `components/GalleryPage.tsx` — Use `getImageUrl()` instead of Supabase URLs, remove auth redirect
- `components/LandingPage/LandingPage.tsx` — Remove `PricingSection` (or delete whole LandingPage folder since we skip it)
- `components/AvatarDropdown.tsx` — Delete (no auth)
- `types.ts` — Remove `CreditPackage`, credit-related interfaces
- `package.json` — Remove `@supabase/supabase-js`
- `tests/mocks/handlers.ts` — Remove credit/payment mock handlers

---

## Step 18: Config & Docker

- **`.env.example`:** Just `GEMINI_API_KEY=your_key_here` and optional `VITE_API_BASE_URL`
- **`docker-compose.yml`:** Remove `stripe-cli` service, all Supabase/Stripe env vars
- **`.gitignore`:** Add `*.db`, `backend/images/*.png`

---

## Step 19: Update README.md & CLAUDE.md

Write a new README focused on quick start:
```
1. Set GEMINI_API_KEY in .env
2. cd backend && uv run uvicorn main:app --reload
3. cd frontend && npm install && npm run dev
4. Open http://localhost:3000
```

Update CLAUDE.md to reflect the simplified architecture.

---

## Verification

1. **Backend:** `cd backend && GEMINI_API_KEY=xxx uv run uvicorn main:app --reload` → health check passes
2. **Frontend:** `cd frontend && npm run dev` → opens without errors
3. **E2E flow:** Complete wizard → story generates → images display → gallery shows stories → panel editing works
4. **Tests:** `cd frontend && npm test` and `cd backend && uv run pytest` — fix broken imports
5. **Docker:** `docker compose up` works with just `GEMINI_API_KEY` set

---

## Critical Files (in modification order)

| # | File | Action |
|---|------|--------|
| 1 | `backend/credit_routes.py`, `credit_crud.py`, `stripe_credits_routes.py`, `auth.py`, `storage.py` | Delete |
| 2 | `backend/database.py` | Rewrite (asyncpg → aiosqlite) |
| 3 | `backend/config.py` | Simplify (only GEMINI_API_KEY) |
| 4 | `backend/crud.py` | Rewrite (PostgreSQL → SQLite + local files) |
| 5 | `backend/main.py` | Major edit (remove credits/auth, add static files) |
| 6 | `backend/models.py` | Remove credit response fields |
| 7 | `backend/pyproject.toml` | Swap deps |
| 8 | `frontend/` — 15+ files | Delete payment/auth files |
| 9 | `frontend/index.tsx` | Remove providers |
| 10 | `frontend/App.tsx` | Remove auth routes, credits UI, landing page |
| 11 | `frontend/services/backendApi.ts` | Remove Supabase auth, add getImageUrl |
| 12 | `frontend/components/MainPage.tsx` | Remove credits, unlock flow |
| 13 | `frontend/components/ComicPanel.tsx` | Remove credit checks |
| 14 | `frontend/components/KidWizard.tsx` | Remove pricing steps |
| 15 | `frontend/hooks/useStoryGenerator.ts` | Remove unlock, simplify |
| 16 | Remaining frontend files | Cleanup imports |
