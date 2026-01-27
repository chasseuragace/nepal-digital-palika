# Platform Admin Panel

A comprehensive admin panel for managing the multi-tenant Nepal Digital Tourism Infrastructure platform.

## Features

- 🎯 **Dashboard** - System overview with key metrics and recent activity
- 👥 **Admin Management** - Create, edit, and manage platform administrators
- 🛡️ **Role Management** - Define and manage user roles with hierarchical levels
- 🔐 **Permission Management** - Configure granular permissions for roles
- 🗺️ **Geographic Hierarchy** - Manage provinces, districts, and palikas
- 📋 **Audit Log** - Track all system activities and changes
- ⚙️ **Settings** - Configure system-wide settings and preferences

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd platform-admin-panel
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard page
│   ├── admins/           # Admin management
│   ├── roles/            # Role management
│   ├── permissions/      # Permission management
│   ├── regions/          # Geographic hierarchy
│   ├── audit-log/        # Audit log viewer
│   ├── settings/         # System settings
│   └── layout.tsx        # Root layout
├── components/
│   ├── layout/           # Layout components
│   │   ├── AdminLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── ui/              # Reusable UI components
│       ├── Card.tsx
│       ├── Button.tsx
│       └── Table.tsx
└── lib/
    ├── supabase.ts      # Supabase client
    ├── types.ts         # TypeScript types
    └── auth-store.ts    # Auth state management
```

## Available Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm run start

# Linting
npm run lint
```

## Pages

### Dashboard (`/dashboard`)
- System overview with key metrics
- Admin distribution by role
- Recent activity feed

### Admins (`/admins`)
- List all administrators
- Create new admin
- Edit admin details
- Assign regions and permissions
- Delete admin

### Roles (`/roles`)
- List all roles
- Create custom roles
- Edit role permissions
- Delete roles

### Permissions (`/permissions`)
- List all permissions
- Create new permissions
- Edit permission details
- Delete permissions

### Regions (`/regions`)
- View geographic hierarchy
- Manage provinces, districts, palikas
- Assign admins to regions

### Audit Log (`/audit-log`)
- View all system activities
- Filter by action, admin, date
- Export audit logs

### Settings (`/settings`)
- Configure general settings
- Security settings
- Notification preferences

## API Integration

The admin panel connects to the following API endpoints:

```
Admin Management:
GET    /api/admin/admins
POST   /api/admin/admins
GET    /api/admin/admins/:id
PUT    /api/admin/admins/:id
DELETE /api/admin/admins/:id

Role Management:
GET    /api/admin/roles
POST   /api/admin/roles
GET    /api/admin/roles/:id
PUT    /api/admin/roles/:id
DELETE /api/admin/roles/:id

Permission Management:
GET    /api/admin/permissions
POST   /api/admin/permissions
GET    /api/admin/permissions/:id
PUT    /api/admin/permissions/:id
DELETE /api/admin/permissions/:id

Geographic Hierarchy:
GET    /api/admin/provinces
GET    /api/admin/districts/:provinceId
GET    /api/admin/palikas/:districtId
GET    /api/admin/hierarchy/tree

Audit Log:
GET    /api/admin/audit-log
GET    /api/admin/audit-log/:id
POST   /api/admin/audit-log/export

System:
GET    /api/admin/settings
PUT    /api/admin/settings
GET    /api/admin/dashboard/stats
```

## Authentication

The admin panel requires authentication via Supabase Auth. Only users with `super_admin` role can access the panel.

## Security

- Row-Level Security (RLS) policies enforce data access control
- JWT-based authentication
- Session timeout after 30 minutes of inactivity
- 2FA support for admin accounts
- All actions logged to audit trail

## Development

### Adding a New Page

1. Create a new directory in `src/app/`
2. Create `page.tsx` with your component
3. Wrap with `AdminLayout` component
4. Add navigation link in `Sidebar.tsx`

### Adding a New Component

1. Create component in `src/components/`
2. Use TypeScript for type safety
3. Import and use in pages

### Styling

- Use Tailwind CSS for styling
- Follow the existing color scheme
- Use `cn()` utility for conditional classes

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy

### Docker

```bash
docker build -t platform-admin-panel .
docker run -p 3000:3000 platform-admin-panel
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT

## Support

For support, email support@nepaltourism.dev or open an issue on GitHub.

## Roadmap

- [ ] Advanced filtering and search
- [ ] Bulk operations
- [ ] Export/import functionality
- [ ] Advanced analytics
- [ ] Custom role builder
- [ ] API key management
- [ ] Webhook configuration
- [ ] Integration with external services
