# End-to-End Test Suite
## Nepal Digital Tourism Infrastructure Platform

**Version:** 1.0  
**Last Updated:** December 24, 2025  
**Test Framework:** Playwright (Web) + Detox (Mobile)  
**Total Tests:** 30 comprehensive E2E scenarios  

---

## 📋 Table of Contents

1. [Test Strategy & Philosophy](#test-strategy--philosophy)
2. [Test Environment Setup](#test-environment-setup)
3. [Category 1: Critical User Journeys](#category-1-critical-user-journeys)
4. [Category 2: Business Workflows](#category-2-business-workflows)
5. [Category 3: Admin Operations](#category-3-admin-operations)
6. [Category 4: Integration Tests](#category-4-integration-tests)
7. [Category 5: Performance & Stress](#category-5-performance--stress)
8. [Category 6: Edge Cases & Error Handling](#category-6-edge-cases--error-handling)
9. [Test Data Management](#test-data-management)
10. [CI/CD Integration](#cicd-integration)
11. [Test Execution Schedule](#test-execution-schedule)

---

## Test Strategy & Philosophy

### Goals
- ✅ Verify complete user journeys (not just API endpoints)
- ✅ Test integration between mobile app, backend, and admin panel
- ✅ Validate real-world scenarios including offline mode
- ✅ Ensure data consistency across the system
- ✅ Test performance under realistic load
- ✅ Validate security and authorization
- ✅ Test cross-platform compatibility

### Test Pyramid
```
    ┌─────────────────┐
    │   E2E Tests     │  30 tests (this document)
    │   (Slow, High   │
    │    Value)       │
    └─────────────────┘
          /\
         /  \
    ┌────────────┐
    │ Integration │      ~100 tests
    │   Tests     │
    └────────────┘
         /\
        /  \
    ┌──────────┐
    │  Unit    │          ~500 tests
    │  Tests   │
    └──────────┘
```

### Priority Levels
- **P0 - Critical:** Must pass for production (life-safety, core functionality)
- **P1 - High:** Must pass for release (major features)
- **P2 - Medium:** Should pass (important but not blocking)
- **P3 - Low:** Nice to have (edge cases, optimizations)

### Test Execution
- **Pre-commit:** Fast smoke tests (~2 min)
- **Pull Request:** P0 + P1 tests (~15 min)
- **Pre-deployment:** All tests (~45 min)
- **Nightly:** All tests + performance + stress (~2 hours)

---

## Test Environment Setup

### Infrastructure
```yaml
# docker-compose.test.yml
version: '3.8'
services:
  api:
    image: palika-api:test
    environment:
      DATABASE_URL: postgresql://test:test@db:5432/palika_test
      REDIS_URL: redis://redis:6379
      STORAGE_URL: http://minio:9000
      
  db:
    image: postgis/postgis:14-3.3
    environment:
      POSTGRES_DB: palika_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      
  redis:
    image: redis:7-alpine
    
  minio:
    image: minio/minio:latest
    command: server /data
    
  mobile-emulator:
    image: budtmo/docker-android:emulator_11.0
    
  admin-panel:
    image: palika-admin:test
```

### Test Data Seed
```sql
-- Seed data for tests
INSERT INTO provinces (id, name_en, name_ne, code) VALUES
  (1, 'Gandaki Province', 'गण्डकी प्रदेश', 'P4');

INSERT INTO districts (id, province_id, name_en, name_ne, code) VALUES
  (1, 1, 'Kaski', 'कास्की', 'D33');

INSERT INTO palikas (id, district_id, name_en, name_ne, type, code) VALUES
  (1, 1, 'Pokhara Metropolitan', 'पोखरा महानगरपालिका', 'metropolitan', 'PKR-001');

-- Test users
INSERT INTO users (id, phone, phone_verified, name, user_type, default_palika_id) VALUES
  ('test-tourist-1', '+977-9841111111', true, 'Sarah Mitchell', 'tourist_international', 1),
  ('test-resident-1', '+977-9842222222', true, 'Ram Sharma', 'resident', 1),
  ('test-business-1', '+977-9843333333', true, 'Devi Sharma', 'resident', 1);

-- Test admin users
INSERT INTO admin_users (id, email, password_hash, full_name, role, palika_id) VALUES
  ('admin-1', 'admin@pokhara.gov.np', '$2b$10$...', 'Admin User', 'palika_admin', 1),
  ('verifier-1', 'verifier@pokhara.gov.np', '$2b$10$...', 'Verifier User', 'verifier', 1);
```

---

# Category 1: Critical User Journeys

## Test 1.1: Tourist Complete Journey ⭐ P0

**Test ID:** `TC-001-TOURIST-COMPLETE-JOURNEY`  
**Priority:** P0 (Critical)  
**Duration:** ~4 minutes  
**Platforms:** Mobile (Android + iOS)

### Scenario
Sarah from UK downloads the app, discovers Bindabasini Temple, visits it, scans QR code, plays audio guide, and submits a review.

### Prerequisites
- Mobile app installed
- Test data seeded (Bindabasini Temple exists)
- GPS mockable

### Test Steps

```javascript
describe('TC-001: Tourist Complete Journey', () => {
  let app, device, screen, camera, api;
  
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });
  
  test('Complete tourist journey from download to review', async () => {
    
    // ========================================
    // PHASE 1: ONBOARDING (90 seconds)
    // ========================================
    
    // 1.1 Welcome Screen
    await expect(screen.getByText('Digital Palika Services')).toBeVisible();
    await screen.getByRole('button', { name: 'Continue' }).tap();
    
    // 1.2 Language Selection
    await expect(screen.getByText('Select Your Language')).toBeVisible();
    await screen.getByText('English').tap();
    await screen.getByRole('button', { name: 'Continue' }).tap();
    
    // 1.3 Permission Requests
    await expect(screen.getByText('App Permissions')).toBeVisible();
    await screen.getByText('Allow All').tap();
    await device.grantPermission('location');
    await device.grantPermission('camera');
    await device.grantPermission('notifications');
    
    // 1.4 Palika Selection (GPS auto-detect)
    await expect(screen.getByText('Which Palika are you in?')).toBeVisible();
    await device.setLocation(27.7172, 85.3240); // Pokhara center
    await screen.getByText('Auto-detect using GPS').tap();
    await waitFor(() => 
      screen.getByText('Pokhara Metropolitan')
    ).toBeVisible({ timeout: 5000 });
    await screen.getByText('Confirm').tap();
    
    // 1.5 User Type Selection
    await expect(screen.getByText('How will you use this app?')).toBeVisible();
    await screen.getByText('Tourist - International').tap();
    await screen.getByRole('button', { name: 'Continue' }).tap();
    
    // 1.6 Notification Preferences
    await expect(screen.getByText('What notifications do you want?')).toBeVisible();
    await screen.getByText('Emergency Alerts').tap(); // Toggle on
    await screen.getByText('Festival & Events').tap(); // Toggle on
    await screen.getByRole('button', { name: 'Save & Continue' }).tap();
    
    // 1.7 Verify Home Screen Loaded
    await expect(screen.getByText('Home')).toBeVisible();
    await expect(screen.getByText('🆘 EMERGENCY SOS')).toBeVisible();
    await expect(screen.getByText('Quick Actions')).toBeVisible();
    
    // ========================================
    // PHASE 2: DISCOVERY (60 seconds)
    // ========================================
    
    // 2.1 Search for Temple
    await screen.getByPlaceholder('Search places, events, services...').tap();
    await screen.getByPlaceholder('Search places, events, services...').type('temple');
    await waitFor(() => 
      screen.getByText('Heritage Sites (8)')
    ).toBeVisible({ timeout: 3000 });
    
    // 2.2 Verify Search Results
    await expect(screen.getByText('Bindabasini Temple')).toBeVisible();
    await expect(screen.getByText('Hindu • 1.2 km')).toBeVisible();
    await expect(screen.getByText('⭐ 4.6')).toBeVisible();
    
    // 2.3 View Heritage Site Details
    await screen.getByText('Bindabasini Temple').tap();
    await expect(screen.getByText('Hindu Temple')).toBeVisible();
    await expect(screen.getByText('⭐ 4.6 ★★★★☆ (342 visitors)')).toBeVisible();
    await expect(screen.getByText('📍 Ward 2, Old Bazaar • 1.2 km away')).toBeVisible();
    await expect(screen.getByText('⏰ 5:00 AM - 8:00 PM Daily')).toBeVisible();
    
    // 2.4 Save to Favorites
    await screen.getByRole('button', { name: '❤️ Save' }).tap();
    await expect(screen.getByText('Added to favorites')).toBeVisible();
    
    // 2.5 View on Map
    await screen.getByRole('button', { name: '🗺️ Show on Map' }).tap();
    await expect(screen.getByText('Google Maps')).toBeVisible();
    await expect(map.getMarkerAt(27.7172, 85.2903)).toBeVisible();
    await device.pressBack(); // Return to details
    
    // ========================================
    // PHASE 3: ON-SITE VISIT (90 seconds)
    // ========================================
    
    // 3.1 Simulate Arrival at Site
    await device.setLocation(27.7172, 85.2903); // At temple
    await device.pressBack(); // Go to home
    
    // 3.2 Scan QR Code
    await screen.getByText('Scan QR').tap();
    await expect(camera.isOpen()).toBe(true);
    
    // Mock QR code scan
    await camera.scanBarcode('heritage_site://bindabasini-temple');
    
    // 3.3 Verify Site Details Loaded from QR
    await expect(screen.getByText('Bindabasini Temple')).toBeVisible();
    await expect(screen.getByRole('button', { name: '🎧 Audio Guide' })).toBeVisible();
    
    // 3.4 Play Audio Guide
    await screen.getByRole('button', { name: '🎧 Audio Guide' }).tap();
    await expect(screen.getByText('Select Language:')).toBeVisible();
    await screen.getByText('English').tap();
    
    await expect(screen.getByText('00:00 / 08:32')).toBeVisible();
    await screen.getByRole('button', { name: 'Play' }).tap();
    
    // Wait for audio to start
    await waitFor(() => 
      screen.getByText(/00:0[1-9]/)
    ).toBeVisible({ timeout: 3000 });
    
    // Pause audio
    await screen.getByRole('button', { name: 'Pause' }).tap();
    await device.pressBack(); // Close audio guide
    
    // 3.5 View Photo Gallery
    await expect(screen.getByText('📷 [1/8]')).toBeVisible();
    await screen.swipeLeft(); // Next photo
    await expect(screen.getByText('📷 [2/8]')).toBeVisible();
    await screen.swipeLeft(); // Next photo
    await expect(screen.getByText('📷 [3/8]')).toBeVisible();
    
    // ========================================
    // PHASE 4: REVIEW SUBMISSION (60 seconds)
    // ========================================
    
    // 4.1 Navigate to Favorites
    await device.pressBack(); // Go back to home
    await screen.getByText('More').tap();
    await screen.getByText('⭐ Saved Places (1)').tap();
    
    // 4.2 Open Saved Site
    await expect(screen.getByText('Bindabasini Temple')).toBeVisible();
    await screen.getByText('Bindabasini Temple').tap();
    
    // 4.3 Scroll to Reviews Section
    await screen.scrollTo('Reviews');
    await expect(screen.getByText('Reviews (342)')).toBeVisible();
    
    // 4.4 Tap Write Review
    await screen.getByRole('button', { name: 'Write Review' }).tap();
    await expect(screen.getByText('Rate Your Experience')).toBeVisible();
    
    // 4.5 Submit Review
    await screen.getByTestId('star-5').tap(); // 5 stars
    await screen.getByPlaceholder('Review title (optional)').type('Amazing temple!');
    await screen.getByPlaceholder('Share your experience...').type(
      'Beautiful architecture and peaceful atmosphere. The audio guide was very informative. Highly recommend visiting early morning for the sunrise view.'
    );
    
    await screen.getByRole('button', { name: 'Submit Review' }).tap();
    
    // 4.6 Verify Review Submitted
    await expect(screen.getByText('Review submitted successfully')).toBeVisible();
    await expect(screen.getByText('Thank you for sharing your experience!')).toBeVisible();
    
    // ========================================
    // PHASE 5: BACKEND VERIFICATION
    // ========================================
    
    // 5.1 Verify Review in Database
    const response = await api.get('/heritage-sites/bindabasini-temple/reviews');
    expect(response.status).toBe(200);
    expect(response.data.data).toContainEqual(
      expect.objectContaining({
        rating: 5,
        title: 'Amazing temple!',
        comment: expect.stringContaining('Beautiful architecture')
      })
    );
    
    // 5.2 Verify Analytics Tracked
    const analyticsResponse = await api.get('/admin/analytics/events', {
      params: {
        event_type: 'qr_scan',
        entity_id: 'bindabasini-temple-id'
      }
    });
    expect(analyticsResponse.data.data.length).toBeGreaterThan(0);
    
    // 5.3 Verify Audio Guide Play Tracked
    const audioAnalytics = await api.get('/admin/analytics/events', {
      params: {
        event_type: 'audio_guide_play',
        entity_id: 'bindabasini-temple-id'
      }
    });
    expect(audioAnalytics.data.data.length).toBeGreaterThan(0);
    
    // ========================================
    // PHASE 6: ADMIN PANEL VERIFICATION
    // ========================================
    
    // 6.1 Admin Logs In
    await adminPanel.navigate('/login');
    await adminPanel.fill('input[type="email"]', 'admin@pokhara.gov.np');
    await adminPanel.fill('input[type="password"]', 'test-password');
    await adminPanel.click('button[type="submit"]');
    
    await expect(adminPanel.getByText('Dashboard')).toBeVisible();
    
    // 6.2 Admin Views Review
    await adminPanel.navigate('/heritage-sites/bindabasini-temple/reviews');
    await expect(adminPanel.getByText('Amazing temple!')).toBeVisible();
    await expect(adminPanel.getByText('Sarah Mitchell')).toBeVisible();
    await expect(adminPanel.getByText('⭐⭐⭐⭐⭐')).toBeVisible();
    
  });
  
  afterAll(async () => {
    await device.terminateApp();
  });
});
```

### Expected Results
✅ User completes onboarding smoothly  
✅ Search returns accurate results  
✅ QR code scanning works  
✅ Audio guide plays without errors  
✅ Review submitted successfully  
✅ Data persists in database  
✅ Admin can view review  

### Failure Criteria
❌ Any step fails or times out  
❌ Data not saved to database  
❌ GPS location not detected  
❌ QR code scanning fails  
❌ Audio doesn't play  

---

## Test 1.2: Emergency SOS Flow ⭐ P0

**Test ID:** `TC-002-SOS-EMERGENCY-FLOW`  
**Priority:** P0 (Critical - Life Safety)  
**Duration:** ~3 minutes  
**Platforms:** Mobile + Admin Panel

### Scenario
User in medical emergency sends SOS, admin assigns responder, responder arrives, emergency resolved, user rates response.

### Test Steps

```javascript
describe('TC-002: Emergency SOS Complete Flow', () => {
  
  test('User sends SOS → Admin assigns → Responder resolves', async () => {
    
    // ========================================
    // PHASE 1: USER SENDS SOS
    // ========================================
    
    // 1.1 Setup: User logged in, on home screen
    await device.launchApp();
    await loginAsUser('test-resident-1'); // Ram Sharma
    await expect(screen.getByText('Home')).toBeVisible();
    
    // 1.2 Tap Floating SOS Button
    await expect(screen.getByRole('button', { name: '🆘 EMERGENCY SOS' })).toBeVisible();
    await screen.getByRole('button', { name: '🆘 EMERGENCY SOS' }).tap();
    
    // 1.3 Emergency Type Selection
    await expect(screen.getByText('What\'s the emergency?')).toBeVisible();
    await expect(screen.getByText('🚑 Medical Emergency')).toBeVisible();
    await expect(screen.getByText('🚒 Fire')).toBeVisible();
    await expect(screen.getByText('👮 Police / Crime')).toBeVisible();
    
    await screen.getByText('🚑 Medical Emergency').tap();
    
    // 1.4 Emergency Details
    await expect(screen.getByText('Tell us more: (Optional)')).toBeVisible();
    await screen.getByText('☐ Severe injury').tap(); // Check
    await screen.getByPlaceholder('Other:').type('Motorcycle accident, leg injury, bleeding');
    
    // 1.5 Verify Location Captured
    await expect(screen.getByText('Your Location:')).toBeVisible();
    await expect(screen.getByText('📍 Ward 5, Near Temple')).toBeVisible();
    await expect(screen.getByText('✓ Correct')).toBeVisible();
    
    // 1.6 Verify Phone Pre-filled
    await expect(screen.getByText('Your Phone:')).toBeVisible();
    await expect(screen.getByText('+977-9842222222')).toBeVisible();
    
    // 1.7 Send SOS
    await screen.getByRole('button', { name: '🆘 SEND EMERGENCY REQUEST' }).tap();
    
    // 1.8 Verify Confirmation Screen
    await expect(screen.getByText('✓ EMERGENCY REQUEST SENT')).toBeVisible();
    
    const requestIdText = await screen.getByText(/Request ID: #SOS-/).textContent();
    const requestId = requestIdText.replace('Request ID: #', '');
    
    await expect(screen.getByText('Status: RECEIVED ●')).toBeVisible();
    await expect(screen.getByText('Waiting for response...')).toBeVisible();
    await expect(screen.getByText('Estimated response: 5-10 minutes')).toBeVisible();
    
    // Emergency numbers always visible
    await expect(screen.getByText('🚑 Ambulance: 102')).toBeVisible();
    await expect(screen.getByText('👮 Police: 100')).toBeVisible();
    
    // ========================================
    // PHASE 2: BACKEND VERIFICATION
    // ========================================
    
    // 2.1 Verify SOS Created in Database
    const sosResponse = await api.get(`/sos/${requestId}`);
    expect(sosResponse.status).toBe(200);
    expect(sosResponse.data.data).toMatchObject({
      request_code: requestId,
      emergency_type: 'medical',
      status: 'received',
      user_phone: '+977-9842222222',
      details: expect.stringContaining('Motorcycle accident'),
      location: {
        latitude: expect.any(Number),
        longitude: expect.any(Number)
      },
      ward_number: 5
    });
    
    // 2.2 Verify Timeline Started
    expect(sosResponse.data.data.timeline).toEqual([
      expect.objectContaining({
        status: 'received',
        timestamp: expect.any(String)
      })
    ]);
    
    // ========================================
    // PHASE 3: ADMIN RECEIVES & ASSIGNS
    // ========================================
    
    // 3.1 Admin Receives Real-time Notification (WebSocket)
    // Mock WebSocket connection
    const wsMessages = [];
    mockWebSocket.on('message', (msg) => wsMessages.push(msg));
    
    await waitFor(() => {
      const sosNotif = wsMessages.find(m => 
        m.type === 'sos:new' && m.data.request_code === requestId
      );
      return sosNotif !== undefined;
    }, { timeout: 5000 });
    
    // 3.2 Admin Opens Dashboard
    await adminPanel.navigate('/login');
    await adminPanel.login('coordinator@pokhara.gov.np', 'test-password');
    
    // 3.3 SOS Dashboard Shows New Request
    await adminPanel.navigate('/sos-requests');
    await expect(adminPanel.getByText(requestId)).toBeVisible();
    await expect(adminPanel.getByText('RECEIVED')).toBeVisible();
    await expect(adminPanel.getByText('Medical Emergency')).toBeVisible();
    await expect(adminPanel.getByText('Ward 5, Near Temple')).toBeVisible();
    
    // 3.4 Admin Opens SOS Detail
    await adminPanel.click(requestId);
    
    await expect(adminPanel.getByText('Ram Sharma')).toBeVisible();
    await expect(adminPanel.getByText('+977-9842222222')).toBeVisible();
    await expect(adminPanel.getByText('Motorcycle accident, leg injury')).toBeVisible();
    
    // Map should show location
    await expect(adminPanel.getByTestId('sos-map')).toBeVisible();
    
    // 3.5 Admin Assigns Responder
    await adminPanel.click('button', { name: 'Assign Responder' });
    
    await adminPanel.fill('input[name="responder_name"]', 'Dr. Binod Thapa');
    await adminPanel.fill('input[name="responder_phone"]', '+977-9847654321');
    await adminPanel.fill('input[name="responder_eta_minutes"]', '5');
    
    await adminPanel.click('button[type="submit"]');
    
    // 3.6 Verify Status Updated
    await expect(adminPanel.getByText('Status: ASSIGNED ●')).toBeVisible();
    await expect(adminPanel.getByText('Dr. Binod Thapa')).toBeVisible();
    
    // ========================================
    // PHASE 4: USER SEES ASSIGNMENT
    // ========================================
    
    // 4.1 User Receives Push Notification
    await waitFor(() => 
      device.hasNotification('Emergency Response Assigned')
    , { timeout: 10000 });
    
    // 4.2 User Opens Notification
    await device.openNotification('Emergency Response Assigned');
    
    // 4.3 Status Screen Updated
    await expect(screen.getByText('Status: ASSIGNED ●')).toBeVisible();
    await expect(screen.getByText('Responder: Dr. Binod Thapa')).toBeVisible();
    await expect(screen.getByText('Phone: +977-9847654321')).toBeVisible();
    await expect(screen.getByText('"On my way. 5 minutes."')).toBeVisible();
    
    await expect(screen.getByRole('button', { name: 'Call Responder' })).toBeVisible();
    
    // ========================================
    // PHASE 5: RESPONDER EN ROUTE
    // ========================================
    
    // 5.1 Admin Updates Status to En Route
    await adminPanel.navigate(`/sos-requests/${requestId}`);
    await adminPanel.selectDropdown('status', 'en_route');
    
    // Simulate responder location
    await adminPanel.fill('input[name="responder_lat"]', '27.7100');
    await adminPanel.fill('input[name="responder_lng"]', '85.3200');
    
    await adminPanel.click('button', { name: 'Update Status' });
    
    // 5.2 User Sees Live Tracking
    await waitFor(() => 
      screen.getByText('Status: EN ROUTE ●')
    ).toBeVisible({ timeout: 5000 });
    
    await expect(screen.getByText('Distance: 1.2 km')).toBeVisible();
    await expect(screen.getByText('ETA: 3 minutes')).toBeVisible();
    
    // Map should show both user and responder
    await screen.getByRole('button', { name: 'Track on Map' }).tap();
    await expect(screen.getByText('📍 Your Location (Blue)')).toBeVisible();
    await expect(screen.getByText('🚑 Responder (Moving)')).toBeVisible();
    
    // ========================================
    // PHASE 6: RESPONDER ARRIVES
    // ========================================
    
    // 6.1 Admin Updates Status to On Site
    await adminPanel.navigate(`/sos-requests/${requestId}`);
    await adminPanel.selectDropdown('status', 'on_site');
    await adminPanel.click('button', { name: 'Update Status' });
    
    // 6.2 User Sees Arrival
    await waitFor(() => 
      screen.getByText('Status: ON SITE ●')
    ).toBeVisible({ timeout: 5000 });
    
    await expect(screen.getByText('✓ RESPONDER ARRIVED')).toBeVisible();
    await expect(screen.getByText('Dr. Binod Thapa is at your location')).toBeVisible();
    
    // ========================================
    // PHASE 7: RESOLUTION
    // ========================================
    
    // 7.1 Admin Resolves SOS (After treatment)
    await wait(5000); // Simulate treatment time
    
    await adminPanel.navigate(`/sos-requests/${requestId}`);
    await adminPanel.selectDropdown('status', 'resolved');
    await adminPanel.fill('textarea[name="resolution_notes"]', 
      'Patient stabilized. Leg wound bandaged. Advised to visit hospital for X-ray. Patient transported to hospital by responder.'
    );
    await adminPanel.click('button', { name: 'Resolve & Close' });
    
    // 7.2 User Sees Resolution
    await waitFor(() => 
      screen.getByText('✓ EMERGENCY RESOLVED')
    ).toBeVisible({ timeout: 5000 });
    
    await expect(screen.getByText('Status: RESOLVED ✓')).toBeVisible();
    await expect(screen.getByText('Response time: 8 minutes')).toBeVisible();
    await expect(screen.getByText('Responder: Dr. Binod Thapa')).toBeVisible();
    
    // ========================================
    // PHASE 8: USER RATES RESPONSE
    // ========================================
    
    // 8.1 User Rates
    await expect(screen.getByRole('button', { name: 'Rate Response' })).toBeVisible();
    await screen.getByRole('button', { name: 'Rate Response' }).tap();
    
    await expect(screen.getByText('How was the response?')).toBeVisible();
    await screen.getByTestId('star-5').tap(); // 5 stars
    
    await screen.getByPlaceholder('Optional feedback...').type(
      'Very fast response! Dr. Thapa was professional and caring. Thank you for saving me!'
    );
    
    await screen.getByRole('button', { name: 'Submit Rating' }).tap();
    
    await expect(screen.getByText('Thank you for your feedback!')).toBeVisible();
    await expect(screen.getByRole('button', { name: 'Done' })).toBeVisible();
    
    // ========================================
    // PHASE 9: FINAL VERIFICATION
    // ========================================
    
    // 9.1 Verify Complete SOS Record
    const finalSOS = await api.get(`/sos/${requestId}`);
    expect(finalSOS.data.data).toMatchObject({
      status: 'resolved',
      responder_name: 'Dr. Binod Thapa',
      user_rating: 5,
      user_feedback: expect.stringContaining('Very fast response'),
      resolved_at: expect.any(String)
    });
    
    // 9.2 Verify Complete Timeline
    expect(finalSOS.data.data.timeline).toHaveLength(5);
    expect(finalSOS.data.data.timeline).toEqual([
      expect.objectContaining({ status: 'received' }),
      expect.objectContaining({ status: 'assigned' }),
      expect.objectContaining({ status: 'en_route' }),
      expect.objectContaining({ status: 'on_site' }),
      expect.objectContaining({ status: 'resolved' })
    ]);
    
    // 9.3 Verify Response Time Calculated
    const responseTime = new Date(finalSOS.data.data.resolved_at) - 
                        new Date(finalSOS.data.data.created_at);
    expect(responseTime).toBeLessThan(15 * 60 * 1000); // Under 15 minutes
    
    // 9.4 Admin Sees Complete Record
    await adminPanel.navigate(`/sos-requests/${requestId}`);
    await expect(adminPanel.getByText('Status: RESOLVED ✓')).toBeVisible();
    await expect(adminPanel.getByText('Response Time: 8 minutes')).toBeVisible();
    await expect(adminPanel.getByText('User Rating: ⭐⭐⭐⭐⭐')).toBeVisible();
    
  });
});
```

### Expected Results
✅ SOS sent successfully  
✅ Real-time notifications work  
✅ Admin receives alert immediately  
✅ Responder assignment updates user  
✅ Live tracking shows responder location  
✅ Resolution recorded properly  
✅ Complete audit trail maintained  

### Failure Criteria
❌ SOS fails to send  
❌ Notifications not received  
❌ Status updates don't sync  
❌ Timeline incomplete  
❌ Response time > 15 minutes (system failure)  

---

## Test 1.3: Offline Functionality ⭐ P0

**Test ID:** `TC-003-OFFLINE-COMPLETE-FLOW`  
**Priority:** P0 (Critical - Nepal context)  
**Duration:** ~6 minutes  
**Platforms:** Mobile

### Scenario
Tourist downloads content while online, goes to remote area (offline), browses heritage sites, tries SOS, comes back online, and syncs.

### Test Steps

```javascript
describe('TC-003: Complete Offline Functionality', () => {
  
  test('Download content → Go offline → Use app → Sync when online', async () => {
    
    // ========================================
    // PHASE 1: DOWNLOAD CONTENT (ONLINE)
    // ========================================
    
    // 1.1 User Navigates to Download Settings
    await device.launchApp();
    await loginAsUser('test-tourist-1'); // Sarah
    await device.enableNetwork(); // Ensure online
    
    await screen.getByText('More').tap();
    await screen.getByText('Download Content').tap();
    
    // 1.2 Verify Current Palika Shown
    await expect(screen.getByText('Pokhara Metropolitan')).toBeVisible();
    await expect(screen.getByText('Current Palika:')).toBeVisible();
    
    // 1.3 Start Download
    await expect(screen.getByRole('button', { name: 'Download All Content' })).toBeVisible();
    await screen.getByRole('button', { name: 'Download All Content' }).tap();
    
    // 1.4 Verify Download Progress
    await expect(screen.getByText('Downloading...')).toBeVisible();
    await expect(screen.getByText(/\d+%/)).toBeVisible();
    
    // Wait for download complete
    await waitFor(() => 
      screen.getByText('✓ Downloaded')
    , { timeout: 60000 }); // 60 second timeout
    
    // 1.5 Verify Download Summary
    await expect(screen.getByText(/87 MB downloaded/)).toBeVisible();
    await expect(screen.getByText(/45 heritage sites/)).toBeVisible();
    await expect(screen.getByText(/12 upcoming events/)).toBeVisible();
    await expect(screen.getByText(/127 businesses/)).toBeVisible();
    
    // 1.6 Download Offline Maps
    await screen.getByText('Offline Maps').tap();
    await expect(screen.getByText('Define Area')).toBeVisible();
    
    await screen.getByRole('button', { name: 'Use Current Location (10 km)' }).tap();
    await screen.getByRole('button', { name: 'Download Maps' }).tap();
    
    await waitFor(() => 
      screen.getByText('✓ Maps Downloaded')
    , { timeout: 90000 }); // 90 second timeout for maps
    
    await expect(screen.getByText(/156 MB/)).toBeVisible();
    
    // ========================================
    // PHASE 2: GO OFFLINE
    // ========================================
    
    // 2.1 Disable Network
    await device.disableNetwork();
    await wait(2000); // Wait for app to detect offline state
    
    // 2.2 Verify Offline Indicator
    await device.pressBack(); // Back to home
    await expect(screen.getByText('⚠️ Offline Mode')).toBeVisible();
    await expect(screen.getByText('Using cached content')).toBeVisible();
    
    // ========================================
    // PHASE 3: BROWSE OFFLINE
    // ========================================
    
    // 3.1 Open Map (Should Work Offline)
    await screen.getByText('Map').tap();
    await expect(screen.getByText('[📡 Offline Maps]')).toBeVisible();
    
    // Verify cached markers visible
    await waitFor(() => 
      map.getMarkers()
    ).resolves.toHaveLength(45); // All downloaded sites
    
    // 3.2 Tap Heritage Site Marker
    await map.tapMarker('Bindabasini Temple');
    
    // 3.3 View Heritage Site Details Offline
    await expect(screen.getByText('Bindabasini Temple')).toBeVisible();
    await expect(screen.getByText('[📡 Offline]')).toBeVisible();
    await expect(screen.getByText('Last updated: 2 days ago')).toBeVisible();
    
    // Verify content loaded from cache
    await expect(screen.getByText('Hindu Temple')).toBeVisible();
    await expect(screen.getByText(/Bindabasini Temple is one of the oldest/)).toBeVisible();
    
    // 3.4 Verify Images Load from Cache
    await expect(screen.getByTestId('featured-image')).toHaveAttribute('src', /^file:\/\//);
    
    // 3.5 Swipe Through Cached Photos
    await screen.swipeLeft();
    await expect(screen.getByText('📷 [2/8]')).toBeVisible();
    await expect(screen.getByTestId('gallery-image-2')).toHaveAttribute('src', /^file:\/\//);
    
    // 3.6 Play Audio Guide Offline
    await screen.getByRole('button', { name: '🎧 Audio Guide' }).tap();
    await screen.selectLanguage('English');
    await screen.getByRole('button', { name: 'Play' }).tap();
    
    // Verify audio plays from local storage
    await waitFor(() => 
      screen.getByText(/00:0[1-9]/)
    ).toBeVisible({ timeout: 3000 });
    
    expect(await audio.isPlaying()).toBe(true);
    expect(await audio.getSource()).toMatch(/^file:\/\//); // Local file
    
    await screen.getByRole('button', { name: 'Pause' }).tap();
    await device.pressBack();
    
    // ========================================
    // PHASE 4: TRY ACTIONS OFFLINE
    // ========================================
    
    // 4.1 Try to Save Favorite (Should Queue)
    await screen.scrollDown();
    await screen.getByRole('button', { name: '❤️ Save to Favorites' }).tap();
    
    await expect(screen.getByText('Saved (will sync when online)')).toBeVisible();
    await expect(screen.getByTestId('sync-pending-icon')).toBeVisible();
    
    // 4.2 Try to Search (Should Show Cached Results Only)
    await device.pressBack();
    await screen.getByPlaceholder('Search...').tap();
    await screen.getByPlaceholder('Search...').type('temple');
    
    await expect(screen.getByText('[📡 Offline] Showing cached results')).toBeVisible();
    await expect(screen.getByText('Bindabasini Temple')).toBeVisible();
    
    // 4.3 Try to View Event
    await device.pressBack();
    await screen.getByText('Events').tap();
    
    await expect(screen.getByText('[📡 Offline Mode]')).toBeVisible();
    await expect(screen.getByText('Showing downloaded events')).toBeVisible();
    
    await screen.getByText('Dashain Festival').tap();
    await expect(screen.getByText('Dashain Festival')).toBeVisible();
    await expect(screen.getByText('[📡 Offline]')).toBeVisible();
    
    // ========================================
    // PHASE 5: SOS OFFLINE (CRITICAL)
    // ========================================
    
    // 5.1 Tap SOS Button While Offline
    await device.pressBack();
    await screen.getByRole('button', { name: '🆘 EMERGENCY SOS' }).tap();
    
    // 5.2 Select Emergency Type
    await screen.getByText('🚑 Medical Emergency').tap();
    await screen.getByText('☐ Severe injury').tap();
    await screen.getByPlaceholder('Other:').type('Altitude sickness, difficulty breathing');
    
    // 5.3 Attempt to Send SOS Offline
    await screen.getByRole('button', { name: '🆘 SEND EMERGENCY REQUEST' }).tap();
    
    // 5.4 Verify Offline Handling
    await expect(screen.getByText('⚠️ No internet connection')).toBeVisible();
    await expect(screen.getByText('Your SOS request will be sent as soon as connection is restored')).toBeVisible();
    await expect(screen.getByText('Meanwhile, call emergency numbers:')).toBeVisible();
    
    // 5.5 Verify Emergency Numbers Available
    await expect(screen.getByText('🚑 Ambulance: 102')).toBeVisible();
    await expect(screen.getByText('👮 Police: 100')).toBeVisible();
    await expect(screen.getByText('🚒 Fire: 101')).toBeVisible();
    
    // 5.6 Test Direct Call (Should Work Offline)
    await screen.getByRole('button', { name: 'Call 102' }).tap();
    expect(await device.isDialerOpen()).toBe(true);
    expect(await device.getDialedNumber()).toBe('102');
    await device.closeDialer();
    
    // 5.7 Verify SOS Queued Locally
    const queuedSOS = await app.localStorage.getItem('queued_sos');
    expect(JSON.parse(queuedSOS)).toMatchObject({
      emergency_type: 'medical',
      details: expect.stringContaining('Altitude sickness'),
      queued_at: expect.any(String),
      status: 'queued'
    });
    
    await screen.getByRole('button', { name: 'OK' }).tap();
    
    // ========================================
    // PHASE 6: GO BACK ONLINE
    // ========================================
    
    // 6.1 Enable Network
    await device.enableNetwork();
    await wait(3000); // Wait for connection detection
    
    // 6.2 Verify Sync Notification
    await waitFor(() => 
      screen.getByText('📶 Back online')
    ).toBeVisible({ timeout: 5000 });
    
    await expect(screen.getByText('Syncing offline changes...')).toBeVisible();
    
    // 6.3 Wait for Sync Complete
    await waitFor(() => 
      screen.getByText('✓ Sync complete')
    , { timeout: 10000 });
    
    // ========================================
    // PHASE 7: VERIFY SYNCED DATA
    // ========================================
    
    // 7.1 Verify Favorite Synced
    const favoritesResponse = await api.get('/user/favorites');
    expect(favoritesResponse.data.data).toContainEqual(
      expect.objectContaining({
        entity_type: 'heritage_site',
        entity_id: expect.stringContaining('bindabasini')
      })
    );
    
    // 7.2 Verify SOS Synced
    const sosResponse = await api.get('/sos');
    expect(sosResponse.data.data).toContainEqual(
      expect.objectContaining({
        emergency_type: 'medical',
        details: expect.stringContaining('Altitude sickness'),
        sent_offline: true,
        status: 'received'
      })
    );
    
    // 7.3 Verify Sync Status in App
    await screen.getByText('More').tap();
    await screen.getByText('⭐ Saved Places').tap();
    
    await expect(screen.getByText('Bindabasini Temple')).toBeVisible();
    await expect(screen.getByTestId('sync-pending-icon')).not.toBeVisible(); // No longer pending
    
    // 7.4 Verify Analytics Tracked
    const analyticsResponse = await api.get('/admin/analytics/events', {
      params: {
        event_type: 'offline_usage'
      }
    });
    expect(analyticsResponse.data.data.length).toBeGreaterThan(0);
    
  });
});
```

### Expected Results
✅ Content downloads successfully  
✅ Offline maps work without internet  
✅ Heritage sites load from cache  
✅ Audio guide plays offline  
✅ Actions queue properly  
✅ SOS shows offline handling  
✅ Emergency numbers work offline  
✅ Sync works when reconnected  
✅ No data loss  

### Failure Criteria
❌ Download fails or incomplete  
❌ Offline mode crashes  
❌ Cached content doesn't load  
❌ Audio guide doesn't play offline  
❌ SOS doesn't queue  
❌ Sync fails when online  
❌ Data lost during offline period  

---

# Category 2: Business Workflows

## Test 2.1: Business Registration to First Inquiry ⭐ P1

**Test ID:** `TC-004-BUSINESS-COMPLETE-JOURNEY`  
**Priority:** P1 (High)  
**Duration:** ~10 minutes  
**Platforms:** Mobile + Admin Panel

### Scenario
Devi Sharma registers Mountain View Homestay, admin verifies, tourist finds it, sends inquiry, business owner manages inquiry.

### Test Steps

```javascript
describe('TC-004: Business Registration to First Inquiry', () => {
  
  test('Complete business lifecycle from registration to inquiry', async () => {
    
    // ========================================
    // PHASE 1: BUSINESS OWNER REGISTRATION
    // ========================================
    
    // 1.1 User Creates Account via OTP
    await device.launchApp({ newInstance: true });
    
    await screen.getByText('More').tap();
    await screen.getByText('Login/Register').tap();
    
    await screen.getByPlaceholder('Phone number').type('+977-9843333333');
    await screen.getByRole('button', { name: 'Send OTP' }).tap();
    
    // Mock OTP delivery
    const otp = await testUtils.getOTP('+977-9843333333');
    await screen.getByPlaceholder('Enter 6-digit code').type(otp);
    await screen.getByRole('button', { name: 'Verify' }).tap();
    
    // 1.2 Complete Profile
    await expect(screen.getByText('Create Your Profile')).toBeVisible();
    await screen.getByPlaceholder('Your name').type('Devi Sharma');
    await screen.getByPlaceholder('Email (optional)').type('devi@example.com');
    await screen.getByText('Local Resident').tap();
    await screen.getByDropdown('Select Palika').select('Pokhara Metropolitan');
    await screen.getByRole('button', { name: 'Continue' }).tap();
    
    await expect(screen.getByText('Home')).toBeVisible();
    
    // ========================================
    // PHASE 2: BUSINESS REGISTRATION (5 STEPS)
    // ========================================
    
    // 2.1 Navigate to Business Registration
    await screen.getByText('More').tap();
    await screen.getByText('My Business').tap();
    
    await expect(screen.getByText('Register Your Business')).toBeVisible();
    await expect(screen.getByText('Get discovered by tourists and locals')).toBeVisible();
    
    await screen.getByRole('button', { name: 'Register Business' }).tap();
    
    // STEP 1/5: Business Type
    await expect(screen.getByText('Step 1/5')).toBeVisible();
    await expect(screen.getByText('What type of business do you have?')).toBeVisible();
    
    await screen.getByTestId('business-type-accommodation').tap();
    await screen.getByRole('button', { name: 'Next' }).tap();
    
    // STEP 2/5: Basic Information
    await expect(screen.getByText('Step 2/5')).toBeVisible();
    await expect(screen.getByText('Basic Information')).toBeVisible();
    
    await screen.getByPlaceholder('Business Name *').type('Mountain View Homestay');
    await screen.getByPlaceholder('Owner Name *').type('Devi Sharma');
    // Phone pre-filled: +977-9843333333
    await screen.getByPlaceholder('Email (optional)').type('mountainview@example.com');
    await screen.getByDropdown('Ward Number *').select('Ward 8');
    await screen.getByPlaceholder('Address/Location *').type('Near Bindabasini Temple, Main Road');
    
    await screen.getByRole('button', { name: 'Pin Location on Map *' }).tap();
    
    // Map picker
    await expect(map.isVisible()).toBe(true);
    await map.longPress(27.7180, 85.3250);
    await expect(screen.getByText('Ward 8, Near Bindabasini Temple')).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm Location' }).tap();
    
    await expect(screen.getByText('✓ Location set')).toBeVisible();
    
    await screen.getByRole('button', { name: 'Next' }).tap();
    
    // STEP 3/5: Business Details (Homestay)
    await expect(screen.getByText('Step 3/5')).toBeVisible();
    await expect(screen.getByText('Tell us about your homestay')).toBeVisible();
    
    await screen.getByTestId('room-stepper-plus').tap();
    await screen.getByTestId('room-stepper-plus').tap();
    await screen.getByTestId('room-stepper-plus').tap();
    await expect(screen.getByText('3')).toBeVisible();
    
    await screen.getByText('☐ Single Room').tap();
    await screen.getByText('☐ Double Room').tap();
    
    await screen.getByText('☐ WiFi Available').tap();
    await screen.getByText('☐ Hot Water').tap();
    await screen.getByText('☐ Meals Included').tap();
    await screen.getByText('☐ Garden/View').tap();
    
    await screen.getByPlaceholder('From NPR').type('1500');
    await screen.getByPlaceholder('to').type('2500');
    
    await screen.getByPlaceholder('Description *').type(
      'Family-run homestay offering authentic Nepali experience with traditional home-cooked meals and stunning mountain views. Perfect for travelers seeking cultural immersion and warm hospitality.'
    );
    
    await screen.getByText('☐ Nepali').tap();
    await screen.getByText('☐ English').tap();
    await screen.getByText('☐ Hindi').tap();
    
    await screen.getByRole('button', { name: 'Next' }).tap();
    
    // STEP 4/5: Photos & Documents
    await expect(screen.getByText('Step 4/5')).toBeVisible();
    await expect(screen.getByText('Photos & Documents')).toBeVisible();
    
    await screen.getByRole('button', { name: '📷 Add Photos' }).tap();
    
    // Mock photo selection
    await device.selectPhotos([
      'test-photos/exterior.jpg',
      'test-photos/room1.jpg',
      'test-photos/room2.jpg',
      'test-photos/dining.jpg',
      'test-photos/mountain-view.jpg',
      'test-photos/kitchen.jpg'
    ]);
    
    await expect(screen.getByText('6 photos added')).toBeVisible();
    await expect(screen.getByTestId('photo-thumbnail-0')).toBeVisible();
    
    // Upload business license (optional)
    await screen.getByRole('button', { name: '📄 Upload Document' }).tap();
    await device.selectFile('test-documents/business-license.pdf');
    await expect(screen.getByText('business-license.pdf ✓')).toBeVisible();
    
    await screen.getByPlaceholder('License Number (optional)').type('PKR-2024-HOME-1234');
    
    await screen.getByRole('button', { name: 'Next' }).tap();
    
    // STEP 5/5: Review & Submit
    await expect(screen.getByText('Step 5/5')).toBeVisible();
    await expect(screen.getByText('Review & Submit')).toBeVisible();
    
    // Verify summary
    await expect(screen.getByText('Mountain View Homestay')).toBeVisible();
    await expect(screen.getByText('Devi Sharma • +977-9843333333')).toBeVisible();
    await expect(screen.getByText('Ward 8, Near Bindabasini Temple')).toBeVisible();
    await expect(screen.getByText('Homestay • 3 Rooms')).toBeVisible();
    await expect(screen.getByText('NPR 1500-2500/night')).toBeVisible();
    await expect(screen.getByText('6 photos attached')).toBeVisible();
    await expect(screen.getByText('License uploaded ✓')).toBeVisible();
    
    await screen.getByText('☐ I confirm this information is accurate').tap();
    await screen.getByText('☐ I agree to terms of service').tap();
    
    await screen.getByRole('button', { name: 'Submit for Verification' }).tap();
    
    // 2.2 Verify Submission Confirmation
    await expect(screen.getByText('✓ Registration Submitted!')).toBeVisible();
    
    const requestIdText = await screen.getByText(/Request ID: #BUS-/).textContent();
    const businessRequestId = requestIdText.replace('Request ID: #BUS-', '');
    
    await expect(screen.getByText('Status: PENDING VERIFICATION ●')).toBeVisible();
    await expect(screen.getByText('Estimated review time: 2-3 business days')).toBeVisible();
    
    // ========================================
    // PHASE 3: BACKEND VERIFICATION
    // ========================================
    
    // 3.1 Verify Business Created in Database
    const businessResponse = await api.get(`/businesses/${businessRequestId}`);
    expect(businessResponse.status).toBe(200);
    expect(businessResponse.data.data).toMatchObject({
      business_name: 'Mountain View Homestay',
      business_type: 'accommodation',
      sub_category: 'homestay',
      owner: {
        name: 'Devi Sharma',
        phone: '+977-9843333333'
      },
      ward_number: 8,
      verification_status: 'pending',
      details: {
        rooms: 3,
        room_types: ['single', 'double'],
        amenities: ['wifi', 'hot_water', 'meals', 'garden_view']
      },
      price_range: {
        min: 1500,
        max: 2500,
        currency: 'NPR',
        unit: 'night'
      }
    });
    
    // 3.2 Verify Images Uploaded
    expect(businessResponse.data.data.images).toHaveLength(6);
    expect(businessResponse.data.data.images[0]).toMatchObject({
      url: expect.stringContaining('http'),
      type: 'image/jpeg'
    });
    
    // ========================================
    // PHASE 4: ADMIN REVIEWS & VERIFIES
    // ========================================
    
    // 4.1 Admin Logs In
    await browser.goto('http://localhost:3001/admin/login');
    await adminPanel.fill('input[type="email"]', 'verifier@pokhara.gov.np');
    await adminPanel.fill('input[type="password"]', 'test-password');
    await adminPanel.click('button[type="submit"]');
    
    await expect(adminPanel.getByText('Dashboard')).toBeVisible();
    
    // 4.2 Navigate to Pending Businesses
    await adminPanel.click('Business Verification');
    await adminPanel.click('Pending Verification');
    
    // 4.3 Find Mountain View Homestay
    await expect(adminPanel.getByText('Mountain View Homestay')).toBeVisible();
    await expect(adminPanel.getByText('Pending')).toBeVisible();
    await expect(adminPanel.getByText('Devi Sharma')).toBeVisible();
    await expect(adminPanel.getByText('2 minutes ago')).toBeVisible();
    
    await adminPanel.click('Mountain View Homestay');
    
    // 4.4 Review Details
    await expect(adminPanel.getByText('Business Verification')).toBeVisible();
    await expect(adminPanel.getByText('Mountain View Homestay')).toBeVisible();
    
    // Verify all details visible
    await expect(adminPanel.getByText('Owner: Devi Sharma')).toBeVisible();
    await expect(adminPanel.getByText('Phone: +977-9843333333')).toBeVisible();
    await expect(adminPanel.getByText('Ward 8, Near Bindabasini Temple')).toBeVisible();
    await expect(adminPanel.getByText('3 rooms')).toBeVisible();
    await expect(adminPanel.getByText('NPR 1500-2500')).toBeVisible();
    
    // View photos
    await adminPanel.click('View Photos (6)');
    await expect(adminPanel.getByTestId('photo-gallery')).toBeVisible();
    
    // View license
    await adminPanel.click('View License Document');
    await expect(adminPanel.getByText('PKR-2024-HOME-1234')).toBeVisible();
    
    // View on map
    await adminPanel.click('View on Map');
    await expect(adminPanel.getByTestId('verification-map')).toBeVisible();
    await expect(map.getMarkerAt(27.7180, 85.3250)).toBeVisible();
    
    // 4.5 Approve Verification
    await adminPanel.selectDropdown('verification_status', 'Verified');
    await adminPanel.fill('textarea[name="verification_notes"]', 
      'All documents verified. Location confirmed. Photos are of good quality. Business license valid.'
    );
    
    await adminPanel.click('button', { name: 'Save Verification' });
    
    // 4.6 Verify Success Message
    await expect(adminPanel.getByText('✓ Business verified successfully')).toBeVisible();
    await expect(adminPanel.getByText('Status: Verified')).toBeVisible();
    await expect(adminPanel.getByText('⭐ Palika Verified Badge Added')).toBeVisible();
    
    // ========================================
    // PHASE 5: BUSINESS OWNER NOTIFIED
    // ========================================
    
    // 5.1 Business Owner Receives Notification
    await wait(2000);
    await device.expectNotification('🎉 Your business has been verified!');
    
    // 5.2 Open App and Check Status
    await device.openNotification('🎉 Your business has been verified!');
    
    await expect(screen.getByText('Congratulations!')).toBeVisible();
    await expect(screen.getByText('Your business has been verified!')).toBeVisible();
    await expect(screen.getByText('Mountain View Homestay')).toBeVisible();
    await expect(screen.getByText('⭐ Palika Verified Business')).toBeVisible();
    
    await screen.getByRole('button', { name: 'View My Business' }).tap();
    
    // 5.3 Verify Business Dashboard
    await expect(screen.getByText('My Business')).toBeVisible();
    await expect(screen.getByText('Mountain View Homestay')).toBeVisible();
    await expect(screen.getByText('⭐ Palika Verified')).toBeVisible();
    await expect(screen.getByText('Status: ACTIVE ●')).toBeVisible();
    
    await expect(screen.getByText('👁️ 0 Views')).toBeVisible();
    await expect(screen.getByText('📞 0 Contact Clicks')).toBeVisible();
    await expect(screen.getByText('💬 0 Inquiries')).toBeVisible();
    
    // ========================================
    // PHASE 6: TOURIST DISCOVERS BUSINESS
    // ========================================
    
    // 6.1 Tourist Opens App
    await device.terminateApp();
    await device.launchApp();
    await loginAsUser('test-tourist-1'); // Sarah
    
    // 6.2 Search for Homestay
    await screen.getByText('Services').tap();
    await screen.getByText('🏨 Stay').tap();
    
    await expect(screen.getByText('Accommodation')).toBeVisible();
    await screen.getByDropdown('Sort by').select('Rating');
    
    // 6.3 Find Mountain View Homestay
    await expect(screen.getByText('Mountain View Homestay')).toBeVisible();
    await expect(screen.getByText('⭐ Palika Verified')).toBeVisible();
    await expect(screen.getByText('Ward 8 • 2.3 km')).toBeVisible();
    await expect(screen.getByText('NPR 1500-2500')).toBeVisible();
    await expect(screen.getByText('WiFi • Hot Water • Meals')).toBeVisible();
    
    // 6.4 View Full Details
    await screen.getByText('Mountain View Homestay').tap();
    
    await expect(screen.getByText('Mountain View Homestay')).toBeVisible();
    await expect(screen.getByText('⭐ Palika Verified Business')).toBeVisible();
    await expect(screen.getByText('Ward 8, Near Bindabasini Temple • 2.3 km away')).toBeVisible();
    await expect(screen.getByText('📞 +977-9843333333')).toBeVisible();
    
    // Swipe through photos
    await screen.swipeLeft();
    await expect(screen.getByText('[2/6]')).toBeVisible();
    
    // Read description
    await screen.scrollDown();
    await expect(screen.getByText(/Family-run homestay offering authentic/)).toBeVisible();
    
    // ========================================
    // PHASE 7: TOURIST SENDS INQUIRY
    // ========================================
    
    // 7.1 Tap Contact Business
    await screen.scrollDown();
    await screen.getByRole('button', { name: 'Contact Business' }).tap();
    
    // 7.2 Verify Inquiry Code Generated
    await expect(screen.getByText('Contact Business')).toBeVisible();
    
    const inquiryCodeText = await screen.getByText(/Your inquiry code: /).textContent();
    const inquiryCode = inquiryCodeText.replace('Your inquiry code: ', '');
    
    await expect(screen.getByText('Please mention this when contacting')).toBeVisible();
    
    // 7.3 Fill Inquiry Form
    await screen.getByRole('button', { name: 'Send Inquiry' }).tap();
    
    await expect(screen.getByText('Inquiry Details')).toBeVisible();
    
    // Name pre-filled: Sarah Mitchell
    // Phone pre-filled: +977-9841111111
    
    await screen.getByTestId('date-picker-checkin').tap();
    await calendar.selectDate(2025, 10, 28);
    await screen.getByRole('button', { name: 'OK' }).tap();
    
    await screen.getByTestId('date-picker-checkout').tap();
    await calendar.selectDate(2025, 10, 30);
    await screen.getByRole('button', { name: 'OK' }).tap();
    
    await screen.getByTestId('stepper-adults-plus').tap();
    await screen.getByTestId('stepper-adults-plus').tap();
    await expect(screen.getByText('2')).toBeVisible();
    
    await screen.getByText('( ) Double Room').tap();
    
    await screen.getByPlaceholder('Any dietary restrictions, pick-up needed, etc...').type(
      'We are vegetarian and would love to learn cooking traditional Nepali dishes. Can you arrange a cooking class?'
    );
    
    await screen.getByText('☐ I agree to share my contact information').tap();
    
    await screen.getByRole('button', { name: 'Send Inquiry' }).tap();
    
    // 7.4 Verify Inquiry Sent
    await expect(screen.getByText('✓ Inquiry Sent Successfully')).toBeVisible();
    await expect(screen.getByText(`Inquiry ID: #${inquiryCode}`)).toBeVisible();
    await expect(screen.getByText('Sent to: Mountain View Homestay')).toBeVisible();
    
    await expect(screen.getByText('What happens next?')).toBeVisible();
    await expect(screen.getByText('1. Business owner will review your inquiry')).toBeVisible();
    await expect(screen.getByText('2. They\'ll contact you directly')).toBeVisible();
    
    // ========================================
    // PHASE 8: BUSINESS OWNER RECEIVES INQUIRY
    // ========================================
    
    // 8.1 Business Owner Receives Notification
    await device.terminateApp();
    await device.launchApp();
    await loginAsUser('test-business-1'); // Devi Sharma
    
    await wait(2000);
    await device.expectNotification('💬 New Inquiry');
    
    // 8.2 Open Notification
    await device.openNotification('💬 New Inquiry');
    
    // 8.3 View Inquiry Dashboard
    await expect(screen.getByText('Inquiries')).toBeVisible();
    await expect(screen.getByText('Unread (1)')).toBeVisible();
    
    // 8.4 View Inquiry Details
    await screen.getByText(inquiryCode).tap();
    
    await expect(screen.getByText('Inquiry Details')).toBeVisible();
    await expect(screen.getByText(inquiryCode)).toBeVisible();
    
    // Customer info
    await expect(screen.getByText('Sarah Mitchell')).toBeVisible();
    await expect(screen.getByText('+977-9841111111')).toBeVisible();
    
    // Inquiry details
    await expect(screen.getByText('Check-in: Oct 28, 2025')).toBeVisible();
    await expect(screen.getByText('Check-out: Oct 30, 2025')).toBeVisible();
    await expect(screen.getByText('Duration: 2 nights')).toBeVisible();
    await expect(screen.getByText('2 Adults')).toBeVisible();
    await expect(screen.getByText('Double Room')).toBeVisible();
    await expect(screen.getByText(/We are vegetarian/)).toBeVisible();
    
    // 8.5 Update Inquiry Status
    await expect(screen.getByText('Current Status: NEW ●')).toBeVisible();
    
    await screen.getByText('( ) Contacted').tap();
    await screen.getByRole('button', { name: 'Save Status' }).tap();
    
    await expect(screen.getByText('✓ Status updated')).toBeVisible();
    await expect(screen.getByText('Current Status: CONTACTED ●')).toBeVisible();
    
    // 8.6 Call Customer (Mock)
    await screen.getByRole('button', { name: '📞 Call' }).tap();
    expect(await device.isDialerOpen()).toBe(true);
    expect(await device.getDialedNumber()).toBe('+977-9841111111');
    await device.closeDialer();
    
    // ========================================
    // PHASE 9: FINAL VERIFICATION
    // ========================================
    
    // 9.1 Verify Inquiry in Database
    const inquiryResponse = await api.get(`/inquiries/${inquiryCode}`);
    expect(inquiryResponse.status).toBe(200);
    expect(inquiryResponse.data.data).toMatchObject({
      inquiry_code: inquiryCode,
      business: {
        id: businessRequestId,
        business_name: 'Mountain View Homestay'
      },
      user: {
        name: 'Sarah Mitchell',
        phone: '+977-9841111111'
      },
      status: 'contacted',
      inquiry_data: {
        check_in: '2025-10-28',
        check_out: '2025-10-30',
        guests: 2,
        room_type: 'double',
        special_requests: expect.stringContaining('vegetarian')
      }
    });
    
    // 9.2 Verify Business Stats Updated
    const updatedBusiness = await api.get(`/businesses/${businessRequestId}`);
    expect(updatedBusiness.data.data.inquiry_count).toBe(1);
    expect(updatedBusiness.data.data.contact_count).toBeGreaterThan(0);
    expect(updatedBusiness.data.data.view_count).toBeGreaterThan(0);
    
    // 9.3 Verify Analytics Tracked
    const analyticsEvents = await api.get('/admin/analytics/events', {
      params: {
        entity_type: 'business',
        entity_id: businessRequestId
      }
    });
    
    expect(analyticsEvents.data.data).toContainEqual(
      expect.objectContaining({
        event_type: 'business_view'
      })
    );
    
    expect(analyticsEvents.data.data).toContainEqual(
      expect.objectContaining({
        event_type: 'inquiry_created'
      })
    );
    
  });
});
```

### Expected Results
✅ OTP login works  
✅ 5-step registration completes  
✅ Photos upload successfully  
✅ Admin verification workflow smooth  
✅ Notification delivery works  
✅ Business appears in search  
✅ Inquiry system functional  
✅ Status updates sync  
✅ Complete audit trail  

### Failure Criteria
❌ Registration fails at any step  
❌ Photo upload fails  
❌ Admin can't verify business  
❌ Business doesn't appear in listings  
❌ Inquiry doesn't reach business owner  
❌ Status updates don't sync  

---

## Test 2.2: Review & Rating Complete Flow ⭐ P1

**Test ID:** `TC-005-REVIEW-RATING-FLOW`  
**Priority:** P1 (High)  
**Duration:** ~5 minutes  
**Platforms:** Mobile + Admin Panel

### Scenario
Tourist completes stay, submits review with rating, business owner responds, admin can moderate.

### Test Steps

```javascript
describe('TC-005: Review & Rating Complete Flow', () => {
  
  test('Tourist reviews → Owner responds → Admin moderates', async () => {
    
    // ========================================
    // PREREQUISITE SETUP
    // ========================================
    
    const businessId = 'mountain-view-homestay-id';
    const inquiryId = 'inquiry-xyz-1234';
    
    // Mark inquiry as completed (tourist has stayed)
    await api.put(`/inquiries/${inquiryId}/status`, {
      status: 'completed',
      booking_details: {
        check_in: '2025-10-28',
        check_out: '2025-10-30',
        actual_guests: 2,
        amount_paid: 4000
      }
    });
    
    // ========================================
    // PHASE 1: TOURIST SUBMITS REVIEW
    // ========================================
    
    // 1.1 Tourist Opens App After Stay
    await device.launchApp();
    await loginAsUser('test-tourist-1'); // Sarah
    
    // 1.2 Navigate to Completed Inquiries
    await screen.getByText('More').tap();
    await screen.getByText('💬 My Inquiries').tap();
    await screen.getByText('Completed').tap();
    
    // 1.3 Find Completed Stay
    await expect(screen.getByText('Mountain View Homestay')).toBeVisible();
    await expect(screen.getByText(inquiryId)).toBeVisible();
    await expect(screen.getByText('Completed ✓')).toBeVisible();
    await expect(screen.getByText('Oct 28-30, 2025')).toBeVisible();
    
    await screen.getByText(inquiryId).tap();
    
    // 1.4 Verify Write Review Button Visible
    await expect(screen.getByText('Booking Completed')).toBeVisible();
    await expect(screen.getByRole('button', { name: 'Write Review' })).toBeVisible();
    
    await screen.getByRole('button', { name: 'Write Review' }).tap();
    
    // 1.5 Fill Review Form
    await expect(screen.getByText('Review Mountain View Homestay')).toBeVisible();
    
    // Rating
    await expect(screen.getByText('Rate Your Experience')).toBeVisible();
    await screen.getByTestId('star-5').tap();
    await expect(screen.getByText('⭐⭐⭐⭐⭐')).toBeVisible();
    
    // Title
    await screen.getByPlaceholder('Review title (optional)').type('Amazing homestay experience!');
    
    // Comment
    await screen.getByPlaceholder('Share your experience...').type(
      'Devi and her family were incredibly welcoming. The traditional meals were absolutely delicious - especially the dal bhat! We learned so much about Nepali culture and cooking. The mountain views from our room were breathtaking. The cooking class was a highlight of our trip. Highly recommend this authentic experience!'
    );
    
    // Submit
    await screen.getByRole('button', { name: 'Submit Review' }).tap();
    
    // 1.6 Verify Submission Success
    await expect(screen.getByText('✓ Review submitted successfully')).toBeVisible();
    await expect(screen.getByText('Thank you for sharing your experience!')).toBeVisible();
    
    // ========================================
    // PHASE 2: REVIEW APPEARS ON BUSINESS PAGE
    // ========================================
    
    // 2.1 Navigate to Business Page
    await device.pressBack();
    await device.pressBack();
    await screen.getByText('Services').tap();
    await screen.getByPlaceholder('Search...').type('Mountain View');
    
    await screen.getByText('Mountain View Homestay').tap();
    
    // 2.2 Verify Rating Updated
    await expect(screen.getByText('⭐ 5.0 ★★★★★ (1 review)')).toBeVisible();
    
    // 2.3 Scroll to Reviews Section
    await screen.scrollTo('Reviews');
    await expect(screen.getByText('Reviews (1)')).toBeVisible();
    
    // 2.4 Verify Review Visible
    await expect(screen.getByText('⭐⭐⭐⭐⭐')).toBeVisible();
    await expect(screen.getByText('Amazing homestay experience!')).toBeVisible();
    await expect(screen.getByText(/Devi and her family were incredibly welcoming/)).toBeVisible();
    await expect(screen.getByText('Sarah Mitchell')).toBeVisible();
    await expect(screen.getByText('UK')).toBeVisible();
    await expect(screen.getByText('Stayed: Oct 2025')).toBeVisible();
    await expect(screen.getByText('✓ Verified Stay')).toBeVisible();
    
    // ========================================
    // PHASE 3: BUSINESS OWNER RECEIVES NOTIFICATION
    // ========================================
    
    // 3.1 Business Owner Gets Notification
    await device.terminateApp();
    await device.launchApp();
    await loginAsUser('test-business-1'); // Devi
    
    await wait(2000);
    await device.expectNotification('⭐ New review posted');
    
    // 3.2 Open Business Dashboard
    await device.openNotification('⭐ New review posted');
    
    await expect(screen.getByText('My Business')).toBeVisible();
    await expect(screen.getByText('Mountain View Homestay')).toBeVisible();
    
    // 3.3 Navigate to Reviews
    await screen.getByText('⭐ Reviews & Ratings (1)').tap();
    
    // 3.4 View Overall Rating
    await expect(screen.getByText('Reviews & Ratings')).toBeVisible();
    await expect(screen.getByText('Overall Rating')).toBeVisible();
    await expect(screen.getByText('⭐ 5.0 out of 5')).toBeVisible();
    await expect(screen.getByText('Based on 1 review')).toBeVisible();
    
    // Rating breakdown
    await expect(screen.getByText('5 stars:')).toBeVisible();
    await expect(screen.getByText('[============] 100% (1)')).toBeVisible();
    
    // 3.5 View Review Details
    await expect(screen.getByText('⭐⭐⭐⭐⭐')).toBeVisible();
    await expect(screen.getByText('Amazing homestay experience!')).toBeVisible();
    await expect(screen.getByText('Sarah Mitchell • UK')).toBeVisible();
    await expect(screen.getByText(/Devi and her family were incredibly welcoming/)).toBeVisible();
    
    // ========================================
    // PHASE 4: OWNER RESPONDS TO REVIEW
    // ========================================
    
    // 4.1 Tap Respond Button
    await screen.getByRole('button', { name: '💬 Respond to Review' }).tap();
    
    // 4.2 Fill Response Form
    await expect(screen.getByText('Respond to Review')).toBeVisible();
    
    // Original review shown (read-only)
    await expect(screen.getByText('Sarah Mitchell • Oct 2025')).toBeVisible();
    await expect(screen.getByText(/Devi and her family/)).toBeVisible();
    
    // Response textarea
    await screen.getByPlaceholder('Write your response...').type(
      'Thank you so much, Sarah! We loved hosting you and your family. It was wonderful to share our Nepali culture and cooking traditions with you. The cooking class was as much fun for us as it was for you! You are always welcome back to our homestay. Safe travels! 🙏'
    );
    
    await expect(screen.getByText('Characters: 268/500')).toBeVisible();
    
    // Tips visible
    await expect(screen.getByText('✓ Be professional and courteous')).toBeVisible();
    await expect(screen.getByText('✓ Thank reviewer for feedback')).toBeVisible();
    
    // Submit response
    await screen.getByRole('button', { name: 'Post Response' }).tap();
    
    // 4.3 Verify Response Posted
    await expect(screen.getByText('✓ Response posted successfully')).toBeVisible();
    
    // 4.4 Verify Response Visible
    await expect(screen.getByText('Owner Response:')).toBeVisible();
    await expect(screen.getByText(/Thank you so much, Sarah!/)).toBeVisible();
    await expect(screen.getByText('Responded: 1 minute ago')).toBeVisible();
    
    // ========================================
    // PHASE 5: TOURIST SEES OWNER RESPONSE
    // ========================================
    
    // 5.1 Tourist Opens App
    await device.terminateApp();
    await device.launchApp();
    await loginAsUser('test-tourist-1'); // Sarah
    
    // 5.2 Receives Notification
    await wait(2000);
    await device.expectNotification('💬 Mountain View Homestay responded to your review');
    
    // 5.3 Open Business Page
    await device.openNotification('💬 Mountain View Homestay responded');
    
    // 5.4 Scroll to Reviews
    await screen.scrollTo('Reviews');
    
    // 5.5 Verify Response Visible
    await expect(screen.getByText('⭐⭐⭐⭐⭐')).toBeVisible();
    await expect(screen.getByText('Amazing homestay experience!')).toBeVisible();
    
    await expect(screen.getByText('Owner Response:')).toBeVisible();
    await expect(screen.getByText(/Thank you so much, Sarah!/)).toBeVisible();
    await expect(screen.getByText('Devi Sharma')).toBeVisible();
    
    // ========================================
    // PHASE 6: ADMIN MODERATION
    // ========================================
    
    // 6.1 Admin Logs In
    await browser.goto('http://localhost:3001/admin/login');
    await adminPanel.login('moderator@pokhara.gov.np', 'test-password');
    
    // 6.2 Navigate to Reviews Dashboard
    await adminPanel.click('Content Moderation');
    await adminPanel.click('Reviews');
    
    // 6.3 View Recent Reviews
    await expect(adminPanel.getByText('Recent Reviews')).toBeVisible();
    
    await expect(adminPanel.getByText('Mountain View Homestay')).toBeVisible();
    await expect(adminPanel.getByText('⭐⭐⭐⭐⭐')).toBeVisible();
    await expect(adminPanel.getByText('Sarah Mitchell')).toBeVisible();
    await expect(adminPanel.getByText('Amazing homestay experience!')).toBeVisible();
    
    // 6.4 Open Review Detail
    await adminPanel.click('Amazing homestay experience!');
    
    // 6.5 Verify Moderation Options
    await expect(adminPanel.getByText('Review Details')).toBeVisible();
    await expect(adminPanel.getByText('Status: Approved ✓')).toBeVisible();
    
    // Owner response visible
    await expect(adminPanel.getByText('Owner Response:')).toBeVisible();
    await expect(adminPanel.getByText(/Thank you so much, Sarah!/)).toBeVisible();
    
    // Moderation actions
    await expect(adminPanel.getByRole('button', { name: 'Flag Review' })).toBeVisible();
    await expect(adminPanel.getByRole('button', { name: 'Delete Review' })).toBeVisible();
    await expect(adminPanel.getByRole('button', { name: 'Delete Owner Response' })).toBeVisible();
    
    // 6.6 Test Flag Function (Optional)
    await adminPanel.click('button', { name: 'Flag Review' });
    
    await adminPanel.selectDropdown('flag_reason', 'Inappropriate content');
    await adminPanel.fill('textarea[name="flag_notes"]', 'Testing moderation system');
    await adminPanel.click('button[type="submit"]');
    
    await expect(adminPanel.getByText('✓ Review flagged')).toBeVisible();
    await expect(adminPanel.getByText('Status: Flagged ⚠️')).toBeVisible();
    
    // 6.7 Unflag Review
    await adminPanel.click('button', { name: 'Unflag' });
    await expect(adminPanel.getByText('Status: Approved ✓')).toBeVisible();
    
    // ========================================
    // PHASE 7: HELPFUL VOTES
    // ========================================
    
    // 7.1 Another Tourist Finds Review Helpful
    await device.terminateApp();
    await device.launchApp();
    await loginAsUser('test-resident-1'); // Ram (another user)
    
    await screen.getByText('Services').tap();
    await screen.getByText('Mountain View Homestay').tap();
    await screen.scrollTo('Reviews');
    
    // 7.2 Mark as Helpful
    await expect(screen.getByText('Amazing homestay experience!')).toBeVisible();
    await expect(screen.getByRole('button', { name: '👍 Helpful (0)' })).toBeVisible();
    
    await screen.getByRole('button', { name: '👍 Helpful (0)' }).tap();
    
    // 7.3 Verify Count Updated
    await expect(screen.getByRole('button', { name: '👍 Helpful (1)' })).toBeVisible();
    
    // ========================================
    // PHASE 8: FINAL VERIFICATION
    // ========================================
    
    // 8.1 Verify Review in Database
    const reviewResponse = await api.get('/reviews', {
      params: { business_id: businessId }
    });
    
    expect(reviewResponse.data.data).toHaveLength(1);
    expect(reviewResponse.data.data[0]).toMatchObject({
      rating: 5,
      title: 'Amazing homestay experience!',
      comment: expect.stringContaining('Devi and her family'),
      owner_response: expect.stringContaining('Thank you so much, Sarah'),
      is_verified_stay: true,
      helpful_count: 1,
      is_approved: true
    });
    
    // 8.2 Verify Business Rating Updated
    const businessResponse = await api.get(`/businesses/${businessId}`);
    expect(businessResponse.data.data.rating_average).toBe(5.0);
    expect(businessResponse.data.data.rating_count).toBe(1);
    
    // 8.3 Verify Analytics Tracked
    const analyticsResponse = await api.get('/admin/analytics/events', {
      params: {
        event_type: 'review_submitted',
        entity_id: businessId
      }
    });
    
    expect(analyticsResponse.data.data).toContainEqual(
      expect.objectContaining({
        event_type: 'review_submitted',
        metadata: expect.objectContaining({
          rating: 5
        })
      })
    );
    
  });
});
```

### Expected Results
✅ Review submission works  
✅ Rating calculation accurate  
✅ Owner notification delivered  
✅ Response system functional  
✅ Tourist sees response  
✅ Admin moderation tools work  
✅ Helpful votes tracked  
✅ Business rating updated  

### Failure Criteria
❌ Review doesn't save  
❌ Rating not calculated  
❌ Notifications fail  
❌ Response doesn't post  
❌ Moderation tools broken  

---

I'll continue with the remaining test categories. This is getting quite long! 

Should I:

**A)** Continue with all 30 tests in this document (will be 100+ pages)

**B)** Create a summary table of remaining tests with key details

**C)** Package what we have and create separate detailed test files

Which approach would you prefer?