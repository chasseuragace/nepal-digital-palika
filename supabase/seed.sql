-- Seed data for Nepal Digital Tourism Infrastructure
-- Provides basic geographic and permission data for tests

-- Insert provinces
INSERT INTO public.provinces (name_en, name_ne, code) VALUES
  ('Madhesh', 'मधेश', 'MADHESH'),
  ('Bagmati', 'बागमती', 'BAGMATI'),
  ('Gandaki', 'गण्डकी', 'GANDAKI'),
  ('Lumbini', 'लुम्बिनी', 'LUMBINI'),
  ('Karnali', 'कर्णाली', 'KARNALI'),
  ('Far West', 'सुदूर', 'FARWEST')
ON CONFLICT DO NOTHING;

-- Insert districts for Madhesh province
INSERT INTO public.districts (province_id, name_en, name_ne, code) VALUES
  ((SELECT id FROM public.provinces WHERE code = 'MADHESH'), 'Saptari', 'सप्तरी', 'SAPTARI'),
  ((SELECT id FROM public.provinces WHERE code = 'MADHESH'), 'Sunsari', 'सुनसरी', 'SUNSARI'),
  ((SELECT id FROM public.provinces WHERE code = 'MADHESH'), 'Siraha', 'सिराहा', 'SIRAHA')
ON CONFLICT DO NOTHING;

-- Insert districts for Bagmati province
INSERT INTO public.districts (province_id, name_en, name_ne, code) VALUES
  ((SELECT id FROM public.provinces WHERE code = 'BAGMATI'), 'Kathmandu', 'काठमाडौं', 'KATHMND'),
  ((SELECT id FROM public.provinces WHERE code = 'BAGMATI'), 'Bhaktapur', 'भक्तपुर', 'BHKTPUR'),
  ((SELECT id FROM public.provinces WHERE code = 'BAGMATI'), 'Lalitpur', 'ललितपुर', 'LALITPU')
ON CONFLICT DO NOTHING;

-- Insert palikas for Saptari district
INSERT INTO public.palikas (district_id, name_en, name_ne, type, code) VALUES
  ((SELECT id FROM public.districts WHERE code = 'SAPTARI'), 'Rajbiraj', 'राजबिराज', 'municipality', 'RAJ001'),
  ((SELECT id FROM public.districts WHERE code = 'SAPTARI'), 'Kanyam', 'कन्याम', 'rural_municipality', 'KAN001'),
  ((SELECT id FROM public.districts WHERE code = 'SAPTARI'), 'Tilawe', 'तिलावे', 'rural_municipality', 'TIL001')
ON CONFLICT DO NOTHING;

-- Insert palikas for Sunsari district
INSERT INTO public.palikas (district_id, name_en, name_ne, type, code) VALUES
  ((SELECT id FROM public.districts WHERE code = 'SUNSARI'), 'Itahari', 'इटहरी', 'municipality', 'ITA001'),
  ((SELECT id FROM public.districts WHERE code = 'SUNSARI'), 'Dharan', 'धरान', 'municipality', 'DHA001'),
  ((SELECT id FROM public.districts WHERE code = 'SUNSARI'), 'Inaruwa', 'इनारुवा', 'municipality', 'INA001')
ON CONFLICT DO NOTHING;

-- Insert palikas for Kathmandu district
INSERT INTO public.palikas (district_id, name_en, name_ne, type, code) VALUES
  ((SELECT id FROM public.districts WHERE code = 'KATHMND'), 'Kathmandu', 'काठमाडौं', 'metropolitan', 'KTM001'),
  ((SELECT id FROM public.districts WHERE code = 'KATHMND'), 'Tokha', 'तोखा', 'municipality', 'TOK001'),
  ((SELECT id FROM public.districts WHERE code = 'KATHMND'), 'Budhanilkantha', 'बुढानिलकण्ठ', 'rural_municipality', 'BUD001')
ON CONFLICT DO NOTHING;

-- Insert palikas for Bhaktapur district
INSERT INTO public.palikas (district_id, name_en, name_ne, type, code) VALUES
  ((SELECT id FROM public.districts WHERE code = 'BHKTPUR'), 'Bhaktapur', 'भक्तपुर', 'municipality', 'BHK001'),
  ((SELECT id FROM public.districts WHERE code = 'BHKTPUR'), 'Madanpur', 'मदनपुर', 'rural_municipality', 'MAD001'),
  ((SELECT id FROM public.districts WHERE code = 'BHKTPUR'), 'Thimi', 'थिमी', 'municipality', 'THI001')
ON CONFLICT DO NOTHING;
