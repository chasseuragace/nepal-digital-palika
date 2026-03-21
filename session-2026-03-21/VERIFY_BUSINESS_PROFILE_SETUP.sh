#!/bin/bash

# ==========================================
# BUSINESS PROFILE SETUP VERIFICATION
# ==========================================
# This script verifies that all components
# for the business profile feature are set up

set -e

echo "🔍 Verifying Business Profile Setup..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for checks
PASSED=0
FAILED=0

# ==========================================
# 1. CHECK FILES EXIST
# ==========================================

echo "📁 Checking files..."

check_file() {
  local file=$1
  local description=$2
  
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $description"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $description - NOT FOUND: $file"
    ((FAILED++))
  fi
}

check_file "m-place/src/api/businesses.ts" "API functions"
check_file "m-place/src/types/index.ts" "Type definitions"
check_file "m-place/src/pages/BusinessProfile.tsx" "Business Profile view page"
check_file "m-place/src/pages/BusinessProfileEdit.tsx" "Business Profile edit page"
check_file "m-place/src/App.tsx" "Router configuration"

echo ""

# ==========================================
# 2. CHECK ROUTES IN APP.TSX
# ==========================================

echo "🛣️  Checking routes..."

if grep -q "BusinessProfile" m-place/src/App.tsx; then
  echo -e "${GREEN}✓${NC} BusinessProfile import found"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} BusinessProfile import NOT found"
  ((FAILED++))
fi

if grep -q "BusinessProfileEdit" m-place/src/App.tsx; then
  echo -e "${GREEN}✓${NC} BusinessProfileEdit import found"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} BusinessProfileEdit import NOT found"
  ((FAILED++))
fi

if grep -q "/business/:businessId" m-place/src/App.tsx; then
  echo -e "${GREEN}✓${NC} Business profile route found"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Business profile route NOT found"
  ((FAILED++))
fi

if grep -q "/business/:businessId/edit" m-place/src/App.tsx; then
  echo -e "${GREEN}✓${NC} Business profile edit route found"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Business profile edit route NOT found"
  ((FAILED++))
fi

echo ""

# ==========================================
# 3. CHECK API FUNCTIONS
# ==========================================

echo "🔧 Checking API functions..."

check_function() {
  local func=$1
  local file=$2
  
  if grep -q "export const $func" "$file"; then
    echo -e "${GREEN}✓${NC} $func function found"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $func function NOT found"
    ((FAILED++))
  fi
}

check_function "getBusinessById" "m-place/src/api/businesses.ts"
check_function "updateBusiness" "m-place/src/api/businesses.ts"
check_function "uploadBusinessImage" "m-place/src/api/businesses.ts"
check_function "deleteBusinessImage" "m-place/src/api/businesses.ts"

echo ""

# ==========================================
# 4. CHECK TYPE DEFINITIONS
# ==========================================

echo "📝 Checking type definitions..."

if grep -q "nameNe" m-place/src/types/index.ts; then
  echo -e "${GREEN}✓${NC} Business interface expanded with nameNe"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Business interface NOT expanded"
  ((FAILED++))
fi

if grep -q "operatingHours" m-place/src/types/index.ts; then
  echo -e "${GREEN}✓${NC} operatingHours field found"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} operatingHours field NOT found"
  ((FAILED++))
fi

if grep -q "facilities" m-place/src/types/index.ts; then
  echo -e "${GREEN}✓${NC} facilities field found"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} facilities field NOT found"
  ((FAILED++))
fi

echo ""

# ==========================================
# 5. CHECK DOCUMENTATION
# ==========================================

echo "📚 Checking documentation..."

check_file "session-2026-03-21/BUSINESS_PROFILE_IMPLEMENTATION.md" "Implementation guide"
check_file "session-2026-03-21/BUSINESS_PROFILE_IMPLEMENTATION_SUMMARY.md" "Implementation summary"
check_file "session-2026-03-21/BUSINESS_PROFILE_QUICK_START.md" "Quick start guide"
check_file "session-2026-03-21/SUPABASE_SETUP_SCRIPT.sql" "Supabase setup script"

echo ""

# ==========================================
# 6. SUMMARY
# ==========================================

echo "📊 Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "=========================================="

if [ $FAILED -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✓ All checks passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Run Supabase setup script in SQL editor"
  echo "2. Add navigation links to business profile"
  echo "3. Test locally with npm run dev"
  echo "4. Run test suite"
  echo "5. Deploy to production"
  echo ""
  exit 0
else
  echo ""
  echo -e "${RED}✗ Some checks failed. Please review above.${NC}"
  echo ""
  exit 1
fi
