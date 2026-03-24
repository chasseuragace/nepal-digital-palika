# check-prerequisites.ps1 - Check if all prerequisites are installed

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  Prerequisites Check" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check Supabase CLI
Write-Host "Checking Supabase CLI..." -NoNewline
try {
    $supabaseVersion = supabase --version 2>&1
    Write-Host " OK" -ForegroundColor Green
    Write-Host "  Version: $supabaseVersion" -ForegroundColor Gray
} catch {
    Write-Host " MISSING" -ForegroundColor Red
    Write-Host "  Supabase CLI is not installed" -ForegroundColor Yellow
    Write-Host "  Install with: scoop install supabase" -ForegroundColor Yellow
    Write-Host "  Or download from: https://github.com/supabase/cli/releases" -ForegroundColor Yellow
    $allGood = $false
}

# Check Node.js
Write-Host ""
Write-Host "Checking Node.js..." -NoNewline
try {
    $nodeVersion = node --version 2>&1
    Write-Host " OK" -ForegroundColor Green
    Write-Host "  Version: $nodeVersion" -ForegroundColor Gray
    
    # Check if version is >= 18
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 18) {
        Write-Host "  Warning: Node.js 18+ recommended (you have $nodeVersion)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " MISSING" -ForegroundColor Red
    Write-Host "  Node.js is not installed" -ForegroundColor Yellow
    Write-Host "  Download from: https://nodejs.org/" -ForegroundColor Yellow
    $allGood = $false
}

# Check npm
Write-Host ""
Write-Host "Checking npm..." -NoNewline
try {
    $npmVersion = npm --version 2>&1
    Write-Host " OK" -ForegroundColor Green
    Write-Host "  Version: $npmVersion" -ForegroundColor Gray
} catch {
    Write-Host " MISSING" -ForegroundColor Red
    Write-Host "  npm is not installed (should come with Node.js)" -ForegroundColor Yellow
    $allGood = $false
}

# Check Git (optional but recommended)
Write-Host ""
Write-Host "Checking Git..." -NoNewline
try {
    $gitVersion = git --version 2>&1
    Write-Host " OK" -ForegroundColor Green
    Write-Host "  Version: $gitVersion" -ForegroundColor Gray
} catch {
    Write-Host " MISSING" -ForegroundColor Yellow
    Write-Host "  Git is not installed (optional)" -ForegroundColor Gray
}

# Check Docker (required for Supabase)
Write-Host ""
Write-Host "Checking Docker..." -NoNewline
try {
    $dockerVersion = docker --version 2>&1
    Write-Host " OK" -ForegroundColor Green
    Write-Host "  Version: $dockerVersion" -ForegroundColor Gray
    
    # Check if Docker is running
    Write-Host "  Checking Docker daemon..." -NoNewline
    $dockerPs = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " NOT RUNNING" -ForegroundColor Red
        Write-Host "  Docker is installed but not running" -ForegroundColor Yellow
        Write-Host "  Start Docker Desktop and try again" -ForegroundColor Yellow
        $allGood = $false
    }
} catch {
    Write-Host " MISSING" -ForegroundColor Red
    Write-Host "  Docker is not installed (required for Supabase)" -ForegroundColor Yellow
    Write-Host "  Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    $allGood = $false
}

# Check if database folder exists
Write-Host ""
Write-Host "Checking project structure..." -NoNewline
if (Test-Path "database") {
    Write-Host " OK" -ForegroundColor Green
    Write-Host "  database/ folder found" -ForegroundColor Gray
} else {
    Write-Host " MISSING" -ForegroundColor Red
    Write-Host "  database/ folder not found" -ForegroundColor Yellow
    Write-Host "  Are you in the project root directory?" -ForegroundColor Yellow
    $allGood = $false
}

# Check if supabase folder exists
Write-Host "Checking Supabase config..." -NoNewline
if (Test-Path "supabase/config.toml") {
    Write-Host " OK" -ForegroundColor Green
    Write-Host "  supabase/config.toml found" -ForegroundColor Gray
} else {
    Write-Host " MISSING" -ForegroundColor Red
    Write-Host "  supabase/config.toml not found" -ForegroundColor Yellow
    Write-Host "  Run 'supabase init' to initialize" -ForegroundColor Yellow
    $allGood = $false
}

# Summary
Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "  All prerequisites met!" -ForegroundColor Green
    Write-Host "===================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "You are ready to run the setup script:" -ForegroundColor Green
    Write-Host "  .\setup-clean-db.ps1" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "  Some prerequisites are missing" -ForegroundColor Red
    Write-Host "===================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please install the missing prerequisites and try again." -ForegroundColor Yellow
    Write-Host ""
}
