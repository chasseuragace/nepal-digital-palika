# Testing Guide

## Overview

The admin panel has two types of tests:
- **Unit Tests**: Fast tests using mocks (98 tests)
- **Integration Tests**: Tests against real Supabase database (16 tests)

## Running Tests

### Run All Unit Tests
```bash
npm run test:unit
```

### Run Integration Tests
```bash
npm run test:integration
```

### Run All Tests (will fail on integration without env vars)
```bash
npm test
```

## Test Structure

```
services/__tests__/
├── *.test.ts              # Unit tests (with mocks)
├── integration/           # Integration tests (real DB)
│   ├── auth.integration.test.ts
│   └── heritage-sites.integration.test.ts
└── setup/
    └── integration-setup.ts  # Integration test configuration
```

## Integration Tests Setup

Integration tests require a `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Prerequisites
1. Database must be seeded with test data
2. Run from `07-database-seeding/`:
   ```bash
   npm run seed:all
   ```

## Test Results

### Unit Tests (98 passing)
- ✅ Auth Service (23 tests)
- ✅ Heritage Sites Service (29 tests)
- ✅ Events Service (26 tests)
- ✅ Analytics Service (20 tests)

### Integration Tests (16 passing)
- ✅ Auth Integration (9 tests)
  - Real authentication with Supabase Auth
  - Permission validation
  - Role-based access control
- ✅ Heritage Sites Integration (7 tests)
  - CRUD operations against real database
  - RLS policy validation
  - Data filtering and search

## Key Fixes Applied

1. **Fixed auth service tests**: Added mock Supabase auth methods
2. **Fixed integration test authentication**: Login before making requests
3. **Fixed permission expectations**: Aligned with actual database permissions
4. **Fixed heritage sites service**: Corrected `this` context in map callbacks
5. **Fixed test data**: Used proper latitude/longitude instead of GeoJSON

## Notes

- Integration tests authenticate as super_admin before running
- Tests clean up after themselves (delete test data)
- RLS policies are validated by integration tests
- Unit tests use mocks and don't require database connection
