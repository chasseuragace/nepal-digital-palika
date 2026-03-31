-- ==========================================
-- SEED: Service Providers for Development
-- ==========================================
-- Sample providers for Bhaktapur (palika_id = 1, assumed dev palika)
-- Coordinates are real Bhaktapur area locations.
-- Uses ST_SetSRID(ST_Point(lon, lat), 4326) for GEOGRAPHY columns.

-- Get Bhaktapur palika_id (adjust if different in your setup)
DO $$
DECLARE
    v_palika_id INTEGER;
    v_admin_id UUID;
BEGIN
    -- Find first active palika (dev default)
    SELECT id INTO v_palika_id FROM palikas WHERE is_active = true ORDER BY id LIMIT 1;
    IF v_palika_id IS NULL THEN
        RAISE NOTICE 'No active palika found, skipping seed';
        RETURN;
    END IF;

    -- Find first admin user for created_by
    SELECT id INTO v_admin_id FROM admin_users WHERE is_active = true ORDER BY created_at LIMIT 1;

    RAISE NOTICE 'Seeding service providers for palika_id=%, admin=%', v_palika_id, v_admin_id;

    -- Ambulance Services
    INSERT INTO service_providers (palika_id, name_en, name_ne, service_type, phone, email, location, address, ward_number, vehicle_count, services, is_24_7, status, coverage_area, response_time_avg_minutes, created_by)
    VALUES
    (v_palika_id, 'Bhaktapur Red Cross Ambulance', 'भक्तपुर रेडक्रस एम्बुलेन्स', 'ambulance',
     '01-6610798', 'redcross@bhaktapur.gov.np',
     ST_SetSRID(ST_Point(85.4275, 27.6710), 4326)::geography,
     'Durbar Square Area, Bhaktapur', 9, 3,
     ARRAY['first_aid', 'critical_care', 'patient_transport'],
     true, 'available', 'Bhaktapur Municipality - All Wards', 12, v_admin_id),

    (v_palika_id, 'Nepal Ambulance Service - Bhaktapur', 'नेपाल एम्बुलेन्स सेवा - भक्तपुर', 'ambulance',
     '01-6614500', 'nas.bhaktapur@gmail.com',
     ST_SetSRID(ST_Point(85.4180, 27.6725), 4326)::geography,
     'Suryabinayak, Bhaktapur', 3, 2,
     ARRAY['first_aid', 'patient_transport', 'oxygen_supply'],
     true, 'available', 'Bhaktapur and surrounding areas', 15, v_admin_id),

    (v_palika_id, 'Community Health Ambulance', 'सामुदायिक स्वास्थ्य एम्बुलेन्स', 'ambulance',
     '01-6612345', NULL,
     ST_SetSRID(ST_Point(85.4320, 27.6680), 4326)::geography,
     'Kamal Binayak, Bhaktapur', 7, 1,
     ARRAY['first_aid', 'patient_transport'],
     false, 'available', 'Bhaktapur Wards 5-12', 18, v_admin_id),

    -- Fire Brigade
    (v_palika_id, 'Bhaktapur Fire Brigade', 'भक्तपुर दमकल सेवा', 'fire_brigade',
     '01-6610101', 'fire@bhaktapur.gov.np',
     ST_SetSRID(ST_Point(85.4290, 27.6730), 4326)::geography,
     'Taumadhi Square Area, Bhaktapur', 10, 4,
     ARRAY['fire_suppression', 'rescue', 'hazmat', 'water_supply'],
     true, 'available', 'Bhaktapur Municipality - Full Coverage', 8, v_admin_id),

    (v_palika_id, 'Suryabinayak Fire Station', 'सूर्यविनायक दमकल केन्द्र', 'fire_brigade',
     '01-6615555', NULL,
     ST_SetSRID(ST_Point(85.4150, 27.6700), 4326)::geography,
     'Suryabinayak Chowk', 2, 2,
     ARRAY['fire_suppression', 'rescue'],
     true, 'available', 'Suryabinayak and western Bhaktapur', 10, v_admin_id),

    -- Police
    (v_palika_id, 'Bhaktapur District Police', 'भक्तपुर जिल्ला प्रहरी', 'police',
     '01-6610999', 'police@bhaktapur.gov.np',
     ST_SetSRID(ST_Point(85.4300, 27.6715), 4326)::geography,
     'Near Nyatapola Temple, Bhaktapur', 9, 6,
     ARRAY['patrol', 'investigation', 'traffic', 'crowd_control', 'emergency_response'],
     true, 'available', 'Bhaktapur District - Full Coverage', 5, v_admin_id),

    (v_palika_id, 'Traffic Police Unit - Bhaktapur', 'ट्राफिक प्रहरी - भक्तपुर', 'police',
     '01-6611100', NULL,
     ST_SetSRID(ST_Point(85.4220, 27.6740), 4326)::geography,
     'Kamal Pokhari, Bhaktapur', 8, 4,
     ARRAY['traffic', 'accident_response', 'road_clearance'],
     true, 'available', 'Bhaktapur main roads and intersections', 7, v_admin_id),

    -- Rescue
    (v_palika_id, 'Nepal Disaster Rescue Team - Bhaktapur', 'नेपाल विपद उद्धार टोली - भक्तपुर', 'rescue',
     '01-6617777', 'rescue.bhaktapur@ndrt.org.np',
     ST_SetSRID(ST_Point(85.4260, 27.6695), 4326)::geography,
     'Dattatreya Square Area, Bhaktapur', 11, 2,
     ARRAY['search_rescue', 'disaster_response', 'rope_rescue', 'water_rescue', 'structural_collapse'],
     true, 'available', 'Bhaktapur and neighboring municipalities', 20, v_admin_id)

    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Seeded 8 service providers for palika_id=%', v_palika_id;
END $$;
