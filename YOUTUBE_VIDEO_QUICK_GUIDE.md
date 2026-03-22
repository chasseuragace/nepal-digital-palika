# YouTube Video Feature - Quick Guide

**Status**: ✅ READY TO USE
**Date**: March 22, 2026

---

## What's New

You can now add YouTube videos to your Palika Profile. Videos are stored as URLs and can be displayed on your website or app.

---

## How to Add Videos

### Step 1: Open Palika Profile
- Login to admin panel
- Click "Palika Profile"

### Step 2: Scroll to YouTube Videos Section
- Find "YouTube Videos" section at the bottom
- Above the "Save Palika Profile" button

### Step 3: Enter Video URL
- Click on the video URL input field
- Paste or type YouTube URL
- Supported formats:
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`

### Step 4: See Preview
- If URL is valid, video preview displays
- If URL is invalid, warning message appears

### Step 5: Add More Videos
- Click "Add Video" button
- Repeat steps 3-4

### Step 6: Save
- Click "Save Palika Profile"
- Videos saved to database

---

## How to Remove Videos

1. Click "Remove Video" button on the video you want to delete
2. Video removed from form
3. Click "Save Palika Profile"
4. Video removed from database

---

## Supported URL Formats

### ✅ Standard YouTube URL
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

### ✅ Shortened YouTube URL
```
https://youtu.be/dQw4w9WgXcQ
```

### ✅ Embed URL
```
https://www.youtube.com/embed/dQw4w9WgXcQ
```

### ❌ NOT Supported
- Playlist URLs
- Channel URLs
- URLs with timestamps
- Video ID only

---

## Example

### Adding a Video

1. Open Palika Profile
2. Scroll to "YouTube Videos" section
3. Paste: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
4. See video preview
5. Click "Add Video"
6. Paste: `https://youtu.be/abc123def456`
7. See second video preview
8. Click "Save Palika Profile"
9. Both videos saved

---

## Data Stored

Videos are stored as an array of URLs:

```json
{
  "videos": [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/abc123def456"
  ]
}
```

---

## Features

✅ Add unlimited videos
✅ Remove videos easily
✅ Live video preview
✅ URL validation
✅ Multiple URL formats
✅ Persistent storage
✅ Responsive player

---

## Testing

### Quick Test (2 minutes)

1. Login as Bhaktapur Admin
   - Email: `palika.admin@bhaktapur.gov.np`
   - Password: `BhaktapurAdmin456!`

2. Go to Palika Profile

3. Scroll to YouTube Videos section

4. Paste a YouTube URL:
   ```
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```

5. See video preview

6. Click "Add Video"

7. Paste another URL:
   ```
   https://youtu.be/abc123def456
   ```

8. See second video preview

9. Click "Save Palika Profile"

10. Reload page and verify videos persist

---

## Troubleshooting

### Video Preview Not Showing
- Check URL format
- Use one of the supported formats
- Verify YouTube video exists

### Invalid URL Warning
- Check URL format
- Use: `https://www.youtube.com/watch?v=VIDEO_ID`
- Or: `https://youtu.be/VIDEO_ID`

### Videos Not Saving
- Check browser console for errors
- Verify at least one description is filled
- Try saving again

---

## Supported Formats

| Format | Example | Status |
|--------|---------|--------|
| Standard | `https://www.youtube.com/watch?v=dQw4w9WgXcQ` | ✅ |
| Shortened | `https://youtu.be/dQw4w9WgXcQ` | ✅ |
| Embed | `https://www.youtube.com/embed/dQw4w9WgXcQ` | ✅ |
| Playlist | `https://www.youtube.com/playlist?list=...` | ❌ |
| Channel | `https://www.youtube.com/channel/...` | ❌ |
| With timestamp | `https://www.youtube.com/watch?v=...&t=10s` | ❌ |

---

## Database

✅ No database changes needed
✅ Existing schema supports videos
✅ Videos stored as array of URLs
✅ Persists across sessions

---

## API

✅ No API changes needed
✅ Existing endpoints handle videos
✅ GET returns videos array
✅ PUT accepts videos array

---

## Compilation

✅ All code compiles without errors

---

## Next Steps

1. Test adding videos
2. Test removing videos
3. Test different URL formats
4. Verify persistence
5. Deploy when ready

---

## Questions?

Refer to:
- `YOUTUBE_VIDEO_FEATURE.md` - Detailed documentation
- `PALIKA_PROFILE_TESTING_GUIDE.md` - Testing procedures
- `PALIKA_PROFILE_SYSTEM_COMPLETE.md` - Complete system overview

