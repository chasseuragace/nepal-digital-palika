# Multi-Tenant Hierarchy Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ADMIN PANEL (Next.js)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  Admin Mgmt      │  │  Role Mgmt       │  │  Permission Mgmt │      │
│  │  - List          │  │  - List          │  │  - List          │      │
│  │  - Create        │  │  - Create        │  │  - Create        │      │
│  │  - Edit          │  │  - Edit          │  │  - Edit          │      │
│  │  - Delete        │  │  - Delete        │  │  - Delete        │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  Region Assign   │  │  Hierarchy Mgmt  │  │  Audit Log       │      │
│  │  - Assign        │  │  - Provinces     │  │  - View          │      │
│  │  - Unassign      │  │  - Districts     │  │  - Filter        │      │
│  │  - View          │  │  - Palikas       │  │  - Export        │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                        ┌───────────────────────┐
                        │   API Layer (Next.js) │
                        │   Route Handlers      │
                        └───────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL + RLS)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    GEOGRAPHIC HIERARCHY                         │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  provinces (7)                                                  │   │
│  │    ├─ districts (9)                                             │   │
│  │    │   ├─ palikas (8)                                           │   │
│  │    │   │   └─ wards (1-35)                                      │   │
│  │    │   └─ ...                                                   │   │
│  │    └─ ...                                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    ADMIN HIERARCHY                              │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  admin_users                                                    │   │
│  │  ├─ id (UUID)                                                   │   │
│  │  ├─ full_name                                                   │   │
│  │  ├─ role (FK → roles)                                           │   │
│  │  ├─ hierarchy_level (national|province|district|palika)        │   │
│  │  ├─ province_id (FK → provinces)                               │   │
│  │  ├─ district_id (FK → districts)                               │   │
│  │  ├─ palika_id (FK → palikas) [legacy support]                  │   │
│  │  ├─ is_active                                                   │   │
│  │  └─ created_at, updated_at                                      │   │
│  │                                                                  │   │
│  │  admin_regions (NEW)                                            │   │
│  │  ├─ id                                                           │   │
│  │  ├─ admin_id (FK → admin_users)                                 │   │
│  │  ├─ region_type (province|district|palika)                     │   │
│  │  ├─ region_id (INT)                                             │   │
│  │  ├─ assigned_at                                                 │   │
│  │  └─ assigned_by (FK → admin_users)                              │   │
│  │                                                                  │   │
│  │  roles                                                           │   │
│  │  ├─ id                                                           │   │
│  │  ├─ name                                                         │   │
│  │  ├─ hierarchy_level (national|province|district|palika)        │   │
│  │  └─ description                                                 │   │
│  │                                                                  │   │
│  │  permissions                                                    │   │
│  │  ├─ id                                                           │   │
│  │  ├─ name                                                         │   │
│  │  ├─ resource                                                     │   │
│  │  └─ action                                                       │   │
│  │                                                                  │   │
│  │  role_permissions (junction)                                    │   │
│  │  ├─ role_id (FK → roles)                                        │   │
│  │  └─ permission_id (FK → permissions)                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    AUDIT TRAIL                                  │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  audit_log (NEW)                                                │   │
│  │  ├─ id                                                           │   │
│  │  ├─ admin_id (FK → admin_users)                                 │   │
│  │  ├─ action (INSERT|UPDATE|DELETE)                              │   │
│  │  ├─ entity_type (table name)                                    │   │
│  │  ├─ entity_id (UUID)                                            │   │
│  │  ├─ changes (JSONB: {old, new})                                 │   │
│  │  └─ created_at                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    CONTENT TABLES                               │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  heritage_sites, events, businesses, blog_posts                │   │
│  │  ├─ id (UUID)                                                   │   │
│  │  ├─ palika_id (FK → palikas) [scoped to palika]                │   │
│  │  ├─ status (draft|published|archived)                          │   │
│  │  ├─ created_by (FK → auth.users)                               │   │
│  │  └─ ... [content-specific fields]                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Access Control Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER REQUEST                                 │
│              (e.g., GET /api/heritage-sites)                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION CHECK                           │
│              (Supabase JWT verification)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  AUTHORIZATION CHECK                            │
│         (RLS Policy: user_has_permission())                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  REGION ACCESS CHECK                            │
│         (RLS Policy: user_has_access_to_palika())               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Check if user has access via:                           │   │
│  │ 1. Super admin? → YES                                   │   │
│  │ 2. Direct palika_id? → Check                            │   │
│  │ 3. admin_regions (palika)? → Check                      │   │
│  │ 4. admin_regions (district)? → Check palikas in district│   │
│  │ 5. admin_regions (province)? → Check palikas in province│   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  DATA RETRIEVAL                                 │
│         (Only rows user has access to returned)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  AUDIT LOGGING                                  │
│         (Trigger: audit_log_trigger() fires)                    │
│         (Records: admin_id, action, entity, changes)            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  RESPONSE                                       │
│              (Data + Audit log entry)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Admin Hierarchy Levels

```
┌─────────────────────────────────────────────────────────────────┐
│                    NATIONAL LEVEL                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ super_admin                                             │   │
│  │ ├─ hierarchy_level: 'national'                          │   │
│  │ ├─ province_id: NULL                                    │   │
│  │ ├─ district_id: NULL                                    │   │
│  │ ├─ palika_id: NULL                                      │   │
│  │ └─ Access: ALL regions, ALL content                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PROVINCE LEVEL                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ province_admin                                          │   │
│  │ ├─ hierarchy_level: 'province'                          │   │
│  │ ├─ province_id: 1 (Bagmati)                             │   │
│  │ ├─ district_id: NULL                                    │   │
│  │ ├─ palika_id: NULL                                      │   │
│  │ ├─ admin_regions:                                       │   │
│  │ │  └─ (province, 1)                                     │   │
│  │ └─ Access: All districts/palikas in Bagmati Province    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DISTRICT LEVEL                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ district_admin                                          │   │
│  │ ├─ hierarchy_level: 'district'                          │   │
│  │ ├─ province_id: 1 (Bagmati)                             │   │
│  │ ├─ district_id: 1 (Kathmandu)                           │   │
│  │ ├─ palika_id: NULL                                      │   │
│  │ ├─ admin_regions:                                       │   │
│  │ │  └─ (district, 1)                                     │   │
│  │ └─ Access: All palikas in Kathmandu District            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PALIKA LEVEL                                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ palika_admin / moderator / support_agent               │   │
│  │ ├─ hierarchy_level: 'palika'                            │   │
│  │ ├─ province_id: 1 (Bagmati)                             │   │
│  │ ├─ district_id: 1 (Kathmandu)                           │   │
│  │ ├─ palika_id: 1 (Kathmandu Metro)                       │   │
│  │ ├─ admin_regions:                                       │   │
│  │ │  └─ (palika, 1)                                       │   │
│  │ └─ Access: Only Kathmandu Metropolitan content          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Permission Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERMISSIONS BY RESOURCE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Heritage Sites:                                                │
│  ├─ manage_heritage_sites (create, read, update, delete)       │
│  └─ view_heritage_sites (read-only)                            │
│                                                                 │
│  Events:                                                        │
│  ├─ manage_events (create, read, update, delete)               │
│  └─ view_events (read-only)                                    │
│                                                                 │
│  Businesses:                                                    │
│  ├─ manage_businesses (create, read, update, delete)           │
│  └─ verify_businesses (approve/reject)                         │
│                                                                 │
│  Blog Posts:                                                    │
│  ├─ manage_blog_posts (create, read, update, delete)           │
│  └─ publish_blog_posts (publish/unpublish)                     │
│                                                                 │
│  Users & Admins:                                                │
│  ├─ manage_users (manage user accounts)                        │
│  └─ manage_admins (manage admin accounts)                      │
│                                                                 │
│  System:                                                        │
│  ├─ manage_sos (manage SOS requests)                           │
│  ├─ manage_support (manage support tickets)                    │
│  ├─ moderate_content (approve/reject content)                  │
│  ├─ view_analytics (view analytics dashboard)                  │
│  ├─ manage_categories (manage content categories)              │
│  └─ send_notifications (send notifications)                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    ROLE → PERMISSION MAPPING                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  super_admin                                                    │
│  └─ ALL permissions (12)                                        │
│                                                                 │
│  province_admin                                                 │
│  ├─ manage_heritage_sites                                       │
│  ├─ manage_events                                               │
│  ├─ manage_businesses                                           │
│  ├─ manage_blog_posts                                           │
│  ├─ manage_admins                                               │
│  ├─ moderate_content                                            │
│  ├─ view_analytics                                              │
│  └─ manage_categories                                           │
│                                                                 │
│  district_admin                                                 │
│  ├─ manage_heritage_sites                                       │
│  ├─ manage_events                                               │
│  ├─ manage_businesses                                           │
│  ├─ manage_blog_posts                                           │
│  ├─ moderate_content                                            │
│  └─ view_analytics                                              │
│                                                                 │
│  palika_admin                                                   │
│  ├─ manage_heritage_sites                                       │
│  ├─ manage_events                                               │
│  ├─ manage_businesses                                           │
│  ├─ manage_blog_posts                                           │
│  └─ moderate_content                                            │
│                                                                 │
│  moderator                                                      │
│  ├─ manage_blog_posts                                           │
│  └─ moderate_content                                            │
│                                                                 │
│  support_agent                                                  │
│  ├─ manage_sos                                                  │
│  └─ manage_support                                              │
│                                                                 │
│  content_editor                                                 │
│  ├─ manage_heritage_sites                                       │
│  ├─ manage_events                                               │
│  └─ manage_blog_posts                                           │
│                                                                 │
│  content_reviewer                                               │
│  ├─ view_heritage_sites                                         │
│  ├─ view_events                                                 │
│  └─ view_blog_posts                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Creating a Heritage Site

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. ADMIN SUBMITS FORM                                            │
│    (Kathmandu Metro Admin creates heritage site)                 │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 2. API ENDPOINT RECEIVES REQUEST                                 │
│    POST /api/heritage-sites                                      │
│    {                                                              │
│      "name_en": "Pashupatinath",                                 │
│      "palika_id": 1,                                             │
│      "status": "draft",                                          │
│      ...                                                          │
│    }                                                              │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 3. AUTHENTICATION CHECK                                          │
│    ✓ JWT token valid                                             │
│    ✓ User is admin_user                                          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 4. AUTHORIZATION CHECK                                           │
│    ✓ user_has_permission('manage_heritage_sites')               │
│    ✓ user_has_access_to_palika(1)                               │
│      - Check: admin_regions (palika, 1)? YES                    │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 5. INSERT INTO DATABASE                                          │
│    INSERT INTO heritage_sites (                                  │
│      id, palika_id, name_en, status, created_by, created_at     │
│    ) VALUES (                                                     │
│      uuid_generate_v4(),                                         │
│      1,                                                           │
│      'Pashupatinath',                                            │
│      'draft',                                                     │
│      auth.uid(),                                                 │
│      NOW()                                                        │
│    )                                                              │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 6. TRIGGER: AUDIT LOG                                            │
│    INSERT INTO audit_log (                                       │
│      admin_id: auth.uid(),                                       │
│      action: 'INSERT',                                           │
│      entity_type: 'heritage_sites',                              │
│      entity_id: <new_id>,                                        │
│      changes: {                                                   │
│        "id": "...",                                              │
│        "palika_id": 1,                                           │
│        "name_en": "Pashupatinath",                               │
│        "status": "draft",                                        │
│        ...                                                        │
│      }                                                            │
│    )                                                              │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 7. RESPONSE TO CLIENT                                            │
│    {                                                              │
│      "success": true,                                            │
│      "data": {                                                    │
│        "id": "660e8400-...",                                     │
│        "name_en": "Pashupatinath",                               │
│        "palika_id": 1,                                           │
│        "status": "draft",                                        │
│        "created_at": "2026-01-26T14:30:45Z"                      │
│      }                                                            │
│    }                                                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Audit Log Example

```
┌──────────────────────────────────────────────────────────────────┐
│ AUDIT LOG ENTRY                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ id: 12345                                                        │
│ admin_id: 550e8400-e29b-41d4-a716-446655440000                  │
│ action: UPDATE                                                   │
│ entity_type: heritage_sites                                      │
│ entity_id: 660e8400-e29b-41d4-a716-446655440001                 │
│ created_at: 2026-01-26T14:35:20Z                                │
│                                                                  │
│ changes: {                                                       │
│   "old": {                                                       │
│     "id": "660e8400-...",                                        │
│     "name_en": "Pashupatinath",                                  │
│     "status": "draft",                                           │
│     "published_at": null,                                        │
│     "updated_at": "2026-01-26T14:30:45Z"                         │
│   },                                                             │
│   "new": {                                                       │
│     "id": "660e8400-...",                                        │
│     "name_en": "Pashupatinath Temple",                           │
│     "status": "published",                                       │
│     "published_at": "2026-01-26T14:35:20Z",                      │
│     "updated_at": "2026-01-26T14:35:20Z"                         │
│   }                                                              │
│ }                                                                │
│                                                                  │
│ CHANGES DETECTED:                                                │
│ - name_en: "Pashupatinath" → "Pashupatinath Temple"             │
│ - status: "draft" → "published"                                 │
│ - published_at: null → "2026-01-26T14:35:20Z"                   │
│ - updated_at: "2026-01-26T14:30:45Z" → "2026-01-26T14:35:20Z"   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Migration Path

```
┌─────────────────────────────────────────────────────────────────┐
│ BEFORE: Single Palika Assignment                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ admin_users                                                     │
│ ├─ id: 550e8400-...                                             │
│ ├─ full_name: "Hari Sharma"                                     │
│ ├─ role: "palika_admin"                                         │
│ ├─ palika_id: 1 (Kathmandu Metro)                               │
│ ├─ hierarchy_level: NULL                                        │
│ ├─ province_id: NULL                                            │
│ └─ district_id: NULL                                            │
│                                                                 │
│ admin_regions: (empty)                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    (Run Migration)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ AFTER: Multi-Region Assignment                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ admin_users                                                     │
│ ├─ id: 550e8400-...                                             │
│ ├─ full_name: "Hari Sharma"                                     │
│ ├─ role: "province_admin"                                       │
│ ├─ palika_id: NULL (legacy field, no longer used)               │
│ ├─ hierarchy_level: "province"                                  │
│ ├─ province_id: 1 (Bagmati)                                     │
│ └─ district_id: NULL                                            │
│                                                                 │
│ admin_regions                                                   │
│ ├─ id: 1                                                        │
│ ├─ admin_id: 550e8400-...                                       │
│ ├─ region_type: "province"                                      │
│ ├─ region_id: 1 (Bagmati)                                       │
│ ├─ assigned_at: 2026-01-26T14:30:45Z                            │
│ └─ assigned_by: 550e8400-... (super_admin)                      │
│                                                                 │
│ Access: All districts and palikas in Bagmati Province           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

This architecture provides:

✅ **Hierarchical Admin Management**
- National → Province → District → Palika levels
- Flexible multi-region assignments
- Backward compatible with existing admins

✅ **Dynamic Permission-Based Access Control**
- Permissions checked at query time
- No hardcoded role checks
- Flexible permission model

✅ **Complete Audit Trail**
- All changes logged automatically
- Full change history preserved
- Compliance-ready

✅ **Scalable Multi-Tenant System**
- Supports unlimited admins and regions
- Efficient RLS policies with proper indexes
- Performance optimized

