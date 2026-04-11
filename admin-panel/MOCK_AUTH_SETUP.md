# Mock Supabase Auth Infrastructure

**Date:** 2026-04-10  
**Status:** ✅ Complete

## Overview

Implemented a complete fake Supabase authentication infrastructure in the admin-panel following the same pattern used in the m-place repository. This allows development and testing without real Supabase credentials.

## What Was Created

### 1. **Mock Admin Users** (`lib/mock-admin-users.ts`)
Pre-generated test admin accounts for development:

```typescript
// Pre-defined test users (passwords in plain text - dev only!)
- super@admin.com / super123456 (Super Admin)
- district@admin.com / district123456 (District Admin - Kathmandu)
- palika@admin.com / palika123456 (Palika Admin - Kathmandu)
- test@admin.com / testpass123456 (Test Admin)
```

**Includes:**
- `MockAdminUser` interface with id, email, password, full_name, role, palika_id, district_id
- Helper functions: `findMockAdminByEmail()`, `findMockAdminById()`, `validatePassword()`, `generateMockToken()`
- `MOCK_ADMIN_USERS` array that persists admins in memory during development

### 2. **Mock Supabase Auth API** (`lib/mock-supabase-auth.ts`)
Server-side mock authentication that mimics Supabase auth interface:

```typescript
// MockAuthApi class methods:
- signInWithPassword({ email, password }) → returns session
- signUp({ email, password }) → creates new user
- signOut() → clears session
- getUser() → returns current user
- refreshSession(token) → returns new tokens

// MockAdminAuthApi class methods (admin operations):
- createUser({ email, password, user_metadata }) → creates new admin
- deleteUser(userId) → removes admin
- updateUserById(userId, attributes) → updates admin
- getUserById(userId) → gets admin by id
- listUsers() → lists all admins
```

**Features:**
- Network delay simulation (50-200ms)
- Full validation (password length, email existence checks)
- Token generation (mock JWT format: `mock_<userId>_<timestamp>_<random>`)
- Error handling matching Supabase API structure

### 3. **Authentication Function** (`lib/auth.ts`)
Updated `authenticateAdmin()` to support both real and mock modes:

```typescript
if (NEXT_PUBLIC_USE_MOCK_AUTH === 'true') {
  // Use mock users from memory
  const user = findMockAdminByEmail(email)
  if (user && validatePassword(user, password)) {
    return AdminUser { id, email, full_name, role, palika_id, is_active: true }
  }
} else {
  // Use real Supabase auth + admin_users table
}
```

### 4. **Login Route** (`app/api/auth/login/route.ts`)
Already uses `authenticateAdmin()` - works with both real and mock auth automatically.

### 5. **Admin Creation Route** (`app/api/admins/create/route.ts`)
Updated to support mock auth:

```typescript
if (USE_MOCK_AUTH) {
  // Add user to MOCK_ADMIN_USERS array in memory
  // Skip region assignments (non-essential for basic testing)
} else {
  // Use real Supabase auth.admin.createUser()
  // Create admin_users and admin_regions records
}
```

### 6. **Supabase Client** (`lib/supabase.ts`)
Updated to support environment-based switching:

```typescript
if (process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true') {
  supabaseAdmin.auth = createMockSupabaseAuth()
} else {
  supabaseAdmin.auth = realSupabaseClient.auth
}
```

## How to Use

### Enable Mock Auth Mode

Add to `.env.local`:
```bash
NEXT_PUBLIC_USE_MOCK_AUTH=true
```

### Log In with Test Accounts

Use any of the pre-defined users:
- **super@admin.com** / super123456
- **district@admin.com** / district123456
- **palika@admin.com** / palika123456
- **test@admin.com** / testpass123456

### Create New Mock Admin

POST `/api/admins/create` with:
```json
{
  "email": "newadifromemail.com",
  "full_name": "New Admin",
  "role": "palika_admin",
  "hierarchy_level": "palika",
  "palika_id": 1,
  "district_id": 3
}
```

The new user is automatically added to `MOCK_ADMIN_USERS` and can immediately log in with their email and a temporary password returned in the response.

## Architecture

```
┌─────────────────────────────────┐
│  UI (Login Form)                 │
└────────────┬────────────────────┘
             │ POST /api/auth/login
             ▼
┌─────────────────────────────────┐
│  app/api/auth/login/route.ts     │
│  └─ authenticateAdmin()          │
└────────────┬────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
┌────────────┐  ┌──────────────────────┐
│Mock Mode   │  │Real Supabase Mode    │
│  (dev)     │  │  (production)        │
└────────────┘  └──────────────────────┘
      │             │
      ▼             ▼
┌────────────────────────────────┐
│  Create Session + Set Cookies  │
└────────────────────────────────┘
```

## Key Differences from m-place

The m-place repo is a client-side app (React), so it stores mock session in localStorage and has global auth state.

The admin-panel is a Next.js server-side app, so:
- Mock data is stored in-memory in `MOCK_ADMIN_USERS` array
- Sessions are managed via secure HTTP-only cookies (handled by auth middleware)
- No localStorage persistence needed (API routes are stateless)
- Each request validates tokens fresh from the mock auth system

## Switching Between Modes

**To use REAL Supabase:**
```bash
# In .env.local, either:
# 1. Remove the line:
NEXT_PUBLIC_USE_MOCK_AUTH=true

# 2. Or set it to false:
NEXT_PUBLIC_USE_MOCK_AUTH=false

# Ensure real Supabase env vars are set:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**To use MOCK:**
```bash
# In .env.local:
NEXT_PUBLIC_USE_MOCK_AUTH=true

# Real Supabase env vars optional (ignored in mock mode)
```

## In-Memory Data Persistence

⚠️ **Important:** Mock admin data is stored in-memory and will be lost when the server restarts.

- Logging out and back in: ✅ Works
- Creating new admins during dev session: ✅ Works
- Server restart: ❌ Mock data is reset to initial `MOCK_ADMIN_USERS` array

This is intentional for development - it keeps the mock state clean and predictable.

## Benefits

✅ **Development**
- No need for real Supabase credentials during development
- Instant auth responses (no network latency)
- Predictable test data
- Can work offline

✅ **Testing**
- Easy to set up test fixtures
- Reproducible auth scenarios
- No risk of modifying production data
- Fast test execution

✅ **Onboarding**
- New developers can immediately use the app
- No credentials setup required
- Pre-populated test accounts

## Next Steps

1. When `NEXT_PUBLIC_USE_MOCK_AUTH=true`, all content datasources also use fake data:
   ```bash
   NEXT_PUBLIC_USE_FAKE_DATASOURCES=true  # Blog posts, events, heritage sites
   NEXT_PUBLIC_USE_MOCK_AUTH=true          # Admin authentication
   ```

2. Full offline development mode:
   ```bash
   # .env.local
   NEXT_PUBLIC_USE_FAKE_DATASOURCES=true
   NEXT_PUBLIC_USE_MOCK_AUTH=true
   
   # Now the entire app works without internet or Supabase
   ```

3. For production, both should be `false` to use real Supabase:
   ```bash
   NEXT_PUBLIC_USE_FAKE_DATASOURCES=false
   NEXT_PUBLIC_USE_MOCK_AUTH=false
   ```
