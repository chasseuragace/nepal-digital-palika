# Platform Subscription Lifecycle — Implementation Plan

**Owner:** platform provider (Kaha / solo operator)
**Surface:** `platform-admin-panel` (internal dev tool, service-role Supabase access)
**Status:** Spec — ready for an implementing agent to pick up
**Date:** 2026-04-21

---

## 1. Goal

Give the platform provider the ability to (a) see which palikas are enrolled on which tier, (b) see when each palika's subscription expires, and (c) record a full-cash payment that renews / reactivates a palika's subscription by extending its end date. Every payment must leave a permanent ledger row.

This is a **ledger + renewal workflow**. It does **not** enforce expiry (no feature blocking). Enforcement is tier-gating and is deliberately out of scope.

---

## 2. Current state — do not re-research

### 2.1 Schema that already exists

Migrations live at `supabase/migrations/` (absolute: `/Users/ajaydahal/Downloads/older/Nepal_Digital_Tourism_Infrastructure_Documentation/supabase/migrations/`). Latest migration is `20260421000065_degate_marketplace_categories.sql` — the next new migration filename should be `20260421000066_*.sql`.

Relevant existing tables:

| Table | Relevant columns | Notes |
|---|---|---|
| `subscription_tiers` | `id (uuid)`, `name`, `display_name`, `cost_per_month`, `cost_per_year`, `is_active` | Full. Do not modify. |
| `palikas` | `subscription_tier_id (uuid FK)`, `subscription_start_date (timestamp)`, `subscription_end_date (timestamp)`, `cost_per_month (numeric)` | The three date/cost columns **exist but are NULL for every palika except Bhaktapur**. See `20250322000054_set_bhaktapur_subscription_dates.sql` for the population pattern. |
| `tier_assignment_log` | `palika_id`, `old_tier_id`, `new_tier_id`, `assigned_by`, `reason`, `created_at` | Audit trail for tier changes only. Already written by `updateTier()`. Keep writing it. |
| `tier_change_requests` | Exists but unused from the UI | Leave alone. Not part of this scope. |

### 2.2 Code that already exists

| File | What it does |
|---|---|
| `platform-admin-panel/src/app/subscriptions/page.tsx` | UI: lists tiers as cards, lists palikas in a table, lets admin change tier via dropdown |
| `platform-admin-panel/src/app/api/subscriptions/palikas/route.ts` | `GET` all palikas with tier; `PATCH` assigns new tier |
| `platform-admin-panel/src/app/api/subscriptions/tiers/route.ts` | `GET` all tiers with features |
| `platform-admin-panel/src/services/palikas.service.ts` | `getAllBasicWithTier()`, `updateTier()` |
| `platform-admin-panel/src/lib/datasources/supabase-palikas-datasource.ts` | `updateTier()` — currently writes `subscription_tier_id` only, does NOT touch the date columns |
| `platform-admin-panel/src/lib/datasources/palikas-datasource.ts` | Datasource interface |
| `platform-admin-panel/src/lib/datasources/fake-palikas-datasource.ts` | Fake impl used when `NEXT_PUBLIC_USE_FAKE_DATASOURCES=true` |

### 2.3 What is missing

- No `subscription_payments` (or equivalent) table
- No endpoint/UI to record a payment or extend `subscription_end_date`
- `updateTier()` does not seed start/end dates when a palika first gets a tier
- No expiry or days-remaining shown in the UI

---

## 3. Scope

### 3.1 In scope — build all of this

1. **New table `subscription_payments`** (ledger, append-only) with RLS.
2. **Seed start/end dates on initial tier assignment** — when `updateTier()` promotes a palika from `subscription_tier_id IS NULL` to a tier, set `subscription_start_date = NOW()` and `subscription_end_date = NOW() + INTERVAL '1 year'`. Tier changes mid-cycle leave the existing dates alone.
3. **Renewal endpoint + datasource + service method** — records a payment row and bumps `subscription_end_date` by the payment's period length.
4. **UI additions to `/subscriptions`** — End Date column, days-until-expiry badge (green >30d, amber 0–30d, red past-due, grey for palikas with no tier yet), a "Renew" button per palika that opens a modal.
5. **Renewal modal** — period (dropdown: 1 month / 3 months / 6 months / 1 year, default 1 year), amount (pre-filled from `tier.cost_per_year` or `cost_per_month * months`, editable), payment method (dropdown: `cash` / `bank_transfer` / `cheque` / `other`, default `cash`), reference/note (optional text), "Record Payment" submits.
6. **Payment history page** — `platform-admin-panel/src/app/subscriptions/[palikaId]/history/page.tsx`: table of every payment row for one palika (period, amount, method, reference, paid_on, recorded_by), with a "Back to Subscriptions" link.

### 3.2 Out of scope — do not build

- Automatic deactivation / feature blocking on expiry (that is tier-gating; `PHASE_7_ROADMAP.md` explicitly defers it)
- Invoice/receipt generation (PDF or otherwise)
- Partial payments, refunds, credits, discounts, tax
- Proration when tier is changed mid-period
- Email reminders / scheduled jobs
- Palika-side self-service renewal
- Integration with any payment processor — assume cash received out-of-band and already reconciled
- The `tier_change_requests` table (leave untouched)

---

## 4. Task breakdown

Execute in order. Each task has an acceptance criterion.

### Task 1 — Migration: create `subscription_payments`

**File:** `supabase/migrations/20260421000066_create_subscription_payments.sql`

```sql
CREATE TABLE public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  palika_id integer NOT NULL REFERENCES public.palikas(id) ON DELETE RESTRICT,
  tier_id uuid NOT NULL REFERENCES public.subscription_tiers(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  paid_on timestamptz NOT NULL DEFAULT NOW(),
  method text NOT NULL DEFAULT 'cash'
    CHECK (method IN ('cash', 'bank_transfer', 'cheque', 'other')),
  reference text,
  recorded_by uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CHECK (period_end > period_start)
);

CREATE INDEX idx_subscription_payments_palika_id
  ON public.subscription_payments(palika_id);
CREATE INDEX idx_subscription_payments_paid_on
  ON public.subscription_payments(paid_on DESC);

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Super admins can read and write everything (platform provider use case)
CREATE POLICY "super_admin_all_subscription_payments"
  ON public.subscription_payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
```

**Acceptance:** Migration applies clean against a reset local DB; table exists; RLS enabled; a seed-time INSERT from a super_admin succeeds.

---

### Task 2 — Update `updateTier()` to seed dates on first assignment

**Files:**
- `platform-admin-panel/src/lib/datasources/supabase-palikas-datasource.ts`
- `platform-admin-panel/src/lib/datasources/fake-palikas-datasource.ts`

Current behavior: `.update({ subscription_tier_id: tierId })`.

New behavior (Supabase impl): first `SELECT subscription_tier_id, subscription_start_date, subscription_end_date FROM palikas WHERE id = ?`. If `subscription_tier_id IS NULL` OR `subscription_end_date IS NULL`, also set `subscription_start_date = NOW()` and `subscription_end_date = NOW() + INTERVAL '1 year'` in the UPDATE. Otherwise leave dates untouched.

Fake impl: mirror the same logic against the in-memory fake records.

**Acceptance:** Assigning a tier to a palika with null dates populates both dates. Changing tier on a palika that already has dates leaves them unchanged.

---

### Task 3 — New datasource: `subscription-payments-datasource`

Follow the existing datasource pattern (see `tier-assignment-log-datasource.ts` for the shape):

**Files to create:**
- `platform-admin-panel/src/lib/datasources/subscription-payments-datasource.ts` — interface + `SubscriptionPayment` type
- `platform-admin-panel/src/lib/datasources/subscription-payments-config.ts` — factory that returns fake vs supabase based on `NEXT_PUBLIC_USE_FAKE_DATASOURCES`
- `platform-admin-panel/src/lib/datasources/supabase-subscription-payments-datasource.ts` — real impl
- `platform-admin-panel/src/lib/datasources/fake-subscription-payments-datasource.ts` — fake impl with 3–5 seed rows for palikas 5, 8, 10

**Interface:**

```typescript
export interface SubscriptionPayment {
  id: string
  palika_id: number
  tier_id: string
  amount: number
  period_start: string
  period_end: string
  paid_on: string
  method: 'cash' | 'bank_transfer' | 'cheque' | 'other'
  reference: string | null
  recorded_by: string | null
  created_at: string
}

export interface RecordPaymentInput {
  palika_id: number
  tier_id: string
  amount: number
  period_start: string  // ISO
  period_end: string    // ISO
  method: SubscriptionPayment['method']
  reference?: string
  recorded_by?: string
}

export interface SubscriptionPaymentsDatasource {
  listForPalika(palikaId: number): Promise<SubscriptionPayment[]>
  recordPayment(input: RecordPaymentInput): Promise<SubscriptionPayment>
}
```

**Acceptance:** Fake datasource returns seeded rows when queried. Supabase datasource round-trips an insert and reads it back.

---

### Task 4 — New service: `SubscriptionPaymentsService`

**File:** `platform-admin-panel/src/services/subscription-payments.service.ts`

Methods:
- `listForPalika(palikaId: number)` — delegates to datasource
- `renew(input: { palikaId, tierId, amount, periodMonths, method, reference?, recordedBy? })` — in a logical transaction:
  1. Read palika's current `subscription_end_date`
  2. `newStart = max(NOW(), current_end_date ?? NOW())`
  3. `newEnd = newStart + periodMonths months`
  4. Insert `subscription_payments` row with `period_start = newStart`, `period_end = newEnd`
  5. UPDATE palika: `subscription_start_date = coalesce(subscription_start_date, newStart)`, `subscription_end_date = newEnd`, `subscription_tier_id = tierId`
  6. Return the inserted payment row

If Supabase doesn't support a true transaction here, execute the insert then the update and accept the best-effort ordering (log any mismatch). Service result shape should follow existing `{ success, data, error }` pattern.

**Acceptance:** Calling `renew()` on an expired palika (end_date in the past) sets new period starting from `NOW()`. Calling on a not-yet-expired palika extends from the existing end_date (no lost time).

---

### Task 5 — API routes

**Files to create:**

- `platform-admin-panel/src/app/api/subscriptions/payments/route.ts`
  - `POST` — body: `{ palikaId, tierId, amount, periodMonths, method, reference? }`. Validates required fields, calls `SubscriptionPaymentsService.renew()`, returns the payment row. Resolves `recorded_by` from the authenticated admin if the current route helper provides it; otherwise null.

- `platform-admin-panel/src/app/api/subscriptions/payments/[palikaId]/route.ts`
  - `GET` — returns `{ data: SubscriptionPayment[] }` for the palika (desc by `paid_on`).

**Acceptance:** `curl -X POST .../api/subscriptions/payments -d '{palikaId, tierId, ...}'` creates a payment and extends the end date.

---

### Task 6 — UI: list page updates

**File:** `platform-admin-panel/src/app/subscriptions/page.tsx`

Add two columns to the palikas table, between "Annual Cost" and "Action":

- **End Date** — formatted `YYYY-MM-DD`, or `—` if null
- **Status** — a badge:
  - `green` "Active (N days left)" when `end_date - now > 30 days`
  - `amber` "Expiring in N days" when `0 < end_date - now ≤ 30 days`
  - `red` "Expired N days ago" when `end_date < now`
  - `grey` "No tier" when `subscription_tier_id IS NULL`

Add a **"Renew"** button in the Action column next to the existing tier dropdown. Disabled when palika has no tier yet (render "Assign tier first" as a tooltip).

Clicking the Renew button opens a modal (see Task 7). Clicking the palika's name (or a new "History" link icon) navigates to `/subscriptions/[palikaId]/history`.

**Acceptance:** Page renders without layout regression. The three status colors show up against seeded fake data (a palika with future end, one within 30 days, one expired).

---

### Task 7 — UI: Renewal modal

Inline inside `subscriptions/page.tsx` or extract to `subscriptions/RenewModal.tsx`.

Modal fields:
- **Tier** — dropdown; defaults to palika's current tier; only listed tiers
- **Period** — dropdown: `1 month / 3 months / 6 months / 1 year`, default `1 year`
- **Amount (NPR)** — number input, pre-filled from `tier.cost_per_year` when period = 1yr, else `tier.cost_per_month * months`. Editable.
- **Payment method** — dropdown: `cash / bank_transfer / cheque / other`, default `cash`
- **Reference / note** — optional text input (receipt #, transaction ID, etc.)

Submit button: "Record Payment" — calls `POST /api/subscriptions/payments`, on success: close modal, toast "Subscription renewed — new end date: YYYY-MM-DD", refetch palikas. On error: show error inside modal, do not close.

**Acceptance:** Recording a payment via the modal refreshes the palikas list with the new end date visible and moves the status badge accordingly.

---

### Task 8 — UI: Payment history page

**File:** `platform-admin-panel/src/app/subscriptions/[palikaId]/history/page.tsx`

Layout: AdminLayout wrapper, page title "Payment history — {palika.name_en}", "Back to Subscriptions" secondary button at top. Card with a Table: columns Paid on (date), Period (start → end), Amount (NPR), Tier, Method, Reference, Recorded by. Empty state: "No payments recorded yet for this palika."

**Acceptance:** Page loads, shows seeded/fake payment rows for a palika that has them, shows empty state for one that doesn't.

---

## 5. Verification

Before declaring done, the implementing agent should:

1. Run the migration against the local Supabase (`supabase db reset` if that's the local workflow) — confirm it applies.
2. Start the dev server with `NEXT_PUBLIC_USE_FAKE_DATASOURCES=true` and walk through:
   - `/subscriptions` — new End Date and Status columns render
   - Click Renew on a palika, submit modal → new end date appears in row
   - Navigate to `/subscriptions/{id}/history` → new payment appears
3. Repeat with `NEXT_PUBLIC_USE_FAKE_DATASOURCES=false` against the local DB.
4. Use Playwright (`@playwright/test` is already a dev dep) to capture a screenshot of `/subscriptions` after a successful renewal, save to `platform-admin-panel/screenshots/subscriptions-after-renewal.png`, and delete the script when done.

---

## 6. Commit guidance

Two commits — keep schema and code separate so a deploy can stage them independently:

1. `feat(supabase): subscription_payments ledger table + RLS` — just the migration file.
2. `feat(platform-admin): subscription renewal flow + payment history` — everything else (datasource, service, API routes, UI, `updateTier` date-seeding change).

Use the repo's existing commit style (see `git log --oneline -10`). No unrelated changes.

---

## 7. Reference files (quick index)

- Migrations dir: `supabase/migrations/`
- Bhaktapur date-seed precedent: `supabase/migrations/20250322000054_set_bhaktapur_subscription_dates.sql`
- Subscriptions UI: `platform-admin-panel/src/app/subscriptions/page.tsx`
- Subscriptions API: `platform-admin-panel/src/app/api/subscriptions/{palikas,tiers}/route.ts`
- Palikas service: `platform-admin-panel/src/services/palikas.service.ts`
- Palikas datasource (Supabase): `platform-admin-panel/src/lib/datasources/supabase-palikas-datasource.ts`
- Datasource pattern reference: `platform-admin-panel/src/lib/datasources/tier-assignment-log-datasource.ts` (interface), `tier-assignment-log-config.ts` (factory)
- Dashboard Phase-7 context (explains why tier-gating/enforcement is out of scope): `PHASE_7_ROADMAP.md`
