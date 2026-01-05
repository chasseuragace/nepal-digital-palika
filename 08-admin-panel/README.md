# Nepal Tourism Admin Panel

React-based admin panel for managing Nepal Digital Tourism Infrastructure content.

## 🎯 Purpose

This admin panel implements the exact workflows described in the System Operations Guide (Section 2: Palika Administrator Workflows). It provides a functional interface for content management without UI beautification - pure functionality focus.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd 08-admin-panel
npm install
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.local.example .env.local

# Edit with your Supabase credentials
nano .env.local
```

Required environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_SESSION_SECRET=your-random-secret-key
```

### 3. Ensure Database Setup
Make sure you have completed the database seeding from `07-database-seeding/`:
```bash
# From the seeding folder
npm run seed:all
npm run setup:temp-admin
```

### 4. Start Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

## 🔐 Login Credentials

Use the temporary admin accounts created by the seeding script:

- **Super Admin:** `superadmin@nepal-tourism.gov.np`
- **Palika Admin:** `ktm.admin@nepal-tourism.gov.np`  
- **Content Moderator:** `moderator@nepal-tourism.gov.np`
- **Password:** `admin123` (for all accounts)

## 📋 Implemented Features

### ✅ **Core Authentication**
- Simple session-based login using temporary admin users
- Role-based access control
- Session management with localStorage

### ✅ **Dashboard (Section 2.2 - Weekly Content Review)**
- Content statistics overview
- Recent activity tracking
- Quick action buttons
- Pending approvals queue (placeholder)

### ✅ **Heritage Sites Management (Section 3.1)**
Complete implementation of the heritage site workflow:

**Basic Information Tab:**
- Site names (Nepali/English)
- Category and type selection
- Status management
- Location details with GPS coordinates
- Ward and Palika assignment

**Description Tab:**
- Short description (100 words)
- Full description (500-1000 words)
- Content guidelines following the workflow

**Visitor Information Tab:**
- Opening hours and entry fees
- Best time to visit and time needed
- Accessibility information
- Facilities and restrictions
- Contact information

**SEO & Metadata Tab:**
- Meta title and description
- Keywords and URL slug
- Auto-generation from content

### 🔄 **In Progress**
- Events management (Section 3.2)
- Blog posts management
- Media management (Section 3.4)
- User management (Section 2.3)

### 📋 **Planned Features**
- Content approval workflow
- Monthly reporting (Section 2.4)
- Emergency alert system (Section 10.5)
- Analytics integration
- Bulk operations

## 🏗️ Architecture

### **Frontend**
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **React Hook Form** for form management
- **React Quill** for rich text editing (planned)

### **Backend**
- **Supabase** for database and API
- **Next.js API Routes** for server-side logic
- **Temporary admin authentication** (will migrate to Supabase Auth)

### **Database Integration**
- Uses existing schema from `07-database-seeding/`
- Service role access for admin operations
- Proper RLS policy integration

## 📁 Project Structure

```
08-admin-panel/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/login/         # Authentication
│   │   ├── dashboard/stats/    # Dashboard data
│   │   ├── heritage-sites/     # Heritage sites CRUD
│   │   ├── categories/         # Category management
│   │   └── palikas/           # Palika data
│   ├── dashboard/             # Admin dashboard
│   ├── heritage-sites/        # Heritage site management
│   │   ├── page.tsx          # List view
│   │   └── new/page.tsx      # Creation form
│   ├── login/                 # Login page
│   └── layout.tsx            # Root layout
├── components/
│   └── AdminLayout.tsx       # Admin navigation and layout
├── lib/
│   ├── supabase.ts          # Supabase client configuration
│   └── auth.ts              # Authentication utilities
└── README.md                # This file
```

## 🔧 Development Guidelines

### **Functionality First**
- Zero consideration for UI beautification
- Focus on implementing exact workflows from System Operations Guide
- Use minimal, functional CSS only

### **Workflow Compliance**
- Follow Section 3.1 (Heritage Site Creation) exactly
- Implement all tabs and fields as specified
- Include all validation and helper text
- Match the step-by-step process

### **Code Standards**
- TypeScript for all components
- Proper error handling
- Loading states for all async operations
- Form validation matching business rules

## 🧪 Testing

### **Manual Testing Checklist**

**Authentication:**
- [ ] Login with all three admin accounts
- [ ] Role-based navigation visibility
- [ ] Session persistence across page refreshes
- [ ] Logout functionality

**Heritage Sites:**
- [ ] Create new heritage site with all tabs
- [ ] Form validation for required fields
- [ ] Auto-generation of URL slug
- [ ] GPS coordinate input
- [ ] Category and Palika selection
- [ ] Success/error message handling

**Dashboard:**
- [ ] Statistics display correctly
- [ ] Recent activity shows latest content
- [ ] Quick action buttons work
- [ ] Navigation between sections

## 🔄 Next Development Steps

### **Phase 1: Complete Core Features**
1. **Events Management** - Implement Section 3.2 workflow
2. **Blog Posts** - Rich text editor with media
3. **Media Management** - Photo upload and organization

### **Phase 2: Advanced Features**
4. **User Management** - Add/remove content editors
5. **Content Approval** - Workflow for content review
6. **Analytics** - Monthly reporting dashboard

### **Phase 3: Production Ready**
7. **Supabase Auth Migration** - Replace temporary admin system
8. **Security Hardening** - Proper authentication and authorization
9. **Performance Optimization** - Caching and optimization

## 🐛 Known Issues

- **Temporary Authentication:** Using simple session storage (not production ready)
- **No Image Upload:** Media management not yet implemented
- **Basic Styling:** Minimal CSS, no responsive design
- **No Validation:** Client-side validation needs enhancement

## 📞 Support

This admin panel directly implements the workflows from:
- `05-operations/SYSTEM_OPERATIONS copy.md` (Sections 2-3)
- Database schema from `07-database-seeding/`
- Admin users from temporary admin setup

For issues:
1. Check database seeding is complete
2. Verify environment variables are set
3. Ensure temporary admin users exist
4. Check browser console for errors

## 🎯 Success Criteria

**Functional Requirements Met:**
- ✅ Admin authentication working
- ✅ Heritage site creation following exact workflow
- ✅ Dashboard with content statistics
- ✅ Navigation between all sections
- ✅ Form validation and error handling

**Next Milestone:**
- Complete events and blog post management
- Implement media upload functionality
- Add user management interface
- Build content approval workflow

This admin panel provides the foundation for content management while following the exact specifications from the System Operations Guide.