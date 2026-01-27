# Quick Start Guide

## Setup (5 minutes)

### 1. Environment Setup
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[REDACTED].
SUPABASE_SERVICE_ROLE_KEY=[REDACTED].
```

### 2. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
platform-admin-panel/
├── src/
│   ├── app/                 # Pages (Next.js App Router)
│   │   ├── dashboard/       # Dashboard page
│   │   ├── admins/         # Admin management
│   │   ├── roles/          # Role management
│   │   ├── permissions/    # Permission management
│   │   ├── regions/        # Geographic hierarchy
│   │   ├── audit-log/      # Audit log viewer
│   │   └── settings/       # System settings
│   ├── components/          # Reusable components
│   │   ├── layout/         # Layout components
│   │   └── ui/             # UI components
│   └── lib/                # Utilities and types
├── public/                 # Static assets
└── package.json           # Dependencies
```

## Key Pages

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/dashboard` | System overview |
| Admins | `/admins` | Manage administrators |
| Roles | `/roles` | Manage roles |
| Permissions | `/permissions` | Manage permissions |
| Regions | `/regions` | Manage geographic hierarchy |
| Audit Log | `/audit-log` | View system activities |
| Settings | `/settings` | Configure system |

## Common Tasks

### Add a New Page

1. Create directory: `src/app/new-page/`
2. Create file: `src/app/new-page/page.tsx`
3. Add to sidebar: `src/components/layout/Sidebar.tsx`

Example:
```tsx
'use client'

import { AdminLayout } from '@/components/layout/AdminLayout'

export default function NewPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold">New Page</h1>
      </div>
    </AdminLayout>
  )
}
```

### Add a New Component

1. Create file: `src/components/ui/NewComponent.tsx`
2. Export component
3. Import and use in pages

Example:
```tsx
interface NewComponentProps {
  title: string
}

export function NewComponent({ title }: NewComponentProps) {
  return <div>{title}</div>
}
```

### Connect to API

Use TanStack Query for data fetching:

```tsx
import { useQuery } from '@tanstack/react-query'

export function AdminsList() {
  const { data, isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: async () => {
      const res = await fetch('/api/admin/admins')
      return res.json()
    },
  })

  if (isLoading) return <div>Loading...</div>
  return <div>{/* render data */}</div>
}
```

## Styling

- Use Tailwind CSS classes
- Follow existing color scheme
- Use `cn()` for conditional classes

```tsx
import { cn } from '@/lib/utils'

<div className={cn('px-4 py-2', isActive && 'bg-blue-600')}>
  Content
</div>
```

## Types

Define types in `src/lib/types.ts`:

```tsx
export interface AdminUser {
  id: string
  full_name: string
  email: string
  role: 'super_admin' | 'palika_admin'
  // ...
}
```

## State Management

Use Zustand for global state:

```tsx
import { useAuthStore } from '@/lib/auth-store'

export function MyComponent() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  
  return <div>{user?.full_name}</div>
}
```

## Build & Deploy

### Build
```bash
npm run build
```

### Production
```bash
npm run start
```

### Deploy to Vercel
```bash
vercel deploy
```

## Troubleshooting

### Port 3000 already in use
```bash
npm run dev -- -p 3001
```

### Clear cache
```bash
rm -rf .next
npm run dev
```

### Update dependencies
```bash
npm update
```

## Next Steps

1. ✅ Set up environment variables
2. ✅ Start development server
3. ✅ Explore the dashboard
4. ✅ Review the code structure
5. ⬜ Connect to Supabase API
6. ⬜ Implement authentication
7. ⬜ Add form validation
8. ⬜ Deploy to production

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com)
- [React Query](https://tanstack.com/query)
- [Zustand](https://github.com/pmndrs/zustand)

## Support

For issues or questions, check the main README.md or contact support@nepaltourism.dev
