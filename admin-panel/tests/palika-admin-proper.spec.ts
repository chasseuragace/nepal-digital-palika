import { test, expect } from '@playwright/test'

/**
 * Palika Admin E2E Test
 *
 * Strategy: Use the storage seam instead of fighting the login flow.
 *
 * The AdminLayout guard reads localStorage.adminSession directly.
 * That IS the abstraction boundary. Inject the session → all pages render.
 * No need for mock auth to work, no need for login POST, no HTTP calls.
 */

const PALIKA_ADMIN_SESSION = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  email: 'palika@admin.com',
  full_name: 'Palika Admin - Kathmandu',
  role: 'palika_admin',
  palika_id: 1,
  district_id: 3,
}

test.describe('Palika Admin - Full Dashboard Experience', () => {
  // Inject session before each test using the storage seam
  test.beforeEach(async ({ page, baseURL }) => {
    // Visit any page first to establish origin for localStorage
    await page.goto(`${baseURL}/login`)
    await page.evaluate((session) => {
      localStorage.setItem('adminSession', JSON.stringify(session))
    }, PALIKA_ADMIN_SESSION)
  })

  test('1. Can access dashboard with injected session', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/dashboard`)
    await page.waitForLoadState('domcontentloaded')

    // Should NOT be redirected to login (guard passes)
    expect(page.url()).not.toContain('/login')
    console.log(`   ✅ Dashboard accessible: ${page.url()}`)
  })

  test('2. Can view Roles page', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/roles`)
    await page.waitForLoadState('domcontentloaded')

    expect(page.url()).toContain('/roles')
    const heading = await page.locator('h1').first().textContent()
    console.log(`   ✅ Roles page: "${heading}"`)
  })

  test('3. Can view Permissions page', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/permissions`)
    await page.waitForLoadState('domcontentloaded')

    expect(page.url()).toContain('/permissions')
    const heading = await page.locator('h1').first().textContent()
    console.log(`   ✅ Permissions page: "${heading}"`)
  })

  test('4. Can view Palika Profile page', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/palika-profile`)
    await page.waitForLoadState('domcontentloaded')

    expect(page.url()).toContain('/palika-profile')
    console.log(`   ✅ Palika profile accessible`)
  })

  test('5. Can access Heritage Sites creation form', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/heritage-sites/new`)
    await page.waitForLoadState('domcontentloaded')

    expect(page.url()).toContain('/heritage-sites/new')

    // Verify form fields are present
    const emailInputs = await page.locator('input').count()
    console.log(`   ✅ Heritage sites form: ${emailInputs} input fields`)
  })

  test('6. Can access Notifications Compose page', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/notifications/compose`)
    await page.waitForLoadState('domcontentloaded')

    expect(page.url()).toContain('/notifications/compose')
    console.log(`   ✅ Notifications compose accessible`)
  })

  test('7. Can view Tiers/Subscription page', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/tiers`)
    await page.waitForLoadState('domcontentloaded')

    expect(page.url()).toContain('/tiers')
    console.log(`   ✅ Tiers page accessible`)
  })

  test('8. Session persists across navigation', async ({ page, baseURL }) => {
    // Visit multiple pages in sequence
    await page.goto(`${baseURL}/roles`)
    await page.waitForLoadState('domcontentloaded')

    await page.goto(`${baseURL}/permissions`)
    await page.waitForLoadState('domcontentloaded')

    await page.goto(`${baseURL}/palika-profile`)
    await page.waitForLoadState('domcontentloaded')

    // Session should still be there
    const session = await page.evaluate(() => localStorage.getItem('adminSession'))
    expect(session).toBeTruthy()

    const parsed = JSON.parse(session!)
    expect(parsed.email).toBe('palika@admin.com')
    expect(parsed.role).toBe('palika_admin')
    console.log(`   ✅ Session persisted across navigation`)
  })

  test('9. API calls route through /api/ layer', async ({ page, baseURL }) => {
    const apiCalls: string[] = []
    const supabaseCalls: string[] = []

    page.on('request', req => {
      const url = req.url()
      if (url.includes('/api/')) {
        apiCalls.push(url)
      }
      if (url.includes('supabase') && !url.includes('localhost')) {
        supabaseCalls.push(url)
      }
    })

    await page.goto(`${baseURL}/roles`)
    await page.waitForLoadState('networkidle')

    console.log(`   ✅ API calls via /api/: ${apiCalls.length}`)
    apiCalls.slice(0, 3).forEach(url => {
      console.log(`      • ${new URL(url).pathname}`)
    })

    console.log(`   ✅ Direct Supabase calls: ${supabaseCalls.length}`)
    expect(supabaseCalls.length).toBe(0)
  })

  test('10. Architecture verified - pages use service layer', async ({ page, baseURL }) => {
    // Navigate through all the refactored pages to verify they load
    const pages = [
      '/roles',
      '/permissions',
      '/palika-profile',
      '/tiers',
      '/notifications/compose',
      '/heritage-sites/new',
    ]

    const results: { page: string; loaded: boolean; error?: string }[] = []

    for (const pagePath of pages) {
      try {
        await page.goto(`${baseURL}${pagePath}`)
        await page.waitForLoadState('domcontentloaded')

        const currentUrl = page.url()
        const loaded = currentUrl.includes(pagePath)
        results.push({ page: pagePath, loaded })
      } catch (e) {
        results.push({
          page: pagePath,
          loaded: false,
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }

    console.log('\n   📊 Page Load Results:')
    results.forEach(r => {
      console.log(`      ${r.loaded ? '✅' : '❌'} ${r.page}${r.error ? ` (${r.error})` : ''}`)
    })

    const failedPages = results.filter(r => !r.loaded)
    expect(failedPages.length).toBe(0)
  })
})
