# Integration Test Helpers

This guide explains how to use the admin creation helper functions in integration tests to avoid code duplication.

## Quick Start

Instead of manually creating admins in 3 steps (auth user + admin_users + admin_regions), use one of these helpers:

```typescript
import {
  createPalikaAdminForTest,
  createDistrictAdminForTest,
  createProvinceAdminForTest,
  createSuperAdminForTest,
  createModeratorForTest
} from '../setup/integration-setup'

// Create a palika admin
const palikaAdmin = await createPalikaAdminForTest(
  palikaId,
  'test@example.com',
  'password123',
  'Test Admin Name'
)

// Create a district admin
const districtAdmin = await createDistrictAdminForTest(
  districtId,
  'test@example.com',
  'password123',
  'Test Admin Name'
)

// Create a super admin
const superAdmin = await createSuperAdminForTest(
  'test@example.com',
  'password123',
  'Test Admin Name'
)
```

## Available Helpers

### createPalikaAdminForTest(palikaId, email, password, fullName)

Creates a palika-level admin with full hierarchy setup.

**Automatically:**
- Fetches district_id from the palika
- Fetches province_id from the district
- Creates auth user
- Creates admin_users record with all hierarchy fields
- Creates admin_regions entry

**Example:**
```typescript
const admin = await createPalikaAdminForTest(
  testPalikaId,
  'palika.admin@example.com',
  'SecurePassword123!',
  'Palika Administrator'
)

// admin now has:
// - Complete auth setup
// - admin_users with province_id, district_id, palika_id
// - admin_regions entry for RLS access
```

### createDistrictAdminForTest(districtId, email, password, fullName)

Creates a district-level admin.

**Automatically:**
- Fetches province_id from the district
- Creates auth user
- Creates admin_users record with hierarchy fields
- Creates admin_regions entry

**Example:**
```typescript
const admin = await createDistrictAdminForTest(
  testDistrictId,
  'district.admin@example.com',
  'SecurePassword123!',
  'District Administrator'
)
```

### createProvinceAdminForTest(provinceId, email, password, fullName)

Creates a province-level admin.

**Automatically:**
- Creates auth user
- Creates admin_users record
- Creates admin_regions entry

**Example:**
```typescript
const admin = await createProvinceAdminForTest(
  testProvinceId,
  'province.admin@example.com',
  'SecurePassword123!',
  'Province Administrator'
)
```

### createSuperAdminForTest(email, password, fullName)

Creates a super admin (national level).

**Important:** Super admins do NOT have region assignments (national scope).

**Automatically:**
- Creates auth user
- Creates admin_users record with national hierarchy
- Does NOT create admin_regions entry

**Example:**
```typescript
const admin = await createSuperAdminForTest(
  'super.admin@example.com',
  'SecurePassword123!',
  'Super Administrator'
)
```

### createModeratorForTest(palikaId, email, password, fullName)

Creates a moderator for a specific palika.

**Automatically:**
- Fetches full hierarchy from palika
- Creates auth user
- Creates admin_users record
- Creates admin_regions entry

**Example:**
```typescript
const moderator = await createModeratorForTest(
  testPalikaId,
  'moderator@example.com',
  'SecurePassword123!',
  'Content Moderator'
)
```

## Under the Hood

All helpers use `createTestAdminWithRegion()` which implements the 3-step admin creation process:

1. **Create Auth User** via `supabase.auth.admin.createUser()`
2. **Create Admin Profile** in `admin_users` table with hierarchy fields
3. **Create Region Assignment** in `admin_regions` table for RLS

### Error Handling

All helpers include automatic rollback:

- If admin_users creation fails → deletes auth user
- If admin_regions creation fails → deletes both auth user and admin_users
- Clear error messages indicating which step failed

**Example:**
```typescript
try {
  const admin = await createPalikaAdminForTest(palikaId, email, password, name)
} catch (error) {
  console.error(error.message)
  // Auth user and admin records automatically cleaned up
}
```

## Before and After

### Before (Manual - ~40 lines per admin creation)
```typescript
const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true
})
if (authError) throw new Error(`Auth error: ${authError.message}`)

// Fetch hierarchy
const { data: palika } = await supabase.from('palikas')
  .select('district_id').eq('id', palikaId).single()
const { data: district } = await supabase.from('districts')
  .select('province_id').eq('id', palika.district_id).single()

const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
  id: authUser.user.id,
  full_name: fullName,
  role: 'palika_admin',
  hierarchy_level: 'palika',
  province_id: district.province_id,
  district_id: palika.district_id,
  palika_id: palikaId,
  is_active: true
}).select().single()
if (adminError) throw new Error(`Admin error: ${adminError.message}`)

const { error: regionError } = await supabase.from('admin_regions').insert({
  admin_id: authUser.user.id,
  region_type: 'palika',
  region_id: palikaId
})
if (regionError) throw new Error(`Region error: ${regionError.message}`)
```

### After (Using helper - 1 line)
```typescript
const admin = await createPalikaAdminForTest(
  palikaId,
  email,
  password,
  fullName
)
```

## Best Practices

1. **Import helpers at the top of your test file:**
   ```typescript
   import {
     createPalikaAdminForTest,
     createSuperAdminForTest
   } from '../setup/integration-setup'
   ```

2. **Use in beforeAll or within test for clean setup:**
   ```typescript
   beforeAll(async () => {
     testAdmin = await createPalikaAdminForTest(...)
   })
   ```

3. **Cleanup is automatic via afterEach:**
   ```typescript
   afterEach(async () => {
     const { data: testAdmins } = await supabase
       .from('admin_users')
       .select('id')
       .like('full_name', 'test-%')

     for (const admin of testAdmins) {
       await supabase.auth.admin.deleteUser(admin.id)
     }
   })
   ```

4. **Always handle errors:**
   ```typescript
   try {
     const admin = await createPalikaAdminForTest(...)
   } catch (error) {
     throw new Error(`Test setup failed: ${error.message}`)
   }
   ```

## Adding New Helpers

To add a new admin type helper:

1. Create a new function in `integration-setup.ts`
2. Use `createTestAdminWithRegion()` or implement 3-step process
3. Include JSDoc comments
4. Add error handling and rollback
5. Document in this file

Example:
```typescript
export async function createContentEditorForTest(
  palikaId: number,
  email: string,
  password: string,
  fullName: string
) {
  // Fetch hierarchy
  // Create using createTestAdminWithRegion with 'content_editor' role
  // Return admin object
}
```

## FAQs

**Q: Do I need to create admin_regions entries manually?**
A: No! All helpers handle this automatically. Never skip admin_regions creation—RLS depends on it.

**Q: Can I use these helpers for non-test code?**
A: No, these are test-only. They use the service role and auto-confirmation. For production, use the API endpoint.

**Q: What if the hierarchy lookup fails?**
A: The helper will throw an error with details about which lookup failed. This is by design—test data must be complete.

**Q: Do these helpers clean up after themselves?**
A: No, you still need afterEach hooks to delete test admins. The helpers only clean up on creation failure.

**Q: Can I use these in integration tests outside the admin-panel?**
A: These are specific to the admin-panel test setup. Similar patterns might apply elsewhere.
