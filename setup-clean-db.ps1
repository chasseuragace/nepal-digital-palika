# setup-clean-db.ps1 - Complete Database Setup Script for Windows
# This script handles: clean DB, infrastructure seeding, admin users, and marketplace data

$ErrorActionPreference = "Stop"

# Helper functions
function Write-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Fail { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ $msg" -ForegroundColor Blue }
function Write-Warn { param($msg) Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Write-Header { param($msg) Write-Host "`n$msg`n" -ForegroundColor Cyan }

# Header
Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  Nepal Digital Tourism - Complete Database Setup" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Prerequisites
Write-Header "[1/6] Checking Prerequisites"

# Check Supabase CLI
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Success "Supabase CLI installed"
} catch {
    Write-Fail "Supabase CLI not installed"
    Write-Host ""
    Write-Host "Install Supabase CLI:"
    Write-Host "  scoop install supabase"
    Write-Host ""
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js installed ($nodeVersion)"
} catch {
    Write-Fail "Node.js not installed"
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Success "npm installed ($npmVersion)"
} catch {
    Write-Fail "npm not installed"
    exit 1
}

# Step 2: Start Supabase
Write-Header "[2/6] Starting Supabase"

try {
    $status = supabase status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Supabase is already running"
    } else {
        throw "Not running"
    }
} catch {
    Write-Info "Starting Supabase local instance..."
    supabase start
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Supabase started successfully"
    } else {
        Write-Fail "Failed to start Supabase"
        exit 1
    }
}

# Step 3: Reset Database (Clean Slate)
Write-Header "[3/6] Resetting Database (Clean Slate)"
Write-Warn "This will delete all existing data and apply migrations"
$response = Read-Host "Continue? (y/n)"

if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Info "Resetting database..."
    supabase db reset
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database reset complete"
        Write-Success "All migrations applied"
    } else {
        Write-Fail "Database reset failed"
        exit 1
    }
} else {
    Write-Warn "Database reset skipped"
}

# Step 4: Install Database Dependencies
Write-Header "[4/6] Installing Database Dependencies"

Push-Location database
if (-not (Test-Path "node_modules")) {
    Write-Info "Installing dependencies..."
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Dependencies installed"
    } else {
        Write-Fail "Failed to install dependencies"
        Pop-Location
        exit 1
    }
} else {
    Write-Success "Dependencies already installed"
}
Pop-Location

# Step 5: Run Seeding Pipeline
Write-Header "[5/6] Running Seeding Pipeline"

Push-Location database

Write-Host ""
Write-Host "Stage 1: Infrastructure Setup" -ForegroundColor Cyan
Write-Info "Seeding subscription tiers..."
npx ts-node scripts/seed-subscription-tiers.ts
if ($LASTEXITCODE -eq 0) { Write-Success "Subscription tiers seeded" }

Write-Info "Seeding business types..."
npx ts-node scripts/seed-business-types.ts
if ($LASTEXITCODE -eq 0) { Write-Success "Business types seeded" }

Write-Info "Seeding business categories..."
npx ts-node scripts/seed-business-categories-direct.ts
if ($LASTEXITCODE -eq 0) { Write-Success "Business categories seeded" }

Write-Info "Seeding marketplace categories..."
npx ts-node scripts/seed-marketplace-categories-direct.ts
if ($LASTEXITCODE -eq 0) { Write-Success "Marketplace categories seeded" }

Write-Host ""
Write-Host "Stage 2: Admin Users" -ForegroundColor Cyan
Write-Info "Creating admin users..."
npx ts-node scripts/seed-admin-users.ts
if ($LASTEXITCODE -eq 0) { Write-Success "Admin users created" }

Write-Host ""
Write-Host "Stage 3: Palika Tier Assignment" -ForegroundColor Cyan
Write-Info "Assigning tiers to palikas..."
npx ts-node scripts/enroll-palikas-tiers.ts
if ($LASTEXITCODE -eq 0) { Write-Success "Palika tiers assigned" }

Write-Host ""
Write-Host "Stage 4: User & Business Creation" -ForegroundColor Cyan
Write-Info "Creating test users and businesses..."
npx ts-node scripts/seed-marketplace-proper.ts
if ($LASTEXITCODE -eq 0) { Write-Success "Users and businesses created" }

Write-Host ""
Write-Host "Stage 5: Marketplace Products" -ForegroundColor Cyan
Write-Info "Creating marketplace products..."
npx ts-node scripts/seed-marketplace-test-data.ts
if ($LASTEXITCODE -eq 0) { Write-Success "Marketplace products created" }

Pop-Location

# Step 6: Verify Setup
Write-Header "[6/6] Verifying Setup"

Push-Location database
if (Test-Path "scripts/quick-table-check.ts") {
    npx ts-node scripts/quick-table-check.ts
}
Pop-Location

# Final Summary
Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Success "Database is clean and seeded"
Write-Host ""
Write-Host "What was created:" -ForegroundColor Blue
Write-Host "  • Infrastructure: Tiers, Features, Categories"
Write-Host "  • Admin Users: Super Admin, Palika Admins, Moderators"
Write-Host "  • Test Data: Users, Businesses, Products"
Write-Host ""
Write-Host "Test Credentials:" -ForegroundColor Blue
Write-Host "  Super Admin:"
Write-Host "    Email: superadmin@nepaltourism.dev"
Write-Host "    Password: SuperSecurePass123!"
Write-Host ""
Write-Host "  Kathmandu Admin:"
Write-Host "    Email: palika.admin@kathmandu.gov.np"
Write-Host "    Password: KathmanduAdmin456!"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Blue
Write-Host "  1. Start admin panel: cd admin-panel; npm run dev"
Write-Host "  2. Access at: http://localhost:3000"
Write-Host "  3. Login with credentials above"
Write-Host ""
Write-Host "Supabase Studio:" -ForegroundColor Blue
Write-Host "  URL: http://127.0.0.1:54323"
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green
Write-Host ""
