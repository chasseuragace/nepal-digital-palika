# Repository Structure

## 📊 Visual Overview

```
nepal-digital-tourism/
│
├── 📚 docs/                          # All project documentation
│   ├── 01-overview/                  # Vision, value proposition, stakeholders
│   ├── 02-business/                  # Business model, roadmap, proposals
│   ├── 03-architecture/              # Technical specs, architecture diagrams
│   ├── 04-database-design/           # Schema design, analysis, validation
│   └── 05-operations/                # Workflows, procedures, operations
│
├── 🗄️ database/                      # Database setup and seeding
│   ├── scripts/                      # SQL and TypeScript seeding scripts
│   │   ├── part1-schema.sql         # Core schema definition
│   │   ├── part2-reference-data.sql # Geographic and category data
│   │   ├── part3-rls-policies.sql   # Row Level Security policies
│   │   ├── clear-database.sql       # Database cleanup script
│   │   ├── seed-database.ts         # Main seeding orchestrator
│   │   └── seed-content.ts          # Content seeding (sites, events, blogs)
│   ├── config/                       # Database configuration
│   ├── docs/                         # Database-specific documentation
│   ├── package.json                  # Dependencies and scripts
│   └── README.md                     # Database setup guide
│
├── 🎛️ admin-panel/                   # Admin web application
│   ├── services/                     # Business logic layer
│   │   ├── auth.service.ts          # Authentication service
│   │   ├── heritage-sites.service.ts # Heritage sites CRUD
│   │   ├── events.service.ts        # Events management
│   │   ├── analytics.service.ts     # Analytics service
│   │   ├── blog-posts.service.ts    # Blog management
│   │   ├── database-client.ts       # Database abstraction
│   │   ├── types.ts                 # TypeScript types
│   │   └── __tests__/               # Unit and integration tests
│   │       ├── *.test.ts            # Unit tests (98 tests)
│   │       ├── integration/         # Integration tests (16 tests)
│   │       └── setup/               # Test configuration
│   ├── components/                   # React components (planned)
│   ├── app/                          # Next.js app directory (planned)
│   ├── lib/                          # Utility functions
│   ├── package.json                  # Dependencies and scripts
│   ├── TESTING.md                    # Testing guide
│   └── README.md                     # Admin panel guide
│
├── 🗄️ archive/                       # Deprecated materials
│   ├── API_SPECIFICATION.yaml       # Old API specs
│   ├── E2E_TEST_SUITE.md           # Deprecated test suite
│   └── README.md                     # Archive policy
│
├── 📄 README.md                      # Main project documentation
├── 📄 STRUCTURE.md                   # This file
├── 📄 .gitignore                     # Git ignore rules
└── 📄 package-lock.json              # Root dependencies lock

```

## 🎯 Directory Purposes

### Documentation (`docs/`)
**Purpose:** Centralized documentation for all aspects of the project

**Audience-Specific:**
- `01-overview/` → Executives, stakeholders
- `02-business/` → Project managers, finance
- `03-architecture/` → Developers, architects
- `04-database-design/` → Database admins, analysts
- `05-operations/` → Operations teams, support

### Database (`database/`)
**Purpose:** Database schema, seeding scripts, and setup tools

**Key Features:**
- Automated database setup
- Sample data seeding
- RLS policy management
- Geographic data initialization

**Commands:**
```bash
npm run seed:all      # Seed everything
npm run clear         # Clear database
npm run check         # Verify setup
```

### Admin Panel (`admin-panel/`)
**Purpose:** Web-based administration interface

**Current Status:**
- ✅ Services layer complete
- ✅ Tests passing (114 total)
- 🔄 UI components in progress

**Commands:**
```bash
npm run test:unit         # Run unit tests
npm run test:integration  # Run integration tests
npm run dev              # Start dev server (when ready)
```

### Archive (`archive/`)
**Purpose:** Historical reference and deprecated materials

**Policy:** Do not use for current development

## 📊 File Count Summary

| Directory | Purpose | File Types |
|-----------|---------|------------|
| `docs/` | Documentation | `.md` |
| `database/` | Database setup | `.sql`, `.ts`, `.json` |
| `admin-panel/` | Admin app | `.ts`, `.tsx`, `.json` |
| `archive/` | Historical | Various |

## 🔄 Migration from Old Structure

### Old → New Mapping

```
01-project-overview/      → docs/01-overview/
02-business-commercial/   → docs/02-business/
03-technical-architecture/ → docs/03-architecture/
04-schema-analysis/       → docs/04-database-design/
05-operations/            → docs/05-operations/
06-deprecated/            → archive/
07-database-seeding/      → database/
08-admin-panel/           → admin-panel/
thoughts_/                → archive/
```

## 🎨 Design Principles

1. **Clarity:** Clear separation between docs, code, and data
2. **Audience-First:** Documentation organized by target audience
3. **Discoverability:** Logical naming and structure
4. **Maintainability:** Each directory has its own README
5. **Scalability:** Room for growth (mobile app, etc.)

## 📝 Naming Conventions

- **Directories:** lowercase with hyphens (`admin-panel`, `database`)
- **Documentation:** UPPERCASE with underscores (`README.md`, `TESTING.md`)
- **Code files:** camelCase with extensions (`.service.ts`, `.test.ts`)
- **Config files:** lowercase with dots (`.env`, `.gitignore`)

## 🚀 Getting Started

1. **Read documentation:** Start in `docs/01-overview/`
2. **Setup database:** Follow `database/README.md`
3. **Run admin panel:** Follow `admin-panel/README.md`
4. **Explore code:** Check service layer in `admin-panel/services/`

## 📞 Questions?

- **Structure questions:** This file
- **Documentation:** `docs/README.md`
- **Database:** `database/README.md`
- **Admin panel:** `admin-panel/README.md`
- **General:** Main `README.md`

---

**Last Updated:** January 6, 2025  
**Version:** 2.0.0 (Reorganized Structure)
