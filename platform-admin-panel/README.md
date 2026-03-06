# Platform Admin Panel (Dev)

Internal developer-facing admin panel for managing the Nepal Digital Tourism platform.

## Overview

**Who:** Developers, DevOps engineers
**What:** Manage platform-level configuration, admins, roles, permissions, regions, subscriptions
**Why:** Central control over multi-tenant system setup and administration

## Architecture

### Authentication
- **Login Page:** Dev credentials (see below)
- **Session Management:** Supabase Auth with local session storage
- **Access Control:** Basic login protection for audit trail
- **Notes:** Not RLS-enforced; all queries use service role key server-side

### Database Access Pattern
```
Client (with anon key)
  ↓
API Endpoint (/api/*)
  ↓
Service Role Client (server-side)
  ↓
Database (bypasses RLS)
```

**Why this pattern:**
- RLS policies can cause infinite recursion on complex queries
- Service role bypass is safe since this is internal-only
- All changes are logged via audit trail
- Simpler than managing RLS for development

## Features

### Admin Management (`/admins`)
- View all platform admins with palika/district/province
- Filter by role
- Search by name

### Role Management (`/roles`)
- View and manage platform roles

### Permissions (`/permissions`)
- View all available permissions
- Map to roles

### Regions (`/regions`)
- View geographic hierarchy
- Manage region assignments

### Subscriptions (`/subscriptions`)
- View 3 subscription tiers (Basic, Tourism, Premium)
- Assign tiers to palikas
- See feature availability per tier

### Audit Log (`/audit-log`)
- Complete audit trail of all operations

## Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Environment variables in .env.local are pre-configured

# 3. Start dev server
npm run dev

# 4. Login with dev credentials (see below)
```

## Test Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@nepaltourism.dev | SuperSecurePass123! |
| Palika Admin | palika.admin@kathmandu.gov.np | KathmanduAdmin456! |
| Moderator | content.moderator@kathmandu.gov.np | ModeratorSecure789! |

## Important Notes

⚠️ **This is for development only**
- Service role key is in `.env.local` (never commit)
- RLS policies are bypassed for simplicity
- No rate limiting or advanced security

For production:
- Implement proper RLS policies
- Use API key authentication
- Add rate limiting
- Implement request signing

## Architecture Decision: Why Service Role?

The platform admin panel uses service role key for database access because:

1. **Simplicity:** No complex RLS policy debugging needed
2. **Safety:** This is internal-only; anon key insufficient anyway
3. **Audit Trail:** Login provides access control + logging
4. **Development:** Easier to manage permissions at app level

Login is kept for:
- Access control (only developers can access)
- Audit trail (tracking who made changes)
- Session management (logout, timeout)
