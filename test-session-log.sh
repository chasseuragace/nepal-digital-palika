#!/bin/bash

# Test Session Log Script
# Resets DB, seeds data, runs all tests, and logs everything

LOG_DIR="test-logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SESSION_LOG="$LOG_DIR/session_${TIMESTAMP}.log"

# Create log directory
mkdir -p $LOG_DIR

echo "=== TEST SESSION STARTED: $(date) ===" | tee $SESSION_LOG
echo "Logging to: $SESSION_LOG" | tee -a $SESSION_LOG
echo "" | tee -a $SESSION_LOG

# Step 1: Reset Supabase Database
echo "=== STEP 1: RESETTING SUPABASE DATABASE ===" | tee -a $SESSION_LOG
cd supabase
supabase db reset 2>&1 | tee -a ../$SESSION_LOG
DB_RESET_STATUS=$?
cd ..
echo "Database reset status: $DB_RESET_STATUS" | tee -a $SESSION_LOG
echo "" | tee -a $SESSION_LOG

# Step 2: Seed Database
echo "=== STEP 2: SEEDING DATABASE ===" | tee -a $SESSION_LOG
cd database
npm run seed 2>&1 | tee -a ../$SESSION_LOG
SEED_STATUS=$?
cd ..
echo "Database seed status: $SEED_STATUS" | tee -a $SESSION_LOG
echo "" | tee -a $SESSION_LOG

# Step 3: Run Property-Based Tests
echo "=== STEP 3: RUNNING PROPERTY-BASED TESTS ===" | tee -a $SESSION_LOG
cd admin-panel
npm test -- --run services/__tests__/properties/ --reporter=verbose 2>&1 | tee -a ../$SESSION_LOG
PROPERTY_TESTS_STATUS=$?
cd ..
echo "Property tests status: $PROPERTY_TESTS_STATUS" | tee -a $SESSION_LOG
echo "" | tee -a $SESSION_LOG

# Step 4: Run Integration Tests
echo "=== STEP 4: RUNNING INTEGRATION TESTS ===" | tee -a $SESSION_LOG
cd admin-panel
npm test -- --run services/__tests__/integration/ --reporter=verbose 2>&1 | tee -a ../$SESSION_LOG
INTEGRATION_TESTS_STATUS=$?
cd ..
echo "Integration tests status: $INTEGRATION_TESTS_STATUS" | tee -a $SESSION_LOG
echo "" | tee -a $SESSION_LOG

# Step 5: Run Unit Tests
echo "=== STEP 5: RUNNING UNIT TESTS ===" | tee -a $SESSION_LOG
cd admin-panel
npm test -- --run services/__tests__/unit/ --reporter=verbose 2>&1 | tee -a ../$SESSION_LOG
UNIT_TESTS_STATUS=$?
cd ..
echo "Unit tests status: $UNIT_TESTS_STATUS" | tee -a $SESSION_LOG
echo "" | tee -a $SESSION_LOG

# Step 6: Run All Tests Summary
echo "=== STEP 6: RUNNING ALL TESTS SUMMARY ===" | tee -a $SESSION_LOG
cd admin-panel
npm test -- --run --reporter=verbose 2>&1 | tee -a ../$SESSION_LOG
ALL_TESTS_STATUS=$?
cd ..
echo "All tests status: $ALL_TESTS_STATUS" | tee -a $SESSION_LOG
echo "" | tee -a $SESSION_LOG

# Summary
echo "=== TEST SESSION SUMMARY ===" | tee -a $SESSION_LOG
echo "Session completed: $(date)" | tee -a $SESSION_LOG
echo "Database reset: $([[ $DB_RESET_STATUS -eq 0 ]] && echo "SUCCESS" || echo "FAILED")" | tee -a $SESSION_LOG
echo "Database seed: $([[ $SEED_STATUS -eq 0 ]] && echo "SUCCESS" || echo "FAILED")" | tee -a $SESSION_LOG
echo "Property tests: $([[ $PROPERTY_TESTS_STATUS -eq 0 ]] && echo "SUCCESS" || echo "FAILED")" | tee -a $SESSION_LOG
echo "Integration tests: $([[ $INTEGRATION_TESTS_STATUS -eq 0 ]] && echo "SUCCESS" || echo "FAILED")" | tee -a $SESSION_LOG
echo "Unit tests: $([[ $UNIT_TESTS_STATUS -eq 0 ]] && echo "SUCCESS" || echo "FAILED")" | tee -a $SESSION_LOG
echo "All tests: $([[ $ALL_TESTS_STATUS -eq 0 ]] && echo "SUCCESS" || echo "FAILED")" | tee -a $SESSION_LOG
echo "" | tee -a $SESSION_LOG

# Create a summary file for easy reference
SUMMARY_FILE="$LOG_DIR/latest_summary.txt"
echo "=== LATEST TEST SESSION SUMMARY ===" > $SUMMARY_FILE
echo "Session: $TIMESTAMP" >> $SUMMARY_FILE
echo "Database reset: $([[ $DB_RESET_STATUS -eq 0 ]] && echo "✅ SUCCESS" || echo "❌ FAILED")" >> $SUMMARY_FILE
echo "Database seed: $([[ $SEED_STATUS -eq 0 ]] && echo "✅ SUCCESS" || echo "❌ FAILED")" >> $SUMMARY_FILE
echo "Property tests: $([[ $PROPERTY_TESTS_STATUS -eq 0 ]] && echo "✅ SUCCESS" || echo "❌ FAILED")" >> $SUMMARY_FILE
echo "Integration tests: $([[ $INTEGRATION_TESTS_STATUS -eq 0 ]] && echo "✅ SUCCESS" || echo "❌ FAILED")" >> $SUMMARY_FILE
echo "Unit tests: $([[ $UNIT_TESTS_STATUS -eq 0 ]] && echo "✅ SUCCESS" || echo "❌ FAILED")" >> $SUMMARY_FILE
echo "All tests: $([[ $ALL_TESTS_STATUS -eq 0 ]] && echo "✅ SUCCESS" || echo "❌ FAILED")" >> $SUMMARY_FILE
echo "" >> $SUMMARY_FILE
echo "Full log: $SESSION_LOG" >> $SUMMARY_FILE

echo "=== SESSION COMPLETE ===" | tee -a $SESSION_LOG
echo "Summary saved to: $SUMMARY_FILE" | tee -a $SESSION_LOG
echo "Full log saved to: $SESSION_LOG" | tee -a $SESSION_LOG

# Display summary
cat $SUMMARY_FILE