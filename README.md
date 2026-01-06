# Nepal Digital Tourism Infrastructure

> **Standardized digital infrastructure as a service for local governments**

A comprehensive platform enabling Nepal's local governments (Palikas) to digitize their tourism assets, manage content, and provide modern services to tourists through mobile and web applications.

---

## 📁 Repository Structure

```
nepal-digital-tourism/
├── docs/                    # 📚 All documentation
│   ├── 01-overview/        # Project vision and value proposition
│   ├── 02-business/        # Business model and implementation roadmap
│   ├── 03-architecture/    # Technical specifications and architecture
│   ├── 04-database-design/ # Database schema and analysis
│   └── 05-operations/      # User workflows and procedures
│
├── database/               # 🗄️ Database setup and seeding
│   ├── scripts/           # SQL and TypeScript seeding scripts
│   ├── config/            # Database configuration
│   └── docs/              # Database-specific documentation
│
├── admin-panel/           # 🎛️ Admin web application
│   ├── services/          # Business logic and API services
│   ├── components/        # React components (to be implemented)
│   └── pages/             # Next.js pages (to be implemented)
│
└── archive/               # 🗄️ Deprecated materials and old versions
```

---

## 🚀 Quick Start Guide

### For Different Roles

| Role | Start Here | Purpose |
|------|-----------|---------|
| **Executives/Decision Makers** | [docs/01-overview/](docs/01-overview/) | Understand vision and value |
| **Project Managers** | [docs/02-business/](docs/02-business/) | Implementation planning |
| **Developers** | [docs/03-architecture/](docs/03-architecture/) | Technical specifications |
| **Database Admins** | [database/](database/) | Setup and seed database |
| **QA/Analysts** | [docs/04-database-design/](docs/04-database-design/) | Schema validation |
| **Operations Teams** | [docs/05-operations/](docs/05-operations/) | User workflows |

---

## 📊 Implementation Status

### ✅ Completed Components

#### Database Layer
- ✅ Complete schema with 20+ tables
- ✅ Row Level Security (RLS) policies
- ✅ Geographic data (7 provinces, 9 districts, 8 palikas)
- ✅ Category system (27 categories)
- ✅ Sample content (8 heritage sites, 8 events, 6 blog posts)
- ✅ Automated seeding scripts

#### Admin Panel Services
- ✅ Authentication service with Supabase Auth
- ✅ Heritage sites CRUD service
- ✅ Events management service
- ✅ Analytics service
- ✅ Blog posts service
- ✅ Unit tests (98 tests passing)
- ✅ Integration tests (16 tests passing)

### 🔄 In Progress
- 🔄 Admin panel UI components
- 🔄 Mobile app development
- 🔄 Content management interface

### 📋 Planned
- 📋 Business registration and verification
- 📋 Review and rating system
- 📋 Advanced analytics dashboard
- 📋 Multi-language content management

---

## 🛠️ Technology Stack

### Backend
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **API:** Supabase REST API / GraphQL

### Admin Panel
- **Framework:** Next.js 14
- **Language:** TypeScript
- **Testing:** Vitest
- **State Management:** React Context (planned)

### Mobile App (Planned)
- **Framework:** React Native / Flutter
- **State Management:** Redux / Provider

---

## 📖 Documentation

### Core Documents

1. **[Executive Summary](docs/01-overview/EXECUTIVE_SUMMARY.md)**
   - Project vision and objectives
   - Target audience and stakeholders
   - Key features and benefits

2. **[Business Model](docs/02-business/BUSINESS_MODEL.md)**
   - Revenue streams
   - Pricing strategy
   - Implementation roadmap

3. **[Technical Architecture](docs/03-architecture/SUPABASE_ARCHITECTURE.md)**
   - System architecture
   - Database design
   - API specifications

4. **[Database Schema](docs/04-database-design/FINAL_SCHEMA_VERIFICATION.md)**
   - Complete schema documentation
   - Relationships and constraints
   - RLS policies

5. **[Operations Guide](docs/05-operations/SYSTEM_OPERATIONS%20copy.md)**
   - User workflows
   - Admin procedures
   - Support guidelines

---

## 🗄️ Database Setup

### Prerequisites
- Node.js 18+
- Supabase account
- PostgreSQL knowledge (basic)

### Setup Steps

1. **Navigate to database directory:**
   ```bash
   cd database
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Run database setup:**
   ```bash
   # Clear existing data (if needed)
   npm run clear
   
   # Seed all data
   npm run seed:all
   ```

5. **Verify setup:**
   ```bash
   npm run check
   ```

**Detailed instructions:** [database/README.md](database/README.md)

---

## 🎛️ Admin Panel

### Prerequisites
- Node.js 18+
- Database already seeded
- Admin user credentials

### Setup Steps

1. **Navigate to admin panel:**
   ```bash
   cd admin-panel
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Run tests:**
   ```bash
   # Unit tests
   npm run test:unit
   
   # Integration tests (requires database)
   npm run test:integration
   ```

5. **Start development server (when UI is ready):**
   ```bash
   npm run dev
   ```

**Detailed instructions:** [admin-panel/README.md](admin-panel/README.md)

---

## 🧪 Testing

### Database Tests
```bash
cd database
npm run test:all
```

### Admin Panel Tests
```bash
cd admin-panel

# Unit tests (fast, with mocks)
npm run test:unit

# Integration tests (real database)
npm run test:integration
```

**Test Coverage:**
- Unit tests: 98 passing
- Integration tests: 16 passing
- Total: 114 tests

---

## 🤝 Contributing

### Development Workflow

1. **Choose your area:**
   - Database: Work in `database/`
   - Admin Panel: Work in `admin-panel/`
   - Documentation: Work in `docs/`

2. **Follow conventions:**
   - TypeScript for all code
   - ESLint for code quality
   - Vitest for testing
   - Conventional commits

3. **Test before committing:**
   ```bash
   npm test
   ```

4. **Document your changes:**
   - Update relevant README files
   - Add inline code comments
   - Update architecture docs if needed

---

## 📞 Support & Contact

### Getting Help

- **Documentation Issues:** Check the relevant `docs/` folder
- **Database Issues:** See [database/README.md](database/README.md)
- **Admin Panel Issues:** See [admin-panel/README.md](admin-panel/README.md)
- **General Questions:** Review [docs/01-overview/](docs/01-overview/)

### Project Structure Questions

Each major directory has its own README with specific guidance:
- [docs/01-overview/README.md](docs/01-overview/README.md)
- [docs/02-business/README.md](docs/02-business/README.md)
- [docs/03-architecture/README.md](docs/03-architecture/README.md)
- [database/README.md](database/README.md)
- [admin-panel/README.md](admin-panel/README.md)

---

## 📜 License

[Add your license information here]

---

## 🎯 Project Goals

1. **Standardization:** Provide consistent digital infrastructure across all Palikas
2. **Accessibility:** Make tourism information easily accessible to tourists
3. **Empowerment:** Enable local governments to manage their own content
4. **Scalability:** Support growth from pilot to nationwide deployment
5. **Sustainability:** Create a financially viable model for long-term operation

---

**Last Updated:** January 6, 2025  
**Version:** 1.0.0  
**Status:** Active Development
