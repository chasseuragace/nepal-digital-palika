# Nepal Digital Palika - Windows Seeding Script
Write-Host "Starting database seeding..." -ForegroundColor Cyan

$env:SUPABASE_URL = "http://127.0.0.1:54321"
$env:SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

Write-Host "
Phase 1: Infrastructure" -ForegroundColor Yellow
npx tsx scripts/seed-subscription-tiers.ts
npx tsx scripts/seed-business-categories-direct.ts
npx tsx scripts/seed-marketplace-categories-direct.ts
npx tsx scripts/enroll-palikas-tiers.ts

Write-Host "
Phase 2: Admin Users" -ForegroundColor Yellow
npx tsx scripts/seed-admin-users.ts

Write-Host "
Phase 3: Marketplace" -ForegroundColor Yellow
npx tsx scripts/seed-marketplace-proper.ts

Write-Host "
Phase 4: Bhaktapur" -ForegroundColor Yellow
npx tsx scripts/seed-bhaktapur-users.ts

Write-Host "
Seeding complete!" -ForegroundColor Green
