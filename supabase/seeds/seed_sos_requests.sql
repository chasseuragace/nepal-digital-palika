-- ==========================================
-- SEED: SOS Requests for Development
-- ==========================================
-- Sample emergency requests across different statuses and types.

DO $$
DECLARE
    v_palika_id INTEGER;
    v_admin_id UUID;
    v_provider_id UUID;
    v_req_id UUID;
BEGIN
    SELECT id INTO v_palika_id FROM palikas WHERE is_active = true ORDER BY id LIMIT 1;
    IF v_palika_id IS NULL THEN
        RAISE NOTICE 'No active palika, skipping';
        RETURN;
    END IF;

    SELECT id INTO v_admin_id FROM admin_users WHERE is_active = true ORDER BY created_at LIMIT 1;
    SELECT id INTO v_provider_id FROM service_providers WHERE palika_id = v_palika_id AND service_type = 'ambulance' LIMIT 1;

    -- 1. Pending request (just came in)
    INSERT INTO sos_requests (palika_id, request_code, emergency_type, service_type, priority, urgency_score, location, location_description, ward_number, user_name, user_phone, details, status, app_submitted, device_location, images)
    VALUES
    (v_palika_id, 'SOS-20260331-001', 'medical', 'ambulance', 'high', 75,
     ST_SetSRID(ST_Point(85.4285, 27.6718), 4326)::geography,
     'Near Pottery Square, Bhaktapur', 9,
     'Ram Shrestha', '+977-9841234567',
     'Elderly person collapsed near Pottery Square. Conscious but unable to stand. Possible stroke.',
     'pending', true, true, '[]'::jsonb);

    -- 2. Reviewing request (admin acknowledged)
    INSERT INTO sos_requests (palika_id, request_code, emergency_type, service_type, priority, urgency_score, location, location_description, ward_number, user_name, user_phone, details, status, reviewed_at, reviewed_by, app_submitted, device_location)
    VALUES
    (v_palika_id, 'SOS-20260331-002', 'fire', 'fire_brigade', 'critical', 95,
     ST_SetSRID(ST_Point(85.4310, 27.6690), 4326)::geography,
     'Dattatreya Square, old wooden building', 11,
     'Sita Maharjan', '+977-9851234567',
     'Fire in traditional wooden building near Dattatreya temple. Smoke visible from multiple windows. 3 families may be inside.',
     'reviewing', NOW() - INTERVAL '5 minutes', v_admin_id, true, true);

    -- 3. Assigned request with provider assignment
    v_req_id := uuid_generate_v4();
    INSERT INTO sos_requests (id, palika_id, request_code, emergency_type, service_type, priority, urgency_score, location, location_description, ward_number, user_name, user_phone, details, status, reviewed_at, reviewed_by, assigned_to, app_submitted)
    VALUES
    (v_req_id, v_palika_id, 'SOS-20260331-003', 'accident', 'ambulance', 'high', 80,
     ST_SetSRID(ST_Point(85.4200, 27.6730), 4326)::geography,
     'Suryabinayak Road, near bus park', 3,
     'Gopal Tamang', '+977-9861234567',
     'Motorcycle accident. Rider has leg injury, bleeding. Helmet was worn.',
     'assigned', NOW() - INTERVAL '15 minutes', v_admin_id, v_admin_id, true);

    -- Create assignment for this request
    IF v_provider_id IS NOT NULL THEN
        INSERT INTO sos_request_assignments (sos_request_id, provider_id, assigned_by, status, estimated_arrival_minutes, distance_km, assignment_notes)
        VALUES
        (v_req_id, v_provider_id, v_admin_id, 'en_route', 8, 1.2, 'Nearest ambulance dispatched. Patient conscious.');
    END IF;

    -- 4. In-progress request
    INSERT INTO sos_requests (palika_id, request_code, emergency_type, service_type, priority, urgency_score, location, location_description, ward_number, user_name, user_phone, details, status, reviewed_at, assigned_to, app_submitted)
    VALUES
    (v_palika_id, 'SOS-20260331-004', 'security', 'police', 'medium', 50,
     ST_SetSRID(ST_Point(85.4255, 27.6705), 4326)::geography,
     'Taumadhi Tole, near Nyatapola', 10,
     'Anonymous', '+977-9871234567',
     'Group of intoxicated individuals causing disturbance near temple area. Threatening local vendors.',
     'in_progress', NOW() - INTERVAL '30 minutes', v_admin_id, false);

    -- 5. Resolved request (complete lifecycle)
    INSERT INTO sos_requests (palika_id, request_code, emergency_type, service_type, priority, urgency_score, location, location_description, ward_number, user_name, user_phone, details, status, reviewed_at, assigned_to, resolved_at, resolution_notes, user_rating, user_feedback, app_submitted)
    VALUES
    (v_palika_id, 'SOS-20260331-005', 'medical', 'ambulance', 'critical', 90,
     ST_SetSRID(ST_Point(85.4270, 27.6722), 4326)::geography,
     'Bhaktapur Hospital Road', 9,
     'Maya Dangol', '+977-9881234567',
     'Child with severe allergic reaction. Difficulty breathing. Age 6.',
     'resolved',
     NOW() - INTERVAL '2 hours',
     v_admin_id,
     NOW() - INTERVAL '1 hour',
     'Patient transported to Bhaktapur Hospital. Treated for anaphylaxis. Stable condition.',
     5, 'Very fast response. Ambulance arrived in 7 minutes. Thank you.', true);

    -- 6. Cancelled request
    INSERT INTO sos_requests (palika_id, request_code, emergency_type, priority, location, location_description, user_name, user_phone, details, status, app_submitted)
    VALUES
    (v_palika_id, 'SOS-20260331-006', 'other', 'low',
     ST_SetSRID(ST_Point(85.4240, 27.6735), 4326)::geography,
     'Kamalbinayak Chowk', 'Test User', '+977-9800000000',
     'Test request - please ignore',
     'cancelled', true);

    RAISE NOTICE 'Seeded 6 SOS requests for palika_id=%', v_palika_id;
END $$;
