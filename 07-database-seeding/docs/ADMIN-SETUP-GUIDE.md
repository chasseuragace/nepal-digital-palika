# Admin User Setup Guide
## Nepal Digital Tourism Infrastructure

Choose your approach based on your current needs:

---

## 🚀 **Option A: Quick Start (Temporary Admin)**
**Best for:** Immediate content management development  
**Time:** 5 minutes  
**Pros:** Works immediately, no auth complexity  
**Cons:** Not production-ready, requires migration later  

### Steps:
```bash
# 1. Copy temporary admin SQL
npm run copy-temp-admin

# 2. Paste and run in Supabase SQL Editor
# This creates temp_admin_users table and 3 admin accounts

# 3. Test the setup
# Check temp_admin_users table in Supabase dashboard
```

### Login Credentials (Temporary):
- **Super Admin:** `superadmin@nepal-tourism.gov.np`
- **Kathmandu Admin:** `ktm.admin@nepal-tourism.gov.np`  
- **Content Moderator:** `moderator@nepal-tourism.gov.np`

### What This Gives You:
- ✅ Admin users for content management
- ✅ Simple session-based auth
- ✅ Role-based permissions
- ✅ Can create/edit blog posts immediately
- ❌ Not integrated with Supabase Auth
- ❌ Requires custom login system

---

## 🏗️ **Option B: Production Ready (Supabase Auth)**
**Best for:** Production deployment  
**Time:** 30 minutes  
**Pros:** Full Supabase integration, production-ready  
**Cons:** More complex, requires auth setup  

### Prerequisites:
1. **Enable Supabase Auth** in your project dashboard
2. **Configure email settings** (optional for development)
3. **Set up RLS policies** for admin_users table

### Steps:
```bash
# 1. Run the auth setup script
npm run setup:auth-admin

# 2. Check the output for login credentials
# 3. Test login in Supabase Auth dashboard
```

### What This Gives You:
- ✅ Full Supabase Auth integration
- ✅ Real user accounts with proper security
- ✅ Email verification (if configured)
- ✅ Password reset functionality
- ✅ Production-ready admin system
- ✅ Proper JWT tokens

---

## 🤔 **Which Should You Choose?**

### **Choose Option A (Temporary) if:**
- You want to start content management **immediately**
- You're prototyping or in early development
- You don't need user authentication yet
- You want to focus on content management features first

### **Choose Option B (Supabase Auth) if:**
- You're building for production
- You need proper user security
- You want the full authentication system
- You're ready to handle auth complexity

---

## 🔄 **Migration Path**

If you start with Option A, you can migrate to Option B later:

1. **Export content** created with temp admins
2. **Set up Supabase Auth** (Option B)
3. **Migrate admin records** to proper auth users
4. **Update foreign key references**
5. **Remove temporary tables**

---

## 📋 **Next Steps After Admin Setup**

Once you have admin users (either option):

### **1. Update Blog Posts Seeding**
```bash
# Now you can seed blog posts with proper author_id
npm run seed:content  # Will work with admin users
```

### **2. Build Content Management Interface**
- Admin login system
- Heritage site creation/editing
- Event management
- Blog post editor
- Business verification

### **3. Test Admin Functionality**
- Create test heritage sites
- Add new events
- Write blog posts
- Verify permissions work correctly

---

## 🛠️ **Development Recommendations**

**For immediate content management development:**
1. Use **Option A** (temporary admin)
2. Build your content management features
3. Test with temporary admin users
4. Migrate to **Option B** when ready for production

**For production-first approach:**
1. Set up **Option B** (Supabase Auth) immediately
2. Build auth-integrated content management
3. Deploy with proper security from day one

---

## 🔐 **Security Notes**

### **Option A Security:**
- Change default password hashes
- Implement proper session management
- Use HTTPS in production
- Limit admin access by IP if possible

### **Option B Security:**
- Enable email verification
- Set up strong password policies
- Configure proper RLS policies
- Use environment variables for secrets
- Enable 2FA for admin accounts (recommended)

---

## 📞 **Troubleshooting**

### **Common Issues:**

**Option A - SQL Errors:**
```sql
-- If foreign key constraint fails:
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;
```

**Option B - Auth Creation Fails:**
- Check Supabase project settings
- Verify service role key permissions
- Ensure email settings are configured

**Both Options - Permission Errors:**
- Verify RLS policies allow admin operations
- Check role assignments are correct
- Test with service role key first