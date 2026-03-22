# Tier Management System - Analysis & Design

**Date**: March 22, 2026
**Status**: ✅ DESIGN COMPLETE

---

## Current Database Tables

### 1. subscription_tiers
**Purpose**: Define available tiers
**Columns**:
- id (UUID)
- name (string) - basic, tourism, premium
- display_name (string)
- description (text)
- cost_per_month (numeric)
- cost_per_year (numeric)
- is_active (boolean)
- created_at, updated_at

**Current Data**:
- Basic: 500,000 NPR/year
- Tourism: 150,000 NPR/year
- Premium: 250,000 NPR/year

### 2. tier_assignment_log
**Purpose**: Audit trail of tier changes
**Columns**:
- id (UUID)
- palika_id (integer)
- old_tier_id (UUID, nullable)
- new_tier_id (UUID)
- assigned_by (UUID)
- reason (text)
- created_at

**Current Data**: 5 records (tier assignments)

### 3. palikas
**Purpose**: Palika information with current tier
**Columns**:
- subscription_tier_id (UUID) - Current tier
- subscription_start_date (timestamp)
- subscription_end_date (timestamp)
- cost_per_month (numeric)

---

## What's Missing

### ❌ Tier Change Request Table
**Needed for**: Palika admins to request tier changes
**Status**: NOT CREATED

### ❌ Tier Change Request Approval Workflow
**Needed for**: Super admins to approve/reject requests
**Status**: NOT CREATED

### ❌ Tier Management UI Page
**Needed for**: Palika admins to view tiers and request changes
**Status**: NOT CREATED

### ❌ Tier Management API Endpoints
**Needed for**: Backend support for tier requests
**Status**: NOT CREATED

---

## Proposed Solution

### 1. New Table: tier_change_requests

```sql
CREATE TABLE public.tier_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palika_id INTEGER NOT NULL,
  current_tier_id UUID NOT NULL,
  requested_tier_id UUID NOT NULL,
  reason TEXT,
  status VARCHAR DEFAULT 'pending', -- pending, approved, rejected, cancelled
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

### 2. RLS Policies

**For Palika Admins**:
- Can view their own tier change requests
- Can create new tier change requests
- Can cancel pending requests
- Cannot view other palikas' requests

**For Super Admins**:
- Can view all tier change requests
- Can approve/reject requests
- Can view history

### 3. API Endpoints

**GET `/api/tiers`**
- Returns all available tiers
- Returns current tier for palika
- Returns pending requests

**POST `/api/tier-change-requests`**
- Create new tier change request
- Requires: palika_id, requested_tier_id, reason

**GET `/api/tier-change-requests`**
- Get requests for palika (palika admin)
- Get all requests (super admin)

**PUT `/api/tier-change-requests/:id/approve`**
- Approve tier change request
- Super admin only
- Updates palikas table
- Creates tier_assignment_log entry

**PUT `/api/tier-change-requests/:id/reject`**
- Reject tier change request
- Super admin only
- Requires review_notes

**DELETE `/api/tier-change-requests/:id`**
- Cancel pending request
- Palika admin can cancel own requests
- Super admin can cancel any request

### 4. Frontend Page: Tier Management

**URL**: `/app/tiers` or `/app/subscription/tiers`

**Sections**:

#### Current Subscription
- Current tier name and display
- Subscription start date
- Subscription end date
- Monthly cost
- Annual cost

#### Available Tiers
- Grid/table showing all tiers
- Features for each tier
- Pricing
- "Request Upgrade/Downgrade" button

#### Tier Change Requests
- List of pending requests
- Status (pending, approved, rejected)
- Requested date
- Reason
- Cancel button (if pending)

#### Request History
- All past tier changes
- Dates
- Who approved
- Reason

---

## Workflow

### Tier Change Request Flow

```
Palika Admin
    ↓
Views available tiers
    ↓
Clicks "Request Tier Change"
    ↓
Selects new tier
    ↓
Enters reason (optional)
    ↓
Submits request
    ↓
Request created with status = 'pending'
    ↓
Super Admin
    ↓
Views pending requests
    ↓
Reviews request
    ↓
Approves or Rejects
    ↓
If Approved:
  - Updates palikas.subscription_tier_id
  - Updates palikas.subscription_start_date
  - Updates palikas.subscription_end_date
  - Updates palikas.cost_per_month
  - Creates tier_assignment_log entry
  - Updates request status = 'approved'
    ↓
If Rejected:
  - Updates request status = 'rejected'
  - Adds review_notes
    ↓
Palika Admin
    ↓
Sees request status updated
    ↓
Can request again if rejected
```

---

## Data Model

### tier_change_requests Table

| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Primary key |
| palika_id | INTEGER | Which palika |
| current_tier_id | UUID | Tier at time of request |
| requested_tier_id | UUID | Tier being requested |
| reason | TEXT | Why they want to change |
| status | VARCHAR | pending/approved/rejected/cancelled |
| requested_by | UUID | Admin who requested |
| requested_at | TIMESTAMP | When requested |
| reviewed_by | UUID | Admin who reviewed |
| reviewed_at | TIMESTAMP | When reviewed |
| review_notes | TEXT | Approval/rejection notes |
| effective_date | TIMESTAMP | When change takes effect |
| created_at | TIMESTAMP | Record created |
| updated_at | TIMESTAMP | Record updated |

---

## Security Considerations

✅ **RLS Policies**: Palika admins can only see their own requests
✅ **Audit Trail**: All changes logged in tier_assignment_log
✅ **Approval Workflow**: No automatic tier changes
✅ **Cancellation**: Admins can cancel pending requests
✅ **History**: All changes tracked with who approved

---

## Implementation Steps

1. **Create tier_change_requests table** (migration)
2. **Create RLS policies** (migration)
3. **Create API endpoints** (backend)
4. **Create tier management page** (frontend)
5. **Add navigation link** (AdminLayout)
6. **Test workflow** (manual testing)

---

## Benefits

✅ Transparent tier management
✅ Audit trail of all changes
✅ Prevents accidental tier changes
✅ Allows admins to change mind
✅ Super admin approval required
✅ Tracks who requested and who approved
✅ Supports upgrade and downgrade

---

## Status

**Design**: ✅ COMPLETE
**Database**: ⏳ PENDING
**API**: ⏳ PENDING
**Frontend**: ⏳ PENDING
**Testing**: ⏳ PENDING

