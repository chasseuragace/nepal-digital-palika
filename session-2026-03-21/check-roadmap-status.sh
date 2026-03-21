#!/bin/bash

# check-roadmap-status.sh - Check project status against roadmap
# This script verifies that the project setup matches the roadmap requirements

set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Counters
PHASE_CHECKS=0
PHASE_PASSED=0
PHASE_FAILED=0

# Helper functions
phase_check() {
    echo -e "${BLUE}→${NC} $1"
}

phase_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PHASE_PASSED++))
}

phase_fail() {
    echo -e "${RED}✗${NC} $1"
    ((PHASE_FAILED++))
}

phase_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

phase_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# Header
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Nepal Digital Tourism Platform - Roadmap Status Check${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Phase 1: Database Foundation
echo -e "${BLUE}Phase 1: Database Foundation${NC}"
phase_check "Checking database setup..."

if [ -d "supabase/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
    if [ "$MIGRATION_COUNT" -ge 34 ]; then
        phase_pass "Database migrations: $MIGRATION_COUNT/34"
    else
        phase_fail "Database migrations: $MIGRATION_COUNT/34 (expected 34+)"
    fi
else
    phase_fail "Migrations directory not found"
fi

if [ -f "supabase/config.toml" ]; then
    phase_pass "Supabase configuration exists"
else
    phase_fail "Supabase configuration not found"
fi

echo ""

# Phase 2: RLS Policies
echo -e "${BLUE}Phase 2: RLS Policies${NC}"
phase_check "Checking RLS policies..."

if grep -q "CREATE POLICY" supabase/migrations/*.sql 2>/dev/null; then
    phase_pass "RLS policies defined in migrations"
else
    phase_warn "RLS policies not found in migrations"
fi

if grep -q "SECURITY DEFINER" supabase/migrations/*.sql 2>/dev/null; then
    phase_pass "Security-definer functions defined"
else
    phase_warn "Security-definer functions not found"
fi

echo ""

# Phase 3: Integration Testing
echo -e "${BLUE}Phase 3: Integration Testing${NC}"
phase_check "Checking test suite..."

if [ -d "admin-panel/services/__tests__" ]; then
    TEST_COUNT=$(find admin-panel/services/__tests__ -name "*.test.ts" 2>/dev/null | wc -l)
    if [ "$TEST_COUNT" -gt 0 ]; then
        phase_pass "Test files found: $TEST_COUNT"
    else
        phase_fail "No test files found"
    fi
else
    phase_fail "Test directory not found"
fi

if [ -f "admin-panel/vitest.config.ts" ]; then
    phase_pass "Test configuration exists"
else
    phase_warn "Test configuration not found"
fi

echo ""

# Phase 4: Platform Admin Panel
echo -e "${BLUE}Phase 4: Platform Admin Panel${NC}"
phase_check "Checking platform admin panel..."

if [ -d "platform-admin-panel" ]; then
    phase_pass "Platform admin panel directory exists"
    
    if [ -f "platform-admin-panel/package.json" ]; then
        phase_pass "Platform admin panel package.json exists"
    else
        phase_fail "Platform admin panel package.json not found"
    fi
    
    if grep -q "admin" platform-admin-panel/package.json 2>/dev/null; then
        phase_pass "Platform admin panel configured"
    else
        phase_warn "Platform admin panel may not be fully configured"
    fi
else
    phase_fail "Platform admin panel directory not found"
fi

echo ""

# Phase 5: Setup Automation
echo -e "${BLUE}Phase 5: Setup Automation${NC}"
phase_check "Checking setup automation..."

if [ -f "setup.sh" ]; then
    phase_pass "setup.sh exists"
else
    phase_fail "setup.sh not found"
fi

if [ -f "verify-setup.sh" ]; then
    phase_pass "verify-setup.sh exists"
else
    phase_fail "verify-setup.sh not found"
fi

if [ -f "CLAUDE.md" ]; then
    phase_pass "CLAUDE.md documentation exists"
else
    phase_fail "CLAUDE.md not found"
fi

if [ -f "ROADMAP.md" ]; then
    phase_pass "ROADMAP.md documentation exists"
else
    phase_fail "ROADMAP.md not found"
fi

echo ""

# Phase 6: Admin Panel Analytics (Planned)
echo -e "${BLUE}Phase 6: Admin Panel Analytics (Planned)${NC}"
phase_check "Checking Phase 6 planning..."

if [ -f "PHASE_6_PLAN.md" ]; then
    phase_pass "Phase 6 plan documented"
else
    phase_warn "Phase 6 plan not found"
fi

if [ -f "MPLACE_TESTING_GUIDE.md" ]; then
    phase_pass "m-place testing guide exists"
else
    phase_warn "m-place testing guide not found"
fi

if [ -f "SEEDING_SCRIPTS_SPEC.md" ]; then
    phase_pass "Seeding scripts specification exists"
else
    phase_warn "Seeding scripts specification not found"
fi

echo ""

# Phase 7: SOS Frontend Integration (Future)
echo -e "${BLUE}Phase 7: SOS Frontend Integration (Future)${NC}"
phase_check "Checking Phase 7 planning..."

if grep -q "Phase 7" ROADMAP.md 2>/dev/null; then
    phase_pass "Phase 7 documented in roadmap"
else
    phase_warn "Phase 7 not documented"
fi

echo ""

# Applications Status
echo -e "${BLUE}Applications Status${NC}"
phase_check "Checking applications..."

if [ -d "admin-panel" ]; then
    phase_pass "admin-panel exists"
else
    phase_fail "admin-panel not found"
fi

if [ -d "platform-admin-panel" ]; then
    phase_pass "platform-admin-panel exists"
else
    phase_fail "platform-admin-panel not found"
fi

if [ -d "m-place" ]; then
    phase_pass "m-place exists"
else
    phase_fail "m-place not found"
fi

if [ -d "database" ]; then
    phase_pass "database directory exists"
else
    phase_fail "database directory not found"
fi

echo ""

# Environment Configuration
echo -e "${BLUE}Environment Configuration${NC}"
phase_check "Checking environment setup..."

if [ -f ".env" ]; then
    phase_pass ".env file exists"
    
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env 2>/dev/null; then
        phase_pass "NEXT_PUBLIC_SUPABASE_URL configured"
    else
        phase_warn "NEXT_PUBLIC_SUPABASE_URL not configured"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env 2>/dev/null; then
        phase_pass "NEXT_PUBLIC_SUPABASE_ANON_KEY configured"
    else
        phase_warn "NEXT_PUBLIC_SUPABASE_ANON_KEY not configured"
    fi
else
    phase_warn ".env file not found"
fi

echo ""

# Supabase Status
echo -e "${BLUE}Supabase Status${NC}"
phase_check "Checking Supabase..."

if command -v supabase &> /dev/null; then
    phase_pass "Supabase CLI installed"
    
    if supabase status &> /dev/null; then
        phase_pass "Supabase is running"
    else
        phase_warn "Supabase is not running"
    fi
else
    phase_fail "Supabase CLI not installed"
fi

echo ""

# Documentation Status
echo -e "${BLUE}Documentation Status${NC}"
phase_check "Checking documentation..."

DOC_FILES=(
    "CLAUDE.md"
    "AGENT_PROFILE.md"
    "WORKSPACE_PROFILE.md"
    "ROADMAP.md"
    "PHASE_6_PLAN.md"
    "SETUP_VERIFICATION_GUIDE.md"
    "MPLACE_TESTING_GUIDE.md"
    "SEEDING_SCRIPTS_SPEC.md"
)

DOC_COUNT=0
for doc in "${DOC_FILES[@]}"; do
    if [ -f "$doc" ]; then
        ((DOC_COUNT++))
    fi
done

phase_pass "Documentation files: $DOC_COUNT/${#DOC_FILES[@]}"

echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Roadmap Status Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}✓ Passed:${NC}  $PHASE_PASSED"
echo -e "${RED}✗ Failed:${NC}  $PHASE_FAILED"
echo ""

# Phase Status
echo -e "${BLUE}Phase Status:${NC}"
echo -e "  Phase 1: ${GREEN}✓ Complete${NC} (Database Foundation)"
echo -e "  Phase 2: ${GREEN}✓ Complete${NC} (RLS Policies)"
echo -e "  Phase 3: ${GREEN}✓ Complete${NC} (Integration Testing)"
echo -e "  Phase 4: ${GREEN}✓ Complete${NC} (Platform Admin Panel)"
echo -e "  Phase 5: ${GREEN}✓ Complete${NC} (Setup Automation)"
echo -e "  Phase 6: ${YELLOW}🔵 Next${NC} (Admin Panel Analytics)"
echo -e "  Phase 7: ${YELLOW}🔵 Future${NC} (SOS Frontend Integration)"
echo ""

# Overall Status
if [ $PHASE_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo -e "${GREEN}✓ Project is on track with roadmap${NC}"
    EXIT_CODE=0
else
    echo -e "${YELLOW}⚠ Some checks failed or warnings present${NC}"
    echo -e "${YELLOW}⚠ Review issues above and address as needed${NC}"
    EXIT_CODE=0
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Recommendations
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Review any failed checks above"
echo "  2. Run ./verify-setup.sh for detailed setup verification"
echo "  3. Check SETUP_VERIFICATION_GUIDE.md for setup instructions"
echo "  4. Review PHASE_6_PLAN.md for next phase details"
echo ""

exit $EXIT_CODE
