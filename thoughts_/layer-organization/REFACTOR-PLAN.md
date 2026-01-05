# Layer Organization - Refactoring Plan

> **Priority:** 🟢 MEDIUM-TERM
> **Dependencies:** All tests passing, stable API

## Original Thought Stream

```
- we are currently on the 08 layer
- we'll refactor this as package in 09
- the cloudflare headless server shall use the same repo in 09 as package
```

## Current Structure (Layer 08)

```
08-admin-panel/
├── services/               # ← THIS is what we're extracting
│   ├── types.ts
│   ├── database-client.ts
│   ├── auth.service.ts
│   ├── heritage-sites.service.ts
│   ├── events.service.ts
│   ├── blog-posts.service.ts
│   ├── analytics.service.ts
│   └── index.ts
├── app/                    # Next.js specific
├── components/             # Next.js specific
└── lib/                    # Next.js specific
```

## Target Structure (Layer 09)

```
09-services/
├── src/
│   ├── types/
│   │   ├── index.ts
│   │   ├── heritage-sites.types.ts
│   │   ├── events.types.ts
│   │   ├── blog-posts.types.ts
│   │   ├── analytics.types.ts
│   │   └── common.types.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── heritage-sites.service.ts
│   │   ├── events.service.ts
│   │   ├── blog-posts.service.ts
│   │   └── analytics.service.ts
│   ├── database/
│   │   ├── client.ts
│   │   ├── supabase.adapter.ts
│   │   └── mock.adapter.ts
│   └── index.ts            # Public API exports
├── __tests__/
│   ├── services/
│   └── integration/
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Package Definition

```json
{
  "name": "@nepal-tourism/services",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./types": "./dist/types/index.js",
    "./services": "./dist/services/index.js"
  },
  "peerDependencies": {
    "@supabase/supabase-js": "^2.x"
  }
}
```

## Usage After Extraction

### In Admin Panel (08)
```typescript
import { 
  createServices, 
  createSupabaseClient 
} from '@nepal-tourism/services'

const db = createSupabaseClient(supabase)
const services = createServices(db)
```

### In Public Website (Future)
```typescript
import { HeritageSitesService } from '@nepal-tourism/services'
// Read-only usage
```

### In Cloudflare MCP (Future)
```typescript
import { createServices } from '@nepal-tourism/services'
// Wrapped as MCP tools
```

## Migration Steps

### Step 1: Prepare (Non-breaking)
- [ ] Add explicit exports to current services/index.ts
- [ ] Ensure all tests pass
- [ ] Document public API surface

### Step 2: Extract
- [ ] Create 09-services directory
- [ ] Copy services with proper structure
- [ ] Set up build (tsup or tsc)
- [ ] Publish to npm (private registry?) or use workspace

### Step 3: Migrate Consumers
- [ ] Update 08-admin-panel imports
- [ ] Verify functionality
- [ ] Remove duplicated code from 08

### Step 4: Enhance
- [ ] Add MCP tool wrappers
- [ ] Add caching layer (optional)
- [ ] Add telemetry hooks (optional)

## Workspace Setup (Monorepo Option)

If you want to keep everything in one repo:

```json
// Root package.json
{
  "workspaces": [
    "08-admin-panel",
    "09-services"
  ]
}
```

Then in 08-admin-panel:
```json
{
  "dependencies": {
    "@nepal-tourism/services": "workspace:*"
  }
}
```

## Questions to Resolve

1. **npm publish or workspace?**
   - Private npm = cleaner versioning
   - Workspace = simpler during development

2. **Include Supabase types in package?**
   - Yes = easier for consumers
   - No = smaller bundle, less coupling

3. **Split services further?**
   - One package with everything
   - OR separate packages per domain (@nepal-tourism/heritage, @nepal-tourism/events, etc.)

## Not Now

Don't extract until:
1. ✅ All 98 tests passing
2. ✅ API surface is stable
3. ✅ Clear on MCP requirements (affects exports)

---

## Timeline Estimate

| Phase | Effort | When |
|-------|--------|------|
| Step 1: Prepare | 2 hours | After test fixes |
| Step 2: Extract | 4 hours | After Step 1 |
| Step 3: Migrate | 2 hours | After Step 2 |
| Step 4: Enhance | Ongoing | Future |
