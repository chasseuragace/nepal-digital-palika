#!/bin/bash

# verify-setup.sh - Verify Nepal Digital Tourism Platform Setup Status
# This script confirms that the database and infrastructure are in the expected state

# Don't exit on error - we want to continue checking
set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((CHECKS_WARNING++))
}

check_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Header
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Nepal Digital Tourism Platform - Setup Verification${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# 1. Check Supabase Installation
echo -e "${BLUE}1. Checking Supabase Installation${NC}"
if command -v supabase &> /dev/null; then
    check_pass "Supabase CLI installed"
    SUPABASE_VERSION=$(supabase --version 2>/dev/null || echo "unknown")
    check_info "Version: $SUPABASE_VERSION"
else
    check_fail "Supabase CLI not installed"
    echo "  Install with: brew install supabase/tap/supabase"
fi
echo ""

# 2. Check Supabase Running
echo -e "${BLUE}2. Checking Supabase Service${NC}"
if command -v supabase &> /dev/null; then
    if supabase status &> /dev/null; then
        check_pass "Supabase is running"
    else
        check_warn "Supabase is not running"
        echo "  Start with: supabase start"
    fi
else
    check_warn "Cannot check Supabase status (CLI not installed)"
fi
echo ""

# 3. Check Environment Variables
echo -e "${BLUE}3. Checking Environment Variables${NC}"
if [ -f ".env" ]; then
    check_pass ".env file exists"
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env; then
        check_pass "NEXT_PUBLIC_SUPABASE_URL configured"
    else
        check_fail "NEXT_PUBLIC_SUPABASE_URL not configured"
    fi
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env; then
        check_pass "NEXT_PUBLIC_SUPABASE_ANON_KEY configured"
    else
        check_fail "NEXT_PUBLIC_SUPABASE_ANON_KEY not configured"
    fi
else
    check_fail ".env file not found"
fi
echo ""

# 4. Check Database Connection
echo -e "${BLUE}4. Checking Database Connection${NC}"
if command -v supabase &> /dev/null; then
    if supabase status &> /dev/null; then
        check_pass "Database connection available"
    else
        check_fail "Cannot connect to database"
    fi
else
    check_warn "Cannot verify database connection (Supabase CLI not available)"
fi
echo ""

# 5. Check Migrations
echo -e "${BLUE}5. Checking Database Migrations${NC}"
if [ -d "supabase/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
    check_pass "Migrations directory exists"
    check_info "Found $MIGRATION_COUNT migration files"
    
    if [ "$MIGRATION_COUNT" -ge 34 ]; then
        check_pass "Expected number of migrations present (34+)"
    else
        check_warn "Expected 34+ migrations, found $MIGRATION_COUNT"
    fi
else
    check_fail "Migrations directory not found"
fi
echo ""

# 6. Check Database Schema
echo -e "${BLUE}6. Checking Database Schema${NC}"
if [ -f "database/docs/schema.md" ]; then
    check_pass "Schema documentation exists"
else
    check_warn "Schema documentation not found"
fi
echo ""

# 7. Check Seeding Scripts
echo -e "${BLUE}7. Checking Seeding Scripts${NC}"
SEED_SCRIPTS=(
    "database/scripts/seed-infrastructure.ts"
    "database/scripts/seed-palika-tiers.ts"
    "database/scripts/seed-palika-admins.ts"
    "database/scripts/seed-users.ts"
    "database/scripts/seed-products.ts"
)

for script in "${SEED_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        check_pass "$(basename $script) exists"
    else
        check_warn "$(basename $script) not found"
    fi
done
echo ""

# 8. Check Admin Panel
echo -e "${BLUE}8. Checking Admin Panel${NC}"
if [ -d "admin-panel" ]; then
    check_pass "Admin panel directory exists"
    
    if [ -f "admin-panel/package.json" ]; then
        check_pass "Admin panel package.json exists"
    else
        check_fail "Admin panel package.json not found"
    fi
    
    if [ -d "admin-panel/node_modules" ]; then
        check_pass "Admin panel dependencies installed"
    else
        check_warn "Admin panel dependencies not installed (run: cd admin-panel && npm install)"
    fi
else
    check_fail "Admin panel directory not found"
fi
echo ""

# 9. Check Platform Admin Panel
echo -e "${BLUE}9. Checking Platform Admin Panel${NC}"
if [ -d "platform-admin-panel" ]; then
    check_pass "Platform admin panel directory exists"
    
    if [ -f "platform-admin-panel/package.json" ]; then
        check_pass "Platform admin panel package.json exists"
    else
        check_fail "Platform admin panel package.json not found"
    fi
    
    if [ -d "platform-admin-panel/node_modules" ]; then
        check_pass "Platform admin panel dependencies installed"
    else
        check_warn "Platform admin panel dependencies not installed (run: cd platform-admin-panel && npm install)"
    fi
else
    check_fail "Platform admin panel directory not found"
fi
echo ""

# 10. Check Marketplace
echo -e "${BLUE}10. Checking Marketplace (m-place)${NC}"
if [ -d "m-place" ]; then
    check_pass "Marketplace directory exists"
    
    if [ -f "m-place/package.json" ]; then
        check_pass "Marketplace package.json exists"
    else
        check_fail "Marketplace package.json not found"
    fi
    
    if [ -d "m-place/node_modules" ]; then
        check_pass "Marketplace dependencies installed"
    else
        check_warn "Marketplace dependencies not installed (run: cd m-place && npm install)"
    fi
else
    check_fail "Marketplace directory not found"
fi
echo ""

# 11. Check Test Suite
echo -e "${BLUE}11. Checking Test Suite${NC}"
if [ -d "admin-panel/services/__tests__" ]; then
    check_pass "Test directory exists"
    TEST_COUNT=$(find admin-panel/services/__tests__ -name "*.test.ts" 2>/dev/null | wc -l)
    check_info "Found $TEST_COUNT test files"
else
    check_warn "Test directory not found"
fi
echo ""

# 12. Check Documentation
echo -e "${BLUE}12. Checking Documentation${NC}"
DOC_FILES=(
    "CLAUDE.md"
    "mindstate.json"
    "BUSINESS_MODEL.md"
    "DATA_PREPARATION_SUMMARY.md"
    "SEEDING_STATUS.md"
)

for doc in "${DOC_FILES[@]}"; do
    if [ -f "$doc" ]; then
        check_pass "$doc exists"
    else
        check_warn "$doc not found"
    fi
done
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Verification Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Passed:${NC}  $CHECKS_PASSED"
echo -e "${YELLOW}Warnings:${NC} $CHECKS_WARNING"
echo -e "${RED}Failed:${NC}  $CHECKS_FAILED"
echo ""

# Overall status
if [ $CHECKS_FAILED -eq 0 ]; then
    if [ $CHECKS_WARNING -eq 0 ]; then
        echo -e "${GREEN}✓ All checks passed! Setup is complete.${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠ Setup is mostly complete, but some warnings need attention.${NC}"
        exit 0
    fi
else
    echo -e "${RED}✗ Setup has issues that need to be resolved.${NC}"
    exit 1
fi
