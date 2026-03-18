#!/bin/bash

################################################################################
# Nepal Digital Tourism Platform - Infrastructure Deployment Script
################################################################################
# Purpose: Complete infrastructure seeding for first-time platform startup
# This script orchestrates all critical seeds in the correct order
#
# Usage:
#   ./deploy-infrastructure.sh              # Full infrastructure + demo content
#   ./deploy-infrastructure.sh --minimal    # Infrastructure only (no demo content)
#   ./deploy-infrastructure.sh --dev        # Full infrastructure + test data (dev only)
#
# Time estimates:
#   - Minimal:       5-7 minutes (geographic + tiers + categories + admins)
#   - Full:          10-15 minutes (+ content)
#   - Development:   15-25 minutes (+ test data)
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DB_SCRIPTS="$SCRIPT_DIR"

# Parse command line arguments
DEPLOY_MODE="full"  # full, minimal, dev
if [[ $# -gt 0 ]]; then
    case "$1" in
        --minimal)
            DEPLOY_MODE="minimal"
            ;;
        --dev)
            DEPLOY_MODE="dev"
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "  --minimal     Infrastructure only (no demo content)"
            echo "  --dev         Full infrastructure + test data"
            echo "  --help        Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
fi

################################################################################
# Utility Functions
################################################################################

log_section() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

log_step() {
    echo -e "${YELLOW}→${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

run_script() {
    local script_name="$1"
    local description="$2"
    local script_path="$DB_SCRIPTS/$script_name.ts"

    if [[ ! -f "$script_path" ]]; then
        log_error "Script not found: $script_path"
        return 1
    fi

    log_step "$description"
    if npx tsx "$script_path"; then
        log_success "$description completed"
        return 0
    else
        log_error "$description failed"
        return 1
    fi
}

check_env() {
    if [[ -z "$SUPABASE_URL" ]] || [[ -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
        log_error "Missing required environment variables:"
        echo "  - SUPABASE_URL"
        echo "  - SUPABASE_SERVICE_ROLE_KEY"
        echo ""
        echo "Please set these in your .env file or as environment variables"
        exit 1
    fi
    log_success "Environment variables loaded"
}

check_node() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    log_success "Node.js and npm found"
}

################################################################################
# Main Deployment Flow
################################################################################

log_section "🚀 NEPAL DIGITAL TOURISM PLATFORM - INFRASTRUCTURE DEPLOYMENT"
echo ""
echo "Deployment Mode: $DEPLOY_MODE"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Pre-flight checks
log_section "🔍 PRE-FLIGHT CHECKS"
check_node
check_env

# Load environment variables from .env if not already set
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    log_step "Loading environment from .env file"
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
    log_success "Environment loaded"
fi

# Verify Supabase connection
log_step "Testing Supabase connection..."
if ! npx tsx -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('provinces').select('count').limit(1).then(({error}) => {
  process.exit(error ? 1 : 0);
});
" 2>/dev/null; then
    log_error "Cannot connect to Supabase"
    echo "   Please verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi
log_success "Supabase connection verified"

################################################################################
# PHASE 1: GEOGRAPHIC DATA (Foundation - No Dependencies)
################################################################################

log_section "📍 PHASE 1: GEOGRAPHIC DATA (Provinces, Districts, Palikas)"
echo "This phase seeds the foundational geographic hierarchy"
echo "Total: 7 provinces, 77 districts, 753 palikas"
echo ""

if run_script "seed-database" "Seeding geographic data (provinces, districts, palikas)"; then
    :
else
    log_error "Geographic data seeding failed. Cannot continue."
    exit 1
fi

################################################################################
# PHASE 2: SUBSCRIPTION TIERS & CATEGORIES
################################################################################

log_section "🎯 PHASE 2: SUBSCRIPTION TIERS & CATEGORIES"
echo "This phase seeds platform feature tiers and product categories"
echo ""

run_script "seed-subscription-tiers" "Seeding subscription tiers (3 tiers + 27 features)" || {
    log_error "Tier seeding failed"
    exit 1
}

run_script "seed-business-categories-direct" "Seeding business categories (8 types)" || {
    log_error "Business category seeding failed"
    exit 1
}

run_script "seed-marketplace-categories-direct" "Seeding marketplace categories (26 products, tier-gated)" || {
    log_error "Marketplace category seeding failed"
    exit 1
}

################################################################################
# PHASE 3: PLATFORM ADMINISTRATION
################################################################################

log_section "🔐 PHASE 3: PLATFORM ADMINISTRATION"
echo "This phase creates system admin users"
echo ""

run_script "seed-admin-users" "Creating admin users (super_admin, palika_admin, moderator)" || {
    log_error "Admin user seeding failed"
    exit 1
}

################################################################################
# PHASE 4: PALIKA TIER ENROLLMENT
################################################################################

log_section "📊 PHASE 4: PALIKA TIER ENROLLMENT"
echo "This phase enrolls palikas into subscription tiers"
echo "Note: Enrolls 4 sample palikas (customize as needed)"
echo ""

run_script "enroll-palikas-tiers" "Enrolling palikas into subscription tiers" || {
    log_error "Palika tier enrollment failed"
    exit 1
}

################################################################################
# PHASE 5: DEMO CONTENT (Optional - Recommended)
################################################################################

if [[ "$DEPLOY_MODE" == "full" ]] || [[ "$DEPLOY_MODE" == "dev" ]]; then
    log_section "📝 PHASE 5: DEMO CONTENT"
    echo "This phase seeds tourism content (heritage sites, events, blog posts)"
    echo "Status: Optional but recommended for platform visibility"
    echo ""

    if run_script "seed-content" "Seeding tourism content (8 heritage + 8 events + 6 blogs)"; then
        :
    else
        log_error "Content seeding failed (continuing with minimal setup)"
    fi
fi

################################################################################
# PHASE 6: TEST DATA (Development Only)
################################################################################

if [[ "$DEPLOY_MODE" == "dev" ]]; then
    log_section "🧪 PHASE 6: TEST DATA (DEVELOPMENT ONLY)"
    echo "⚠️  This phase creates test data for QA/development"
    echo "    DO NOT RUN IN PRODUCTION"
    echo ""

    read -p "Continue with test data seeding? (yes/no): " -r
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        run_script "seed-marketplace-test-data" "Seeding test data (8 users, 8 businesses, 16 products, 15 comments)" || {
            log_error "Test data seeding failed (continuing)"
        }
    else
        log_step "Test data seeding skipped"
    fi
fi

################################################################################
# VERIFICATION & SUMMARY
################################################################################

log_section "✅ DEPLOYMENT VERIFICATION"
echo ""
echo "Running verification tests..."
echo ""

if command -v npm &> /dev/null && grep -q '"test:verify"' "$PROJECT_ROOT/package.json" 2>/dev/null; then
    log_step "Running verification script..."
    if npm run test:verify --prefix "$PROJECT_ROOT" 2>/dev/null; then
        log_success "Verification tests passed"
    else
        log_error "Verification tests failed (check logs above)"
    fi
fi

################################################################################
# FINAL SUMMARY
################################################################################

log_section "🎉 INFRASTRUCTURE DEPLOYMENT COMPLETE"
echo ""
echo "Deployment Summary:"
echo "  ✅ Deployment Mode: $DEPLOY_MODE"
echo "  ✅ Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

if [[ "$DEPLOY_MODE" == "minimal" ]]; then
    echo "Infrastructure Status (Minimal):"
    echo "  ✅ 7 Provinces"
    echo "  ✅ 77 Districts"
    echo "  ✅ 753 Palikas"
    echo "  ✅ 3 Subscription Tiers"
    echo "  ✅ 27 Features (tier-mapped)"
    echo "  ✅ 8 Business Categories"
    echo "  ✅ 26 Marketplace Categories"
    echo "  ✅ 3 Admin Users"
    echo "  ✅ 4 Palikas enrolled in tiers"
    echo ""
    echo "Ready for API development ✨"
elif [[ "$DEPLOY_MODE" == "full" ]]; then
    echo "Infrastructure Status (Full):"
    echo "  ✅ All minimal items"
    echo "  ✅ 8 Heritage Sites"
    echo "  ✅ 8 Events/Festivals"
    echo "  ✅ 6 Blog Posts"
    echo ""
    echo "Ready for demonstration and API development ✨"
elif [[ "$DEPLOY_MODE" == "dev" ]]; then
    echo "Infrastructure Status (Development):"
    echo "  ✅ All full items"
    echo "  ✅ 8 Test Users"
    echo "  ✅ 8 Test Businesses"
    echo "  ✅ 16 Test Products"
    echo "  ✅ 15 Test Comments"
    echo ""
    echo "Ready for QA testing and development ✨"
fi

echo ""
echo "Next Steps:"
if [[ "$DEPLOY_MODE" == "minimal" ]]; then
    echo "  1. Review SEEDING_STRATEGY.md for details"
    echo "  2. Start API development"
    echo "  3. Run 'npm run seed:content' to add demo content later"
fi
if [[ "$DEPLOY_MODE" == "full" ]]; then
    echo "  1. Review MARKETPLACE_READY_FOR_API.md"
    echo "  2. Begin API implementation"
    echo "  3. Optional: Run 'npm run seed:marketplace-test-data' for QA"
fi
if [[ "$DEPLOY_MODE" == "dev" ]]; then
    echo "  1. Run test suite: npm run test:rls-policies"
    echo "  2. Review test data in database"
    echo "  3. Begin API/UI development with test data"
fi

echo ""
echo -e "${GREEN}✨ Platform infrastructure ready!${NC}"
echo ""
