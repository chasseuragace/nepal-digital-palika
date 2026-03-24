# Prerequisites

Software and tools required to set up the Nepal Digital Tourism platform.

## Required Software

### 1. Node.js (v18 or higher)

**Check if installed:**
```powershell
node --version
```

**Install:**
Download from https://nodejs.org/

**Recommended:** v18 LTS or higher

---

### 2. npm (comes with Node.js)

**Check if installed:**
```powershell
npm --version
```

Should be v8 or higher.

---

### 3. Docker Desktop

**Check if installed:**
```powershell
docker --version
docker ps
```

**Install:**
Download from https://www.docker.com/products/docker-desktop

**Important:** Docker must be running before starting Supabase.

---

### 4. Supabase CLI

**Check if installed:**
```powershell
supabase --version
```

**Install via Scoop:**

First, install Scoop if you don't have it:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

Then install Supabase CLI:
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Alternative:** Download from https://github.com/supabase/cli/releases

---

### 5. Git (Optional but recommended)

**Check if installed:**
```powershell
git --version
```

**Install:**
Download from https://git-scm.com/

---

## Automated Check

Run this script to check all prerequisites:

```powershell
cd setup-guide
.\check-prerequisites.ps1
```

This will verify:
- ✅ Supabase CLI
- ✅ Node.js (v18+)
- ✅ npm
- ✅ Docker (installed and running)
- ✅ Git (optional)
- ✅ Project structure

---

## System Requirements

### Operating System
- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu 20.04+, Debian, etc.)

### Hardware
- **RAM:** 8GB minimum, 16GB recommended
- **Disk Space:** 10GB free space
- **CPU:** 2 cores minimum, 4 cores recommended

### Network
- Internet connection for downloading dependencies
- No proxy/firewall blocking Docker or npm

---

## Installation Order

Follow this order for best results:

1. **Docker Desktop** - Install and start first
2. **Node.js** - Includes npm
3. **Scoop** - Package manager for Windows
4. **Supabase CLI** - Via Scoop
5. **Git** - Optional but useful

---

## Verification

After installing everything, verify with:

```powershell
# Check Node.js
node --version  # Should show v18.x.x or higher

# Check npm
npm --version   # Should show v8.x.x or higher

# Check Docker
docker --version  # Should show version
docker ps         # Should list running containers (or empty list)

# Check Supabase CLI
supabase --version  # Should show version

# Check Git (optional)
git --version  # Should show version
```

---

## Common Installation Issues

### Scoop Installation Fails

**Error:** "Execution policy error"

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

---

### Docker Won't Start

**Solution:**
1. Restart Docker Desktop
2. Check Windows features: Hyper-V and WSL2 must be enabled
3. Restart computer if needed

---

### Supabase CLI Not Found After Installation

**Solution:**
1. Restart PowerShell
2. Check PATH includes Scoop directory
3. Reinstall: `scoop uninstall supabase && scoop install supabase`

---

### Node.js Version Too Old

**Solution:**
1. Uninstall old Node.js
2. Download latest LTS from https://nodejs.org/
3. Install and restart PowerShell

---

## Next Steps

Once all prerequisites are installed:

1. Run `.\check-prerequisites.ps1` to verify
2. Proceed to **02-DATABASE-SETUP.md**
3. Or run **00-QUICK-START.md** for fastest setup

---

## Optional Tools

These aren't required but can be helpful:

### VS Code
- **Purpose:** Code editor
- **Download:** https://code.visualstudio.com/

### Postman
- **Purpose:** API testing
- **Download:** https://www.postman.com/

### DBeaver
- **Purpose:** Database management
- **Download:** https://dbeaver.io/

---

## Environment Setup

### PowerShell Execution Policy

If you get script execution errors:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### PATH Configuration

Ensure these are in your PATH:
- Node.js: `C:\Program Files\nodejs\`
- npm: `C:\Users\<username>\AppData\Roaming\npm`
- Scoop: `C:\Users\<username>\scoop\shims`

---

## Ready to Proceed?

Run the prerequisite check:
```powershell
cd setup-guide
.\check-prerequisites.ps1
```

If everything shows "OK", you're ready for **00-QUICK-START.md**!
