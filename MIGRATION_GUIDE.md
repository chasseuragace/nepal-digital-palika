# Migration Guide - Repository Reorganization

## 📢 What Changed?

The repository has been reorganized for better clarity and maintainability. All content remains the same, just in new locations.

## 🗺️ Quick Reference Map

### Documentation Moved

| Old Location | New Location |
|-------------|--------------|
| `01-project-overview/` | `docs/01-overview/` |
| `02-business-commercial/` | `docs/02-business/` |
| `03-technical-architecture/` | `docs/03-architecture/` |
| `04-schema-analysis/` | `docs/04-database-design/` |
| `05-operations/` | `docs/05-operations/` |

### Code Moved

| Old Location | New Location |
|-------------|--------------|
| `07-database-seeding/` | `database/` |
| `08-admin-panel/` | `admin-panel/` |

### Archive

| Old Location | New Location |
|-------------|--------------|
| `06-deprecated/` | `archive/` |
| `thoughts_/` | `archive/` |

## 🔧 Update Your Bookmarks

If you had bookmarks or links to specific files, update them:

### Common Files

```
OLD: 01-project-overview/EXECUTIVE_SUMMARY.md
NEW: docs/01-overview/EXECUTIVE_SUMMARY.md

OLD: 03-technical-architecture/SUPABASE_ARCHITECTURE.md
NEW: docs/03-architecture/SUPABASE_ARCHITECTURE.md

OLD: 07-database-seeding/README.md
NEW: database/README.md

OLD: 08-admin-panel/README.md
NEW: admin-panel/README.md
```

## 💻 Update Your Commands

### Database Commands

**Old:**
```bash
cd 07-database-seeding
npm run seed:all
```

**New:**
```bash
cd database
npm run seed:all
```

### Admin Panel Commands

**Old:**
```bash
cd 08-admin-panel
npm run test:integration
```

**New:**
```bash
cd admin-panel
npm run test:integration
```

## 📝 Update Your Scripts

If you have scripts that reference old paths:

### Bash/Shell Scripts

```bash
# Old
cd 07-database-seeding && npm run seed

# New
cd database && npm run seed
```

### Node.js Scripts

```javascript
// Old
const dbPath = './07-database-seeding'

// New
const dbPath = './database'
```

### Import Paths

```typescript
// Old
import { AuthService } from '../08-admin-panel/services/auth.service'

// New
import { AuthService } from '../admin-panel/services/auth.service'
```

## 🔍 Finding Files

### Use Git to Find Moved Files

```bash
# Find where a file moved to
git log --follow --all -- path/to/old/file.md

# Search for content
git grep "search term"
```

### Use Find Command

```bash
# Find all markdown files
find . -name "*.md" -type f

# Find specific file
find . -name "EXECUTIVE_SUMMARY.md"
```

## ✅ Verification Checklist

After updating your references:

- [ ] Updated bookmarks in browser
- [ ] Updated local scripts
- [ ] Updated documentation links
- [ ] Updated CI/CD pipelines (if any)
- [ ] Updated team wiki/notes
- [ ] Tested database commands
- [ ] Tested admin panel commands

## 🆘 Troubleshooting

### "File not found" errors

1. Check the mapping table above
2. Use `find` command to locate file
3. Check `STRUCTURE.md` for current layout

### Import errors in code

1. Update import paths to new structure
2. Check `admin-panel/` instead of `08-admin-panel/`
3. Check `database/` instead of `07-database-seeding/`

### Git history issues

Don't worry! Git tracks file moves. Use:
```bash
git log --follow -- path/to/file
```

## 📚 New Documentation

New files to help you navigate:

- `README.md` - Updated main documentation
- `STRUCTURE.md` - Visual structure guide
- `docs/README.md` - Documentation index
- `archive/README.md` - Archive policy

## 🎯 Benefits of New Structure

1. **Clearer organization:** Docs, code, and data separated
2. **Better discoverability:** Logical naming without numbers
3. **Easier navigation:** Audience-specific documentation
4. **Professional structure:** Industry-standard layout
5. **Room for growth:** Easy to add new components

## ❓ Questions?

- **Can't find a file?** Check `STRUCTURE.md`
- **Need old structure?** Check git history
- **General questions?** See main `README.md`

## 📅 Timeline

- **Reorganization Date:** January 6, 2025
- **Old structure:** Available in git history
- **Support period:** Ongoing

---

**Note:** All file content remains unchanged. Only locations have been updated for better organization.
