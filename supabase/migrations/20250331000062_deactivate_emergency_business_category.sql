-- ==========================================
-- MIGRATION 062: Deactivate emergency business category
-- ==========================================
-- Service providers now have their own table (service_providers).
-- Deactivate (not delete) the old business category to preserve FK integrity.
-- Any existing businesses with this category are unaffected — they just
-- won't appear in new category listings.

UPDATE categories
SET is_active = false
WHERE entity_type = 'business'
  AND slug = 'emergency';
