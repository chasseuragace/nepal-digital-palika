# setup-database.ps1 - Automated Database Setup
# Run this script to set up the database with all required data

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  Nepal Digital Tourism - Database Setup" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase is running
Write-Host "Checking Supabase status..." -NoNewline
try {
    $status = supabase status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " NOT RUNNING" -ForegroundColor Yellow
        Write-Host "Starting Supabase..." -NoNewline
        supabase start
        if ($LASTEXITCODE -eq 0) {
            Write-Host " OK" -ForegroundColor Green
        } else {
            Write-Host " FAILED" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host " ERROR" -ForegroundColor Red
    Write-Host "Supabase CLI not found. Please install it first."
    exit 1
}

# Navigate to database directory
Write-Host ""
Write-Host "Navigating to database directory..." -NoNewline
Push-Location ..\database
Write-Host " OK" -ForegroundColor Green

# Install dependencies if needed
Write-Host "Checking dependencies..." -NoNewline
if (-not (Test-Path "node_modules")) {
    Write-Host " INSTALLING" -ForegroundColor Yellow
    npm install --silent
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "Failed to install dependencies" -ForegroundColor Red
        Pop-Location
        exit 1
    }
} else {
    Write-Host " OK" -ForegroundColor Green
}

# Run seeding scripts in order
Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  Running Seeding Scripts" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "[1/6] Seeding basic infrastructure..." -ForegroundColor Cyan
npx ts-node scripts/seed-database.ts
if ($LASTEXITCODE -eq 0) { Write-Host "✓ Basic infrastructure seeded" -ForegroundColor Green }

Write-Host ""
Write-Host "[2/6] Seeding subscription tiers..." -ForegroundColor Cyan
npx ts-node scripts/seed-subscription-tiers.ts
if ($LASTEXITCODE -eq 0) { Write-Host "✓ Subscription tiers seeded" -ForegroundColor Green }

Write-Host ""
Write-Host "[3/6] Seeding marketplace categories..." -ForegroundColor Cyan
npx ts-node scripts/seed-marketplace-categories-direct.ts
if ($LASTEXITCODE -eq 0) { Write-Host "✓ Marketplace categories seeded" -ForegroundColor Green }

Write-Host ""
Write-Host "[4/6] Seeding business categories..." -ForegroundColor Cyan
npx ts-node scripts/seed-business-categories-direct.ts
if ($LASTEXITCODE -eq 0) { Write-Host "✓ Business categories seeded" -ForegroundColor Green }

Write-Host ""
Write-Host "[5/6] Assigning tiers to palikas..." -ForegroundColor Cyan
npx ts-node scripts/enroll-palikas-tiers.ts
if ($LASTEXITCODE -eq 0) { Write-Host "✓ Palika tiers assigned" -ForegroundColor Green }

Write-Host ""
Write-Host "[6/6] Creating test data..." -ForegroundColor Cyan
npx ts-node scripts/seed-marketplace-proper.ts
if ($LASTEXITCODE -eq 0) { Write-Host "✓ Test data created" -ForegroundColor Green }

# Verify setup
Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  Verifying Setup" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

npx ts-node scripts/quick-table-check.ts

Pop-Location

# Final summary
Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database is ready with:" -ForegroundColor Green
Write-Host "  • 7 provinces, 77 districts, 372 palikas"
Write-Host "  • 3 subscription tiers with 27 features"
Write-Host "  • 26 marketplace categories, 8 business categories"
Write-Host "  • 8 test users, 8 businesses, 16 products"
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Blue
Write-Host "  • Supabase Studio: http://127.0.0.1:54323"
Write-Host "  • Database: http://127.0.0.1:54321"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Blue
Write-Host "  1. cd ..\admin-panel"
Write-Host "  2. npm install"
Write-Host "  3. npm run dev"
Write-Host "  4. Open http://localhost:3000"
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green
Write-Host ""
