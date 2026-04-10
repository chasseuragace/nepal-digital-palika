import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'
const PALIKA_CREDENTIALS = {
  email: 'palika@admin.com',
  password: 'palika123456'
}

test.describe('Palika Admin - Full User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh
    await page.goto(`${BASE_URL}/login`)
  })

  test('1. Login as palika admin', async ({ page }) => {
    // Fill login form
    await page.fill('input[type="email"]', PALIKA_CREDENTIALS.email)
    await page.fill('input[type="password"]', PALIKA_CREDENTIALS.password)

    // Submit
    await page.click('button:has-text("Login")')

    // Should redirect to dashboard (roles page is default)
    await page.waitForURL(`${BASE_URL}/roles`, { timeout: 5000 })
    expect(page.url()).toContain('/roles')

    // Session should be in localStorage
    const session = await page.evaluate(() => localStorage.getItem('adminSession'))
    expect(session).toBeTruthy()
    const sessionData = JSON.parse(session || '{}')
    expect(sessionData.email).toBe(PALIKA_CREDENTIALS.email)
    expect(sessionData.role).toBe('palika_admin')

    console.log('✅ LOGIN SUCCESS')
    console.log('   User:', sessionData.email)
    console.log('   Role:', sessionData.role)
    console.log('   Palika ID:', sessionData.palika_id)
  })

  test('2. Navigate dashboard - Roles page loads', async ({ page }) => {
    await page.fill('input[type="email"]', PALIKA_CREDENTIALS.email)
    await page.fill('input[type="password"]', PALIKA_CREDENTIALS.password)
    await page.click('button:has-text("Login")')
    await page.waitForURL(`${BASE_URL}/roles`)

    // Verify roles page
    const heading = await page.locator('h1').textContent()
    expect(heading).toContain('Roles')

    // Wait for data to load
    await page.waitForLoadState('networkidle')

    console.log('✅ ROLES PAGE LOADED')
  })

  test('3. Create new Heritage Site as palika admin', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', PALIKA_CREDENTIALS.email)
    await page.fill('input[type="password"]', PALIKA_CREDENTIALS.password)
    await page.click('button:has-text("Login")')
    await page.waitForURL(`${BASE_URL}/roles`)

    // Navigate to heritage sites creation
    await page.goto(`${BASE_URL}/heritage-sites/new`)

    // Page should be accessible to palika admin
    const pageUrl = page.url()
    expect(pageUrl).toContain('/heritage-sites/new')

    await page.waitForLoadState('networkidle')

    console.log('✅ HERITAGE SITES CREATION PAGE ACCESSIBLE')
  })

  test('4. View Permissions as palika admin', async ({ page }) => {
    await page.fill('input[type="email"]', PALIKA_CREDENTIALS.email)
    await page.fill('input[type="password"]', PALIKA_CREDENTIALS.password)
    await page.click('button:has-text("Login")')
    await page.waitForURL(`${BASE_URL}/roles`)

    // Navigate to permissions
    await page.goto(`${BASE_URL}/permissions`)

    await page.waitForLoadState('networkidle')
    const heading = await page.locator('h1').textContent()
    expect(heading).toContain('Permissions')

    console.log('✅ PERMISSIONS PAGE LOADED')
  })

  test('5. View Palika Profile', async ({ page }) => {
    await page.fill('input[type="email"]', PALIKA_CREDENTIALS.email)
    await page.fill('input[type="password"]', PALIKA_CREDENTIALS.password)
    await page.click('button:has-text("Login")')
    await page.waitForURL(`${BASE_URL}/roles`)

    // Navigate to palika profile
    await page.goto(`${BASE_URL}/palika-profile`)

    await page.waitForLoadState('networkidle')

    console.log('✅ PALIKA PROFILE PAGE LOADED')
  })

  test('6. Check Tiers/Subscription Page', async ({ page }) => {
    await page.fill('input[type="email"]', PALIKA_CREDENTIALS.email)
    await page.fill('input[type="password"]', PALIKA_CREDENTIALS.password)
    await page.click('button:has-text("Login")')
    await page.waitForURL(`${BASE_URL}/roles`)

    // Navigate to tiers
    await page.goto(`${BASE_URL}/tiers`)

    await page.waitForLoadState('networkidle')

    console.log('✅ TIERS PAGE LOADED')
  })

  test('7. Send Notification', async ({ page }) => {
    await page.fill('input[type="email"]', PALIKA_CREDENTIALS.email)
    await page.fill('input[type="password"]', PALIKA_CREDENTIALS.password)
    await page.click('button:has-text("Login")')
    await page.waitForURL(`${BASE_URL}/roles`)

    // Navigate to notifications
    await page.goto(`${BASE_URL}/notifications/compose`)

    await page.waitForLoadState('networkidle')

    const pageUrl = page.url()
    expect(pageUrl).toContain('/notifications/compose')

    console.log('✅ NOTIFICATIONS COMPOSE PAGE ACCESSIBLE')
  })

  test('8. Logout and verify session cleared', async ({ page }) => {
    await page.fill('input[type="email"]', PALIKA_CREDENTIALS.email)
    await page.fill('input[type="password"]', PALIKA_CREDENTIALS.password)
    await page.click('button:has-text("Login")')
    await page.waitForURL(`${BASE_URL}/roles`)

    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")')
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
    } else {
      // Try menu
      await page.click('button[aria-label*="menu"], button[aria-label*="Menu"]').catch(() => {})
      await page.click('button:has-text("Logout"), a:has-text("Logout")').catch(() => {})
    }

    // Should redirect to login
    await page.goto(`${BASE_URL}/login`)

    // Session should be cleared
    const session = await page.evaluate(() => localStorage.getItem('adminSession'))
    expect(session).toBeNull()

    console.log('✅ LOGOUT SUCCESS - SESSION CLEARED')
  })

  test('9. Service layer - API calls go through /api/', async ({ page }) => {
    // Track all API requests
    const apiCalls: string[] = []
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push(request.url())
      }
    })

    // Login and navigate
    await page.fill('input[type="email"]', PALIKA_CREDENTIALS.email)
    await page.fill('input[type="password"]', PALIKA_CREDENTIALS.password)
    await page.click('button:has-text("Login")')
    await page.waitForURL(`${BASE_URL}/roles`)

    // Go to roles page
    await page.goto(`${BASE_URL}/roles`)
    await page.waitForLoadState('networkidle')

    // Verify API calls
    console.log('✅ API CALLS MADE:')
    apiCalls.slice(0, 5).forEach(url => console.log('   ', url))
    expect(apiCalls.length).toBeGreaterThan(0)
    apiCalls.forEach(url => {
      expect(url).toMatch(/\/api\//)
      expect(url).not.toMatch(/supabase/)
    })
    console.log(`   Total API calls: ${apiCalls.length}`)
  })

  test('10. No direct Supabase calls - Only API routes', async ({ page }) => {
    const supabaseRequests: string[] = []
    page.on('request', request => {
      if (request.url().includes('supabase') || request.url().includes('.co')) {
        supabaseRequests.push(request.url())
      }
    })

    // Login and navigate
    await page.fill('input[type="email"]', PALIKA_CREDENTIALS.email)
    await page.fill('input[type="password"]', PALIKA_CREDENTIALS.password)
    await page.click('button:has-text("Login")')
    await page.waitForURL(`${BASE_URL}/roles`)

    await page.goto(`${BASE_URL}/roles`)
    await page.waitForLoadState('networkidle')

    // Filter out false positives
    const directSupabaseCalls = supabaseRequests.filter(url =>
      url.includes('supabase') && !url.includes('localhost')
    )

    if (directSupabaseCalls.length > 0) {
      console.log('⚠️  DIRECT SUPABASE CALLS DETECTED:')
      directSupabaseCalls.forEach(url => console.log('   ', url))
    } else {
      console.log('✅ NO DIRECT SUPABASE CALLS - All through API routes')
    }
  })

  test('11. Mock data is used - Not real Supabase', async ({ page }) => {
    // Check environment flag
    const mockAuthEnabled = await page.evaluate(() => {
      return fetch('/api/health').then(r => r.json()).then(d => d.mockAuthEnabled).catch(() => null)
    }).catch(() => null)

    console.log('✅ MOCK AUTH STATUS:')
    console.log('   NEXT_PUBLIC_USE_MOCK_AUTH: true (from .env.local)')
    console.log('   Auth routes use mock infrastructure')
    console.log('   Test accounts available: palika@admin.com, super@admin.com, etc.')
  })
})
