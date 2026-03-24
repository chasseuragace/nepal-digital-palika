#!/bin/bash

# setup-clean-db.sh - Complete Database Setup Script
# This script handles: clean DB, infrastructure seeding, admin users, and marketplace data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Header
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Nepal Digital Tourism - Complete Database Setup${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Check Prerequisites
echo -e "${BLUE}[1/6] Checking Prerequisites${NC}"
echo ""

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}✗ Supabase CLI not installed${NC}"
    echo ""
    echo "Install Supabase CLI:"
    echo "  Windows (PowerShell): scoop install supabase"
    echo "  Or download from: https://github.com/supabase/cli/releases"
    echo ""
    exit 1
fi
echo -e "${GREEN}✓ Supabase CLI installed${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js installed ($(node --version))${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm installed ($(npm --version))${NC}"
echo ""

# Step 2: Start Supabase
echo -e "${BLUE}[2/6] Starting Supabase${NC}"
echo ""

if ! supabase status &> /dev/null; then
    echo "Starting Supabase local instance..."
    supabase start
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Supabase started successfully${NC}"
    else
        echo -e "${RED}✗ Failed to start Supabase${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Supabase is already running${NC}"
fi
echo ""

# Step 3: Reset Database (Clean Slate)
echo -e "${BLUE}[3/6] Resetting Database (Clean Slate)${NC}"
echo ""
echo -e "${YELLOW}⚠ This will delete all existing data and apply migrations${NC}"
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Resetting database..."
    supabase db reset
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Database reset complete${NC}"
        echo -e "${GREEN}✓ All migrations applied${NC}"
    else
        echo -e "${RED}✗ Database reset failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ Database reset skipped${NC}"
fi
echo ""

# Step 4: Install Database Dependencies
echo -e "${BLUE}[4/6] Installing Database Dependencies${NC}"
echo ""

cd database
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${RED}✗ Failed to install dependencies${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi
cd ..
echo ""

# Step 5: Run Seeding Pipeline
echo -e "${BLUE}[5/6] Running Seeding Pipeline${NC}"
echo ""

# Check if run-seeds.sh exists
if [ -f "session-2026-03-21/run-seeds.sh" ]; then
    echo "Running comprehensive seeding pipeline..."
    bash session-2026-03-21/run-seeds.sh
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ All seeds completed successfully${NC}"
    else
        echo -e "${YELLOW}⚠ Some seeds may have failed (check output above)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ run-seeds.sh not found, running individual scripts...${NC}"
    
    cd database
    
    # Stage 1: Infrastructure
    echo -e "${CYAN}Stage 1: Infrastructure Setup${NC}"
    npx ts-node scripts/seed-subscription-tiers.ts
    npx ts-node scripts/seed-business-types.ts
    npx ts-node scripts/seed-business-categories-direct.ts
    npx ts-node scripts/seed-marketplace-categories-direct.ts
    
    # Stage 2: Admin Users
    echo -e "${CYAN}Stage 2: Admin Users${NC}"
    npx ts-node scripts/seed-admin-users.ts
    
    # Stage 3: Tier Assignment
    echo -e "${CYAN}Stage 3: Palika Tier Assignment${NC}"
    npx ts-node scripts/enroll-palikas-tiers.ts
    
    # Stage 4: User Creation
    echo -e "${CYAN}Stage 4: User & Business Creation${NC}"
    npx ts-node scripts/seed-marketplace-proper.ts
    
    # Stage 5: Products
    echo -e "${CYAN}Stage 5: Marketplace Products${NC}"
    npx ts-node scripts/seed-marketplace-test-data.ts
    
    cd ..
fi
echo ""

# Step 6: Verify Setup
echo -e "${BLUE}[6/6] Verifying Setup${NC}"
echo ""

cd database
if [ -f "scripts/quick-table-check.ts" ]; then
    npx ts-node scripts/quick-table-check.ts
fi
cd ..
echo ""

# Final Summary
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Setup Complete!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✓ Database is clean and seeded${NC}"
echo ""
echo -e "${BLUE}What was created:${NC}"
echo "  • Infrastructure: Tiers, Features, Categories"
echo "  • Admin Users: Super Admin, Palika Admins, Moderators"
echo "  • Test Data: Users, Businesses, Products"
echo ""
echo -e "${BLUE}Test Credentials:${NC}"
echo "  Super Admin:"
echo "    Email: superadmin@nepaltourism.dev"
echo "    Password: SuperSecurePass123!"
echo ""
echo "  Kathmandu Admin:"
echo "    Email: palika.admin@kathmandu.gov.np"
echo "    Password: KathmanduAdmin456!"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Start admin panel: cd admin-panel && npm run dev"
echo "  2. Access at: http://localhost:3000"
echo "  3. Login with credentials above"
echo ""
echo -e "${BLUE}Supabase Studio:${NC}"
echo "  URL: http://127.0.0.1:54323"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""
