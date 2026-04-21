-- =====================================================================
-- Marketplace Categories
-- 26 categories, flat / un-gated. The former min_tier_level column is
-- deprecated (migration 20260421000065) — seeded as NULL.
-- =====================================================================

INSERT INTO public.marketplace_categories (name_en, name_ne, slug, min_tier_level, display_order) VALUES
  ('Agriculture & Vegetables', 'कृषि र सब्जीहरु',       'agriculture_vegetables', NULL, 1),
  ('Honey & Bee Products',     'मधु र मधु उत्पादन',     'honey_products',         NULL, 2),
  ('Tea & Spices',             'चिया र मसलाहरु',         'tea_spices',             NULL, 3),
  ('Dairy & Milk Products',    'दुग्ध र दुग्ध उत्पाद',   'dairy_products',         NULL, 4),
  ('Nuts & Seeds',             'नट र बीजहरु',             'nuts_seeds',             NULL, 5),
  ('Animal Products',          'पशु उत्पाद',              'animal_products',        NULL, 6),
  ('Grains & Cereals',         'अनाज र सिरियल',          'grains_cereals',         NULL, 7),
  ('Essential Goods',          'आवश्यक सामान',           'essential_goods',        NULL, 8),
  ('Oils & Fats',              'तेल र वसा',               'oils_fats',              NULL, 9),
  ('Textiles & Fabrics',       'कपड़े र कपड़े',          'textiles_fabrics',       NULL, 10),
  ('Handicrafts',              'हस्तकला',                 'handicrafts',            NULL, 11),
  ('Clothing & Fashion',       'कपड़े र फैशन',            'clothing_fashion',       NULL, 12),
  ('Electronics & Gadgets',    'इलेक्ट्रॉनिक्स र गैजेट', 'electronics_gadgets',    NULL, 13),
  ('Beauty & Wellness',        'सौंदर्य र कल्याण',       'beauty_wellness',        NULL, 14),
  ('Household Goods',          'घरेलू सामान',             'household_goods',        NULL, 15),
  ('Sports & Outdoor',         'खेल र बाहिरी',            'sports_outdoor',         NULL, 16),
  ('Books & Educational',      'किताब र शिक्षाप्रद',     'books_educational',      NULL, 17),
  ('Luxury Goods',             'विलासवान सामान',         'luxury_goods',           NULL, 18),
  ('Jewelry & Gems',           'गहना र रत्न',             'jewelry_gems',           NULL, 19),
  ('Premium Crafts',           'प्रीमियम हस्तकला',       'premium_crafts',         NULL, 20),
  ('Premium Fashion',          'प्रीमियम फैशन',          'premium_fashion',        NULL, 21),
  ('Art & Antiques',           'कला र प्राचीन वस्तु',    'art_antiques',           NULL, 22),
  ('Consulting Services',      'परामर्श सेवा',           'consulting_services',    NULL, 23),
  ('Premium Travel',           'प्रीमियम यात्रा',         'premium_travel',         NULL, 24),
  ('Wellness Services',        'स्वास्थ्य सेवा',          'wellness_services',      NULL, 25),
  ('Gourmet Food',             'उच्च मानक भोजन',         'gourmet_food',           NULL, 26)
ON CONFLICT (slug) DO UPDATE SET
  name_en       = EXCLUDED.name_en,
  name_ne       = EXCLUDED.name_ne,
  display_order = EXCLUDED.display_order;
