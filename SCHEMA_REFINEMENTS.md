# Supabase Schema Refinements

## Overview
The schema has been refined to address inconsistencies, add missing fields, and improve data integrity. All changes maintain backward compatibility while adding structure and constraints.

## Key Improvements

### 1. Standardized Location Fields
**Before:** Mixed naming (`location`, `center_point`, `primary_location`)
**After:** Consistent `location` field across all tables
- `palikas.center_point` → kept for geographic center (separate from boundary)
- `events.primary_location` → `location`
- All other tables use `location`

### 2. JSONB Structure Documentation
All JSONB fields now have documented structure with examples:

#### Palikas Settings
```json
{
  "logo_url": null,
  "theme_color": "#1a73e8",
  "contact_email": null,
  "languages": ["en", "ne"]
}
```

#### Heritage Sites
- **opening_hours**: `{"monday": "09:00-17:00", ...}`
- **entry_fee**: `{"local_adult": 100, "local_child": 50, "foreign_adult": 500, "currency": "NPR"}`
- **accessibility_info**: `{"wheelchair_accessible": true, "parking": true, ...}`
- **images**: `[{"url": "https://...", "caption": "...", "order": 1}, ...]`

#### Businesses
- **details**: `{"rooms": 3, "room_types": ["single", "double"], "amenities": [...]}`
- **price_range**: `{"min": 1500, "max": 2500, "currency": "NPR", "unit": "night"}`
- **operating_hours**: `{"monday": "09:00-17:00", ...}`
- **facilities**: `{"parking": true, "wifi": true, "restaurant": false, ...}`

### 3. New Fields Added

#### Heritage Sites
- `languages_available` (TEXT[]) - Audio guide languages
- `accessibility_info` (JSONB) - Wheelchair access, parking, restrooms, guides
- `best_time_to_visit` (VARCHAR) - Seasonal recommendations
- `average_visit_duration_minutes` (INTEGER) - Expected visit time

#### Businesses
- `operating_hours` (JSONB) - Daily hours
- `is_24_7` (BOOLEAN) - Always open flag
- `languages_spoken` (TEXT[]) - Staff languages
- `facilities` (JSONB) - Parking, WiFi, restaurant, guide service

#### SOS Requests
- `location_accuracy` (FLOAT) - GPS accuracy in meters
- `sent_offline` (BOOLEAN) - Queued while offline
- `queued_at` (TIMESTAMPTZ) - When queued offline

### 4. Constraints Added

#### Check Constraints
- `palikas.type` - Only valid types: municipality, metropolitan, sub_metropolitan
- `palikas.total_wards` - Must be >= 0
- `profiles.user_type` - Valid types: resident, tourist_domestic, tourist_international, business_owner, admin
- `heritage_sites.category` - Valid categories: temple, monastery, palace, fort, museum, archaeological, natural, cultural, other
- `heritage_sites.heritage_status` - Valid statuses: world_heritage, national, provincial, local, proposed
- `heritage_sites.ward_number` - Between 1-35
- `heritage_sites.average_visit_duration_minutes` - Must be > 0
- `businesses.business_type` - Valid types: accommodation, restaurant, tour_operator, transport, shopping, entertainment, service, other
- `businesses.ward_number` - Between 1-35
- `sos_requests.emergency_type` - Valid types: medical, accident, fire, security, natural_disaster, other
- `sos_requests.status` - Valid statuses: received, assigned, in_progress, resolved, cancelled
- `sos_requests.ward_number` - Between 1-35
- `sos_requests.responder_eta_minutes` - Must be > 0
- `admin_users.role` - Valid roles: super_admin, palika_admin, moderator, support

### 5. New Indexes

#### Search Indexes
- `heritage_sites` - Full-text search on `name_en`
- `businesses` - Full-text search on `business_name`

#### Query Performance
- `businesses(business_type, verification_status, is_active)` - Common filter combinations
- `sos_requests(DATE(created_at))` - Daily analytics queries
- `palikas(is_active)` - Active palika queries
- `profiles(user_type)` - User type filtering
- `admin_users(palika_id, is_active)` - Admin lookups
- `events(location)` - Geographic queries

### 6. Automated Slug Generation
New trigger `generate_slug()` automatically creates URL-friendly slugs from names:
- Converts to lowercase
- Removes special characters
- Replaces spaces with hyphens
- Applied to: `heritage_sites`, `events`, `businesses`

### 7. Auth Integration Clarification
**Profiles Table:**
- `id` references `auth.users(id)` - Primary key relationship
- `phone` denormalized from `auth.users` for performance
- `name` stored locally (can differ from auth.users)
- Supabase auth.users has: email, phone, email_confirmed_at, phone_confirmed_at
- Profiles extends with app-specific data

### 8. Default Values Improved
All JSONB defaults now have meaningful structure instead of empty `{}`:
- Prevents null checks in application code
- Clear schema documentation
- Easier to extend

## Migration Notes

If upgrading from previous schema:

1. **Location fields**: No data migration needed (new tables)
2. **JSONB fields**: Existing empty `{}` values are still valid
3. **New fields**: All have defaults, no migration required
4. **Constraints**: Only apply to new inserts, existing data unaffected
5. **Indexes**: Created automatically, no action needed
6. **Triggers**: Slug generation only applies to new records

## Testing

All test blocks are commented out in the SQL file. To run tests:

1. Uncomment individual test blocks in `sipabase_sql.md`
2. Run in a transaction (they include ROLLBACK)
3. Tests verify:
   - Tourist journey (view, favorite, review)
   - SOS emergency flow
   - Business registration & inquiry
   - Search & discovery
   - Analytics & reporting

## Next Steps

1. Review JSONB structures with frontend team
2. Adjust constraints based on business rules
3. Add more specific indexes based on actual query patterns
4. Consider partitioning `analytics_events` by date for large datasets
5. Set up automated backups and monitoring
