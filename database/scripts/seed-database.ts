#!/usr/bin/env tsx

/**
 * Nepal Digital Tourism Infrastructure - Database Seeding Script
 * 
 * 1. Optionally drops all tables (dev mode)
 * 2. Creates database schema from schema-setup.sql
 * 3. Seeds essential reference data into Supabase database
 * 
 * Usage:
 *   npx tsx seed-database.ts              # Normal seeding
 *   npx tsx seed-database.ts --drop-all   # Drop tables first (dev mode)
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { seedAdminUsers } from './seed-admin-users'

// Load environment variables
config()

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Command line arguments
const args = process.argv.slice(2);

/**
 * Guide the user to set up the database schema manually.
 */
async function setupSchema() {
  console.log('🏗️  Database schema setup required...');
  console.log('');
  console.log('📋 Manual Setup Instructions:');
  console.log('   1. Open your Supabase Project Dashboard → SQL Editor.');
  console.log('   2. Execute the SQL scripts in the following order:');
  console.log('');
  console.log('   STEP 1: Basic Tables');
  console.log("   - Run `npm run copy-part1` to copy the SQL to your clipboard.");
  console.log('   - Paste and run in the SQL Editor.');
  console.log('');
  console.log('   STEP 2: Content Tables');
  console.log("   - Run `npm run copy-part2` to copy the SQL to your clipboard.");
  console.log('   - Paste and run in the SQL Editor.');
  console.log('');
  console.log('   STEP 3: RLS Policies');
  console.log("   - Run `npm run db:copy-rls` to copy the SQL to your clipboard.");
  console.log('   - Paste and run in the SQL Editor.');
  console.log('');
  console.log('   4. After all scripts have been executed successfully, re-run this seeding script.');
  console.log('');
  
  // Check if basic tables exist to determine if schema is already set up
  try {
    const { data, error } = await supabase
      .from('provinces')
      .select('count')
      .limit(1);
    
    if (!error && data) {
      console.log('✅ Schema appears to be already set up (provinces table exists).');
      return true;
    }
  } catch (e) {
    // Table doesn't exist, schema setup needed
  }
  
  console.log('❌ Schema not found. Please follow the manual setup instructions above.');
  console.log('');
  
  return false;
}


// Types for our data structures
interface Province {
  name_en: string
  name_ne: string
  code: string
}

interface District {
  province_code: string
  name_en: string
  name_ne: string
  code: string
}

interface Palika {
  district_code: string
  name_en: string
  name_ne: string
  type: 'municipality' | 'metropolitan' | 'sub_metropolitan' | 'rural_municipality'
  code: string
  total_wards: number
}

interface Category {
  entity_type: 'heritage_site' | 'event' | 'business' | 'blog_post'
  name_en: string
  name_ne: string
  slug: string
  display_order: number
}

// ==========================================
// REFERENCE DATA
// ==========================================
// ============================================
// PROVINCES (7)
// ============================================
const PROVINCES: Province[] = [
  { name_en: 'Koshi Province', name_ne: 'कोशी प्रदेश', code: 'P1' },
  { name_en: 'Madhesh Province', name_ne: 'मधेश प्रदेश', code: 'P2' },
  { name_en: 'Bagmati Province', name_ne: 'बागमती प्रदेश', code: 'P3' },
  { name_en: 'Gandaki Province', name_ne: 'गण्डकी प्रदेश', code: 'P4' },
  { name_en: 'Lumbini Province', name_ne: 'लुम्बिनी प्रदेश', code: 'P5' },
  { name_en: 'Karnali Province', name_ne: 'कर्णाली प्रदेश', code: 'P6' },
  { name_en: 'Sudurpashchim Province', name_ne: 'सुदूरपश्चिम प्रदेश', code: 'P7' }
];

// ============================================
// DISTRICTS (77)
// ============================================
const DISTRICTS: District[] = [
  // Koshi Province (P1) - 14 districts
  { province_code: 'P1', name_en: 'Bhojpur', name_ne: 'भोजपुर', code: 'D01' },
  { province_code: 'P1', name_en: 'Dhankuta', name_ne: 'धनकुटा', code: 'D02' },
  { province_code: 'P1', name_en: 'Ilam', name_ne: 'इलाम', code: 'D03' },
  { province_code: 'P1', name_en: 'Jhapa', name_ne: 'झापा', code: 'D04' },
  { province_code: 'P1', name_en: 'Khotang', name_ne: 'खोटाङ', code: 'D05' },
  { province_code: 'P1', name_en: 'Morang', name_ne: 'मोरङ', code: 'D06' },
  { province_code: 'P1', name_en: 'Okhaldhunga', name_ne: 'ओखलढुङ्गा', code: 'D07' },
  { province_code: 'P1', name_en: 'Panchthar', name_ne: 'पञ्चथर', code: 'D08' },
  { province_code: 'P1', name_en: 'Sankhuwasabha', name_ne: 'संखुवासभा', code: 'D09' },
  { province_code: 'P1', name_en: 'Solukhumbu', name_ne: 'सोलुखुम्बु', code: 'D10' },
  { province_code: 'P1', name_en: 'Sunsari', name_ne: 'सुनसरी', code: 'D11' },
  { province_code: 'P1', name_en: 'Taplejung', name_ne: 'ताप्लेजुङ', code: 'D12' },
  { province_code: 'P1', name_en: 'Terhathum', name_ne: 'तेह्रथुम', code: 'D13' },
  { province_code: 'P1', name_en: 'Udayapur', name_ne: 'उदयपुर', code: 'D14' },

  // Madhesh Province (P2) - 8 districts
  { province_code: 'P2', name_en: 'Saptari', name_ne: 'सप्तरी', code: 'D15' },
  { province_code: 'P2', name_en: 'Siraha', name_ne: 'सिराहा', code: 'D16' },
  { province_code: 'P2', name_en: 'Dhanusa', name_ne: 'धनुषा', code: 'D17' },
  { province_code: 'P2', name_en: 'Mahottari', name_ne: 'महोत्तरी', code: 'D18' },
  { province_code: 'P2', name_en: 'Sarlahi', name_ne: 'सर्लाही', code: 'D19' },
  { province_code: 'P2', name_en: 'Bara', name_ne: 'बारा', code: 'D20' },
  { province_code: 'P2', name_en: 'Parsa', name_ne: 'पर्सा', code: 'D21' },
  { province_code: 'P2', name_en: 'Rautahat', name_ne: 'रौतहट', code: 'D22' },

  // Bagmati Province (P3) - 13 districts
  { province_code: 'P3', name_en: 'Sindhuli', name_ne: 'सिन्धुली', code: 'D23' },
  { province_code: 'P3', name_en: 'Ramechhap', name_ne: 'रामेछाप', code: 'D24' },
  { province_code: 'P3', name_en: 'Dolakha', name_ne: 'डोलखा', code: 'D25' },
  { province_code: 'P3', name_en: 'Bhaktapur', name_ne: 'भक्तपुर', code: 'D26' },
  { province_code: 'P3', name_en: 'Dhading', name_ne: 'धादिङ', code: 'D27' },
  { province_code: 'P3', name_en: 'Kathmandu', name_ne: 'काठमाडौं', code: 'D28' },
  { province_code: 'P3', name_en: 'Kavrepalanchok', name_ne: 'काभ्रेपलाञ्चोक', code: 'D29' },
  { province_code: 'P3', name_en: 'Lalitpur', name_ne: 'ललितपुर', code: 'D30' },
  { province_code: 'P3', name_en: 'Nuwakot', name_ne: 'नुवाकोट', code: 'D31' },
  { province_code: 'P3', name_en: 'Rasuwa', name_ne: 'रसुवा', code: 'D32' },
  { province_code: 'P3', name_en: 'Sindhupalchok', name_ne: 'सिन्धुपाल्चोक', code: 'D33' },
  { province_code: 'P3', name_en: 'Chitwan', name_ne: 'चितवन', code: 'D34' },
  { province_code: 'P3', name_en: 'Makwanpur', name_ne: 'मकवानपुर', code: 'D35' },

  // Gandaki Province (P4) - 11 districts
  { province_code: 'P4', name_en: 'Gorkha', name_ne: 'गोरखा', code: 'D36' },
  { province_code: 'P4', name_en: 'Lamjung', name_ne: 'लमजुङ', code: 'D37' },
  { province_code: 'P4', name_en: 'Tanahun', name_ne: 'तनहुँ', code: 'D38' },
  { province_code: 'P4', name_en: 'Kaski', name_ne: 'कास्की', code: 'D39' },
  { province_code: 'P4', name_en: 'Manang', name_ne: 'मनाङ', code: 'D40' },
  { province_code: 'P4', name_en: 'Mustang', name_ne: 'मुस्ताङ', code: 'D41' },
  { province_code: 'P4', name_en: 'Parbat', name_ne: 'पर्वत', code: 'D42' },
  { province_code: 'P4', name_en: 'Syangja', name_ne: 'स्याङ्जा', code: 'D43' },
  { province_code: 'P4', name_en: 'Myagdi', name_ne: 'म्याग्दी', code: 'D44' },
  { province_code: 'P4', name_en: 'Baglung', name_ne: 'बागलुङ', code: 'D45' },
  { province_code: 'P4', name_en: 'Nawalpur', name_ne: 'नवलपुर', code: 'D46' },

  // Lumbini Province (P5) - 12 districts
  { province_code: 'P5', name_en: 'Arghakhanchi', name_ne: 'अर्घाखाँची', code: 'D47' },
  { province_code: 'P5', name_en: 'Banke', name_ne: 'बाँके', code: 'D48' },
  { province_code: 'P5', name_en: 'Bardiya', name_ne: 'बर्दिया', code: 'D49' },
  { province_code: 'P5', name_en: 'Dang', name_ne: 'दाङ', code: 'D50' },
  { province_code: 'P5', name_en: 'Gulmi', name_ne: 'गुल्मी', code: 'D51' },
  { province_code: 'P5', name_en: 'Kapilvastu', name_ne: 'कपिलवस्तु', code: 'D52' },
  { province_code: 'P5', name_en: 'Parasi', name_ne: 'परासी', code: 'D53' },
  { province_code: 'P5', name_en: 'Palpa', name_ne: 'पाल्पा', code: 'D54' },
  { province_code: 'P5', name_en: 'Pyuthan', name_ne: 'प्यूठान', code: 'D55' },
  { province_code: 'P5', name_en: 'Rolpa', name_ne: 'रोल्पा', code: 'D56' },
  { province_code: 'P5', name_en: 'Rukum East', name_ne: 'पूर्वी रुकुम', code: 'D57' },
  { province_code: 'P5', name_en: 'Rupandehi', name_ne: 'रुपन्देही', code: 'D58' },

  // Karnali Province (P6) - 10 districts
  { province_code: 'P6', name_en: 'Dolpa', name_ne: 'डोल्पा', code: 'D59' },
  { province_code: 'P6', name_en: 'Jumla', name_ne: 'जुम्ला', code: 'D60' },
  { province_code: 'P6', name_en: 'Mugu', name_ne: 'मुगु', code: 'D61' },
  { province_code: 'P6', name_en: 'Humla', name_ne: 'हुम्ला', code: 'D62' },
  { province_code: 'P6', name_en: 'Kalikot', name_ne: 'कालिकोट', code: 'D63' },
  { province_code: 'P6', name_en: 'Jajarkot', name_ne: 'जाजरकोट', code: 'D64' },
  { province_code: 'P6', name_en: 'Dailekh', name_ne: 'दैलेख', code: 'D65' },
  { province_code: 'P6', name_en: 'Salyan', name_ne: 'सल्यान', code: 'D66' },
  { province_code: 'P6', name_en: 'Surkhet', name_ne: 'सुर्खेत', code: 'D67' },
  { province_code: 'P6', name_en: 'Rukum West', name_ne: 'पश्चिमी रुकुम', code: 'D68' },

  // Sudurpashchim Province (P7) - 9 districts
  { province_code: 'P7', name_en: 'Bajura', name_ne: 'बाजुरा', code: 'D69' },
  { province_code: 'P7', name_en: 'Bajhang', name_ne: 'बझाङ', code: 'D70' },
  { province_code: 'P7', name_en: 'Doti', name_ne: 'डोटी', code: 'D71' },
  { province_code: 'P7', name_en: 'Achham', name_ne: 'अछाम', code: 'D72' },
  { province_code: 'P7', name_en: 'Darchula', name_ne: 'डार्चुला', code: 'D73' },
  { province_code: 'P7', name_en: 'Baitadi', name_ne: 'बैतडी', code: 'D74' },
  { province_code: 'P7', name_en: 'Dadeldhura', name_ne: 'डडेलधुरा', code: 'D75' },
  { province_code: 'P7', name_en: 'Kanchanpur', name_ne: 'कञ्चनपुर', code: 'D76' },
  { province_code: 'P7', name_en: 'Kailali', name_ne: 'कैलाली', code: 'D77' }
];

// ============================================
// PALIKAS (753 Local Units)
// 6 Metropolitan, 11 Sub-Metropolitan, 276 Municipalities, 460 Rural Municipalities
// ============================================
const PALIKAS: Palika[] = [
  // ============================================
  // KOSHI PROVINCE (P1)
  // ============================================

  // Bhojpur District (D01) - 9 palikas
  { district_code: 'D01', name_en: 'Bhojpur Municipality', name_ne: 'भोजपुर नगरपालिका', type: 'municipality', code: 'D01-M01', total_wards: 14 },
  { district_code: 'D01', name_en: 'Shadananda Municipality', name_ne: 'षडानन्द नगरपालिका', type: 'municipality', code: 'D01-M02', total_wards: 10 },
  { district_code: 'D01', name_en: 'Aamchok Rural Municipality', name_ne: 'आमचोक गाउँपालिका', type: 'rural_municipality', code: 'D01-R01', total_wards: 7 },
  { district_code: 'D01', name_en: 'Arun Rural Municipality', name_ne: 'अरुण गाउँपालिका', type: 'rural_municipality', code: 'D01-R02', total_wards: 8 },
  { district_code: 'D01', name_en: 'Hatuwagadhi Rural Municipality', name_ne: 'हतुवागढी गाउँपालिका', type: 'rural_municipality', code: 'D01-R03', total_wards: 9 },
  { district_code: 'D01', name_en: 'Pauwadungma Rural Municipality', name_ne: 'पौवादुङमा गाउँपालिका', type: 'rural_municipality', code: 'D01-R04', total_wards: 7 },
  { district_code: 'D01', name_en: 'Ramprasad Rai Rural Municipality', name_ne: 'रामप्रसाद राई गाउँपालिका', type: 'rural_municipality', code: 'D01-R05', total_wards: 6 },
  { district_code: 'D01', name_en: 'Salpasilichho Rural Municipality', name_ne: 'साल्पासिलिछो गाउँपालिका', type: 'rural_municipality', code: 'D01-R06', total_wards: 6 },
  { district_code: 'D01', name_en: 'Tyamkemaiyung Rural Municipality', name_ne: 'टेम्केमैयुङ गाउँपालिका', type: 'rural_municipality', code: 'D01-R07', total_wards: 7 },

  // Dhankuta District (D02) - 7 palikas
  { district_code: 'D02', name_en: 'Dhankuta Municipality', name_ne: 'धनकुटा नगरपालिका', type: 'municipality', code: 'D02-M01', total_wards: 10 },
  { district_code: 'D02', name_en: 'Mahalaxmi Municipality', name_ne: 'महालक्ष्मी नगरपालिका', type: 'municipality', code: 'D02-M02', total_wards: 9 },
  { district_code: 'D02', name_en: 'Pakhribas Municipality', name_ne: 'पाख्रीबास नगरपालिका', type: 'municipality', code: 'D02-M03', total_wards: 11 },
  { district_code: 'D02', name_en: 'Chaubise Rural Municipality', name_ne: 'चौविसे गाउँपालिका', type: 'rural_municipality', code: 'D02-R01', total_wards: 9 },
  { district_code: 'D02', name_en: 'Chhathar Jorpati Rural Municipality', name_ne: 'छथर जोरपाटी गाउँपालिका', type: 'rural_municipality', code: 'D02-R02', total_wards: 7 },
  { district_code: 'D02', name_en: 'Sahidbhumi Rural Municipality', name_ne: 'सहिदभूमि गाउँपालिका', type: 'rural_municipality', code: 'D02-R03', total_wards: 7 },
  { district_code: 'D02', name_en: 'Sangurigadhi Rural Municipality', name_ne: 'सागुरीगढी गाउँपालिका', type: 'rural_municipality', code: 'D02-R04', total_wards: 8 },

  // Ilam District (D03) - 10 palikas
  { district_code: 'D03', name_en: 'Ilam Municipality', name_ne: 'इलाम नगरपालिका', type: 'municipality', code: 'D03-M01', total_wards: 12 },
  { district_code: 'D03', name_en: 'Deumai Municipality', name_ne: 'देउमाई नगरपालिका', type: 'municipality', code: 'D03-M02', total_wards: 9 },
  { district_code: 'D03', name_en: 'Mai Municipality', name_ne: 'माई नगरपालिका', type: 'municipality', code: 'D03-M03', total_wards: 12 },
  { district_code: 'D03', name_en: 'Suryodaya Municipality', name_ne: 'सूर्योदय नगरपालिका', type: 'municipality', code: 'D03-M04', total_wards: 14 },
  { district_code: 'D03', name_en: 'Chulachuli Rural Municipality', name_ne: 'चुलाचुली गाउँपालिका', type: 'rural_municipality', code: 'D03-R01', total_wards: 7 },
  { district_code: 'D03', name_en: 'Maijogmai Rural Municipality', name_ne: 'माईजोगमाई गाउँपालिका', type: 'rural_municipality', code: 'D03-R02', total_wards: 6 },
  { district_code: 'D03', name_en: 'Mangsebung Rural Municipality', name_ne: 'माङसेबुङ गाउँपालिका', type: 'rural_municipality', code: 'D03-R03', total_wards: 5 },
  { district_code: 'D03', name_en: 'Phakphokthum Rural Municipality', name_ne: 'फाकफोकथुम गाउँपालिका', type: 'rural_municipality', code: 'D03-R04', total_wards: 7 },
  { district_code: 'D03', name_en: 'Rong Rural Municipality', name_ne: 'रोङ गाउँपालिका', type: 'rural_municipality', code: 'D03-R05', total_wards: 6 },
  { district_code: 'D03', name_en: 'Sandakpur Rural Municipality', name_ne: 'सन्दकपुर गाउँपालिका', type: 'rural_municipality', code: 'D03-R06', total_wards: 6 },

  // Jhapa District (D04) - 15 palikas
  { district_code: 'D04', name_en: 'Mechinagar Municipality', name_ne: 'मेचीनगर नगरपालिका', type: 'municipality', code: 'D04-M01', total_wards: 15 },
  { district_code: 'D04', name_en: 'Bhadrapur Municipality', name_ne: 'भद्रपुर नगरपालिका', type: 'municipality', code: 'D04-M02', total_wards: 10 },
  { district_code: 'D04', name_en: 'Birtamod Municipality', name_ne: 'बिर्तामोड नगरपालिका', type: 'municipality', code: 'D04-M03', total_wards: 11 },
  { district_code: 'D04', name_en: 'Damak Municipality', name_ne: 'दमक नगरपालिका', type: 'municipality', code: 'D04-M04', total_wards: 11 },
  { district_code: 'D04', name_en: 'Kankai Municipality', name_ne: 'कनकाई नगरपालिका', type: 'municipality', code: 'D04-M05', total_wards: 9 },
  { district_code: 'D04', name_en: 'Shivasatakshi Municipality', name_ne: 'शिवसताक्षी नगरपालिका', type: 'municipality', code: 'D04-M06', total_wards: 11 },
  { district_code: 'D04', name_en: 'Arjundhara Municipality', name_ne: 'अर्जुनधारा नगरपालिका', type: 'municipality', code: 'D04-M07', total_wards: 9 },
  { district_code: 'D04', name_en: 'Gauradaha Municipality', name_ne: 'गौरादह नगरपालिका', type: 'municipality', code: 'D04-M08', total_wards: 9 },
  { district_code: 'D04', name_en: 'Bahradashi Rural Municipality', name_ne: 'बाह्रदशी गाउँपालिका', type: 'rural_municipality', code: 'D04-R01', total_wards: 8 },
  { district_code: 'D04', name_en: 'Buddhashanti Rural Municipality', name_ne: 'बुद्धशान्ति गाउँपालिका', type: 'rural_municipality', code: 'D04-R02', total_wards: 9 },
  { district_code: 'D04', name_en: 'Gaurigunj Rural Municipality', name_ne: 'गौरीगंज गाउँपालिका', type: 'rural_municipality', code: 'D04-R03', total_wards: 7 },
  { district_code: 'D04', name_en: 'Haldibari Rural Municipality', name_ne: 'हल्दीबारी गाउँपालिका', type: 'rural_municipality', code: 'D04-R04', total_wards: 7 },
  { district_code: 'D04', name_en: 'Jhapa Rural Municipality', name_ne: 'झापा गाउँपालिका', type: 'rural_municipality', code: 'D04-R05', total_wards: 7 },
  { district_code: 'D04', name_en: 'Kachankawal Rural Municipality', name_ne: 'कचनकवल गाउँपालिका', type: 'rural_municipality', code: 'D04-R06', total_wards: 9 },
  { district_code: 'D04', name_en: 'Kamal Rural Municipality', name_ne: 'कमल गाउँपालिका', type: 'rural_municipality', code: 'D04-R07', total_wards: 8 },

  // Khotang District (D05) - 8 palikas
  { district_code: 'D05', name_en: 'Halesi Tuwachung Municipality', name_ne: 'हलेसी तुवाचुङ नगरपालिका', type: 'municipality', code: 'D05-M01', total_wards: 9 },
  { district_code: 'D05', name_en: 'Rupakot Majhuwagadhi Municipality', name_ne: 'रुपाकोट मझुवागढी नगरपालिका', type: 'municipality', code: 'D05-M02', total_wards: 9 },
  { district_code: 'D05', name_en: 'Diktel Rupakot Majhuwagadhi Municipality', name_ne: 'दिक्तेल रुपाकोट मझुवागढी नगरपालिका', type: 'municipality', code: 'D05-M03', total_wards: 10 },
  { district_code: 'D05', name_en: 'Aiselukharka Rural Municipality', name_ne: 'ऐसेलुखर्क गाउँपालिका', type: 'rural_municipality', code: 'D05-R01', total_wards: 6 },
  { district_code: 'D05', name_en: 'Barahapokhari Rural Municipality', name_ne: 'बराहपोखरी गाउँपालिका', type: 'rural_municipality', code: 'D05-R02', total_wards: 7 },
  { district_code: 'D05', name_en: 'Jantedhunga Rural Municipality', name_ne: 'जन्तेढुंगा गाउँपालिका', type: 'rural_municipality', code: 'D05-R03', total_wards: 6 },
  { district_code: 'D05', name_en: 'Khotehang Rural Municipality', name_ne: 'खोटेहाङ गाउँपालिका', type: 'rural_municipality', code: 'D05-R04', total_wards: 7 },
  { district_code: 'D05', name_en: 'Rawabesi Rural Municipality', name_ne: 'रावाबेसी गाउँपालिका', type: 'rural_municipality', code: 'D05-R05', total_wards: 6 },
  { district_code: 'D05', name_en: 'Sakela Rural Municipality', name_ne: 'साकेला गाउँपालिका', type: 'rural_municipality', code: 'D05-R06', total_wards: 6 },
  { district_code: 'D05', name_en: 'Kepilasgadhi Rural Municipality', name_ne: 'केपिलासगढी गाउँपालिका', type: 'rural_municipality', code: 'D05-R07', total_wards: 5 },
  { district_code: 'D05', name_en: 'Lamidanda Rural Municipality', name_ne: 'लामिडाँडा गाउँपालिका', type: 'rural_municipality', code: 'D05-R08', total_wards: 5 },

  // Morang District (D06) - 17 palikas
  { district_code: 'D06', name_en: 'Biratnagar Metropolitan', name_ne: 'विराटनगर महानगरपालिका', type: 'metropolitan', code: 'D06-MT01', total_wards: 19 },
  { district_code: 'D06', name_en: 'Belbari Municipality', name_ne: 'बेलवारी नगरपालिका', type: 'municipality', code: 'D06-M01', total_wards: 11 },
  { district_code: 'D06', name_en: 'Urlabari Municipality', name_ne: 'उर्लाबारी नगरपालिका', type: 'municipality', code: 'D06-M02', total_wards: 11 },
  { district_code: 'D06', name_en: 'Rangeli Municipality', name_ne: 'रंगेली नगरपालिका', type: 'municipality', code: 'D06-M03', total_wards: 10 },
  { district_code: 'D06', name_en: 'Sundar Haraicha Municipality', name_ne: 'सुन्दर हरैचा नगरपालिका', type: 'municipality', code: 'D06-M04', total_wards: 12 },
  { district_code: 'D06', name_en: 'Pathari Shanishchare Municipality', name_ne: 'पथरी शनिश्चरे नगरपालिका', type: 'municipality', code: 'D06-M05', total_wards: 12 },
  { district_code: 'D06', name_en: 'Ratuwamai Municipality', name_ne: 'रतुवामाई नगरपालिका', type: 'municipality', code: 'D06-M06', total_wards: 11 },
  { district_code: 'D06', name_en: 'Letang Municipality', name_ne: 'लेटाङ नगरपालिका', type: 'municipality', code: 'D06-M07', total_wards: 10 },
  { district_code: 'D06', name_en: 'Sunawarshi Municipality', name_ne: 'सुनवर्षि नगरपालिका', type: 'municipality', code: 'D06-M08', total_wards: 9 },
  { district_code: 'D06', name_en: 'Budhiganga Rural Municipality', name_ne: 'बुढीगंगा गाउँपालिका', type: 'rural_municipality', code: 'D06-R01', total_wards: 7 },
  { district_code: 'D06', name_en: 'Dhanpalthan Rural Municipality', name_ne: 'धनपालथान गाउँपालिका', type: 'rural_municipality', code: 'D06-R02', total_wards: 7 },
  { district_code: 'D06', name_en: 'Gramthan Rural Municipality', name_ne: 'ग्रामथान गाउँपालिका', type: 'rural_municipality', code: 'D06-R03', total_wards: 7 },
  { district_code: 'D06', name_en: 'Jahada Rural Municipality', name_ne: 'जहदा गाउँपालिका', type: 'rural_municipality', code: 'D06-R04', total_wards: 5 },
  { district_code: 'D06', name_en: 'Kanepokhari Rural Municipality', name_ne: 'कानेपोखरी गाउँपालिका', type: 'rural_municipality', code: 'D06-R05', total_wards: 7 },
  { district_code: 'D06', name_en: 'Katahari Rural Municipality', name_ne: 'कटहरी गाउँपालिका', type: 'rural_municipality', code: 'D06-R06', total_wards: 8 },
  { district_code: 'D06', name_en: 'Kerabari Rural Municipality', name_ne: 'केराबारी गाउँपालिका', type: 'rural_municipality', code: 'D06-R07', total_wards: 7 },
  { district_code: 'D06', name_en: 'Miklajung Rural Municipality', name_ne: 'मिक्लाजुङ गाउँपालिका', type: 'rural_municipality', code: 'D06-R08', total_wards: 6 },

  // Okhaldhunga District (D07) - 8 palikas
  { district_code: 'D07', name_en: 'Siddhicharan Municipality', name_ne: 'सिद्धिचरण नगरपालिका', type: 'municipality', code: 'D07-M01', total_wards: 9 },
  { district_code: 'D07', name_en: 'Champadevi Rural Municipality', name_ne: 'चम्पादेवी गाउँपालिका', type: 'rural_municipality', code: 'D07-R01', total_wards: 5 },
  { district_code: 'D07', name_en: 'Chisankhugadhi Rural Municipality', name_ne: 'चिसंखुगढी गाउँपालिका', type: 'rural_municipality', code: 'D07-R02', total_wards: 7 },
  { district_code: 'D07', name_en: 'Khijidemba Rural Municipality', name_ne: 'खिजीदेम्बा गाउँपालिका', type: 'rural_municipality', code: 'D07-R03', total_wards: 7 },
  { district_code: 'D07', name_en: 'Likhu Rural Municipality', name_ne: 'लिखु गाउँपालिका', type: 'rural_municipality', code: 'D07-R04', total_wards: 7 },
  { district_code: 'D07', name_en: 'Manebhanjyang Rural Municipality', name_ne: 'मानेभञ्ज्याङ गाउँपालिका', type: 'rural_municipality', code: 'D07-R05', total_wards: 5 },
  { district_code: 'D07', name_en: 'Molung Rural Municipality', name_ne: 'मोलुङ गाउँपालिका', type: 'rural_municipality', code: 'D07-R06', total_wards: 7 },
  { district_code: 'D07', name_en: 'Sunkoshi Rural Municipality', name_ne: 'सुनकोशी गाउँपालिका', type: 'rural_municipality', code: 'D07-R07', total_wards: 6 },

  // Panchthar District (D08) - 8 palikas
  { district_code: 'D08', name_en: 'Phidim Municipality', name_ne: 'फिदिम नगरपालिका', type: 'municipality', code: 'D08-M01', total_wards: 14 },
  { district_code: 'D08', name_en: 'Falgunanda Rural Municipality', name_ne: 'फाल्गुनन्द गाउँपालिका', type: 'rural_municipality', code: 'D08-R01', total_wards: 7 },
  { district_code: 'D08', name_en: 'Hilihang Rural Municipality', name_ne: 'हिलिहाङ गाउँपालिका', type: 'rural_municipality', code: 'D08-R02', total_wards: 6 },
  { district_code: 'D08', name_en: 'Kummayak Rural Municipality', name_ne: 'कुम्मायक गाउँपालिका', type: 'rural_municipality', code: 'D08-R03', total_wards: 5 },
  { district_code: 'D08', name_en: 'Miklajung Rural Municipality', name_ne: 'मिक्लाजुङ गाउँपालिका', type: 'rural_municipality', code: 'D08-R04', total_wards: 6 },
  { district_code: 'D08', name_en: 'Phalelung Rural Municipality', name_ne: 'फालेलुङ गाउँपालिका', type: 'rural_municipality', code: 'D08-R05', total_wards: 7 },
  { district_code: 'D08', name_en: 'Tumbewa Rural Municipality', name_ne: 'तुम्बेवा गाउँपालिका', type: 'rural_municipality', code: 'D08-R06', total_wards: 5 },
  { district_code: 'D08', name_en: 'Yangwarak Rural Municipality', name_ne: 'याङवरक गाउँपालिका', type: 'rural_municipality', code: 'D08-R07', total_wards: 6 },

  // Sankhuwasabha District (D09) - 10 palikas
  { district_code: 'D09', name_en: 'Khandbari Municipality', name_ne: 'खाँदबारी नगरपालिका', type: 'municipality', code: 'D09-M01', total_wards: 11 },
  { district_code: 'D09', name_en: 'Chainpur Municipality', name_ne: 'चैनपुर नगरपालिका', type: 'municipality', code: 'D09-M02', total_wards: 11 },
  { district_code: 'D09', name_en: 'Dharmadevi Municipality', name_ne: 'धर्मदेवी नगरपालिका', type: 'municipality', code: 'D09-M03', total_wards: 9 },
  { district_code: 'D09', name_en: 'Madi Municipality', name_ne: 'माडी नगरपालिका', type: 'municipality', code: 'D09-M04', total_wards: 9 },
  { district_code: 'D09', name_en: 'Panchkhapan Municipality', name_ne: 'पाँचखपन नगरपालिका', type: 'municipality', code: 'D09-M05', total_wards: 9 },
  { district_code: 'D09', name_en: 'Bhotkhola Rural Municipality', name_ne: 'भोटखोला गाउँपालिका', type: 'rural_municipality', code: 'D09-R01', total_wards: 5 },
  { district_code: 'D09', name_en: 'Chichila Rural Municipality', name_ne: 'चिचिला गाउँपालिका', type: 'rural_municipality', code: 'D09-R02', total_wards: 5 },
  { district_code: 'D09', name_en: 'Makalu Rural Municipality', name_ne: 'मकालु गाउँपालिका', type: 'rural_municipality', code: 'D09-R03', total_wards: 6 },
  { district_code: 'D09', name_en: 'Sabhapokhari Rural Municipality', name_ne: 'सभापोखरी गाउँपालिका', type: 'rural_municipality', code: 'D09-R04', total_wards: 6 },
  { district_code: 'D09', name_en: 'Silichong Rural Municipality', name_ne: 'सिलीचोङ गाउँपालिका', type: 'rural_municipality', code: 'D09-R05', total_wards: 5 },

  // Solukhumbu District (D10) - 8 palikas
  { district_code: 'D10', name_en: 'Solududhkunda Municipality', name_ne: 'सोलुदुधकुण्ड नगरपालिका', type: 'municipality', code: 'D10-M01', total_wards: 9 },
  { district_code: 'D10', name_en: 'Dudhauli Municipality', name_ne: 'दुधकौशी गाउँपालिका', type: 'rural_municipality', code: 'D10-R01', total_wards: 9 },
  { district_code: 'D10', name_en: 'Khumbu Pasanglhamu Rural Municipality', name_ne: 'खुम्बु पासाङल्हामु गाउँपालिका', type: 'rural_municipality', code: 'D10-R02', total_wards: 6 },
  { district_code: 'D10', name_en: 'Likhupike Rural Municipality', name_ne: 'लिखुपिके गाउँपालिका', type: 'rural_municipality', code: 'D10-R03', total_wards: 6 },
  { district_code: 'D10', name_en: 'Mahakulung Rural Municipality', name_ne: 'महाकुलुङ गाउँपालिका', type: 'rural_municipality', code: 'D10-R04', total_wards: 5 },
  { district_code: 'D10', name_en: 'Mapya Dudhkoshi Rural Municipality', name_ne: 'माप्य दुधकोशी गाउँपालिका', type: 'rural_municipality', code: 'D10-R05', total_wards: 7 },
  { district_code: 'D10', name_en: 'Necha Salyan Rural Municipality', name_ne: 'नेचासल्यान गाउँपालिका', type: 'rural_municipality', code: 'D10-R06', total_wards: 5 },
  { district_code: 'D10', name_en: 'Thulung Dudhkoshi Rural Municipality', name_ne: 'थुलुङ दुधकोशी गाउँपालिका', type: 'rural_municipality', code: 'D10-R07', total_wards: 8 },

  // Sunsari District (D11) - 12 palikas
  { district_code: 'D11', name_en: 'Itahari Sub-Metropolitan', name_ne: 'इटहरी उपमहानगरपालिका', type: 'sub_metropolitan', code: 'D11-SM01', total_wards: 20 },
  { district_code: 'D11', name_en: 'Dharan Sub-Metropolitan', name_ne: 'धरान उपमहानगरपालिका', type: 'sub_metropolitan', code: 'D11-SM02', total_wards: 20 },
  { district_code: 'D11', name_en: 'Inaruwa Municipality', name_ne: 'इनरुवा नगरपालिका', type: 'municipality', code: 'D11-M01', total_wards: 12 },
  { district_code: 'D11', name_en: 'Duhabi Municipality', name_ne: 'दुहवी नगरपालिका', type: 'municipality', code: 'D11-M02', total_wards: 13 },
  { district_code: 'D11', name_en: 'Barahakshetra Municipality', name_ne: 'बराहक्षेत्र नगरपालिका', type: 'municipality', code: 'D11-M03', total_wards: 12 },
  { district_code: 'D11', name_en: 'Ramdhuni Municipality', name_ne: 'रामधुनी नगरपालिका', type: 'municipality', code: 'D11-M04', total_wards: 11 },
  { district_code: 'D11', name_en: 'Bhokraha Narsingh Rural Municipality', name_ne: 'भोक्राहा नरसिंह गाउँपालिका', type: 'rural_municipality', code: 'D11-R01', total_wards: 7 },
  { district_code: 'D11', name_en: 'Dewanganj Rural Municipality', name_ne: 'देवानगञ्ज गाउँपालिका', type: 'rural_municipality', code: 'D11-R02', total_wards: 6 },
  { district_code: 'D11', name_en: 'Gadhi Rural Municipality', name_ne: 'गढी गाउँपालिका', type: 'rural_municipality', code: 'D11-R03', total_wards: 6 },
  { district_code: 'D11', name_en: 'Harinagar Rural Municipality', name_ne: 'हरिनगर गाउँपालिका', type: 'rural_municipality', code: 'D11-R04', total_wards: 6 },
  { district_code: 'D11', name_en: 'Koshi Rural Municipality', name_ne: 'कोशी गाउँपालिका', type: 'rural_municipality', code: 'D11-R05', total_wards: 6 },
  { district_code: 'D11', name_en: 'Barju Rural Municipality', name_ne: 'बर्जु गाउँपालिका', type: 'rural_municipality', code: 'D11-R06', total_wards: 6 },

  // Taplejung District (D12) - 9 palikas
  { district_code: 'D12', name_en: 'Phungling Municipality', name_ne: 'फुङलिङ नगरपालिका', type: 'municipality', code: 'D12-M01', total_wards: 10 },
  { district_code: 'D12', name_en: 'Aathrai Tribeni Rural Municipality', name_ne: 'आठराई त्रिवेणी गाउँपालिका', type: 'rural_municipality', code: 'D12-R01', total_wards: 6 },
  { district_code: 'D12', name_en: 'Meringden Rural Municipality', name_ne: 'मेरिङदेन गाउँपालिका', type: 'rural_municipality', code: 'D12-R02', total_wards: 5 },
  { district_code: 'D12', name_en: 'Mikwakhola Rural Municipality', name_ne: 'मिक्वाखोला गाउँपालिका', type: 'rural_municipality', code: 'D12-R03', total_wards: 5 },
  { district_code: 'D12', name_en: 'Pathibhara Yangwarak Rural Municipality', name_ne: 'पाथीभरा याङवरक गाउँपालिका', type: 'rural_municipality', code: 'D12-R04', total_wards: 5 },
  { district_code: 'D12', name_en: 'Phaktanglung Rural Municipality', name_ne: 'फक्ताङलुङ गाउँपालिका', type: 'rural_municipality', code: 'D12-R05', total_wards: 7 },
  { district_code: 'D12', name_en: 'Sidingba Rural Municipality', name_ne: 'सिदिङ्बा गाउँपालिका', type: 'rural_municipality', code: 'D12-R06', total_wards: 5 },
  { district_code: 'D12', name_en: 'Sirijangha Rural Municipality', name_ne: 'सिरीजङ्घा गाउँपालिका', type: 'rural_municipality', code: 'D12-R07', total_wards: 5 },
  { district_code: 'D12', name_en: 'Maiwakhola Rural Municipality', name_ne: 'मैवाखोला गाउँपालिका', type: 'rural_municipality', code: 'D12-R08', total_wards: 5 },

  // Terhathum District (D13) - 6 palikas
  { district_code: 'D13', name_en: 'Myanglung Municipality', name_ne: 'म्याङलुङ नगरपालिका', type: 'municipality', code: 'D13-M01', total_wards: 10 },
  { district_code: 'D13', name_en: 'Laligurans Municipality', name_ne: 'लालीगुराँस नगरपालिका', type: 'municipality', code: 'D13-M02', total_wards: 9 },
  { district_code: 'D13', name_en: 'Aathrai Rural Municipality', name_ne: 'आठराई गाउँपालिका', type: 'rural_municipality', code: 'D13-R01', total_wards: 6 },
  { district_code: 'D13', name_en: 'Chhathar Rural Municipality', name_ne: 'छथर गाउँपालिका', type: 'rural_municipality', code: 'D13-R02', total_wards: 6 },
  { district_code: 'D13', name_en: 'Menchayam Rural Municipality', name_ne: 'मेन्छायम गाउँपालिका', type: 'rural_municipality', code: 'D13-R03', total_wards: 5 },
  { district_code: 'D13', name_en: 'Phedap Rural Municipality', name_ne: 'फेदाप गाउँपालिका', type: 'rural_municipality', code: 'D13-R04', total_wards: 7 },

  // Udayapur District (D14) - 8 palikas
  { district_code: 'D14', name_en: 'Triyuga Municipality', name_ne: 'त्रियुगा नगरपालिका', type: 'municipality', code: 'D14-M01', total_wards: 17 },
  { district_code: 'D14', name_en: 'Katari Municipality', name_ne: 'कटारी नगरपालिका', type: 'municipality', code: 'D14-M02', total_wards: 14 },
  { district_code: 'D14', name_en: 'Chaudandigadhi Municipality', name_ne: 'चौदण्डीगढी नगरपालिका', type: 'municipality', code: 'D14-M03', total_wards: 13 },
  { district_code: 'D14', name_en: 'Belaka Municipality', name_ne: 'बेलका नगरपालिका', type: 'municipality', code: 'D14-M04', total_wards: 10 },
  { district_code: 'D14', name_en: 'Udayapurgadhi Rural Municipality', name_ne: 'उदयपुरगढी गाउँपालिका', type: 'rural_municipality', code: 'D14-R01', total_wards: 9 },
  { district_code: 'D14', name_en: 'Rautamai Rural Municipality', name_ne: 'रौतामाई गाउँपालिका', type: 'rural_municipality', code: 'D14-R02', total_wards: 7 },
  { district_code: 'D14', name_en: 'Tapli Rural Municipality', name_ne: 'ताप्ली गाउँपालिका', type: 'rural_municipality', code: 'D14-R03', total_wards: 6 },
  { district_code: 'D14', name_en: 'Limchungbung Rural Municipality', name_ne: 'लिम्चुङबुङ गाउँपालिका', type: 'rural_municipality', code: 'D14-R04', total_wards: 5 },

  // ============================================
  // MADHESH PROVINCE (P2)
  // ============================================

  // Saptari District (D15) - 18 palikas
  { district_code: 'D15', name_en: 'Rajbiraj Municipality', name_ne: 'राजविराज नगरपालिका', type: 'municipality', code: 'D15-M01', total_wards: 21 },
  { district_code: 'D15', name_en: 'Kanchanrup Municipality', name_ne: 'कञ्चनरुप नगरपालिका', type: 'municipality', code: 'D15-M02', total_wards: 11 },
  { district_code: 'D15', name_en: 'Dakneshwari Municipality', name_ne: 'डाक्नेश्वरी नगरपालिका', type: 'municipality', code: 'D15-M03', total_wards: 10 },
  { district_code: 'D15', name_en: 'Bodebarsain Municipality', name_ne: 'बोदेबरसाइन नगरपालिका', type: 'municipality', code: 'D15-M04', total_wards: 9 },
  { district_code: 'D15', name_en: 'Khadak Municipality', name_ne: 'खडक नगरपालिका', type: 'municipality', code: 'D15-M05', total_wards: 10 },
  { district_code: 'D15', name_en: 'Shambhunath Municipality', name_ne: 'शम्भुनाथ नगरपालिका', type: 'municipality', code: 'D15-M06', total_wards: 11 },
  { district_code: 'D15', name_en: 'Hanumannagar Kankalini Municipality', name_ne: 'हनुमाननगर कंकालिनी नगरपालिका', type: 'municipality', code: 'D15-M07', total_wards: 12 },
  { district_code: 'D15', name_en: 'Saptakoshi Municipality', name_ne: 'सप्तकोशी नगरपालिका', type: 'municipality', code: 'D15-M08', total_wards: 11 },
  { district_code: 'D15', name_en: 'Surunga Municipality', name_ne: 'सुरुंगा नगरपालिका', type: 'municipality', code: 'D15-M09', total_wards: 10 },
  { district_code: 'D15', name_en: 'Agnisaira Krishnasavaran Rural Municipality', name_ne: 'अग्निसाइर कृष्णसवरन गाउँपालिका', type: 'rural_municipality', code: 'D15-R01', total_wards: 8 },
  { district_code: 'D15', name_en: 'Balan Bihul Rural Municipality', name_ne: 'बलान बिहुल गाउँपालिका', type: 'rural_municipality', code: 'D15-R02', total_wards: 6 },
  { district_code: 'D15', name_en: 'Bishnupur Rural Municipality', name_ne: 'विष्णुपुर गाउँपालिका', type: 'rural_municipality', code: 'D15-R03', total_wards: 7 },
  { district_code: 'D15', name_en: 'Chhinnamasta Rural Municipality', name_ne: 'छिन्नमस्ता गाउँपालिका', type: 'rural_municipality', code: 'D15-R04', total_wards: 8 },
  { district_code: 'D15', name_en: 'Mahadeva Rural Municipality', name_ne: 'महादेवा गाउँपालिका', type: 'rural_municipality', code: 'D15-R05', total_wards: 6 },
  { district_code: 'D15', name_en: 'Rupani Rural Municipality', name_ne: 'रुपनी गाउँपालिका', type: 'rural_municipality', code: 'D15-R06', total_wards: 7 },
  { district_code: 'D15', name_en: 'Rajgadh Rural Municipality', name_ne: 'राजगढ गाउँपालिका', type: 'rural_municipality', code: 'D15-R07', total_wards: 6 },
  { district_code: 'D15', name_en: 'Tilathi Koiladi Rural Municipality', name_ne: 'तिलाठी कोइलाडी गाउँपालिका', type: 'rural_municipality', code: 'D15-R08', total_wards: 9 },
  { district_code: 'D15', name_en: 'Tirhut Rural Municipality', name_ne: 'तिरहुत गाउँपालिका', type: 'rural_municipality', code: 'D15-R09', total_wards: 6 },

  // Siraha District (D16) - 17 palikas
  { district_code: 'D16', name_en: 'Siraha Municipality', name_ne: 'सिराहा नगरपालिका', type: 'municipality', code: 'D16-M01', total_wards: 22 },
  { district_code: 'D16', name_en: 'Lahan Municipality', name_ne: 'लहान नगरपालिका', type: 'municipality', code: 'D16-M02', total_wards: 26 },
  { district_code: 'D16', name_en: 'Dhangadhimai Municipality', name_ne: 'धनगढीमाई नगरपालिका', type: 'municipality', code: 'D16-M03', total_wards: 13 },
  { district_code: 'D16', name_en: 'Mirchaiya Municipality', name_ne: 'मिर्चैया नगरपालिका', type: 'municipality', code: 'D16-M04', total_wards: 12 },
  { district_code: 'D16', name_en: 'Golbazar Municipality', name_ne: 'गोलबजार नगरपालिका', type: 'municipality', code: 'D16-M05', total_wards: 11 },
  { district_code: 'D16', name_en: 'Kalyanpur Municipality', name_ne: 'कल्याणपुर नगरपालिका', type: 'municipality', code: 'D16-M06', total_wards: 9 },
  { district_code: 'D16', name_en: 'Sukhipur Municipality', name_ne: 'सुखीपुर नगरपालिका', type: 'municipality', code: 'D16-M07', total_wards: 13 },
  { district_code: 'D16', name_en: 'Karjanha Municipality', name_ne: 'कर्जन्हा नगरपालिका', type: 'municipality', code: 'D16-M08', total_wards: 10 },
  { district_code: 'D16', name_en: 'Arnama Rural Municipality', name_ne: 'अर्नमा गाउँपालिका', type: 'rural_municipality', code: 'D16-R01', total_wards: 7 },
  { district_code: 'D16', name_en: 'Aurahi Rural Municipality', name_ne: 'औरही गाउँपालिका', type: 'rural_municipality', code: 'D16-R02', total_wards: 6 },
  { district_code: 'D16', name_en: 'Bariyarpatti Rural Municipality', name_ne: 'बरियारपट्टी गाउँपालिका', type: 'rural_municipality', code: 'D16-R03', total_wards: 6 },
  { district_code: 'D16', name_en: 'Bhagawanpur Rural Municipality', name_ne: 'भगवानपुर गाउँपालिका', type: 'rural_municipality', code: 'D16-R04', total_wards: 7 },
  { district_code: 'D16', name_en: 'Bishnupur Rural Municipality', name_ne: 'विष्णुपुर गाउँपालिका', type: 'rural_municipality', code: 'D16-R05', total_wards: 7 },
  { district_code: 'D16', name_en: 'Lakshmipur Patari Rural Municipality', name_ne: 'लक्ष्मीपुर पतारी गाउँपालिका', type: 'rural_municipality', code: 'D16-R06', total_wards: 6 },
  { district_code: 'D16', name_en: 'Naraha Rural Municipality', name_ne: 'नरहा गाउँपालिका', type: 'rural_municipality', code: 'D16-R07', total_wards: 6 },
  { district_code: 'D16', name_en: 'Navarajpur Rural Municipality', name_ne: 'नवराजपुर गाउँपालिका', type: 'rural_municipality', code: 'D16-R08', total_wards: 6 },
  { district_code: 'D16', name_en: 'Sakhuwanankar Katti Rural Municipality', name_ne: 'सखुवानान्कर्कट्टी गाउँपालिका', type: 'rural_municipality', code: 'D16-R09', total_wards: 6 },

  // Dhanusa District (D17) - 18 palikas
  { district_code: 'D17', name_en: 'Janakpur Sub-Metropolitan', name_ne: 'जनकपुर उपमहानगरपालिका', type: 'sub_metropolitan', code: 'D17-SM01', total_wards: 25 },
  { district_code: 'D17', name_en: 'Chhireshwarnath Municipality', name_ne: 'छिरेश्वरनाथ नगरपालिका', type: 'municipality', code: 'D17-M01', total_wards: 11 },
  { district_code: 'D17', name_en: 'Ganeshman Charnath Municipality', name_ne: 'गणेशमान चरनाथ नगरपालिका', type: 'municipality', code: 'D17-M02', total_wards: 9 },
  { district_code: 'D17', name_en: 'Dhanushadham Municipality', name_ne: 'धनुषाधाम नगरपालिका', type: 'municipality', code: 'D17-M03', total_wards: 13 },
  { district_code: 'D17', name_en: 'Nagarain Municipality', name_ne: 'नगराइन नगरपालिका', type: 'municipality', code: 'D17-M04', total_wards: 10 },
  { district_code: 'D17', name_en: 'Bideha Municipality', name_ne: 'विदेह नगरपालिका', type: 'municipality', code: 'D17-M05', total_wards: 11 },
  { district_code: 'D17', name_en: 'Mithila Municipality', name_ne: 'मिथिला नगरपालिका', type: 'municipality', code: 'D17-M06', total_wards: 11 },
  { district_code: 'D17', name_en: 'Sabaila Municipality', name_ne: 'सबैला नगरपालिका', type: 'municipality', code: 'D17-M07', total_wards: 13 },
  { district_code: 'D17', name_en: 'Kamala Municipality', name_ne: 'कमला नगरपालिका', type: 'municipality', code: 'D17-M08', total_wards: 9 },
  { district_code: 'D17', name_en: 'Shahidnagar Municipality', name_ne: 'शहीदनगर नगरपालिका', type: 'municipality', code: 'D17-M09', total_wards: 12 },
  { district_code: 'D17', name_en: 'Mithila Bihari Municipality', name_ne: 'मिथिला बिहारी नगरपालिका', type: 'municipality', code: 'D17-M10', total_wards: 9 },
  { district_code: 'D17', name_en: 'Hansapur Municipality', name_ne: 'हंसपुर नगरपालिका', type: 'municipality', code: 'D17-M11', total_wards: 9 },
  { district_code: 'D17', name_en: 'Janaknandini Rural Municipality', name_ne: 'जनकनन्दिनी गाउँपालिका', type: 'rural_municipality', code: 'D17-R01', total_wards: 7 },
  { district_code: 'D17', name_en: 'Bateshwar Rural Municipality', name_ne: 'बटेश्वर गाउँपालिका', type: 'rural_municipality', code: 'D17-R02', total_wards: 7 },
  { district_code: 'D17', name_en: 'Mukhiyapatti Musaharmiya Rural Municipality', name_ne: 'मुखियापट्टी मुसहरमिया गाउँपालिका', type: 'rural_municipality', code: 'D17-R03', total_wards: 7 },
  { district_code: 'D17', name_en: 'Lakshminiya Rural Municipality', name_ne: 'लक्ष्मीनिया गाउँपालिका', type: 'rural_municipality', code: 'D17-R04', total_wards: 7 },
  { district_code: 'D17', name_en: 'Aurahi Rural Municipality', name_ne: 'औरही गाउँपालिका', type: 'rural_municipality', code: 'D17-R05', total_wards: 5 },
  { district_code: 'D17', name_en: 'Dhanauji Rural Municipality', name_ne: 'धनौजी गाउँपालिका', type: 'rural_municipality', code: 'D17-R06', total_wards: 6 },

  // Mahottari District (D18) - 15 palikas
  { district_code: 'D18', name_en: 'Jaleshwar Municipality', name_ne: 'जलेश्वर नगरपालिका', type: 'municipality', code: 'D18-M01', total_wards: 11 },
  { district_code: 'D18', name_en: 'Bardibas Municipality', name_ne: 'बर्दिबास नगरपालिका', type: 'municipality', code: 'D18-M02', total_wards: 17 },
  { district_code: 'D18', name_en: 'Gaushala Municipality', name_ne: 'गौशाला नगरपालिका', type: 'municipality', code: 'D18-M03', total_wards: 13 },
  { district_code: 'D18', name_en: 'Loharpatti Municipality', name_ne: 'लोहरपट्टी नगरपालिका', type: 'municipality', code: 'D18-M04', total_wards: 9 },
  { district_code: 'D18', name_en: 'Ramgopalpur Municipality', name_ne: 'रामगोपालपुर नगरपालिका', type: 'municipality', code: 'D18-M05', total_wards: 8 },
  { district_code: 'D18', name_en: 'Manara Shiswa Municipality', name_ne: 'मनरा शिसवा नगरपालिका', type: 'municipality', code: 'D18-M06', total_wards: 8 },
  { district_code: 'D18', name_en: 'Matihani Municipality', name_ne: 'मटिहानी नगरपालिका', type: 'municipality', code: 'D18-M07', total_wards: 9 },
  { district_code: 'D18', name_en: 'Bhangaha Municipality', name_ne: 'भंगाहा नगरपालिका', type: 'municipality', code: 'D18-M08', total_wards: 10 },
  { district_code: 'D18', name_en: 'Balawa Municipality', name_ne: 'बलवा नगरपालिका', type: 'municipality', code: 'D18-M09', total_wards: 9 },
  { district_code: 'D18', name_en: 'Aurahi Municipality', name_ne: 'औरही नगरपालिका', type: 'municipality', code: 'D18-M10', total_wards: 9 },
  { district_code: 'D18', name_en: 'Ekdara Rural Municipality', name_ne: 'एकडारा गाउँपालिका', type: 'rural_municipality', code: 'D18-R01', total_wards: 7 },
  { district_code: 'D18', name_en: 'Mahottari Rural Municipality', name_ne: 'महोत्तरी गाउँपालिका', type: 'rural_municipality', code: 'D18-R02', total_wards: 6 },
  { district_code: 'D18', name_en: 'Pipara Rural Municipality', name_ne: 'पिपरा गाउँपालिका', type: 'rural_municipality', code: 'D18-R03', total_wards: 6 },
  { district_code: 'D18', name_en: 'Samsi Rural Municipality', name_ne: 'साम्सी गाउँपालिका', type: 'rural_municipality', code: 'D18-R04', total_wards: 6 },
  { district_code: 'D18', name_en: 'Sonama Rural Municipality', name_ne: 'सोनमा गाउँपालिका', type: 'rural_municipality', code: 'D18-R05', total_wards: 7 },

  // Sarlahi District (D19) - 20 palikas
  { district_code: 'D19', name_en: 'Malangwa Municipality', name_ne: 'मलंगवा नगरपालिका', type: 'municipality', code: 'D19-M01', total_wards: 17 },
  { district_code: 'D19', name_en: 'Lalbandi Municipality', name_ne: 'लालबन्दी नगरपालिका', type: 'municipality', code: 'D19-M02', total_wards: 13 },
  { district_code: 'D19', name_en: 'Hariwan Municipality', name_ne: 'हरिवन नगरपालिका', type: 'municipality', code: 'D19-M03', total_wards: 15 },
  { district_code: 'D19', name_en: 'Ishworpur Municipality', name_ne: 'ईश्वरपुर नगरपालिका', type: 'municipality', code: 'D19-M04', total_wards: 11 },
  { district_code: 'D19', name_en: 'Godaita Municipality', name_ne: 'गोडैता नगरपालिका', type: 'municipality', code: 'D19-M05', total_wards: 11 },
  { district_code: 'D19', name_en: 'Bagmati Municipality', name_ne: 'बागमती नगरपालिका', type: 'municipality', code: 'D19-M06', total_wards: 15 },
  { district_code: 'D19', name_en: 'Barahathwa Municipality', name_ne: 'बरहथवा नगरपालिका', type: 'municipality', code: 'D19-M07', total_wards: 14 },
  { district_code: 'D19', name_en: 'Haripur Municipality', name_ne: 'हरिपुर नगरपालिका', type: 'municipality', code: 'D19-M08', total_wards: 10 },
  { district_code: 'D19', name_en: 'Balara Municipality', name_ne: 'बलरा नगरपालिका', type: 'municipality', code: 'D19-M09', total_wards: 8 },
  { district_code: 'D19', name_en: 'Haripurwa Municipality', name_ne: 'हरिपुर्वा नगरपालिका', type: 'municipality', code: 'D19-M10', total_wards: 8 },
  { district_code: 'D19', name_en: 'Kabilasi Municipality', name_ne: 'कविलासी नगरपालिका', type: 'municipality', code: 'D19-M11', total_wards: 8 },
  { district_code: 'D19', name_en: 'Brahampuri Rural Municipality', name_ne: 'ब्रह्मपुरी गाउँपालिका', type: 'rural_municipality', code: 'D19-R01', total_wards: 7 },
  { district_code: 'D19', name_en: 'Basbariya Rural Municipality', name_ne: 'बसबरिया गाउँपालिका', type: 'rural_municipality', code: 'D19-R02', total_wards: 7 },
  { district_code: 'D19', name_en: 'Bishnu Rural Municipality', name_ne: 'विष्णु गाउँपालिका', type: 'rural_municipality', code: 'D19-R03', total_wards: 6 },
  { district_code: 'D19', name_en: 'Chandranagar Rural Municipality', name_ne: 'चन्द्रनगर गाउँपालिका', type: 'rural_municipality', code: 'D19-R04', total_wards: 7 },
  { district_code: 'D19', name_en: 'Chakraghatta Rural Municipality', name_ne: 'चक्रघट्टा गाउँपालिका', type: 'rural_municipality', code: 'D19-R05', total_wards: 6 },
  { district_code: 'D19', name_en: 'Dhankaul Rural Municipality', name_ne: 'धनकौल गाउँपालिका', type: 'rural_municipality', code: 'D19-R06', total_wards: 5 },
  { district_code: 'D19', name_en: 'Kaudena Rural Municipality', name_ne: 'कौडेना गाउँपालिका', type: 'rural_municipality', code: 'D19-R07', total_wards: 6 },
  { district_code: 'D19', name_en: 'Parsa Rural Municipality', name_ne: 'पर्सा गाउँपालिका', type: 'rural_municipality', code: 'D19-R08', total_wards: 6 },
  { district_code: 'D19', name_en: 'Ramnagar Rural Municipality', name_ne: 'रामनगर गाउँपालिका', type: 'rural_municipality', code: 'D19-R09', total_wards: 5 },

  // Bara District (D20) - 16 palikas
  { district_code: 'D20', name_en: 'Kalaiya Sub-Metropolitan', name_ne: 'कलैया उपमहानगरपालिका', type: 'sub_metropolitan', code: 'D20-SM01', total_wards: 27 },
  { district_code: 'D20', name_en: 'Jitpur Simara Sub-Metropolitan', name_ne: 'जीतपुर सिमरा उपमहानगरपालिका', type: 'sub_metropolitan', code: 'D20-SM02', total_wards: 23 },
  { district_code: 'D20', name_en: 'Kolhabi Municipality', name_ne: 'कोल्हवी नगरपालिका', type: 'municipality', code: 'D20-M01', total_wards: 12 },
  { district_code: 'D20', name_en: 'Nijgadh Municipality', name_ne: 'निजगढ नगरपालिका', type: 'municipality', code: 'D20-M02', total_wards: 11 },
  { district_code: 'D20', name_en: 'Simraungadh Municipality', name_ne: 'सिम्रौनगढ नगरपालिका', type: 'municipality', code: 'D20-M03', total_wards: 15 },
  { district_code: 'D20', name_en: 'Pachrauta Municipality', name_ne: 'पचरौता नगरपालिका', type: 'municipality', code: 'D20-M04', total_wards: 10 },
  { district_code: 'D20', name_en: 'Mahagadhimai Municipality', name_ne: 'महागढीमाई नगरपालिका', type: 'municipality', code: 'D20-M05', total_wards: 13 },
  { district_code: 'D20', name_en: 'Adarsha Kotwal Rural Municipality', name_ne: 'आदर्श कोटवाल गाउँपालिका', type: 'rural_municipality', code: 'D20-R01', total_wards: 9 },
  { district_code: 'D20', name_en: 'Baragadhi Rural Municipality', name_ne: 'बारागढी गाउँपालिका', type: 'rural_municipality', code: 'D20-R02', total_wards: 7 },
  { district_code: 'D20', name_en: 'Bishrampur Rural Municipality', name_ne: 'विश्रामपुर गाउँपालिका', type: 'rural_municipality', code: 'D20-R03', total_wards: 6 },
  { district_code: 'D20', name_en: 'Devtal Rural Municipality', name_ne: 'देवताल गाउँपालिका', type: 'rural_municipality', code: 'D20-R04', total_wards: 6 },
  { district_code: 'D20', name_en: 'Karaiyamai Rural Municipality', name_ne: 'करैयामाई गाउँपालिका', type: 'rural_municipality', code: 'D20-R05', total_wards: 7 },
  { district_code: 'D20', name_en: 'Pheta Rural Municipality', name_ne: 'फेटा गाउँपालिका', type: 'rural_municipality', code: 'D20-R06', total_wards: 7 },
  { district_code: 'D20', name_en: 'Parawanipur Rural Municipality', name_ne: 'परवानीपुर गाउँपालिका', type: 'rural_municipality', code: 'D20-R07', total_wards: 6 },
  { district_code: 'D20', name_en: 'Prasauni Rural Municipality', name_ne: 'प्रसौनी गाउँपालिका', type: 'rural_municipality', code: 'D20-R08', total_wards: 6 },
  { district_code: 'D20', name_en: 'Suwarna Rural Municipality', name_ne: 'सुवर्ण गाउँपालिका', type: 'rural_municipality', code: 'D20-R09', total_wards: 8 },

  // Parsa District (D21) - 14 palikas
  { district_code: 'D21', name_en: 'Birgunj Metropolitan', name_ne: 'वीरगञ्ज महानगरपालिका', type: 'metropolitan', code: 'D21-MT01', total_wards: 32 },
  { district_code: 'D21', name_en: 'Pokhariya Municipality', name_ne: 'पोखरिया नगरपालिका', type: 'municipality', code: 'D21-M01', total_wards: 13 },
  { district_code: 'D21', name_en: 'Bahudarmai Municipality', name_ne: 'बहुदरमाई नगरपालिका', type: 'municipality', code: 'D21-M02', total_wards: 11 },
  { district_code: 'D21', name_en: 'Parsagadhi Municipality', name_ne: 'पर्सागढी नगरपालिका', type: 'municipality', code: 'D21-M03', total_wards: 15 },
  { district_code: 'D21', name_en: 'Bindabasini Rural Municipality', name_ne: 'बिन्दबासिनी गाउँपालिका', type: 'rural_municipality', code: 'D21-R01', total_wards: 8 },
  { district_code: 'D21', name_en: 'Chhipaharmai Rural Municipality', name_ne: 'छिपहरमाई गाउँपालिका', type: 'rural_municipality', code: 'D21-R02', total_wards: 6 },
  { district_code: 'D21', name_en: 'Dhobini Rural Municipality', name_ne: 'ढोबिनी गाउँपालिका', type: 'rural_municipality', code: 'D21-R03', total_wards: 6 },
  { district_code: 'D21', name_en: 'Jagarnathpur Rural Municipality', name_ne: 'जगरनाथपुर गाउँपालिका', type: 'rural_municipality', code: 'D21-R04', total_wards: 7 },
  { district_code: 'D21', name_en: 'Kalikamai Rural Municipality', name_ne: 'कालिकामाई गाउँपालिका', type: 'rural_municipality', code: 'D21-R05', total_wards: 7 },
  { district_code: 'D21', name_en: 'Pakaha Mainpur Rural Municipality', name_ne: 'पकाहा मैनपुर गाउँपालिका', type: 'rural_municipality', code: 'D21-R06', total_wards: 7 },
  { district_code: 'D21', name_en: 'Paterwa Sugauli Rural Municipality', name_ne: 'पटेर्वा सुगौली गाउँपालिका', type: 'rural_municipality', code: 'D21-R07', total_wards: 7 },
  { district_code: 'D21', name_en: 'Sakhuwa Prasauni Rural Municipality', name_ne: 'सखुवा प्रसौनी गाउँपालिका', type: 'rural_municipality', code: 'D21-R08', total_wards: 7 },
  { district_code: 'D21', name_en: 'Thori Rural Municipality', name_ne: 'ठोरी गाउँपालिका', type: 'rural_municipality', code: 'D21-R09', total_wards: 6 },
  { district_code: 'D21', name_en: 'Jirabhawani Rural Municipality', name_ne: 'जिराभवानी गाउँपालिका', type: 'rural_municipality', code: 'D21-R10', total_wards: 5 },

  // Rautahat District (D22) - 18 palikas
  { district_code: 'D22', name_en: 'Gaur Municipality', name_ne: 'गौर नगरपालिका', type: 'municipality', code: 'D22-M01', total_wards: 23 },
  { district_code: 'D22', name_en: 'Chandrapur Municipality', name_ne: 'चन्द्रपुर नगरपालिका', type: 'municipality', code: 'D22-M02', total_wards: 13 },
  { district_code: 'D22', name_en: 'Garuda Municipality', name_ne: 'गरुडा नगरपालिका', type: 'municipality', code: 'D22-M03', total_wards: 11 },
  { district_code: 'D22', name_en: 'Baudhimai Municipality', name_ne: 'बौधीमाई नगरपालिका', type: 'municipality', code: 'D22-M04', total_wards: 13 },
  { district_code: 'D22', name_en: 'Brindaban Municipality', name_ne: 'वृन्दावन नगरपालिका', type: 'municipality', code: 'D22-M05', total_wards: 9 },
  { district_code: 'D22', name_en: 'Dewahi Gonahi Municipality', name_ne: 'देवाही गोनाही नगरपालिका', type: 'municipality', code: 'D22-M06', total_wards: 11 },
  { district_code: 'D22', name_en: 'Gujara Municipality', name_ne: 'गुजरा नगरपालिका', type: 'municipality', code: 'D22-M07', total_wards: 9 },
  { district_code: 'D22', name_en: 'Ishnath Municipality', name_ne: 'ईशनाथ नगरपालिका', type: 'municipality', code: 'D22-M08', total_wards: 10 },
  { district_code: 'D22', name_en: 'Katahariya Municipality', name_ne: 'कटहरिया नगरपालिका', type: 'municipality', code: 'D22-M09', total_wards: 9 },
  { district_code: 'D22', name_en: 'Madhav Narayan Municipality', name_ne: 'माधव नारायण नगरपालिका', type: 'municipality', code: 'D22-M10', total_wards: 10 },
  { district_code: 'D22', name_en: 'Maulapur Municipality', name_ne: 'मौलापुर नगरपालिका', type: 'municipality', code: 'D22-M11', total_wards: 8 },
  { district_code: 'D22', name_en: 'Paroha Municipality', name_ne: 'परोहा नगरपालिका', type: 'municipality', code: 'D22-M12', total_wards: 12 },
  { district_code: 'D22', name_en: 'Phatuwa Bijayapur Municipality', name_ne: 'फतुवा विजयपुर नगरपालिका', type: 'municipality', code: 'D22-M13', total_wards: 10 },
  { district_code: 'D22', name_en: 'Rajdevi Municipality', name_ne: 'राजदेवी नगरपालिका', type: 'municipality', code: 'D22-M14', total_wards: 9 },
  { district_code: 'D22', name_en: 'Rajpur Municipality', name_ne: 'राजपुर नगरपालिका', type: 'municipality', code: 'D22-M15', total_wards: 9 },
  { district_code: 'D22', name_en: 'Durga Bhagwati Rural Municipality', name_ne: 'दुर्गा भगवती गाउँपालिका', type: 'rural_municipality', code: 'D22-R01', total_wards: 6 },
  { district_code: 'D22', name_en: 'Yamunamai Rural Municipality', name_ne: 'यमुनामाई गाउँपालिका', type: 'rural_municipality', code: 'D22-R02', total_wards: 6 },
  { district_code: 'D22', name_en: 'Gadhimai Rural Municipality', name_ne: 'गढीमाई गाउँपालिका', type: 'rural_municipality', code: 'D22-R03', total_wards: 9 },

  // ============================================
  // BAGMATI PROVINCE (P3) - Continuing...
  // ============================================

  // Kathmandu District (D28) - 11 palikas
  { district_code: 'D28', name_en: 'Kathmandu Metropolitan', name_ne: 'काठमाडौं महानगरपालिका', type: 'metropolitan', code: 'D28-MT01', total_wards: 32 },
  { district_code: 'D28', name_en: 'Budhanilkantha Municipality', name_ne: 'बुढानिलकण्ठ नगरपालिका', type: 'municipality', code: 'D28-M01', total_wards: 13 },
  { district_code: 'D28', name_en: 'Chandragiri Municipality', name_ne: 'चन्द्रागिरी नगरपालिका', type: 'municipality', code: 'D28-M02', total_wards: 15 },
  { district_code: 'D28', name_en: 'Dakshinkali Municipality', name_ne: 'दक्षिणकाली नगरपालिका', type: 'municipality', code: 'D28-M03', total_wards: 9 },
  { district_code: 'D28', name_en: 'Gokarneshwor Municipality', name_ne: 'गोकर्णेश्वर नगरपालिका', type: 'municipality', code: 'D28-M04', total_wards: 9 },
  { district_code: 'D28', name_en: 'Kageshwori Manohara Municipality', name_ne: 'कागेश्वरी मनोहरा नगरपालिका', type: 'municipality', code: 'D28-M05', total_wards: 9 },
  { district_code: 'D28', name_en: 'Kirtipur Municipality', name_ne: 'कीर्तिपुर नगरपालिका', type: 'municipality', code: 'D28-M06', total_wards: 10 },
  { district_code: 'D28', name_en: 'Nagarjun Municipality', name_ne: 'नागार्जुन नगरपालिका', type: 'municipality', code: 'D28-M07', total_wards: 10 },
  { district_code: 'D28', name_en: 'Shankharapur Municipality', name_ne: 'शंखरापुर नगरपालिका', type: 'municipality', code: 'D28-M08', total_wards: 9 },
  { district_code: 'D28', name_en: 'Tarakeshwor Municipality', name_ne: 'तारकेश्वर नगरपालिका', type: 'municipality', code: 'D28-M09', total_wards: 11 },
  { district_code: 'D28', name_en: 'Tokha Municipality', name_ne: 'टोखा नगरपालिका', type: 'municipality', code: 'D28-M10', total_wards: 11 },

  // Lalitpur District (D30) - 6 palikas
  { district_code: 'D30', name_en: 'Lalitpur Metropolitan', name_ne: 'ललितपुर महानगरपालिका', type: 'metropolitan', code: 'D30-MT01', total_wards: 29 },
  { district_code: 'D30', name_en: 'Godawari Municipality', name_ne: 'गोदावरी नगरपालिका', type: 'municipality', code: 'D30-M01', total_wards: 14 },
  { district_code: 'D30', name_en: 'Mahalaxmi Municipality', name_ne: 'महालक्ष्मी नगरपालिका', type: 'municipality', code: 'D30-M02', total_wards: 10 },
  { district_code: 'D30', name_en: 'Bagmati Rural Municipality', name_ne: 'बागमती गाउँपालिका', type: 'rural_municipality', code: 'D30-R01', total_wards: 9 },
  { district_code: 'D30', name_en: 'Konjyosom Rural Municipality', name_ne: 'कोन्ज्योसोम गाउँपालिका', type: 'rural_municipality', code: 'D30-R02', total_wards: 7 },
  { district_code: 'D30', name_en: 'Mahankal Rural Municipality', name_ne: 'महाङ्काल गाउँपालिका', type: 'rural_municipality', code: 'D30-R03', total_wards: 7 },

  // Bhaktapur District (D26) - 4 palikas
  { district_code: 'D26', name_en: 'Bhaktapur Municipality', name_ne: 'भक्तपुर नगरपालिका', type: 'municipality', code: 'D26-M01', total_wards: 10 },
  { district_code: 'D26', name_en: 'Madhyapur Thimi Municipality', name_ne: 'मध्यपुर थिमी नगरपालिका', type: 'municipality', code: 'D26-M02', total_wards: 9 },
  { district_code: 'D26', name_en: 'Suryabinayak Municipality', name_ne: 'सूर्यविनायक नगरपालिका', type: 'municipality', code: 'D26-M03', total_wards: 10 },
  { district_code: 'D26', name_en: 'Changunarayan Municipality', name_ne: 'चाँगुनारायण नगरपालिका', type: 'municipality', code: 'D26-M04', total_wards: 9 },

  // Chitwan District (D34) - 7 palikas
  { district_code: 'D34', name_en: 'Bharatpur Metropolitan', name_ne: 'भरतपुर महानगरपालिका', type: 'metropolitan', code: 'D34-MT01', total_wards: 29 },
  { district_code: 'D34', name_en: 'Kalika Municipality', name_ne: 'कालिका नगरपालिका', type: 'municipality', code: 'D34-M01', total_wards: 11 },
  { district_code: 'D34', name_en: 'Khairahani Municipality', name_ne: 'खैरहनी नगरपालिका', type: 'municipality', code: 'D34-M02', total_wards: 13 },
  { district_code: 'D34', name_en: 'Madi Municipality', name_ne: 'माडी नगरपालिका', type: 'municipality', code: 'D34-M03', total_wards: 10 },
  { district_code: 'D34', name_en: 'Rapti Municipality', name_ne: 'राप्ती नगरपालिका', type: 'municipality', code: 'D34-M04', total_wards: 15 },
  { district_code: 'D34', name_en: 'Ratnanagar Municipality', name_ne: 'रत्ननगर नगरपालिका', type: 'municipality', code: 'D34-M05', total_wards: 16 },
  { district_code: 'D34', name_en: 'Ichchhakamana Rural Municipality', name_ne: 'इच्छाकामना गाउँपालिका', type: 'rural_municipality', code: 'D34-R01', total_wards: 6 },

  // Kaski District (D39) - 5 palikas (Gandaki Province)
  { district_code: 'D39', name_en: 'Pokhara Metropolitan', name_ne: 'पोखरा महानगरपालिका', type: 'metropolitan', code: 'D39-MT01', total_wards: 33 },
  { district_code: 'D39', name_en: 'Annapurna Rural Municipality', name_ne: 'अन्नपूर्ण गाउँपालिका', type: 'rural_municipality', code: 'D39-R01', total_wards: 11 },
  { district_code: 'D39', name_en: 'Machhapuchchhre Rural Municipality', name_ne: 'माछापुच्छ्रे गाउँपालिका', type: 'rural_municipality', code: 'D39-R02', total_wards: 9 },
  { district_code: 'D39', name_en: 'Madi Rural Municipality', name_ne: 'मादी गाउँपालिका', type: 'rural_municipality', code: 'D39-R03', total_wards: 12 },
  { district_code: 'D39', name_en: 'Rupa Rural Municipality', name_ne: 'रुपा गाउँपालिका', type: 'rural_municipality', code: 'D39-R04', total_wards: 7 },

  // ============================================
  // LUMBINI PROVINCE (P5) - Major Cities
  // ============================================

  // Rupandehi District (D58) - 16 palikas
  { district_code: 'D58', name_en: 'Butwal Sub-Metropolitan', name_ne: 'बुटवल उपमहानगरपालिका', type: 'sub_metropolitan', code: 'D58-SM01', total_wards: 19 },
  { district_code: 'D58', name_en: 'Siddharthanagar Municipality', name_ne: 'सिद्धार्थनगर नगरपालिका', type: 'municipality', code: 'D58-M01', total_wards: 13 },
  { district_code: 'D58', name_en: 'Devdaha Municipality', name_ne: 'देवदह नगरपालिका', type: 'municipality', code: 'D58-M02', total_wards: 12 },
  { district_code: 'D58', name_en: 'Lumbini Sanskritik Municipality', name_ne: 'लुम्बिनी सांस्कृतिक नगरपालिका', type: 'municipality', code: 'D58-M03', total_wards: 10 },
  { district_code: 'D58', name_en: 'Sainamaina Municipality', name_ne: 'सैनामैना नगरपालिका', type: 'municipality', code: 'D58-M04', total_wards: 12 },
  { district_code: 'D58', name_en: 'Tilottama Municipality', name_ne: 'तिलोत्तमा नगरपालिका', type: 'municipality', code: 'D58-M05', total_wards: 17 },
  { district_code: 'D58', name_en: 'Gaidahawa Rural Municipality', name_ne: 'गैडहवा गाउँपालिका', type: 'rural_municipality', code: 'D58-R01', total_wards: 7 },
  { district_code: 'D58', name_en: 'Kanchan Rural Municipality', name_ne: 'कञ्चन गाउँपालिका', type: 'rural_municipality', code: 'D58-R02', total_wards: 6 },
  { district_code: 'D58', name_en: 'Kotahimai Rural Municipality', name_ne: 'कोटहीमाई गाउँपालिका', type: 'rural_municipality', code: 'D58-R03', total_wards: 7 },
  { district_code: 'D58', name_en: 'Marchawari Rural Municipality', name_ne: 'मर्चवारी गाउँपालिका', type: 'rural_municipality', code: 'D58-R04', total_wards: 6 },
  { district_code: 'D58', name_en: 'Mayadevi Rural Municipality', name_ne: 'मायादेवी गाउँपालिका', type: 'rural_municipality', code: 'D58-R05', total_wards: 6 },
  { district_code: 'D58', name_en: 'Omsatiya Rural Municipality', name_ne: 'ओमसतिया गाउँपालिका', type: 'rural_municipality', code: 'D58-R06', total_wards: 5 },
  { district_code: 'D58', name_en: 'Rohini Rural Municipality', name_ne: 'रोहिणी गाउँपालिका', type: 'rural_municipality', code: 'D58-R07', total_wards: 6 },
  { district_code: 'D58', name_en: 'Sammarimai Rural Municipality', name_ne: 'सम्मरीमाई गाउँपालिका', type: 'rural_municipality', code: 'D58-R08', total_wards: 5 },
  { district_code: 'D58', name_en: 'Siyari Rural Municipality', name_ne: 'सियारी गाउँपालिका', type: 'rural_municipality', code: 'D58-R09', total_wards: 6 },
  { district_code: 'D58', name_en: 'Suddhodhan Rural Municipality', name_ne: 'शुद्धोधन गाउँपालिका', type: 'rural_municipality', code: 'D58-R10', total_wards: 6 },

  // Dang District (D50) - 10 palikas
  { district_code: 'D50', name_en: 'Ghorahi Sub-Metropolitan', name_ne: 'घोराही उपमहानगरपालिका', type: 'sub_metropolitan', code: 'D50-SM01', total_wards: 19 },
  { district_code: 'D50', name_en: 'Tulsipur Sub-Metropolitan', name_ne: 'तुल्सीपुर उपमहानगरपालिका', type: 'sub_metropolitan', code: 'D50-SM02', total_wards: 24 },
  { district_code: 'D50', name_en: 'Lamahi Municipality', name_ne: 'लमही नगरपालिका', type: 'municipality', code: 'D50-M01', total_wards: 10 },
  { district_code: 'D50', name_en: 'Babai Rural Municipality', name_ne: 'बबई गाउँपालिका', type: 'rural_municipality', code: 'D50-R01', total_wards: 7 },
  { district_code: 'D50', name_en: 'Banglachuli Rural Municipality', name_ne: 'बंगलाचुली गाउँपालिका', type: 'rural_municipality', code: 'D50-R02', total_wards: 9 },
  { district_code: 'D50', name_en: 'Dangisharan Rural Municipality', name_ne: 'दंगीशरण गाउँपालिका', type: 'rural_municipality', code: 'D50-R03', total_wards: 5 },
  { district_code: 'D50', name_en: 'Gadhawa Rural Municipality', name_ne: 'गढवा गाउँपालिका', type: 'rural_municipality', code: 'D50-R04', total_wards: 8 },
  { district_code: 'D50', name_en: 'Rajpur Rural Municipality', name_ne: 'राजपुर गाउँपालिका', type: 'rural_municipality', code: 'D50-R05', total_wards: 6 },
  { district_code: 'D50', name_en: 'Rapti Rural Municipality', name_ne: 'राप्ती गाउँपालिका', type: 'rural_municipality', code: 'D50-R06', total_wards: 8 },
  { district_code: 'D50', name_en: 'Shantinagar Rural Municipality', name_ne: 'शान्तिनगर गाउँपालिका', type: 'rural_municipality', code: 'D50-R07', total_wards: 6 },

  // Banke District (D48) - 8 palikas
  { district_code: 'D48', name_en: 'Nepalgunj Sub-Metropolitan', name_ne: 'नेपालगन्ज उपमहानगरपालिका', type: 'sub_metropolitan', code: 'D48-SM01', total_wards: 23 },
  { district_code: 'D48', name_en: 'Kohalpur Municipality', name_ne: 'कोहलपुर नगरपालिका', type: 'municipality', code: 'D48-M01', total_wards: 15 },
  { district_code: 'D48', name_en: 'Baijanath Rural Municipality', name_ne: 'बैजनाथ गाउँपालिका', type: 'rural_municipality', code: 'D48-R01', total_wards: 10 },
  { district_code: 'D48', name_en: 'Duduwa Rural Municipality', name_ne: 'डुडुवा गाउँपालिका', type: 'rural_municipality', code: 'D48-R02', total_wards: 7 },
  { district_code: 'D48', name_en: 'Janaki Rural Municipality', name_ne: 'जानकी गाउँपालिका', type: 'rural_municipality', code: 'D48-R03', total_wards: 6 },
  { district_code: 'D48', name_en: 'Khajura Rural Municipality', name_ne: 'खजुरा गाउँपालिका', type: 'rural_municipality', code: 'D48-R04', total_wards: 9 },
  { district_code: 'D48', name_en: 'Narainapur Rural Municipality', name_ne: 'नरैनापुर गाउँपालिका', type: 'rural_municipality', code: 'D48-R05', total_wards: 6 },
  { district_code: 'D48', name_en: 'Rapti Sonari Rural Municipality', name_ne: 'राप्ती सोनारी गाउँपालिका', type: 'rural_municipality', code: 'D48-R06', total_wards: 9 },

  // ============================================
  // KARNALI PROVINCE (P6)
  // ============================================

  // Surkhet District (D67) - 9 palikas
  { district_code: 'D67', name_en: 'Birendranagar Municipality', name_ne: 'वीरेन्द्रनगर नगरपालिका', type: 'municipality', code: 'D67-M01', total_wards: 16 },
  { district_code: 'D67', name_en: 'Bheriganga Municipality', name_ne: 'भेरीगंगा नगरपालिका', type: 'municipality', code: 'D67-M02', total_wards: 14 },
  { district_code: 'D67', name_en: 'Gurbhakot Municipality', name_ne: 'गुर्भाकोट नगरपालिका', type: 'municipality', code: 'D67-M03', total_wards: 13 },
  { district_code: 'D67', name_en: 'Lekbesi Municipality', name_ne: 'लेकबेसी नगरपालिका', type: 'municipality', code: 'D67-M04', total_wards: 11 },
  { district_code: 'D67', name_en: 'Panchpuri Municipality', name_ne: 'पञ्चपुरी नगरपालिका', type: 'municipality', code: 'D67-M05', total_wards: 9 },
  { district_code: 'D67', name_en: 'Barahatal Rural Municipality', name_ne: 'बराहताल गाउँपालिका', type: 'rural_municipality', code: 'D67-R01', total_wards: 6 },
  { district_code: 'D67', name_en: 'Chaukune Rural Municipality', name_ne: 'चौकुने गाउँपालिका', type: 'rural_municipality', code: 'D67-R02', total_wards: 5 },
  { district_code: 'D67', name_en: 'Chingad Rural Municipality', name_ne: 'चिङगाड गाउँपालिका', type: 'rural_municipality', code: 'D67-R03', total_wards: 6 },
  { district_code: 'D67', name_en: 'Simta Rural Municipality', name_ne: 'सिम्ता गाउँपालिका', type: 'rural_municipality', code: 'D67-R04', total_wards: 8 },

  // ============================================
  // SUDURPASHCHIM PROVINCE (P7)
  // ============================================

  // Kailali District (D77) - 13 palikas
  { district_code: 'D77', name_en: 'Dhangadhi Sub-Metropolitan', name_ne: 'धनगढी उपमहानगरपालिका', type: 'sub_metropolitan', code: 'D77-SM01', total_wards: 19 },
  { district_code: 'D77', name_en: 'Tikapur Municipality', name_ne: 'टिकापुर नगरपालिका', type: 'municipality', code: 'D77-M01', total_wards: 9 },
  { district_code: 'D77', name_en: 'Ghodaghodi Municipality', name_ne: 'घोडाघोडी नगरपालिका', type: 'municipality', code: 'D77-M02', total_wards: 12 },
  { district_code: 'D77', name_en: 'Lamkichuha Municipality', name_ne: 'लम्कीचुहा नगरपालिका', type: 'municipality', code: 'D77-M03', total_wards: 9 },
  { district_code: 'D77', name_en: 'Bhajani Municipality', name_ne: 'भजनी नगरपालिका', type: 'municipality', code: 'D77-M04', total_wards: 9 },
  { district_code: 'D77', name_en: 'Godawari Municipality', name_ne: 'गोदावरी नगरपालिका', type: 'municipality', code: 'D77-M05', total_wards: 12 },
  { district_code: 'D77', name_en: 'Gauriganga Municipality', name_ne: 'गौरीगंगा नगरपालिका', type: 'municipality', code: 'D77-M06', total_wards: 10 },
  { district_code: 'D77', name_en: 'Bardagoriya Rural Municipality', name_ne: 'बर्दगोरिया गाउँपालिका', type: 'rural_municipality', code: 'D77-R01', total_wards: 6 },
  { district_code: 'D77', name_en: 'Chure Rural Municipality', name_ne: 'चुरे गाउँपालिका', type: 'rural_municipality', code: 'D77-R02', total_wards: 6 },
  { district_code: 'D77', name_en: 'Janaki Rural Municipality', name_ne: 'जानकी गाउँपालिका', type: 'rural_municipality', code: 'D77-R03', total_wards: 6 },
  { district_code: 'D77', name_en: 'Joshipur Rural Municipality', name_ne: 'जोशीपुर गाउँपालिका', type: 'rural_municipality', code: 'D77-R04', total_wards: 6 },
  { district_code: 'D77', name_en: 'Kailari Rural Municipality', name_ne: 'कैलारी गाउँपालिका', type: 'rural_municipality', code: 'D77-R05', total_wards: 7 },
  { district_code: 'D77', name_en: 'Mohanyal Rural Municipality', name_ne: 'मोहन्याल गाउँपालिका', type: 'rural_municipality', code: 'D77-R06', total_wards: 5 },

  // Kanchanpur District (D76) - 9 palikas
  { district_code: 'D76', name_en: 'Bhimdatta Municipality', name_ne: 'भीमदत्त नगरपालिका', type: 'municipality', code: 'D76-M01', total_wards: 19 },
  { district_code: 'D76', name_en: 'Punarbas Municipality', name_ne: 'पुनर्वास नगरपालिका', type: 'municipality', code: 'D76-M02', total_wards: 11 },
  { district_code: 'D76', name_en: 'Bedkot Municipality', name_ne: 'बेदकोट नगरपालिका', type: 'municipality', code: 'D76-M03', total_wards: 10 },
  { district_code: 'D76', name_en: 'Belauri Municipality', name_ne: 'बेलौरी नगरपालिका', type: 'municipality', code: 'D76-M04', total_wards: 10 },
  { district_code: 'D76', name_en: 'Mahakali Municipality', name_ne: 'महाकाली नगरपालिका', type: 'municipality', code: 'D76-M05', total_wards: 10 },
  { district_code: 'D76', name_en: 'Shuklaphanta Municipality', name_ne: 'शुक्लाफाँटा नगरपालिका', type: 'municipality', code: 'D76-M06', total_wards: 11 },
  { district_code: 'D76', name_en: 'Krishnapur Municipality', name_ne: 'कृष्णपुर नगरपालिका', type: 'municipality', code: 'D76-M07', total_wards: 9 },
  { district_code: 'D76', name_en: 'Beldandi Rural Municipality', name_ne: 'बेल्डाँडी गाउँपालिका', type: 'rural_municipality', code: 'D76-R01', total_wards: 5 },
  { district_code: 'D76', name_en: 'Laljhadi Rural Municipality', name_ne: 'लालझाडी गाउँपालिका', type: 'rural_municipality', code: 'D76-R02', total_wards: 6 },
];

interface Role {
  name: string
  description: string
  description_ne?: string
}

interface Permission {
  name: string
  description: string
  description_ne?: string
  resource: string
  action: string
}

const ROLES: Role[] = [
  { name: 'super_admin', description: 'Full system access across all palikas' },
  { name: 'palika_admin', description: 'Full access within assigned palika' },
  { name: 'content_editor', description: 'Can create and edit content' },
  { name: 'content_reviewer', description: 'Can review and approve content' },
  { name: 'support_agent', description: 'Can handle support tickets' },
  { name: 'moderator', description: 'Can moderate content and users' }
]

const PERMISSIONS: Permission[] = [
  { name: 'manage_heritage_sites', description: 'Create, edit, delete heritage sites', resource: 'heritage_site', action: 'manage' },
  { name: 'manage_events', description: 'Create, edit, delete events', resource: 'event', action: 'manage' },
  { name: 'manage_businesses', description: 'Verify, edit, delete businesses', resource: 'business', action: 'manage' },
  { name: 'manage_blog_posts', description: 'Create, edit, delete blog posts', resource: 'blog_post', action: 'manage' },
  { name: 'manage_users', description: 'Create, edit, delete user accounts', resource: 'user', action: 'manage' },
  { name: 'manage_admins', description: 'Create, edit, delete admin accounts', resource: 'admin', action: 'manage' },
  { name: 'manage_sos', description: 'Handle SOS requests and responses', resource: 'sos_request', action: 'manage' },
  { name: 'manage_support', description: 'Handle support tickets', resource: 'support_ticket', action: 'manage' },
  { name: 'moderate_content', description: 'Review and approve content', resource: 'content', action: 'moderate' },
  { name: 'view_analytics', description: 'Access analytics and reports', resource: 'analytics', action: 'view' },
  { name: 'manage_categories', description: 'Create and manage content categories', resource: 'category', action: 'manage' },
  { name: 'send_notifications', description: 'Send notifications to users', resource: 'notification', action: 'send' }
]

const CATEGORIES: Category[] = [
  // Heritage site categories
  { entity_type: 'heritage_site', name_en: 'Temple', name_ne: 'मन्दिर', slug: 'temple', display_order: 1 },
  { entity_type: 'heritage_site', name_en: 'Monastery', name_ne: 'गुम्बा', slug: 'monastery', display_order: 2 },
  { entity_type: 'heritage_site', name_en: 'Palace', name_ne: 'दरबार', slug: 'palace', display_order: 3 },
  { entity_type: 'heritage_site', name_en: 'Fort', name_ne: 'किल्ला', slug: 'fort', display_order: 4 },
  { entity_type: 'heritage_site', name_en: 'Museum', name_ne: 'संग्रहालय', slug: 'museum', display_order: 5 },
  { entity_type: 'heritage_site', name_en: 'Archaeological Site', name_ne: 'पुरातत्व स्थल', slug: 'archaeological', display_order: 6 },
  { entity_type: 'heritage_site', name_en: 'Natural Heritage', name_ne: 'प्राकृतिक सम्पदा', slug: 'natural', display_order: 7 },
  
  // Event categories
  { entity_type: 'event', name_en: 'Festival', name_ne: 'चाड पर्व', slug: 'festival', display_order: 1 },
  { entity_type: 'event', name_en: 'Cultural', name_ne: 'सांस्कृतिक', slug: 'cultural', display_order: 2 },
  { entity_type: 'event', name_en: 'Sports', name_ne: 'खेलकुद', slug: 'sports', display_order: 3 },
  { entity_type: 'event', name_en: 'Religious', name_ne: 'धार्मिक', slug: 'religious', display_order: 4 },
  { entity_type: 'event', name_en: 'Food', name_ne: 'खाना', slug: 'food', display_order: 5 },
  { entity_type: 'event', name_en: 'Music', name_ne: 'संगीत', slug: 'music', display_order: 6 },
  { entity_type: 'event', name_en: 'Educational', name_ne: 'शैक्षिक', slug: 'educational', display_order: 7 },
  
  // Business categories
  { entity_type: 'business', name_en: 'Accommodation', name_ne: 'बास स्थान', slug: 'accommodation', display_order: 1 },
  { entity_type: 'business', name_en: 'Restaurant', name_ne: 'रेस्टुरेन्ट', slug: 'restaurant', display_order: 2 },
  { entity_type: 'business', name_en: 'Tour Operator', name_ne: 'भ्रमण संचालक', slug: 'tour-operator', display_order: 3 },
  { entity_type: 'business', name_en: 'Transport', name_ne: 'यातायात', slug: 'transport', display_order: 4 },
  { entity_type: 'business', name_en: 'Shopping', name_ne: 'किनमेल', slug: 'shopping', display_order: 5 },
  { entity_type: 'business', name_en: 'Entertainment', name_ne: 'मनोरञ्जन', slug: 'entertainment', display_order: 6 },
  // Emergency Services category deactivated — service_providers table used instead (migration 062)
  // { entity_type: 'business', name_en: 'Emergency Services', name_ne: 'आपतकालीन सेवा', slug: 'emergency', display_order: 7 },
  { entity_type: 'business', name_en: 'Government Office', name_ne: 'सरकारी कार्यालय', slug: 'government', display_order: 8 },
  
  // Blog post categories
  { entity_type: 'blog_post', name_en: 'Tourism News', name_ne: 'पर्यटन समाचार', slug: 'tourism-news', display_order: 1 },
  { entity_type: 'blog_post', name_en: 'Cultural Stories', name_ne: 'सांस्कृतिक कथा', slug: 'cultural-stories', display_order: 2 },
  { entity_type: 'blog_post', name_en: 'Local Events', name_ne: 'स्थानीय कार्यक्रम', slug: 'local-events', display_order: 3 },
  { entity_type: 'blog_post', name_en: 'Heritage Updates', name_ne: 'सम्पदा अपडेट', slug: 'heritage-updates', display_order: 4 },
  { entity_type: 'blog_post', name_en: 'Community News', name_ne: 'समुदायिक समाचार', slug: 'community-news', display_order: 5 }
]

// ==========================================
// SEEDING FUNCTIONS
// ==========================================

async function seedProvinces() {
  console.log('🗺️  Seeding provinces...');
  
  const insertedProvinces = [];
  for (const province of PROVINCES) {
    const { data, error } = await supabase
      .from('provinces')
      .upsert({
        name_en: province.name_en,
        name_ne: province.name_ne,
        code: province.code
      }, {
        onConflict: 'code'
      })
      .select()
      .single();
    
    if (error) {
      console.error(`❌ Error upserting province ${province.name_en}:`, error);
      throw error;
    }
    
    console.log(`✅ Upserted province: ${province.name_en}`);
    insertedProvinces.push(data);
  }
  
  console.log(`✅ Completed seeding ${insertedProvinces.length} provinces.`);
  return insertedProvinces;
}

async function seedDistricts(provinces: any[]) {
  console.log('🗺️  Seeding districts...');
  
  // Create a map from province code to province id
  const provinceCodeToId = new Map();
  provinces.forEach(province => {
    provinceCodeToId.set(province.code, province.id);
  });
  
  const insertedDistricts = [];
  for (const district of DISTRICTS) {
    const provinceId = provinceCodeToId.get(district.province_code);
    if (!provinceId) {
      console.error(`❌ Province code ${district.province_code} not found for district ${district.name_en}`);
      throw new Error(`Province code ${district.province_code} not found`);
    }
    
    const { data, error } = await supabase
      .from('districts')
      .upsert({
        province_id: provinceId,
        name_en: district.name_en,
        name_ne: district.name_ne,
        code: district.code
      }, {
        onConflict: 'code'
      })
      .select()
      .single();
    
    if (error) {
      console.error(`❌ Error upserting district ${district.name_en}:`, error);
      throw error;
    }
    
    console.log(`✅ Upserted district: ${district.name_en}`);
    insertedDistricts.push(data);
  }
  
  console.log(`✅ Completed seeding ${insertedDistricts.length} districts.`);
  return insertedDistricts;
}

async function seedPalikas(districts: any[]) {
  console.log('🗺️  Seeding palikas...');
  
  // Create a map from district code to district id
  const districtCodeToId = new Map();
  districts.forEach(district => {
    districtCodeToId.set(district.code, district.id);
  });
  
  const insertedPalikas = [];
  for (const palika of PALIKAS) {
    const districtId = districtCodeToId.get(palika.district_code);
    if (!districtId) {
      console.error(`❌ District code ${palika.district_code} not found for palika ${palika.name_en}`);
      throw new Error(`District code ${palika.district_code} not found`);
    }
    
    const { data, error } = await supabase
      .from('palikas')
      .upsert({
        district_id: districtId,
        name_en: palika.name_en,
        name_ne: palika.name_ne,
        type: palika.type,
        code: palika.code,
        total_wards: palika.total_wards
      }, {
        onConflict: 'code'
      })
      .select()
      .single();
    
    if (error) {
      console.error(`❌ Error upserting palika ${palika.name_en}:`, error);
      throw error;
    }
    
    console.log(`✅ Upserted palika: ${palika.name_en}`);
    insertedPalikas.push(data);
  }
  
  console.log(`✅ Completed seeding ${insertedPalikas.length} palikas.`);
  return insertedPalikas;
}

async function seedRoles() {
  console.log('👥 Seeding roles...');
  
  for (const role of ROLES) {
    const { error } = await supabase
      .from('roles')
      .upsert({
        name: role.name,
        description: role.description
      }, {
        onConflict: 'name'
      });
    
    if (error) {
      console.error(`❌ Error upserting role ${role.name}:`, error);
      throw error;
    }
    
    console.log(`✅ Upserted role: ${role.name}`);
  }
  
  console.log(`✅ Completed seeding ${ROLES.length} roles.`);
}

async function seedPermissions() {
  console.log('🔐 Seeding permissions...');
  
  for (const permission of PERMISSIONS) {
    const { error } = await supabase
      .from('permissions')
      .upsert({
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action
      }, {
        onConflict: 'name'
      });
    
    if (error) {
      console.error(`❌ Error upserting permission ${permission.name}:`, error);
      throw error;
    }
    
    console.log(`✅ Upserted permission: ${permission.name}`);
  }
  
  console.log(`✅ Completed seeding ${PERMISSIONS.length} permissions.`);
}

async function seedCategories() {
  console.log('🗂️  Seeding categories...');
  
  for (const category of CATEGORIES) {
    const { error } = await supabase
      .from('categories')
      .upsert({
        entity_type: category.entity_type,
        name_en: category.name_en,
        name_ne: category.name_ne,
        slug: category.slug,
        display_order: category.display_order
      }, {
        onConflict: 'palika_id,entity_type,slug'
      });
    
    if (error) {
      console.error(`❌ Error upserting category ${category.name_en}:`, error);
      throw error;
    }
    
    console.log(`✅ Upserted category: ${category.name_en}`);
  }
  
  console.log(`✅ Completed seeding ${CATEGORIES.length} categories.`);
}

async function seedAppVersions() {
  console.log('📱 Seeding app versions...');
  
  const { error } = await supabase
    .from('app_versions')
    .upsert([
      {
        version_name: '1.0.0',
        version_code: 1,
        platform: 'android',
        is_latest: true,
        release_notes: 'Initial release',
        released_at: new Date().toISOString()
      },
      {
        version_name: '1.0.0',
        version_code: 1,
        platform: 'ios',
        is_latest: true,
        release_notes: 'Initial release',
        released_at: new Date().toISOString()
      }
    ], {
      onConflict: 'platform,version_code'
    });
  
  if (error) {
    console.error('❌ Error upserting app version:', error);
    throw error;
  }
  
  console.log('✅ Upserted app versions.');
}

// ==========================================
// MAIN SEEDING FUNCTION
// ==========================================

async function main() {
  console.log('🌱 Starting database seeding...');
  console.log('📍 Target:', supabaseUrl);
  
  try {
    // Step 1: Check for schema and guide user if not set up
    const schemaReady = await setupSchema();
    if (!schemaReady) {
      console.log('⏸️  Seeding paused. Please set up the schema first and re-run.');
      process.exit(0);
    }
    console.log('');
    
    // Step 2: Test connection
    console.log('🔗 Testing database connection...');
    const { error: testError } = await supabase
      .from('provinces')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Failed to connect to Supabase:', testError);
      process.exit(1);
    }
    
    console.log('✅ Database connection successful');
    console.log('');
    
    // Step 3: Seed geographical and core data
    const provinces = await seedProvinces();
    const districts = await seedDistricts(provinces);
    const palikas = await seedPalikas(districts);
    await seedRoles();
    await seedPermissions();
    await seedCategories();
    await seedAppVersions();

    // Step 4: Seed the production-ready admin users
    await seedAdminUsers();
    
    console.log('');
    console.log('🎉 Database data seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • ${provinces.length} provinces`);
    console.log(`   • ${districts.length} districts`);
    console.log(`   • ${palikas.length} palikas`);
    console.log(`   • ${ROLES.length} roles`);
    console.log(`   • ${PERMISSIONS.length} permissions`);
    console.log(`   • ${CATEGORIES.length} categories`);
    console.log(`   • Seeded default admin users`);
    console.log('');
    console.log('✅ System is ready for use!');
    
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
if (require.main === module) {
  main()
}

export { main as seedDatabase }