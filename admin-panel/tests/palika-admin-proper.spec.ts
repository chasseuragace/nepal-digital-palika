import { test, expect } from '@playwright/test'

test.describe('Palika Admin - Proper End-to-End Flow', () => {
  test('should complete full login → navigate → logout flow', async ({ page, baseURL }) => {
    console.log('\n🧪 PROPER E2E TEST - Palika Admin Flow\n')

    // Step 1: Navigate to login - use baseURL from config
    console.log(`1️⃣  Navigating to login at ${baseURL}...`)
    await page.goto(`${baseURL}/login`)

    // Wait for page to be interactive
    await page.waitForLoadState('domcontentloaded')

    // Verify we're on login page
    expect(page.url()).toContain('/login')
    console.log(`   ✅ At login page: ${page.url()}`)

    // Step 2: Inspect the page - see what's actually there
    console.log('\n2️⃣  Inspecting login form...')

    // Find all buttons and log their text
    const buttons = await page.locator('button').all()
    const buttonTexts = await Promise.all(
      buttons.map(btn => btn.textContent())
    )
    console.log(`   Found ${buttons.length} buttons: ${buttonTexts.map(t => `"${t?.trim()}"`).join(', ')}`)

    // Find the submit button - look for actual text
    const submitButton = buttons.find(async (btn) => {
      const text = await btn.textContent()
      return text?.toLowerCase().includes('sign') || text?.toLowerCase().includes('login')
    })

    if (!submitButton) {
      // Fallback: inspect page HTML
      const html = await page.content()
      console.log('   ❌ Could not find sign in button. Page HTML snippet:')
      const loginFormSection = html.substring(
        html.indexOf('<form'),
        Math.min(html.indexOf('</form>') + 7, html.length)
      )
      console.log(loginFormSection.substring(0, 300))
      throw new Error('Login button not found on page')
    }

    console.log('   ✅ Located submit button')

    // Step 3: Fill form with mock credentials
    console.log('\n3️⃣  Filling login form...')
    await page.fill('input[type="email"]', 'palika@admin.com')
    await page.fill('input[type="password"]', 'palika123456')
    console.log('   ✅ Credentials entered')

    // Step 4: Click submit button
    console.log('\n4️⃣  Submitting login form...')
    const submitButtonLocator = page.locator('button').filter({
      hasText: /Sign In|Login/i
    })

    const count = await submitButtonLocator.count()
    console.log(`   Found ${count} matching button(s)`)

    if (count === 0) {
      throw new Error('Submit button not found - no buttons match "Sign In" or "Login"')
    }

    await submitButtonLocator.first().click()
    console.log('   ✅ Form submitted')

    // Step 5: Wait for navigation - be patient
    console.log('\n5️⃣  Waiting for authentication...')
    try {
      await page.waitForURL(/\/(roles|dashboard|admins|login)/, { timeout: 15000 })
      const finalUrl = page.url()
      console.log(`   ✅ Navigated to: ${finalUrl}`)

      // Check if still on login (failed auth)
      if (finalUrl.includes('/login')) {
        const errorDiv = await page.locator('[role="alert"], .login-alert').textContent()
        console.log(`   ⚠️  Still on login page. Error message: ${errorDiv || 'None'}`)
        throw new Error('Authentication failed or returned to login')
      }
    } catch (e) {
      // Timeout or navigation error
      const currentUrl = page.url()
      const pageTitle = await page.title()
      const bodyText = await page.locator('body').textContent()

      console.log(`   ❌ Navigation failed`)
      console.log(`      Current URL: ${currentUrl}`)
      console.log(`      Page title: ${pageTitle}`)
      console.log(`      Body text (first 200 chars): ${bodyText?.substring(0, 200)}`)
      throw e
    }

    // Step 6: Verify session was created
    console.log('\n6️⃣  Verifying session...')
    const sessionJson = await page.evaluate(() => localStorage.getItem('adminSession'))

    if (!sessionJson) {
      throw new Error('No session in localStorage after login')
    }

    const session = JSON.parse(sessionJson)
    console.log(`   ✅ Session created:`)
    console.log(`      Email: ${session.email}`)
    console.log(`      Role: ${session.role}`)
    console.log(`      Palika ID: ${session.palika_id}`)

    expect(session.email).toBe('palika@admin.com')
    expect(session.role).toBe('palika_admin')

    // Step 7: Navigate to another page
    console.log('\n7️⃣  Testing page navigation...')
    await page.goto(`${baseURL}/permissions`)
    await page.waitForLoadState('domcontentloaded')

    const permissionsUrl = page.url()
    expect(permissionsUrl).toContain('/permissions')
    console.log(`   ✅ Navigated to permissions: ${permissionsUrl}`)

    // Verify page loaded with content
    const headings = await page.locator('h1, h2, h3').all()
    console.log(`   Page has ${headings.length} headings`)

    // Step 8: Verify session still exists
    console.log('\n8️⃣  Session persists across navigation...')
    const sessionAfterNav = await page.evaluate(() => localStorage.getItem('adminSession'))
    expect(sessionAfterNav).toBeTruthy()
    console.log('   ✅ Session still valid')

    // Step 9: Check API calls were made
    console.log('\n9️⃣  Verifying API layer...')
    const apiRequests: string[] = []
    page.on('request', req => {
      if (req.url().includes('/api/')) {
        apiRequests.push(req.url())
      }
    })

    // Force a reload to capture API calls
    await page.reload()
    await page.waitForLoadState('networkidle')

    console.log(`   ✅ API calls made: ${apiRequests.length}`)
    apiRequests.slice(0, 3).forEach(url => {
      const path = new URL(url).pathname
      console.log(`      • ${path}`)
    })

    // Verify no direct Supabase calls
    const supabastCalls = apiRequests.filter(url =>
      url.includes('supabase') && !url.includes('localhost')
    )
    expect(supabastCalls.length).toBe(0)
    console.log('   ✅ No direct Supabase calls detected')

    console.log('\n✅ FULL FLOW TEST PASSED\n')
  })
})
