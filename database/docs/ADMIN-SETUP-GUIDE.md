# Admin User Setup Guide
## Nepal Digital Tourism Infrastructure

This guide covers setting up admin users for content management using Supabase Auth.

---

## 🚀 **Setup Supabase Auth**
**Best for:** Production-ready admin system  
**Time:** 30 minutes  
**Pros:** Full Supabase integration, production-ready, proper security  

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

## 📋 **Next Steps After Admin Setup**

Once you have admin users set up:

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

Build your content management features with Supabase Auth integrated from the start for production-ready code.

---

## 🔐 **Security Notes**

### **Supabase Auth Security:**
- Enable email verification
- Set up strong password policies
- Configure proper RLS policies
- Use environment variables for secrets
- Enable 2FA for admin accounts (recommended)

---

## 📞 **Troubleshooting**

### **Common Issues:**

**Auth Creation Fails:**
- Check Supabase project settings
- Verify service role key permissions
- Ensure email settings are configured

**Permission Errors:**
- Verify RLS policies allow admin operations
- Check role assignments are correct
- Test with service role key first