# Admin Panel Specification

## Overview

A comprehensive admin panel for platform developers to configure and manage the multi-tenant hierarchy, roles, permissions, and regional assignments.

---

## 1. Dashboard

### 1.1 System Overview
```
┌─────────────────────────────────────────────────────────┐
│ Nepal Digital Tourism Infrastructure - Admin Panel      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Quick Stats:                                             │
│  ├─ Total Admins: 127                                    │
│  ├─ Active Regions: 7 provinces, 9 districts, 8 palikas │
│  ├─ Pending Approvals: 12                                │
│  └─ System Health: ✅ Healthy                            │
│                                                           │
│  Recent Activity:                                         │
│  ├─ [2 min ago] palika_admin@kathmandu assigned to KTM   │
│  ├─ [15 min ago] New role created: district_moderator   │
│  └─ [1 hour ago] Permission updated: manage_heritage     │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Key Metrics
- Total admins by role
- Admins by region (province/district/palika)
- Active sessions
- Recent changes (audit log)
- System health indicators

---

## 2. Admin Management

### 2.1 Admin List View
```
┌─────────────────────────────────────────────────────────┐
│ Admins                                    [+ New Admin]  │
├─────────────────────────────────────────────────────────┤
│ Name              │ Role           │ Region    │ Status  │
├───────────────────┼────────────────┼───────────┼─────────┤
│ Raj Poudel        │ super_admin    │ National  │ Active  │
│ Hari Sharma       │ province_admin │ Bagmati   │ Active  │
│ Priya Thapa       │ district_admin │ Kathmandu │ Active  │
│ Sunita Gurung     │ palika_admin   │ KTM Metro │ Active  │
│ Deepak Magar      │ moderator      │ KTM Metro │ Inactive│
└─────────────────────────────────────────────────────────┘

Filters: [Role ▼] [Region ▼] [Status ▼] [Search...]
```

### 2.2 Create/Edit Admin
```
┌─────────────────────────────────────────────────────────┐
│ Create New Admin                                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Basic Information:                                        │
│ ├─ Full Name: [_____________________]                   │
│ ├─ Email: [_____________________]                       │
│ ├─ Phone: [_____________________]                       │
│ └─ Status: [Active ▼]                                   │
│                                                           │
│ Role & Hierarchy:                                        │
│ ├─ Role: [super_admin ▼]                                │
│ │  └─ Description: Full system access across all regions│
│ │                                                         │
│ └─ Hierarchy Level: [National ▼]                        │
│    └─ Assigned Regions:                                  │
│       ├─ ☐ Koshi Province                               │
│       ├─ ☐ Madhesh Province                             │
│       ├─ ☐ Bagmati Province                             │
│       ├─ ☐ Gandaki Province                             │
│       ├─ ☐ Lumbini Province                             │
│       ├─ ☐ Karnali Province                             │
│       └─ ☐ Sudurpashchim Province                       │
│                                                           │
│ Permissions:                                             │
│ ├─ ☑ manage_heritage_sites                              │
│ ├─ ☑ manage_events                                      │
│ ├─ ☑ manage_businesses                                  │
│ ├─ ☑ manage_blog_posts                                  │
│ ├─ ☑ manage_users                                       │
│ ├─ ☑ manage_admins                                      │
│ ├─ ☑ manage_sos                                         │
│ ├─ ☑ manage_support                                     │
│ ├─ ☑ moderate_content                                   │
│ ├─ ☑ view_analytics                                     │
│ ├─ ☑ manage_categories                                  │
│ └─ ☑ send_notifications                                 │
│                                                           │
│ [Cancel]  [Save]  [Send Invite]                         │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Admin Details View
```
┌─────────────────────────────────────────────────────────┐
│ Admin: Hari Sharma                      [Edit] [Delete]  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Profile:                                                  │
│ ├─ Email: hari.sharma@nepaltourism.dev                  │
│ ├─ Phone: +977-1-4123456                                │
│ ├─ Role: province_admin                                  │
│ ├─ Hierarchy Level: Province                             │
│ ├─ Status: Active                                        │
│ ├─ Created: 2026-01-15 10:30 AM                         │
│ └─ Last Login: 2026-01-26 02:15 PM                      │
│                                                           │
│ Assigned Regions:                                        │
│ ├─ Bagmati Province                                      │
│ │  ├─ Kathmandu District                                 │
│ │  │  ├─ Kathmandu Metropolitan                          │
│ │  │  ├─ Lalitpur Metropolitan                           │
│ │  │  └─ Bhaktapur Municipality                          │
│ │  ├─ Lalitpur District                                  │
│ │  └─ Bhaktapur District                                 │
│                                                           │
│ Permissions:                                             │
│ ├─ manage_heritage_sites ✓                              │
│ ├─ manage_events ✓                                      │
│ ├─ manage_businesses ✓                                  │
│ ├─ manage_blog_posts ✓                                  │
│ ├─ moderate_content ✓                                   │
│ └─ view_analytics ✓                                     │
│                                                           │
│ Activity:                                                 │
│ ├─ [2 hours ago] Created heritage site: Pashupatinath   │
│ ├─ [5 hours ago] Approved event: Dashain Festival       │
│ └─ [1 day ago] Updated blog post: Tourism Guide         │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Role Management

### 3.1 Role List
```
┌─────────────────────────────────────────────────────────┐
│ Roles                                    [+ New Role]    │
├─────────────────────────────────────────────────────────┤
│ Role Name          │ Level      │ Admins │ Permissions  │
├────────────────────┼────────────┼────────┼──────────────┤
│ super_admin        │ National   │ 1      │ All (12)     │
│ province_admin     │ Province   │ 7      │ 10           │
│ district_admin     │ District   │ 9      │ 8            │
│ palika_admin       │ Palika     │ 45     │ 8            │
│ content_editor     │ Palika     │ 32     │ 4            │
│ moderator          │ Palika     │ 28     │ 3            │
│ support_agent      │ Palika     │ 6      │ 2            │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Create/Edit Role
```
┌─────────────────────────────────────────────────────────┐
│ Create New Role                                          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Basic Information:                                        │
│ ├─ Role Name: [_____________________]                   │
│ ├─ Description (EN): [_____________________]            │
│ ├─ Description (NE): [_____________________]            │
│ └─ Hierarchy Level: [Palika ▼]                          │
│                                                           │
│ Permissions:                                             │
│ ├─ Heritage Sites:                                       │
│ │  ├─ ☐ manage_heritage_sites                           │
│ │  └─ ☐ view_heritage_sites                             │
│ │                                                         │
│ ├─ Events:                                               │
│ │  ├─ ☐ manage_events                                   │
│ │  └─ ☐ view_events                                     │
│ │                                                         │
│ ├─ Businesses:                                           │
│ │  ├─ ☐ manage_businesses                               │
│ │  └─ ☐ verify_businesses                               │
│ │                                                         │
│ ├─ Blog Posts:                                           │
│ │  ├─ ☐ manage_blog_posts                               │
│ │  └─ ☐ publish_blog_posts                              │
│ │                                                         │
│ ├─ Users & Admins:                                       │
│ │  ├─ ☐ manage_users                                    │
│ │  └─ ☐ manage_admins                                   │
│ │                                                         │
│ ├─ System:                                               │
│ │  ├─ ☐ manage_sos                                      │
│ │  ├─ ☐ manage_support                                  │
│ │  ├─ ☐ moderate_content                                │
│ │  ├─ ☐ view_analytics                                  │
│ │  ├─ ☐ manage_categories                               │
│ │  └─ ☐ send_notifications                              │
│                                                           │
│ [Cancel]  [Save]                                         │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Permission Management

### 4.1 Permission List
```
┌─────────────────────────────────────────────────────────┐
│ Permissions                              [+ New Permission]
├─────────────────────────────────────────────────────────┤
│ Permission Name    │ Resource      │ Action   │ Roles    │
├────────────────────┼───────────────┼──────────┼──────────┤
│ manage_heritage    │ heritage_site │ manage   │ 4 roles  │
│ manage_events      │ event         │ manage   │ 4 roles  │
│ manage_businesses  │ business      │ manage   │ 3 roles  │
│ manage_blog_posts  │ blog_post     │ manage   │ 3 roles  │
│ manage_users       │ user          │ manage   │ 2 roles  │
│ manage_admins      │ admin         │ manage   │ 1 role   │
│ manage_sos         │ sos_request   │ manage   │ 3 roles  │
│ manage_support     │ support_ticket│ manage   │ 2 roles  │
│ moderate_content   │ content       │ moderate │ 4 roles  │
│ view_analytics     │ analytics     │ view     │ 5 roles  │
│ manage_categories  │ category      │ manage   │ 1 role   │
│ send_notifications │ notification  │ send     │ 2 roles  │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Geographic Hierarchy Management

### 5.1 Province Management
```
┌─────────────────────────────────────────────────────────┐
│ Provinces                                                │
├─────────────────────────────────────────────────────────┤
│ Province Name      │ Districts │ Palikas │ Admins │ Edit │
├────────────────────┼───────────┼─────────┼────────┼──────┤
│ Koshi Province     │ 2         │ 2       │ 1      │ ✎    │
│ Madhesh Province   │ 1         │ 1       │ 1      │ ✎    │
│ Bagmati Province   │ 3         │ 3       │ 2      │ ✎    │
│ Gandaki Province   │ 2         │ 2       │ 1      │ ✎    │
│ Lumbini Province   │ 1         │ 0       │ 0      │ ✎    │
│ Karnali Province   │ 0         │ 0       │ 0      │ ✎    │
│ Sudurpashchim      │ 0         │ 0       │ 0      │ ✎    │
└─────────────────────────────────────────────────────────┘
```

### 5.2 District Management
```
┌─────────────────────────────────────────────────────────┐
│ Districts (Bagmati Province)                             │
├─────────────────────────────────────────────────────────┤
│ District Name      │ Palikas │ Admins │ Status │ Edit   │
├────────────────────┼─────────┼────────┼────────┼────────┤
│ Kathmandu          │ 3       │ 2      │ Active │ ✎      │
│ Lalitpur           │ 1       │ 1      │ Active │ ✎      │
│ Bhaktapur          │ 1       │ 1      │ Active │ ✎      │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Palika Management
```
┌─────────────────────────────────────────────────────────┐
│ Palikas (Kathmandu District)                             │
├─────────────────────────────────────────────────────────┤
│ Palika Name        │ Type           │ Wards │ Admins │ Edit
├────────────────────┼────────────────┼───────┼────────┼─────┤
│ Kathmandu Metro    │ Metropolitan   │ 32    │ 2      │ ✎   │
│ Lalitpur Metro     │ Metropolitan   │ 29    │ 1      │ ✎   │
│ Bhaktapur Muni     │ Municipality   │ 10    │ 1      │ ✎   │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Region Assignment

### 6.1 Assign Admin to Regions
```
┌─────────────────────────────────────────────────────────┐
│ Assign Admin to Regions                                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Admin: [Hari Sharma ▼]                                  │
│ Role: province_admin                                     │
│ Hierarchy Level: Province                                │
│                                                           │
│ Available Regions:                                       │
│ ├─ Provinces:                                            │
│ │  ├─ ☐ Koshi Province                                  │
│ │  ├─ ☑ Bagmati Province (assigned)                     │
│ │  ├─ ☐ Gandaki Province                                │
│ │  ├─ ☐ Lumbini Province                                │
│ │  ├─ ☐ Karnali Province                                │
│ │  ├─ ☐ Madhesh Province                                │
│ │  └─ ☐ Sudurpashchim Province                          │
│                                                           │
│ Assigned Regions (Bagmati Province):                     │
│ ├─ Districts:                                            │
│ │  ├─ ☑ Kathmandu District                              │
│ │  ├─ ☑ Lalitpur District                               │
│ │  └─ ☑ Bhaktapur District                              │
│                                                           │
│ ├─ Palikas (auto-included from districts):              │
│ │  ├─ ☑ Kathmandu Metropolitan                          │
│ │  ├─ ☑ Lalitpur Metropolitan                           │
│ │  ├─ ☑ Bhaktapur Municipality                          │
│                                                           │
│ [Cancel]  [Save]                                         │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Audit & Activity Log

### 7.1 Audit Log View
```
┌─────────────────────────────────────────────────────────┐
│ Audit Log                                                │
├─────────────────────────────────────────────────────────┤
│ Timestamp          │ Admin         │ Action      │ Details
├────────────────────┼───────────────┼─────────────┼────────┤
│ 2026-01-26 14:30   │ Raj Poudel    │ Created     │ Admin: Hari Sharma
│ 2026-01-26 14:25   │ Raj Poudel    │ Updated     │ Role: province_admin
│ 2026-01-26 14:20   │ Hari Sharma   │ Created     │ Heritage: Pashupatinath
│ 2026-01-26 14:15   │ Sunita Gurung │ Approved    │ Event: Dashain Festival
│ 2026-01-26 14:10   │ Raj Poudel    │ Deleted     │ Admin: Old User
│ 2026-01-26 14:05   │ Priya Thapa   │ Updated     │ Blog: Tourism Guide
└─────────────────────────────────────────────────────────┘

Filters: [Admin ▼] [Action ▼] [Date Range ▼] [Search...]
Export: [CSV] [PDF]
```

### 7.2 Audit Log Details
```
┌─────────────────────────────────────────────────────────┐
│ Audit Log Entry                                          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Timestamp: 2026-01-26 14:30:45 UTC                      │
│ Admin: Raj Poudel (super_admin)                         │
│ Action: Created                                          │
│ Entity Type: admin_user                                  │
│ Entity ID: 550e8400-e29b-41d4-a716-446655440000        │
│                                                           │
│ Changes:                                                  │
│ {                                                         │
│   "full_name": "Hari Sharma",                            │
│   "email": "hari.sharma@nepaltourism.dev",              │
│   "role": "province_admin",                              │
│   "hierarchy_level": "province",                         │
│   "regions": ["Bagmati Province"],                       │
│   "permissions": [                                       │
│     "manage_heritage_sites",                             │
│     "manage_events",                                     │
│     "manage_businesses",                                 │
│     "manage_blog_posts",                                 │
│     "moderate_content",                                  │
│     "view_analytics"                                     │
│   ],                                                      │
│   "status": "active"                                     │
│ }                                                         │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 8. System Configuration

### 8.1 Settings
```
┌─────────────────────────────────────────────────────────┐
│ System Settings                                          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ General:                                                  │
│ ├─ Platform Name: [Nepal Digital Tourism Infrastructure]
│ ├─ Support Email: [support@nepaltourism.dev]            │
│ └─ Support Phone: [+977-1-4123456]                      │
│                                                           │
│ Security:                                                 │
│ ├─ Session Timeout (minutes): [30]                      │
│ ├─ Password Min Length: [8]                             │
│ ├─ Require 2FA for Admins: [✓]                          │
│ └─ IP Whitelist: [_____________________]                │
│                                                           │
│ Notifications:                                           │
│ ├─ Email on Admin Creation: [✓]                         │
│ ├─ Email on Permission Change: [✓]                      │
│ ├─ Email on Suspicious Activity: [✓]                    │
│ └─ Slack Webhook: [_____________________]               │
│                                                           │
│ [Cancel]  [Save]                                         │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Technical Architecture

### 9.1 Admin Panel Stack
```
Frontend:
├─ Framework: Next.js 14 (TypeScript)
├─ UI Library: Shadcn/ui + Tailwind CSS
├─ State Management: TanStack Query + Zustand
├─ Forms: React Hook Form + Zod validation
└─ Charts: Recharts for analytics

Backend:
├─ API: Next.js API Routes
├─ Database: Supabase (PostgreSQL)
├─ Auth: Supabase Auth (JWT)
├─ RLS: Row-Level Security policies
└─ Audit: Custom audit logging

Deployment:
├─ Hosting: Vercel
├─ Database: Supabase Cloud
├─ CDN: Vercel Edge Network
└─ Monitoring: Sentry + LogRocket
```

### 9.2 API Endpoints
```
Admin Management:
├─ GET    /api/admin/admins
├─ POST   /api/admin/admins
├─ GET    /api/admin/admins/:id
├─ PUT    /api/admin/admins/:id
├─ DELETE /api/admin/admins/:id
└─ POST   /api/admin/admins/:id/regions

Role Management:
├─ GET    /api/admin/roles
├─ POST   /api/admin/roles
├─ GET    /api/admin/roles/:id
├─ PUT    /api/admin/roles/:id
└─ DELETE /api/admin/roles/:id

Permission Management:
├─ GET    /api/admin/permissions
├─ POST   /api/admin/permissions
├─ GET    /api/admin/permissions/:id
├─ PUT    /api/admin/permissions/:id
└─ DELETE /api/admin/permissions/:id

Geographic Hierarchy:
├─ GET    /api/admin/provinces
├─ GET    /api/admin/districts/:provinceId
├─ GET    /api/admin/palikas/:districtId
└─ GET    /api/admin/hierarchy/tree

Audit Log:
├─ GET    /api/admin/audit-log
├─ GET    /api/admin/audit-log/:id
└─ POST   /api/admin/audit-log/export

System:
├─ GET    /api/admin/settings
├─ PUT    /api/admin/settings
└─ GET    /api/admin/dashboard/stats
```

---

## 10. Security & Access Control

### 10.1 Admin Panel Access
- Only `super_admin` role can access admin panel
- 2FA required for all admin panel access
- IP whitelist support
- Session timeout: 30 minutes
- All actions logged to audit trail

### 10.2 Permission Checks
```typescript
// Example: Only super_admin can create new admins
if (user.role !== 'super_admin') {
  throw new UnauthorizedError('Only super admins can create admins');
}

// Example: Can only assign regions within own hierarchy
if (user.hierarchy_level === 'province') {
  if (newAdmin.hierarchy_level === 'national') {
    throw new UnauthorizedError('Cannot assign national-level admins');
  }
}
```

---

## 11. Implementation Roadmap

### Phase 1: Core Admin Panel (Weeks 1-2)
- [ ] Admin list/create/edit/delete
- [ ] Role management UI
- [ ] Permission management UI
- [ ] Basic audit logging

### Phase 2: Geographic Hierarchy (Weeks 3-4)
- [ ] Province/district/palika management
- [ ] Region assignment UI
- [ ] Hierarchical access control

### Phase 3: Advanced Features (Weeks 5-6)
- [ ] Analytics dashboard
- [ ] Bulk operations
- [ ] Export/import functionality
- [ ] Advanced audit log filtering

### Phase 4: Polish & Security (Weeks 7-8)
- [ ] 2FA implementation
- [ ] IP whitelist
- [ ] Rate limiting
- [ ] Performance optimization

---

## 12. UI/UX Principles

1. **Clarity**: Clear role/permission hierarchy visualization
2. **Safety**: Confirmation dialogs for destructive actions
3. **Efficiency**: Bulk operations, quick filters, search
4. **Auditability**: Every action logged and visible
5. **Accessibility**: WCAG 2.1 AA compliance
6. **Responsiveness**: Works on desktop, tablet, mobile

---

## 13. Success Metrics

- Admin panel load time < 2 seconds
- 99.9% uptime
- Zero unauthorized access incidents
- All actions audited and traceable
- Admin satisfaction score > 4.5/5
