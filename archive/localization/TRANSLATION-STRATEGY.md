# Localization Strategy - English/Nepali

> **Priority:** 🟡 SHORT-TERM (Product concern)
> **Impact:** User experience for all admin & public users

## Original Thought Stream

```
- we'll need to later have eng/nepali translation
- e.g. title, subtitles etc
- it's a govt website afterall right?
- what's the best translation/localization to be used here
- are there any ways such that I don't have to worry about the translation, 
  as if it comes built in
- I believe we have the eng and nep columns for contents to support 
  multilanguage from heart!
```

## Current State: Database-Level i18n ✓

You already made the right architectural decision:

```sql
-- Your schema has bilingual columns
name_en VARCHAR,        -- English name
name_ne VARCHAR,        -- Nepali name
description_en TEXT,    -- English description  
description_ne TEXT,    -- Nepali description
```

**This is the "from heart" approach.** Content is natively bilingual.

## What Remains: UI Strings

Database content is covered. But what about:
- Button labels ("Save" / "सेभ गर्नुहोस्")
- Menu items ("Heritage Sites" / "सम्पदा स्थलहरू")
- Form labels ("Title" / "शीर्षक")
- Error messages ("Required field" / "आवश्यक क्षेत्र")

## Localization Options

### Option A: next-intl (Recommended for Next.js)

```typescript
// messages/en.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "heritage": {
    "title": "Heritage Sites",
    "addNew": "Add New Site"
  }
}

// messages/ne.json  
{
  "common": {
    "save": "सेभ गर्नुहोस्",
    "cancel": "रद्द गर्नुहोस्",
    "delete": "हटाउनुहोस्"
  },
  "heritage": {
    "title": "सम्पदा स्थलहरू",
    "addNew": "नयाँ स्थल थप्नुहोस्"
  }
}

// Usage in component
import { useTranslations } from 'next-intl'

function HeritageList() {
  const t = useTranslations('heritage')
  return <h1>{t('title')}</h1>  // "Heritage Sites" or "सम्पदा स्थलहरू"
}
```

**Pros:** Next.js native, good DX, type-safe
**Cons:** Manual translation required

### Option B: react-i18next

Similar approach, more framework-agnostic. Good if you extract to React Native later.

### Option C: Crowdin/Lokalise (Translation Management)

For larger teams:
1. Developers write English strings
2. Push to Crowdin
3. Translators add Nepali
4. Pull back translated files

**Pros:** Professional translation workflow
**Cons:** Cost, complexity for small team

### Option D: AI-Assisted Translation (Pragmatic)

Since you're building AI-first:

```typescript
// One-time script to generate initial translations
const englishStrings = loadEnglishStrings()
const nepaliStrings = await translateWithClaude(englishStrings, 'ne')
saveNepaliStrings(nepaliStrings)
```

Then have native speaker review. Best of both worlds.

## Recommendation: Hybrid Approach

```
┌─────────────────────────────────────────────────────────────┐
│                    Content Layer                             │
│  Database columns: name_en, name_ne, description_en, etc.   │
│  ✓ Already done                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    UI String Layer                           │
│  next-intl with JSON message files                          │
│  Initial translation: AI-assisted                           │
│  Review: Native speaker                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Runtime Selection                         │
│  URL-based: /en/heritage-sites, /ne/heritage-sites         │
│  OR cookie/preference based                                 │
└─────────────────────────────────────────────────────────────┘
```

## Service Layer Consideration

Should services handle language selection?

```typescript
// Option A: Service returns both, let UI pick
const site = await heritageSites.getById('123')
// site.name_en, site.name_ne both available

// Option B: Service accepts locale parameter  
const site = await heritageSites.getById('123', { locale: 'ne' })
// site.name = site.name_ne
```

**Recommendation:** Option A. Keep services language-agnostic. Let UI layer decide what to display.

## Implementation Steps

### Phase 1: Setup (2-3 hours)
- [ ] Install next-intl
- [ ] Create messages/en.json with all UI strings
- [ ] Configure middleware for locale detection

### Phase 2: Initial Translation (1-2 hours)
- [ ] Generate messages/ne.json using AI
- [ ] Have native speaker review critical strings

### Phase 3: Integration (4-6 hours)
- [ ] Replace hardcoded strings with t() calls
- [ ] Add language switcher component
- [ ] Test both languages

### Phase 4: Content Display
- [ ] Create useLocale hook for database content
- [ ] Display appropriate _en or _ne fields based on locale

## Nepali Typography Notes

For proper Nepali display:
- Use Noto Sans Devanagari font
- Ensure UTF-8 encoding everywhere
- Test number formatting (Nepali numerals optional)

```css
/* fonts.css */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap');

body[lang="ne"] {
  font-family: 'Noto Sans Devanagari', sans-serif;
}
```

## Not Now

Don't start localization until:
1. ✅ Core functionality works
2. ✅ UI is stable (avoid re-translating changed strings)
3. ✅ Clear on all user-facing text

---

## Quick Win

If you want immediate bilingual support without full i18n setup:

```typescript
// Simple locale context
const LocaleContext = createContext<'en' | 'ne'>('en')

function useLocalizedField<T extends { name_en: string; name_ne: string }>(
  item: T
): string {
  const locale = useContext(LocaleContext)
  return locale === 'ne' ? item.name_ne : item.name_en
}
```

This gives you bilingual content display with minimal setup.
