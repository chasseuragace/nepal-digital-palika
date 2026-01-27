#!/bin/bash

# Documentation Cleanup Script
# Moves outdated/duplicate files to archive and organizes current documentation

echo "=== DOCUMENTATION CLEANUP STARTED ==="

# Create archive directories
mkdir -p archive/old-summaries
mkdir -p archive/old-test-reports
mkdir -p archive/old-analysis

# Move outdated summary files
echo "Moving outdated summary files..."
mv ANALYSIS_SUMMARY.md archive/old-summaries/ 2>/dev/null
mv COMPREHENSIVE_PROJECT_SUMMARY.md archive/old-summaries/ 2>/dev/null
mv CURRENT_STATUS.md archive/old-summaries/ 2>/dev/null
mv FINAL_SUMMARY.txt archive/old-summaries/ 2>/dev/null
mv SESSION_SUMMARY.md archive/old-summaries/ 2>/dev/null
mv REORGANIZATION_SUMMARY.md archive/old-summaries/ 2>/dev/null

# Move outdated test reports
echo "Moving outdated test reports..."
mv FAILING_TESTS_LOG.txt archive/old-test-reports/ 2>/dev/null
mv TEST_EXECUTION_SUMMARY.md archive/old-test-reports/ 2>/dev/null
mv TEST_FAILURES.md archive/old-test-reports/ 2>/dev/null
mv TEST_REPORT_INDEX.md archive/old-test-reports/ 2>/dev/null
mv TEST_RESULTS.md archive/old-test-reports/ 2>/dev/null
mv LOCAL_SUPABASE_TESTS_PASSING.md archive/old-test-reports/ 2>/dev/null

# Move outdated analysis files
echo "Moving outdated analysis files..."
mv BACKWARD_COMPATIBILITY_VS_PERMISSION_ENFORCEMENT.md archive/old-analysis/ 2>/dev/null
mv PERMISSION_ENFORCEMENT_ANALYSIS.md archive/old-analysis/ 2>/dev/null
mv RLS_DEBUGGING_GUIDE.md archive/old-analysis/ 2>/dev/null
mv RLS_FAILURES_DETAILED.md archive/old-analysis/ 2>/dev/null
mv RLS_FIX_SUMMARY.md archive/old-analysis/ 2>/dev/null

# Move outdated setup/migration files
echo "Moving outdated setup files..."
mv ADMIN_PANEL_SETUP_COMPLETE.md archive/old-summaries/ 2>/dev/null
mv PLATFORM_ADMIN_PANEL_CREATED.md archive/old-summaries/ 2>/dev/null
mv LOCAL_SUPABASE_INTEGRATION.md archive/old-summaries/ 2>/dev/null
mv SETUP_LOCAL_SUPABASE.md archive/old-summaries/ 2>/dev/null
mv MIGRATION_GUIDE.md archive/old-summaries/ 2>/dev/null
mv REORGANIZATION_COMPLETE.txt archive/old-summaries/ 2>/dev/null

# Move duplicate files
echo "Moving duplicate files..."
mv QUICK_REFERENCE.txt archive/old-summaries/ 2>/dev/null  # Keep .md version
mv README_PERMISSION_ENFORCEMENT.md archive/old-analysis/ 2>/dev/null

# Keep these current files:
# - README.md (main project readme)
# - TEST_SESSION_ANALYSIS.md (current test analysis)
# - QUICK_REFERENCE.md (current reference)
# - DELIVERABLES.md (project deliverables)
# - IMPLEMENTATION_PLAN.md (current plan)
# - INDEX.md (project index)
# - STRUCTURE.md (project structure)
# - ARCHITECTURE_DIAGRAM.md (architecture docs)

echo ""
echo "=== CLEANUP SUMMARY ==="
echo "✅ Moved outdated summary files to archive/old-summaries/"
echo "✅ Moved outdated test reports to archive/old-test-reports/"
echo "✅ Moved outdated analysis files to archive/old-analysis/"
echo ""
echo "📁 Current documentation structure:"
echo "   README.md - Main project documentation"
echo "   TEST_SESSION_ANALYSIS.md - Latest test analysis"
echo "   QUICK_REFERENCE.md - Current quick reference"
echo "   DELIVERABLES.md - Project deliverables"
echo "   IMPLEMENTATION_PLAN.md - Current implementation plan"
echo "   INDEX.md - Project index"
echo "   STRUCTURE.md - Project structure"
echo "   ARCHITECTURE_DIAGRAM.md - Architecture documentation"
echo ""
echo "📂 Archived files moved to:"
echo "   archive/old-summaries/ - Old project summaries"
echo "   archive/old-test-reports/ - Old test reports"
echo "   archive/old-analysis/ - Old analysis documents"
echo ""
echo "=== DOCUMENTATION CLEANUP COMPLETE ==="