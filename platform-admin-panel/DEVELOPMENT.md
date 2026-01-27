# Development Guide

## Code Style & Conventions

### File Naming
- Pages: `page.tsx` (Next.js convention)
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `types.ts`

### Component Structure
```tsx
'use client'  // Add if using client-side features

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ComponentProps {
  children?: ReactNode
  className?: string
}

export function Component({ children, className }: ComponentProps) {
  return (
    <div className={cn('base-classes', className)}>
      {children}
    </div>
  )
}
```

### Imports Order
1. React/Next.js imports
2. Third-party imports
3. Local imports (components, lib, types)

```tsx
import { ReactNode } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { AdminUser } from '@/lib/types'
```

## Adding Features

### 1. Add a New Page

**Step 1:** Create directory
```bash
mkdir -p src/app/new-feature
```

**Step 2:** Create page component
```tsx
// src/app/new-feature/page.tsx
'use client'

import { AdminLayout } from '@/components/layout/AdminLayout'

export default function NewFeaturePage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold">New Feature</h1>
      </div>
    </AdminLayout>
  )
}
```

**Step 3:** Add to sidebar
```tsx
// src/components/layout/Sidebar.tsx
const navigation = [
  // ... existing items
  { name: 'New Feature', href: '/new-feature', icon: IconName },
]
```

### 2. Add a New Component

**Step 1:** Create component file
```tsx
// src/components/ui/NewComponent.tsx
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface NewComponentProps {
  title: string
  children?: ReactNode
  className?: string
}

export function NewComponent({ 
  title, 
  children, 
  className 
}: NewComponentProps) {
  return (
    <div className={cn('p-4 border rounded-lg', className)}>
      <h3 className="font-semibold">{title}</h3>
      {children}
    </div>
  )
}
```

**Step 2:** Use in pages
```tsx
import { NewComponent } from '@/components/ui/NewComponent'

export default function Page() {
  return (
    <NewComponent title="Example">
      Content here
    </NewComponent>
  )
}
```

### 3. Add API Integration

**Step 1:** Define types
```tsx
// src/lib/types.ts
export interface NewData {
  id: string
  name: string
  // ...
}
```

**Step 2:** Create API hook
```tsx
// src/lib/hooks/useNewData.ts
import { useQuery } from '@tanstack/react-query'
import { NewData } from '@/lib/types'

export function useNewData() {
  return useQuery({
    queryKey: ['new-data'],
    queryFn: async () => {
      const res = await fetch('/api/new-data')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json() as Promise<NewData[]>
    },
  })
}
```

**Step 3:** Use in component
```tsx
import { useNewData } from '@/lib/hooks/useNewData'

export function NewDataList() {
  const { data, isLoading, error } = useNewData()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {data?.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
```

### 4. Add Form with Validation

**Step 1:** Install dependencies (already done)
```bash
npm install react-hook-form zod @hookform/resolvers
```

**Step 2:** Create form component
```tsx
// src/components/forms/NewItemForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
})

type FormData = z.infer<typeof schema>

export function NewItemForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
    console.log(data)
    // Submit to API
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Name</label>
        <input
          {...register('name')}
          className="w-full px-4 py-2 border rounded-lg"
        />
        {errors.name && <p className="text-red-600 text-sm">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input
          {...register('email')}
          className="w-full px-4 py-2 border rounded-lg"
        />
        {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
      </div>

      <Button type="submit">Submit</Button>
    </form>
  )
}
```

## Testing

### Unit Tests
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

### Example Test
```tsx
// src/components/ui/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

## Performance Optimization

### 1. Image Optimization
```tsx
import Image from 'next/image'

<Image
  src="/image.png"
  alt="Description"
  width={400}
  height={300}
  priority
/>
```

### 2. Code Splitting
```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('@/components/Heavy'), {
  loading: () => <div>Loading...</div>,
})
```

### 3. Memoization
```tsx
import { memo } from 'react'

const MemoizedComponent = memo(function Component() {
  return <div>Content</div>
})
```

## Debugging

### Browser DevTools
- Open DevTools: F12
- React DevTools extension
- Network tab for API calls
- Console for errors

### VS Code Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

## Common Issues & Solutions

### Issue: Port 3000 already in use
```bash
# Use different port
npm run dev -- -p 3001

# Or kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Issue: Module not found
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run dev
```

### Issue: TypeScript errors
```bash
# Check types
npx tsc --noEmit

# Fix types
npm install --save-dev @types/node
```

### Issue: Styling not applied
- Check Tailwind CSS is imported in `globals.css`
- Verify class names are correct
- Check `tailwind.config.ts` includes correct paths

## Git Workflow

### Branch Naming
```
feature/admin-management
bugfix/sidebar-navigation
docs/api-integration
```

### Commit Messages
```
feat: add admin management page
fix: sidebar navigation active state
docs: update API integration guide
style: improve button styling
refactor: extract table component
```

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Feature
- [ ] Bug fix
- [ ] Documentation

## Testing
How to test the changes

## Screenshots
If applicable
```

## Deployment Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Environment variables set
- [ ] API endpoints working
- [ ] Performance optimized
- [ ] Security audit passed
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Ready for production

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)

### Tools
- [VS Code](https://code.visualstudio.com)
- [React DevTools](https://react-devtools-tutorial.vercel.app)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

### Learning
- [Next.js Tutorial](https://nextjs.org/learn)
- [React Tutorial](https://react.dev/learn)
- [Tailwind CSS Tutorial](https://tailwindcss.com/docs)

## Best Practices

1. **Keep components small** - Single responsibility
2. **Use TypeScript** - Type safety
3. **Avoid prop drilling** - Use context/state management
4. **Optimize images** - Use Next.js Image component
5. **Lazy load** - Use dynamic imports
6. **Test thoroughly** - Unit and integration tests
7. **Document code** - Comments and JSDoc
8. **Follow conventions** - Consistent naming
9. **Security first** - Validate inputs, sanitize outputs
10. **Performance matters** - Monitor and optimize

## Support

For development questions:
1. Check documentation
2. Review existing code
3. Search GitHub issues
4. Ask in team chat
5. Contact: dev@nepaltourism.dev
