#!/bin/bash

# run-seeds.sh - Run all database seeding scripts
# This script runs the seeding scripts in the correct order after db reset

set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
SEEDS_RUN=0
SEEDS_FAILED=0

# Helper functions
seed_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((SEEDS_RUN++))
}

seed_fail() {
    echo -e "${RED}✗${NC} $1"
    ((SEEDS_FAILED++))
}

seed_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Header
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Nepal Digital Tourism Platform - Database Seeding${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${RED}✗ Not in project root directory${NC}"
    echo "  Run this script from: Nepal_Digital_Tourism_Infrastructure_Documentation/"
    exit 1
fi

# Check if database is running
echo -e "${BLUE}Checking Database Connection${NC}"
if ! supabase status &> /dev/null; then
    seed_fail "Supabase is not running"
    echo "  Start with: supabase start"
    exit 1
fi
seed_pass "Supabase is running"
echo ""

# Check if Node.js is available
echo -e "${BLUE}Checking Dependencies${NC}"
if ! command -v node &> /dev/null; then
    seed_fail "Node.js not installed"
    exit 1
fi
seed_pass "Node.js is installed"

if ! command -v npm &> /dev/null; then
    seed_fail "npm not installed"
    exit 1
fi
seed_pass "npm is installed"
echo ""

# Install database dependencies if needed
echo -e "${BLUE}Setting Up Database Scripts${NC}"
if [ ! -d "database/node_modules" ]; then
    seed_info "Installing database dependencies..."
    cd database
    npm install --silent
    if [ $? -eq 0 ]; then
        seed_pass "Database dependencies installed"
    else
        seed_fail "Failed to install database dependencies"
        exit 1
    fi
    cd ..
else
    seed_pass "Database dependencies already installed"
fi
echo ""

# Run seeding scripts in order
echo -e "${BLUE}Running Seeding Scripts${NC}"
echo ""

SEED_SCRIPTS=(
    # Stage 1: Infrastructure Setup
    "database/scripts/seed-subscription-tiers.ts"
    "database/scripts/seed-business-types.ts"
    "database/scripts/seed-business-categories-direct.ts"
    "database/scripts/seed-marketplace-categories-direct.ts"
    
    # Stage 2: Admin Setup
    "database/scripts/seed-admin-users.ts"
    
    # Stage 3: Palika Tier Assignment
    "database/scripts/enroll-palikas-tiers.ts"
    
    # Stage 4: Palika User Creation
    "database/scripts/seed-marketplace-proper.ts"
    
    # Stage 5: Marketplace Product Creation
    "database/scripts/seed-marketplace-test-data.ts"
)

for script in "${SEED_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        echo -e "${BLUE}Running:${NC} $(basename $script)"
        cd database
        npx ts-node "../$script" 2>&1
        if [ $? -eq 0 ]; then
            seed_pass "$(basename $script) completed"
        else
            seed_fail "$(basename $script) failed"
        fi
        cd ..
        echo ""
    else
        seed_fail "$(basename $script) not found"
    fi
done

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Seeding Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Completed:${NC} $SEEDS_RUN"
echo -e "${RED}Failed:${NC}    $SEEDS_FAILED"
echo ""

if [ $SEEDS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All seeds completed successfully!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some seeds failed. Check the output above for details.${NC}"
    exit 1
fi
