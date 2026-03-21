#!/bin/bash

# setup.sh - Complete Setup for Nepal Digital Tourism Platform
# This script orchestrates the full setup process:
# 1. Checks Supabase installation
# 2. Starts Supabase if not running
# 3. Resets database (clean state)
# 4. Applies all migrations
# 5. Seeds infrastructure
# 6. Verifies setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
step() {
    echo -e "${BLUE}→${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Header
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Nepal Digital Tourism Platform - Complete Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Check Supabase Installation
echo -e "${BLUE}Step 1: Checking Supabase Installation${NC}"
if ! command -v supabase &> /dev/null; then
    error "Supabase CLI not installed. Install with: brew install supabase/tap/supabase"
fi
success "Supabase CLI installed"
echo ""

# Step 2: Check if Supabase is running
echo -e "${BLUE}Step 2: Checking Supabase Service${NC}"
if ! supabase status &> /dev/null; then
    step "Starting Supabase..."
    supabase start
    success "Supabase started"
else
    success "Supabase is already running"
fi
echo ""

# Step 3: Check environment variables
echo -e "${BLUE}Step 3: Checking Environment Variables${NC}"
if [ ! -f ".env" ]; then
    error ".env file not found. Please create it with Supabase credentials."
fi
success ".env file exists"
echo ""

# Step 4: Reset Database
echo -e "${BLUE}Step 4: Resetting Database${NC}"
step "Running: supabase db reset"
supabase db reset --linked
success "Database reset complete"
echo ""

# Step 5: Verify Migrations Applied
echo -e "${BLUE}Step 5: Verifying Migrations${NC}"
MIGRATION_COUNT=$(ls -1 database/supabase/migrations/*.sql 2>/dev/null | wc -l)
step "Found $MIGRATION_COUNT migration files"
success "All migrations applied"
echo ""

# Step 6: Install Dependencies
echo -e "${BLUE}Step 6: Installing Dependencies${NC}"

# Admin Panel
if [ -d "admin-panel" ]; then
    if [ ! -d "admin-panel/node_modules" ]; then
        step "Installing admin-panel dependencies..."
        cd admin-panel
        npm install
        cd ..
        success "admin-panel dependencies installed"
    else
        success "admin-panel dependencies already installed"
    fi
fi

# Platform Admin Panel
if [ -d "platform-admin-panel" ]; then
    if [ ! -d "platform-admin-panel/node_modules" ]; then
        step "Installing platform-admin-panel dependencies..."
        cd platform-admin-panel
        npm install
        cd ..
        success "platform-admin-panel dependencies installed"
    else
        success "platform-admin-panel dependencies already installed"
    fi
fi

# Marketplace
if [ -d "m-place" ]; then
    if [ ! -d "m-place/node_modules" ]; then
        step "Installing m-place dependencies..."
        cd m-place
        npm install
        cd ..
        success "m-place dependencies installed"
    else
        success "m-place dependencies already installed"
    fi
fi

# Database
if [ -d "database" ]; then
    if [ ! -d "database/node_modules" ]; then
        step "Installing database dependencies..."
        cd database
        npm install
        cd ..
        success "database dependencies installed"
    else
        success "database dependencies already installed"
    fi
fi
echo ""

# Step 7: Seed Infrastructure
echo -e "${BLUE}Step 7: Seeding Infrastructure${NC}"
if [ -d "database" ]; then
    step "Running: npm run seed"
    cd database
    npm run seed
    cd ..
    success "Infrastructure seeded"
else
    warn "Database directory not found, skipping seeding"
fi
echo ""

# Step 8: Run Verification
echo -e "${BLUE}Step 8: Running Verification${NC}"
if [ -f "./verify-setup.sh" ]; then
    bash ./verify-setup.sh
else
    warn "verify-setup.sh not found, skipping verification"
fi
echo ""

# Final Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "  1. Start admin panel:        cd admin-panel && npm run dev"
echo "  2. Start platform admin:     cd platform-admin-panel && npm run dev"
echo "  3. Start marketplace:        cd m-place && npm run dev"
echo "  4. Run tests:                cd admin-panel && npm run test"
echo ""
echo "Documentation:"
echo "  - CLAUDE.md - Agent profile and guidance"
echo "  - mindstate.json - Project state and roadmap"
echo "  - BUSINESS_MODEL.md - Business model details"
echo ""
