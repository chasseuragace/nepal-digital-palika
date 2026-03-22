# Tier Management System - Implementation Complete

**Date**: March 22, 2026
**Status**: ✅ IMPLEMENTATION COMPLETE

---

## Overview

Implemented a tier management system that allows palika admins to:
- View all available subscription tiers
- View their current subscription details
- Request tier changes (upgrade/downgrade)
- Cancel pending tier change requests
- View request history

**Note**: Tier change approval/rejection is handled in a separate repo.

---

## Database Changes

### 1. New Table: tier_change_requests
**Migration**: `20250322000055_create_tier_change_requests_table.sql`

```sql
CREATE TABLE public.tier_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palika_id INTEGER NOT NULL,
  current_tier_id UUID NOT NULL,
  requested_tier_id UUID NOT NULL,
  reason TEXT,
  status VARCHAR DEFAULT 'pending',
  requested_by UUID NOT NULL,
  requested_at TIMESTAMP DEFAULT NOW(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  effective_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (palika_id) REFERENCES palikas(id),
  FOREIGN KEY (current_tier_id) REFERENCES subscription_tiers(id),
  FOREIGN KEY (requested_tier_id) REFERENCES subscription_tiers(id),
  FOREIGN KEY (requested_by) REFERENCES admin_users(id),
  FOREIGN KEY (reviewed_by) REFERENCES admin_users(id)
);
```

**Indexes**:
- `idx_tier_change_requests_palika_id` - Fast lookup by palika
- `idx_tier_change_requests_status` - Fast lookup by status
- `idx_tier_change_requests_requested_by` - Fast lookup by requester

### 2. RLS Policies
**Migration**: `20250322000056_enable_rls_tier_change_requests.sql`

**Palika Admin Policies**:
- Can view their own tier change requests
- Can create new tier change requests
- Can cancel their own pending requests

**Super Admin Policies**:
- Can view all tier change requests
- Can approve/reject requests (handled in separate repo)

---

## API Endpoints

### GET /api/tiers
**Purpose**: Fetch all tiers, current subscription, and pending requests

**Query Parameters**:
- `palika_id` (required) - Palika ID

**Response**:
```json
{
  "tiers": [
    {
      "id": "uuid",
      "name": "basic",
      "display_name": "Basic",
      "description": "...",
      "cost_per_month": 500000,
      "cost_per_year": 5000000
    }
  ],
  "currentSubscription": {
    "id": 10,
    "name_en": "Bhaktapur",
    "subscription_tier_id": "uuid",
    "subscription_start_date": "2026-03-22T...",
    "subscription_end_date": "2027-03-22T...",
    "cost_per_month": 150000,
    "subscription_tiers": { ... }
  },
  "tierChangeRequests": [
    {
      "id": "uuid",
      "current_tier_id": "uuid",
      "requested_tier_id": "uuid",
      "reason": "...",
      "status": "pending",
      "requested_at": "2026-03-22T...",
      "subscription_tiers": { ... }
    }
  ]
}
```

### POST /api/tier-change-requests
**Purpose**: Create a new tier change request

**Headers**:
- `X-Palika-ID` (required) - Palika ID
- `X-User-ID` (required) - Admin user ID

**Body**:
```json
{
  "requested_tier_id": "uuid",
  "reason": "Optional reason for tier change"
}
```

**Response**:
```json
{
  "success": true,
  "request": { ... }
}
```

**Validation**:
- Palika must exist
- Cannot request same tier as current
- Only one pending request allowed per palika

### GET /api/tier-change-requests
**Purpose**: Fetch tier change requests for a palika

**Query Parameters**:
- `palika_id` (required) - Palika ID
- `status` (optional) - Filter by status (pending, approved, rejected, cancelled)

**Response**:
```json
{
  "requests": [ ... ]
}
```

### DELETE /api/tier-change-requests/:id
**Purpose**: Cancel a pending tier change request

**Response**:
```json
{
  "success": true,
  "message": "Tier change request deleted"
}
```

**Validation**:
- Only pending requests can be deleted
- Palika admins can only delete their own requests

---

## Frontend Page

### URL: /app/tiers

**Sections**:

#### 1. Current Subscription
- Current tier name
- Monthly cost
- Subscription start date
- Subscription end date

#### 2. Available Tiers
- Grid of all active tiers
- Tier name, description, pricing
- Clickable selection
- Highlights current tier

#### 3. Request Tier Change
- Shows when a tier is selected (and different from current)
- Optional reason textarea
- Submit button
- Only visible if no pending request exists

#### 4. Pending Request Alert
- Shows when a pending request exists
- Displays requested tier and date
- Cancel button to withdraw request

#### 5. Request History
- Table of all tier change requests
- Columns: Requested Tier, Status, Requested Date, Reason
- Status badges (pending, approved, rejected, cancelled)

---

## Features

✅ **View Available Tiers**: Palika admins can see all active subscription tiers with pricing

✅ **View Current Subscription**: Display current tier, dates, and cost

✅ **Request Tier Change**: Submit upgrade/downgrade requests with optional reason

✅ **Cancel Requests**: Withdraw pending requests before approval

✅ **Request History**: Track all tier change requests and their status

✅ **RLS Security**: Palika admins only see their own requests

✅ **Validation**: Prevents duplicate pending requests, same tier requests

✅ **Audit Trail**: All requests tracked with timestamps and user info

---

## Files Created

### Database Migrations
1. `supabase/migrations/20250322000055_create_tier_change_requests_table.sql`
2. `supabase/migrations/20250322000056_enable_rls_tier_change_requests.sql`

### API Endpoints
1. `admin-panel/app/api/tiers/route.ts` - GET tiers and subscription info
2. `admin-panel/app/api/tier-change-requests/route.ts` - POST/GET tier change requests
3. `admin-panel/app/api/tier-change-requests/[id]/route.ts` - DELETE tier change requests

### Frontend
1. `admin-panel/app/tiers/page.tsx` - Tier management page

### Navigation
- Updated `admin-panel/components/AdminLayout.tsx` - Added "Subscription Tiers" link

---

## Workflow

### Palika Admin Workflow

1. **Navigate to Subscription Tiers** - Click "Subscription Tiers" in navigation
2. **View Current Subscription** - See current tier, dates, and cost
3. **Browse Available Tiers** - View all active tiers with pricing
4. **Select New Tier** - Click on a tier card to select it
5. **Add Reason (Optional)** - Enter reason for tier change
6. **Submit Request** - Click "Submit Tier Change Request"
7. **Confirmation** - See success message
8. **Track Status** - View request in history table
9. **Cancel if Needed** - Click "Cancel Request" to withdraw pending request

### Super Admin Workflow (Separate Repo)

1. View all pending tier change requests
2. Review request details and reason
3. Approve or reject request
4. If approved: Update palika subscription, create audit log
5. If rejected: Add review notes

---

## Testing Checklist

- [ ] Apply migrations: `supabase db push`
- [ ] Login as Bhaktapur Admin
- [ ] Navigate to Subscription Tiers page
- [ ] Verify current subscription displays correctly
- [ ] Verify all tiers display with correct pricing
- [ ] Select a different tier
- [ ] Add optional reason
- [ ] Submit tier change request
- [ ] Verify success message
- [ ] Verify request appears in history
- [ ] Verify request status is "pending"
- [ ] Cancel the request
- [ ] Verify request is removed
- [ ] Try to create duplicate pending request (should fail)
- [ ] Try to request same tier as current (should fail)

---

## Next Steps (Separate Repo)

1. Create approval/rejection endpoints
2. Create super admin approval page
3. Implement tier change approval workflow
4. Add email notifications
5. Create audit reports

---

## Compilation Status

✅ All files compile without errors
✅ No TypeScript issues
✅ All API endpoints ready
✅ Frontend page ready

---

## Notes

- Approval/rejection logic is NOT in this admin panel
- Handled in a separate repo for centralized approval management
- This panel only handles request submission and cancellation
- All tier change requests start with status = 'pending'
- Palika admins cannot see other palikas' requests (RLS enforced)
- Super admins can see all requests (for approval in separate repo)
