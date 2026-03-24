# Install Supabase CLI on Windows

## Option 1: Using Scoop (Recommended)

### Install Scoop (if not already installed)
```powershell
# Run in PowerShell (as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

### Install Supabase CLI
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Verify Installation
```powershell
supabase --version
```

## Option 2: Manual Installation

### Download Binary
1. Go to: https://github.com/supabase/cli/releases
2. Download the latest Windows release (e.g., `supabase_windows_amd64.zip`)
3. Extract the ZIP file
4. Move `supabase.exe` to a folder in your PATH (e.g., `C:\Program Files\Supabase\`)

### Add to PATH
1. Open System Properties → Environment Variables
2. Edit the `Path` variable
3. Add the folder containing `supabase.exe`
4. Restart PowerShell

### Verify Installation
```powershell
supabase --version
```

## Option 3: Using Chocolatey

```powershell
# Run in PowerShell (as Administrator)
choco install supabase
```

## After Installation

Once Supabase CLI is installed, run the prerequisites check again:

```powershell
.\check-prerequisites.ps1
```

Then proceed with the database setup:

```powershell
.\setup-clean-db.ps1
```

## Troubleshooting

### "supabase: command not found"
- Restart PowerShell after installation
- Check if supabase.exe is in your PATH
- Try running with full path: `C:\path\to\supabase.exe --version`

### Permission Denied
- Run PowerShell as Administrator
- Check execution policy: `Get-ExecutionPolicy`
- Set if needed: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Docker Not Running
- Start Docker Desktop
- Wait for it to fully start (check system tray icon)
- Run `docker ps` to verify

## Next Steps

After installing Supabase CLI:

1. ✅ Run prerequisites check: `.\check-prerequisites.ps1`
2. ✅ Run database setup: `.\setup-clean-db.ps1`
3. ✅ Start admin panel: `cd admin-panel; npm run dev`
4. ✅ Access at: http://localhost:3000

---

**Need help?** Check the [Database Setup Guide](DATABASE-SETUP-GUIDE.md)
