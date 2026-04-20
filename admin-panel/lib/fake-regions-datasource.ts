/**
 * Fake regions datasource — provinces, districts, palikas.
 *
 * Used when NEXT_PUBLIC_USE_FAKE_DATASOURCES=true so the admin panel
 * can run offline without a Supabase instance. Match the column shape
 * returned by the production routes under app/api/palikas/**.
 */

export interface FakeProvince {
  id: number
  name_en: string
  name_ne: string
  code: string
}

export interface FakeDistrict {
  id: number
  name_en: string
  name_ne: string
  code: string
  province_id: number
}

export interface FakePalika {
  id: number
  name_en: string
  name_ne: string
  code: string
  district_id: number
  center_point?: {
    latitude: number
    longitude: number
  } | null
}

const PROVINCES: FakeProvince[] = [
  { id: 1, name_en: 'Koshi', name_ne: 'कोशी', code: 'P1' },
  { id: 3, name_en: 'Bagmati', name_ne: 'बागमती', code: 'P3' },
  { id: 4, name_en: 'Gandaki', name_ne: 'गण्डकी', code: 'P4' },
  { id: 5, name_en: 'Lumbini', name_ne: 'लुम्बिनी', code: 'P5' },
]

const DISTRICTS: FakeDistrict[] = [
  { id: 101, name_en: 'Morang', name_ne: 'मोरङ', code: 'D101', province_id: 1 },
  { id: 102, name_en: 'Sunsari', name_ne: 'सुनसरी', code: 'D102', province_id: 1 },
  { id: 301, name_en: 'Kathmandu', name_ne: 'काठमाडौं', code: 'D301', province_id: 3 },
  { id: 302, name_en: 'Lalitpur', name_ne: 'ललितपुर', code: 'D302', province_id: 3 },
  { id: 303, name_en: 'Bhaktapur', name_ne: 'भक्तपुर', code: 'D303', province_id: 3 },
  { id: 401, name_en: 'Kaski', name_ne: 'कास्की', code: 'D401', province_id: 4 },
  { id: 501, name_en: 'Rupandehi', name_ne: 'रूपन्देही', code: 'D501', province_id: 5 },
]

const PALIKAS: FakePalika[] = [
  { id: 1, name_en: 'Biratnagar Metropolitan', name_ne: 'विराटनगर महानगरपालिका', code: 'PK-BRT', district_id: 101, center_point: { latitude: 26.4847, longitude: 87.2834 } },
  { id: 2, name_en: 'Letang Municipality', name_ne: 'लेटाङ नगरपालिका', code: 'PK-LTG', district_id: 101 },
  { id: 3, name_en: 'Itahari Sub-Metropolitan', name_ne: 'इटहरी उपमहानगरपालिका', code: 'PK-ITH', district_id: 102, center_point: { latitude: 26.6561, longitude: 87.2801 } },
  { id: 4, name_en: 'Dharan Sub-Metropolitan', name_ne: 'धरान उपमहानगरपालिका', code: 'PK-DHR', district_id: 102, center_point: { latitude: 26.8276, longitude: 87.2846 } },
  { id: 5, name_en: 'Kathmandu Metropolitan', name_ne: 'काठमाडौं महानगरपालिका', code: 'PK-KTM', district_id: 301, center_point: { latitude: 27.7172, longitude: 85.3240 } },
  { id: 6, name_en: 'Kirtipur Municipality', name_ne: 'कीर्तिपुर नगरपालिका', code: 'PK-KRT', district_id: 301 },
  { id: 7, name_en: 'Tokha Municipality', name_ne: 'टोखा नगरपालिका', code: 'PK-TKH', district_id: 301 },
  { id: 8, name_en: 'Lalitpur Metropolitan', name_ne: 'ललितपुर महानगरपालिका', code: 'PK-LAL', district_id: 302, center_point: { latitude: 27.6710, longitude: 85.3180 } },
  { id: 9, name_en: 'Godawari Municipality', name_ne: 'गोदावरी नगरपालिका', code: 'PK-GOD', district_id: 302 },
  { id: 10, name_en: 'Bhaktapur Municipality', name_ne: 'भक्तपुर नगरपालिका', code: 'PK-BKT', district_id: 303, center_point: { latitude: 27.6710, longitude: 85.4275 } },
  { id: 11, name_en: 'Madhyapur Thimi Municipality', name_ne: 'मध्यपुर थिमी नगरपालिका', code: 'PK-MDT', district_id: 303 },
  { id: 12, name_en: 'Pokhara Metropolitan', name_ne: 'पोखरा महानगरपालिका', code: 'PK-PKR', district_id: 401, center_point: { latitude: 28.2096, longitude: 84.0079 } },
  { id: 13, name_en: 'Annapurna Rural Municipality', name_ne: 'अन्नपूर्ण गाउँपालिका', code: 'PK-ANP', district_id: 401 },
  { id: 14, name_en: 'Butwal Sub-Metropolitan', name_ne: 'बुटवल उपमहानगरपालिका', code: 'PK-BTW', district_id: 501, center_point: { latitude: 27.7017, longitude: 83.4523 } },
  { id: 15, name_en: 'Siddharthanagar Municipality', name_ne: 'सिद्धार्थनगर नगरपालिका', code: 'PK-SDH', district_id: 501 },
]

const sortByNameEn = <T extends { name_en: string }>(rows: T[]): T[] =>
  [...rows].sort((a, b) => a.name_en.localeCompare(b.name_en))

export function getFakeProvinces(): FakeProvince[] {
  return sortByNameEn(PROVINCES)
}

export function getFakeDistricts(provinceId?: number): FakeDistrict[] {
  const rows = typeof provinceId === 'number'
    ? DISTRICTS.filter(d => d.province_id === provinceId)
    : DISTRICTS
  return sortByNameEn(rows)
}

export function getFakePalikas(districtId?: number): FakePalika[] {
  const rows = typeof districtId === 'number'
    ? PALIKAS.filter(p => p.district_id === districtId)
    : PALIKAS
  return sortByNameEn(rows)
}
