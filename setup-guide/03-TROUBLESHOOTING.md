# Troubleshooting Guide

Common issues and their solutions.

## Supabase Issues

### Supabase CLI Not Found

**Error:**
```
supabase: The term 'supabase' is not recognized
```

**Solution:**
```powershell
# Install Scoop first
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

---

### Supabase Won't Start

**Error:**
```
Error starting Supabase
```

**Solutions:**

1. **Check Docker is running:**
```powershell
docker ps
```
If Docker isn't running, start Docker Desktop.

2. **Stop and restart Supabase:**
```powershell
supabase stop
supabase start
```

3. **Check for port conflicts:**
```powershell
# Check if ports are in use
netstat -ano | findstr :54321
netstat -ano | findstr :54323
```

4. **Reset Supabase:**
```powershell
supabase stop
# Wait 10 seconds
supabase start
```

---

### Database Reset Fails

**Error:**
```
ERROR: syntax error at or near "COMMENT"
error running container: exit 1
```

**Solution:**
Don't use `supabase db reset`. Instead:
1. Keep Supabase running
2. Run seeding scripts directly
3. They will create/update data without needing migrations

```powershell
cd database
npx ts-node scripts/seed-database.ts
# ... continue with other scripts
```

---

## Seeding Issues

### "No palikas found"

**Error:**
```
❌ No palikas found. Run geographic seeding first.
```

**Solution:**
Run `seed-database.ts` first:
```powershell
cd database
npx ts-node scripts/seed-database.ts
```

---

### "No subscription tiers found"

**Error:**
```
❌ No subscription tiers found
```

**Solution:**
Run `seed-subscription-tiers.ts`:
```powershell
cd database
npx ts-node scripts/seed-subscription-tiers.ts
```

---

### "Could not find Kathmandu palika (KTM001)"

**Error:**
```
❌ Could not find Kathmandu palika (KTM001)
```

**Solution:**
This is expected. The admin seeding script looks for specific palika codes that don't exist. Skip this error - it's not critical for basic setup. The main seeding scripts work fine.

---

### "Category not found"

**Error:**
```
❌ Category 'X' for entity type 'Y' not found
```

**Solution:**
Run category seeding scripts:
```powershell
cd database
npx ts-node scripts/seed-marketplace-categories-direct.ts
npx ts-node scripts/seed-business-categories-direct.ts
```

---

## Node/npm Issues

### "ts-node not found"

**Error:**
```
'ts-node' is not recognized
```

**Solution:**
Install dependencies:
```powershell
cd database
npm install
```

---

### "Cannot find module"

**Error:**
```
Error: Cannot find module '@supabase/supabase-js'
```

**Solution:**
```powershell
cd database
rm -rf node_modules
npm install
```

---

## Script Execution Issues

### Scripts Run Out of Order

**Problem:**
Scripts fail because dependencies aren't met.

**Solution:**
Follow the correct order in `seeding-order.md`:
1. seed-database.ts
2. seed-subscription-tiers.ts
3. seed-marketplace-categories-direct.ts
4. seed-business-categories-direct.ts
5. enroll-palikas-tiers.ts
6. seed-marketplace-proper.ts

---

### Script Hangs or Freezes

**Problem:**
Script appears to hang with no output.

**Solution:**
1. Wait 30 seconds - some scripts take time
2. Check Supabase is still running: `supabase status`
3. Press Ctrl+C to cancel
4. Restart Supabase: `supabase stop && supabase start`
5. Run script again

---

## Connection Issues

### "Failed to connect to Supabase"

**Error:**
```
❌ Failed to connect to Supabase
```

**Solutions:**

1. **Check Supabase is running:**
```powershell
supabase status
```

2. **Check environment variables:**
```powershell
cat database/.env
```
Should show:
```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

3. **Restart Supabase:**
```powershell
supabase stop
supabase start
```

---

### "Connection refused"

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:54321
```

**Solution:**
Supabase isn't running. Start it:
```powershell
supabase start
```

---

## Admin Panel Issues

### "Module not found" in Admin Panel

**Error:**
```
Error: Cannot find module 'next'
```

**Solution:**
```powershell
cd admin-panel
npm install
```

---

### Admin Panel Won't Start

**Error:**
```
Error: Port 3000 is already in use
```

**Solution:**
1. Kill the process using port 3000:
```powershell
# Find process
netstat -ano | findstr :3000

# Kill it (replace PID with actual process ID)
taskkill /PID <PID> /F
```

2. Or use a different port:
```powershell
npm run dev -- -p 3001
```

---

### Can't Login to Admin Panel

**Problem:**
Login fails with test credentials.

**Solution:**
1. Check test users were created:
```sql
SELECT email FROM auth.users;
```

2. Verify credentials:
- Email: ramesh.sharma@test.com
- Password: TestPassword123!@#

3. Re-run user seeding:
```powershell
cd database
npx ts-node scripts/seed-marketplace-proper.ts
```

---

## Data Verification Issues

### Tables Are Empty

**Problem:**
Tables exist but have no data.

**Solution:**
Run seeding scripts:
```powershell
cd database
npx ts-node scripts/seed-database.ts
# ... run other scripts in order
```

---

### Duplicate Key Errors

**Error:**
```
ERROR: duplicate key value violates unique constraint
```

**Solution:**
This is normal on re-runs. Scripts use upsert operations. The error can be ignored - data is already there.

---

## General Troubleshooting Steps

When something goes wrong:

1. **Check Supabase status:**
```powershell
supabase status
```

2. **Check Docker is running:**
```powershell
docker ps
```

3. **Verify prerequisites:**
```powershell
cd setup-guide
.\check-prerequisites.ps1
```

4. **Check database connection:**
Open Supabase Studio: http://127.0.0.1:54323

5. **Review logs:**
Check PowerShell output for error messages

6. **Start fresh:**
```powershell
supabase stop
supabase start
cd database
# Run seeding scripts in order
```

---

## Getting More Help

If issues persist:

1. Check **05-LESSONS-LEARNED.md** for similar issues
2. Review **seeding-order.md** for correct sequence
3. Verify all prerequisites are installed
4. Check Supabase documentation: https://supabase.com/docs

---

## Emergency Reset

If everything is broken and you want to start completely fresh:

```powershell
# Stop Supabase
supabase stop

# Start fresh
supabase start

# Run setup script
cd setup-guide
.\setup-database.ps1
```

This will give you a clean slate.

---

**Remember:** Most issues are caused by:
1. Supabase not running
2. Docker not running
3. Scripts run out of order
4. Missing dependencies

Check these first before diving deeper!
