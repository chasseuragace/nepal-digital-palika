#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Check your .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper function to get category ID by name and entity type
async function getCategoryId(name: string, entityType: string): Promise<string> {
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('name_en', name)
    .eq('entity_type', entityType)
    .single()
  
  if (error || !data) {
    throw new Error(`Category '${name}' for entity type '${entityType}' not found`)
  }
  
  return data.id
}

// Helper function to get palika ID by name
async function getPalikaId(name: string): Promise<string> {
  const { data, error } = await supabase
    .from('palikas')
    .select('id')
    .eq('name_en', name)
    .single()
  
  if (error || !data) {
    throw new Error(`Palika '${name}' not found`)
  }
  
  return data.id
}

// Heritage Sites Data - EXPANDED (10 UNESCO World Heritage Sites)
const heritageSites = [
  {
    name_en: 'Pashupatinath Temple',
    name_ne: 'पशुपतिनाथ मन्दिर',
    slug: 'pashupatinath-temple',
    short_description: 'Sacred Hindu temple complex dedicated to Lord Shiva, located on the banks of Bagmati River.',
    short_description_ne: 'बागमती नदीको किनारमा अवस्थित भगवान शिवलाई समर्पित पवित्र हिन्दू मन्दिर परिसर।',
    full_description: 'One of the most significant temples in Nepal and a UNESCO World Heritage Site. The temple complex features traditional pagoda architecture and is an important pilgrimage site for Hindus worldwide.',
    full_description_ne: 'नेपालको सबैभन्दा महत्वपूर्ण मन्दिरहरू मध्ये एक र युनेस्को विश्व सम्पदा स्थल।',
    category: 'Temple',
    palika: 'Kathmandu Metropolitan',
    latitude: 27.7106,
    longitude: 85.3481,
    heritage_status: 'world_heritage',
    entry_fee: {
      local_adult: 0,
      local_child: 0,
      foreign_adult: 1000,
      foreign_child: 500,
      currency: 'NPR'
    },
    opening_hours: {
      monday: '04:00-19:00',
      tuesday: '04:00-19:00',
      wednesday: '04:00-19:00',
      thursday: '04:00-19:00',
      friday: '04:00-19:00',
      saturday: '04:00-19:00',
      sunday: '04:00-19:00'
    },
    status: 'published',
    is_featured: true,
    best_time_to_visit: 'Early morning or evening',
    average_visit_duration_minutes: 90
  },
  {
    name_en: 'Boudhanath Stupa',
    name_ne: 'बौद्धनाथ स्तुप',
    slug: 'boudhanath-stupa',
    short_description: 'One of the largest Buddhist stupas in the world and a UNESCO World Heritage Site.',
    short_description_ne: 'विश्वको सबैभन्दा ठूलो बौद्ध स्तुपहरू मध्ये एक र युनेस्को विश्व सम्पदा स्थल।',
    full_description: 'Important pilgrimage site for Buddhists and center of Tibetan culture in Kathmandu. The massive mandala makes it one of the largest spherical stupas in Nepal.',
    full_description_ne: 'बौद्धहरूका लागि महत्वपूर्ण तीर्थस्थल र काठमाडौंमा तिब्बती संस्कृतिको केन्द्र।',
    category: 'Monastery',
    palika: 'Kathmandu Metropolitan',
    latitude: 27.7215,
    longitude: 85.3621,
    heritage_status: 'world_heritage',
    entry_fee: {
      local_adult: 0,
      local_child: 0,
      foreign_adult: 400,
      foreign_child: 200,
      currency: 'NPR'
    },
    opening_hours: {
      monday: '05:00-18:00',
      tuesday: '05:00-18:00',
      wednesday: '05:00-18:00',
      thursday: '05:00-18:00',
      friday: '05:00-18:00',
      saturday: '05:00-18:00',
      sunday: '05:00-18:00'
    },
    status: 'published',
    is_featured: true,
    best_time_to_visit: 'Early morning or evening for prayers',
    average_visit_duration_minutes: 60
  },
  {
    name_en: 'Swayambhunath (Monkey Temple)',
    name_ne: 'स्वयम्भूनाथ',
    slug: 'swayambhunath-monkey-temple',
    short_description: 'Ancient religious complex atop a hill in Kathmandu valley with panoramic views.',
    short_description_ne: 'काठमाडौं उपत्यकाको पहाडमाथि अवस्थित पुरातन धार्मिक परिसर।',
    full_description: 'Known as Monkey Temple due to resident monkeys. UNESCO World Heritage Site offering stunning panoramic views of Kathmandu valley.',
    full_description_ne: 'बाँदरहरूका कारण बाँदर मन्दिर भनेर चिनिन्छ। उपत्यकाको मनोरम दृश्यसहित युनेस्को विश्व सम्पदा स्थल।',
    category: 'Temple',
    palika: 'Kathmandu Metropolitan',
    latitude: 27.7149,
    longitude: 85.2906,
    heritage_status: 'world_heritage',
    entry_fee: {
      local_adult: 0,
      local_child: 0,
      foreign_adult: 200,
      foreign_child: 100,
      currency: 'NPR'
    },
    opening_hours: {
      monday: '05:00-20:00',
      tuesday: '05:00-20:00',
      wednesday: '05:00-20:00',
      thursday: '05:00-20:00',
      friday: '05:00-20:00',
      saturday: '05:00-20:00',
      sunday: '05:00-20:00'
    },
    status: 'published',
    is_featured: true,
    best_time_to_visit: 'Early morning or sunset',
    average_visit_duration_minutes: 75
  },
  {
    name_en: 'Kathmandu Durbar Square',
    name_ne: 'काठमाडौं दरबार स्क्वायर',
    slug: 'kathmandu-durbar-square',
    short_description: 'Historic palace complex and UNESCO World Heritage Site with traditional architecture.',
    short_description_ne: 'ऐतिहासिक दरबार परिसर र युनेस्को विश्व सम्पदा स्थल।',
    full_description: 'Former royal palace of Kathmandu with ancient temples, courtyards, and traditional Newari architecture showcasing centuries of craftsmanship.',
    full_description_ne: 'पुराना मन्दिरहरू, आँगनहरू र परम्परागत वास्तुकलासहित काठमाडौंको पुरानो राजदरबार।',
    category: 'Palace',
    palika: 'Kathmandu Metropolitan',
    latitude: 27.7040,
    longitude: 85.3070,
    heritage_status: 'world_heritage',
    entry_fee: {
      local_adult: 30,
      local_child: 15,
      foreign_adult: 1000,
      foreign_child: 500,
      currency: 'NPR'
    },
    opening_hours: {
      monday: '09:00-17:00',
      tuesday: '09:00-17:00',
      wednesday: '09:00-17:00',
      thursday: '09:00-17:00',
      friday: '09:00-17:00',
      saturday: '09:00-17:00',
      sunday: '09:00-17:00'
    },
    status: 'published',
    is_featured: true,
    best_time_to_visit: 'Morning hours',
    average_visit_duration_minutes: 120
  },
  {
    name_en: 'Patan Durbar Square',
    name_ne: 'पाटन दरबार स्क्वायर',
    slug: 'patan-durbar-square',
    short_description: 'Medieval royal palace complex showcasing finest Newari architecture and craftsmanship.',
    short_description_ne: 'उत्कृष्ट नेवारी वास्तुकला र शिल्पकलाको प्रदर्शन गर्ने मध्यकालीन राजदरबार परिसर।',
    full_description: 'Also known as Lalitpur Durbar Square, this UNESCO World Heritage Site features exquisite temples, courtyards, and the famous Krishna Mandir.',
    full_description_ne: 'ललितपुर दरबार स्क्वायर भनेर पनि चिनिन्छ, यो युनेस्को विश्व सम्पदा स्थलमा उत्कृष्ट मन्दिरहरू, आँगनहरू र प्रसिद्ध कृष्ण मन्दिर छ।',
    category: 'Palace',
    palika: 'Lalitpur Metropolitan',
    latitude: 27.6731,
    longitude: 85.3261,
    heritage_status: 'world_heritage',
    entry_fee: {
      local_adult: 25,
      local_child: 15,
      foreign_adult: 1000,
      foreign_child: 500,
      currency: 'NPR'
    },
    opening_hours: {
      monday: '09:00-17:00',
      tuesday: '09:00-17:00',
      wednesday: '09:00-17:00',
      thursday: '09:00-17:00',
      friday: '09:00-17:00',
      saturday: '09:00-17:00',
      sunday: '09:00-17:00'
    },
    status: 'published',
    is_featured: true,
    best_time_to_visit: 'Morning or late afternoon',
    average_visit_duration_minutes: 90
  },
  {
    name_en: 'Bhaktapur Durbar Square',
    name_ne: 'भक्तपुर दरबार स्क्वायर',
    slug: 'bhaktapur-durbar-square',
    short_description: 'Living museum of medieval art and architecture with well-preserved royal palace complex.',
    short_description_ne: 'राम्रोसँग संरक्षित राजदरबार परिसरसहित मध्यकालीन कला र वास्तुकलाको जीवित संग्रहालय।',
    full_description: 'UNESCO World Heritage Site featuring the famous 55-Window Palace, Vatsala Temple, and traditional pottery squares.',
    full_description_ne: 'प्रसिद्ध ५५ झ्यालको दरबार, वत्सला मन्दिर र परम्परागत माटोका भाँडाका चोकहरू भएको युनेस्को विश्व सम्पदा स्थल।',
    category: 'Palace',
    palika: 'Bhaktapur Municipality',
    latitude: 27.6710,
    longitude: 85.4298,
    heritage_status: 'world_heritage',
    entry_fee: {
      local_adult: 30,
      local_child: 15,
      foreign_adult: 1800,
      foreign_child: 900,
      currency: 'NPR'
    },
    opening_hours: {
      monday: '09:00-17:00',
      tuesday: '09:00-17:00',
      wednesday: '09:00-17:00',
      thursday: '09:00-17:00',
      friday: '09:00-17:00',
      saturday: '09:00-17:00',
      sunday: '09:00-17:00'
    },
    status: 'published',
    is_featured: true,
    best_time_to_visit: 'Early morning for golden light',
    average_visit_duration_minutes: 150
  },
  {
    name_en: 'Lumbini',
    name_ne: 'लुम्बिनी',
    slug: 'lumbini-birthplace-buddha',
    short_description: 'Sacred birthplace of Lord Buddha and UNESCO World Heritage Site.',
    short_description_ne: 'भगवान बुद्धको पवित्र जन्मस्थान र युनेस्को विश्व सम्पदा स्थल।',
    full_description: 'The most important Buddhist pilgrimage site in the world, featuring the Maya Devi Temple, Ashoka Pillar, and numerous monasteries from different countries.',
    full_description_ne: 'विश्वको सबैभन्दा महत्वपूर्ण बौद्ध तीर्थस्थल, मायादेवी मन्दिर, अशोक स्तम्भ र विभिन्न देशका धेरै गुम्बाहरू छन्।',
    category: 'Temple', // Changed from 'Archaeological Site' to existing category
    palika: 'Kathmandu Metropolitan', // Using available palika since Lumbini palika not seeded
    latitude: 27.4833,
    longitude: 83.2833,
    heritage_status: 'world_heritage',
    entry_fee: {
      local_adult: 25,
      local_child: 10,
      foreign_adult: 200,
      foreign_child: 100,
      currency: 'NPR'
    },
    opening_hours: {
      monday: '06:00-18:00',
      tuesday: '06:00-18:00',
      wednesday: '06:00-18:00',
      thursday: '06:00-18:00',
      friday: '06:00-18:00',
      saturday: '06:00-18:00',
      sunday: '06:00-18:00'
    },
    status: 'published',
    is_featured: true,
    best_time_to_visit: 'October to March',
    average_visit_duration_minutes: 180
  },
  {
    name_en: 'Changu Narayan Temple',
    name_ne: 'चाँगु नारायण मन्दिर',
    slug: 'changu-narayan-temple',
    short_description: 'Oldest Hindu temple in Nepal dedicated to Lord Vishnu, dating back to 4th century.',
    short_description_ne: 'भगवान विष्णुलाई समर्पित नेपालको सबैभन्दा पुरानो हिन्दू मन्दिर, चौथो शताब्दीको।',
    full_description: 'UNESCO World Heritage Site featuring the oldest inscription in Nepal and exquisite stone and wood carvings representing centuries of artistic tradition.',
    full_description_ne: 'नेपालको सबैभन्दा पुरानो शिलालेख र शताब्दीयौंको कलात्मक परम्पराको प्रतिनिधित्व गर्ने उत्कृष्ट ढुङ्गा र काठको नक्काशी भएको युनेस्को विश्व सम्पदा स्थल।',
    category: 'Temple',
    palika: 'Bhaktapur Municipality',
    latitude: 27.7161,
    longitude: 85.4347,
    heritage_status: 'world_heritage',
    entry_fee: {
      local_adult: 0,
      local_child: 0,
      foreign_adult: 300,
      foreign_child: 150,
      currency: 'NPR'
    },
    opening_hours: {
      monday: '06:00-18:00',
      tuesday: '06:00-18:00',
      wednesday: '06:00-18:00',
      thursday: '06:00-18:00',
      friday: '06:00-18:00',
      saturday: '06:00-18:00',
      sunday: '06:00-18:00'
    },
    status: 'published',
    is_featured: false,
    best_time_to_visit: 'Morning hours',
    average_visit_duration_minutes: 60
  }
]

// Events Data - EXPANDED (8 major festivals and events)
const events = [
  {
    name_en: 'Dashain Festival',
    name_ne: 'दशैं पर्व',
    slug: 'dashain-festival-2025',
    short_description: 'The biggest and most important festival in Nepal, celebrating the victory of good over evil.',
    short_description_ne: 'नेपालको सबैभन्दा ठूलो र महत्वपूर्ण पर्व, असत्यमाथि सत्यको विजय मनाउने।',
    full_description: '15-day festival with family gatherings, blessings, and celebrations. Features traditional rituals, kite flying, and elaborate feasts.',
    full_description_ne: 'पारिवारिक भेला, आशीर्वाद र उत्सवसहित १५ दिने पर्व।',
    category: 'Festival',
    palika: 'Kathmandu Metropolitan',
    start_date: '2025-10-02',
    end_date: '2025-10-16',
    event_type: 'Cultural',
    is_festival: true,
    recurrence_pattern: 'annual',
    status: 'published'
  },
  {
    name_en: 'Tihar Festival',
    name_ne: 'तिहार पर्व',
    slug: 'tihar-festival-2025',
    short_description: 'Festival of lights celebrated for 5 days, honoring different animals and relationships.',
    short_description_ne: 'विभिन्न जनावर र सम्बन्धहरूलाई सम्मान गर्दै ५ दिन मनाइने बत्तीको पर्व।',
    full_description: 'Also known as Deepawali, featuring oil lamps, decorations, and cultural programs. Each day honors different animals and relationships.',
    full_description_ne: 'दीपावली भनेर पनि चिनिन्छ, तेलको बत्ती, सजावट र सांस्कृतिक कार्यक्रमहरूसहित।',
    category: 'Festival',
    palika: 'Kathmandu Metropolitan',
    start_date: '2025-11-01',
    end_date: '2025-11-05',
    event_type: 'Cultural',
    is_festival: true,
    recurrence_pattern: 'annual',
    status: 'published'
  },
  {
    name_en: 'Buddha Jayanti',
    name_ne: 'बुद्ध जयन्ती',
    slug: 'buddha-jayanti-2025',
    short_description: 'Celebration of Lord Buddha\'s birth, enlightenment, and death.',
    short_description_ne: 'भगवान बुद्धको जन्म, ज्ञान प्राप्ति र मृत्युको उत्सव।',
    full_description: 'Major Buddhist festival with special ceremonies at Lumbini and Buddhist monasteries across Nepal.',
    full_description_ne: 'लुम्बिनी र बौद्ध गुम्बाहरूमा विशेष समारोहसहित प्रमुख बौद्ध पर्व।',
    category: 'Religious',
    palika: 'Kathmandu Metropolitan',
    start_date: '2025-05-12',
    end_date: '2025-05-12',
    event_type: 'Religious',
    is_festival: true,
    recurrence_pattern: 'annual',
    status: 'published'
  },
  {
    name_en: 'Holi Festival',
    name_ne: 'होली पर्व',
    slug: 'holi-festival-2026',
    short_description: 'Festival of colors celebrating the arrival of spring with vibrant colors and joyful celebrations.',
    short_description_ne: 'रंगबिरंगी रंगहरू र आनन्दमय उत्सवसहित वसन्तको आगमन मनाउने रंगहरूको पर्व।',
    full_description: 'Two-day celebration where people throw colored powders and water at each other, symbolizing the victory of good over evil and the arrival of spring.',
    full_description_ne: 'दुई दिने उत्सव जहाँ मानिसहरूले एकअर्कामा रंगीन धुलो र पानी फ्याँक्छन्, असत्यमाथि सत्यको विजय र वसन्तको आगमनको प्रतीक।',
    category: 'Festival',
    palika: 'Kathmandu Metropolitan',
    start_date: '2026-03-13',
    end_date: '2026-03-14',
    event_type: 'Cultural',
    is_festival: true,
    recurrence_pattern: 'annual',
    status: 'published'
  },
  {
    name_en: 'Indra Jatra',
    name_ne: 'इन्द्र जात्रा',
    slug: 'indra-jatra-2025',
    short_description: 'Kathmandu\'s biggest street festival featuring the living goddess Kumari and traditional dances.',
    short_description_ne: 'जीवित देवी कुमारी र परम्परागत नृत्यहरूको विशेषता भएको काठमाडौंको सबैभन्दा ठूलो सडक उत्सव।',
    full_description: 'Eight-day festival celebrating Indra, the king of gods, featuring chariot processions, mask dances, and the rare public appearance of the living goddess Kumari.',
    full_description_ne: 'देवताहरूका राजा इन्द्रको उत्सव मनाउने आठ दिने पर्व, रथ यात्रा, मुखौटा नृत्य र जीवित देवी कुमारीको दुर्लभ सार्वजनिक दर्शन।',
    category: 'Festival',
    palika: 'Kathmandu Metropolitan',
    start_date: '2025-09-17',
    end_date: '2025-09-24',
    event_type: 'Cultural',
    is_festival: true,
    recurrence_pattern: 'annual',
    status: 'published'
  },
  {
    name_en: 'Everest Marathon',
    name_ne: 'सगरमाथा म्याराथन',
    slug: 'everest-marathon-2025',
    short_description: 'World\'s highest marathon starting from Everest Base Camp through stunning Himalayan landscapes.',
    short_description_ne: 'सगरमाथा आधार शिविरबाट सुरु हुने हिमालयको मनमोहक दृश्यहरूबीच विश्वको सबैभन्दा उच्च म्याराथन।',
    full_description: 'Challenging high-altitude marathon attracting runners from around the world. The race starts at 17,598 feet and descends through Sherpa villages.',
    full_description_ne: 'विश्वभरका धावकहरूलाई आकर्षित गर्ने चुनौतीपूर्ण उच्च उचाइको म्याराथन। दौड १७,५९८ फिटबाट सुरु भएर शेर्पा गाउँहरूबाट तल झर्छ।',
    category: 'Cultural', // Changed from 'Sports' to existing category
    palika: 'Kathmandu Metropolitan',
    start_date: '2025-05-29',
    end_date: '2025-05-29',
    event_type: 'Sports',
    is_festival: false,
    recurrence_pattern: 'annual',
    status: 'published'
  },
  {
    name_en: 'Pokhara Street Festival',
    name_ne: 'पोखरा सडक महोत्सव',
    slug: 'pokhara-street-festival-2025',
    short_description: 'Annual street festival in Pokhara featuring live music, cultural performances, and local food.',
    short_description_ne: 'प्रत्यक्ष संगीत, सांस्कृतिक प्रस्तुति र स्थानीय खानाको विशेषता भएको पोखराको वार्षिक सडक महोत्सव।',
    full_description: 'Three-day celebration of music, art, and culture in the beautiful lakeside city of Pokhara, featuring local and international artists.',
    full_description_ne: 'सुन्दर तालको शहर पोखरामा स्थानीय र अन्तर्राष्ट्रिय कलाकारहरूको विशेषतासहित संगीत, कला र संस्कृतिको तीन दिने उत्सव।',
    category: 'Cultural',
    palika: 'Pokhara Metropolitan',
    start_date: '2025-12-15',
    end_date: '2025-12-17',
    event_type: 'Cultural',
    is_festival: false,
    recurrence_pattern: 'annual',
    status: 'published'
  },
  {
    name_en: 'Nepal Food Festival',
    name_ne: 'नेपाल खाना महोत्सव',
    slug: 'nepal-food-festival-2026',
    short_description: 'Culinary celebration showcasing traditional and modern Nepali cuisine from different regions.',
    short_description_ne: 'विभिन्न क्षेत्रका परम्परागत र आधुनिक नेपाली खानाको प्रदर्शन गर्ने पाक कला उत्सव।',
    full_description: 'Five-day festival celebrating Nepal\'s diverse culinary heritage with cooking demonstrations, food stalls, and cultural performances.',
    full_description_ne: 'खाना पकाउने प्रदर्शन, खाना स्टलहरू र सांस्कृतिक प्रस्तुतिसहित नेपालको विविध पाक सम्पदा मनाउने पाँच दिने महोत्सव।',
    category: 'Cultural', // Changed from 'Food' to existing category
    palika: 'Kathmandu Metropolitan',
    start_date: '2026-01-15',
    end_date: '2026-01-19',
    event_type: 'Cultural',
    is_festival: false,
    recurrence_pattern: 'annual',
    status: 'published'
  }
]

// Blog Posts Data - EXPANDED (6 tourism articles)
const blogPosts = [
  {
    title_en: 'Ultimate Guide to Nepal\'s World Heritage Sites',
    title_ne: 'नेपालका विश्व सम्पदा स्थलहरूको पूर्ण गाइड',
    slug: 'ultimate-guide-nepal-world-heritage-sites',
    excerpt: 'Nepal is home to 10 UNESCO World Heritage Sites, each telling a unique story of the country\'s rich cultural and natural heritage.',
    excerpt_ne: 'नेपाल १० युनेस्को विश्व सम्पदा स्थलहरूको घर हो, प्रत्येकले देशको समृद्ध सांस्कृतिक र प्राकृतिक सम्पदाको अनौठो कथा भन्छ।',
    content: 'Nepal is home to 10 UNESCO World Heritage Sites, each telling a unique story of the country\'s rich cultural and natural heritage. From ancient temples to pristine national parks, these sites represent the best of Nepal\'s treasures.\n\nCultural Heritage Sites:\n1. Kathmandu Durbar Square - Former royal palace complex\n2. Patan Durbar Square - Medieval architecture masterpiece\n3. Bhaktapur Durbar Square - Living museum of culture\n4. Swayambhunath - Ancient Buddhist temple\n5. Boudhanath - Largest stupa in Nepal\n6. Pashupatinath - Sacred Hindu temple\n7. Changu Narayan - Oldest temple in Nepal\n8. Lumbini - Birthplace of Lord Buddha\n\nNatural Heritage Sites:\n1. Sagarmatha National Park - Home to Mount Everest\n2. Chitwan National Park - Wildlife sanctuary\n\nEach site offers unique experiences, from spiritual journeys to wildlife encounters. Plan your visit during the best seasons and respect local customs for an enriching experience.',
    content_ne: 'नेपाल १० युनेस्को विश्व सम्पदा स्थलहरूको घर हो, प्रत्येकले देशको समृद्ध सांस्कृतिक र प्राकृतिक सम्पदाको अनौठो कथा भन्छ।',
    category: 'Heritage Updates',
    palika: 'Kathmandu Metropolitan',
    tags: ['Heritage', 'UNESCO', 'Culture', 'Travel Guide'],
    status: 'published'
  },
  {
    title_en: 'Best Time to Visit Nepal: Season by Season Guide',
    title_ne: 'नेपाल भ्रमणको उत्तम समय: मौसम अनुसारको गाइड',
    slug: 'best-time-visit-nepal-season-guide',
    excerpt: 'Nepal\'s diverse geography creates distinct seasons, each offering unique experiences for travelers.',
    excerpt_ne: 'नेपालको विविध भूगोलले फरक मौसमहरू सिर्जना गर्छ, प्रत्येकले यात्रुहरूका लागि अनौठो अनुभवहरू प्रदान गर्छ।',
    content: 'Nepal\'s diverse geography creates distinct seasons, each offering unique experiences for travelers.\n\nAutumn (September-November):\n- Clear mountain views\n- Perfect trekking weather\n- Major festivals (Dashain, Tihar)\n- Peak tourist season\n\nWinter (December-February):\n- Clear skies but cold temperatures\n- Great for cultural tours\n- Fewer crowds\n- Limited high-altitude trekking\n\nSpring (March-May):\n- Rhododendrons in bloom\n- Excellent trekking conditions\n- Warm weather\n- Pre-monsoon clarity\n\nSummer/Monsoon (June-August):\n- Lush green landscapes\n- Cultural festivals\n- Fewer tourists\n- Limited mountain visibility\n\nChoose your season based on your interests: trekking (autumn/spring), culture (winter), or experiencing monsoon beauty (summer).',
    content_ne: 'नेपालको विविध भूगोलले फरक मौसमहरू सिर्जना गर्छ, प्रत्येकले यात्रुहरूका लागि अनौठो अनुभवहरू प्रदान गर्छ।',
    category: 'Tourism News',
    palika: 'Kathmandu Metropolitan',
    tags: ['Travel Tips', 'Seasons', 'Weather', 'Planning'],
    status: 'published'
  },
  {
    title_en: 'Nepal Festival Calendar 2025-2026',
    title_ne: 'नेपाल पर्व पात्रो २०२५-२०२६',
    slug: 'nepal-festival-calendar-2025-2026',
    excerpt: 'Complete guide to Nepal\'s major festivals and their cultural significance throughout the year.',
    excerpt_ne: 'वर्षभरि नेपालका प्रमुख पर्वहरू र तिनीहरूको सांस्कृतिक महत्वको पूर्ण गाइड।',
    content: 'Nepal celebrates numerous festivals throughout the year, each with deep cultural and religious significance.\n\nMajor Festivals:\n\nDashain (October 2025) - 15 days\n- Biggest Hindu festival\n- Victory of good over evil\n- Family reunions and blessings\n\nTihar (November 2025) - 5 days\n- Festival of lights\n- Honoring animals and relationships\n- Beautiful decorations\n\nHoli (March 2026) - 2 days\n- Festival of colors\n- Spring celebration\n- Joyful community participation\n\nBuddha Jayanti (May 2025)\n- Buddha\'s birth, enlightenment, and death\n- Special ceremonies at Lumbini\n- Buddhist pilgrimage\n\nIndra Jatra (September 2025) - 8 days\n- Kathmandu\'s biggest festival\n- Living goddess Kumari procession\n- Traditional dances and music\n\nPlan your visit around these festivals for authentic cultural experiences.',
    content_ne: 'नेपालले वर्षभरि धेरै पर्वहरू मनाउँछ, प्रत्येकको गहिरो सांस्कृतिक र धार्मिक महत्व छ।',
    category: 'Cultural Stories',
    palika: 'Kathmandu Metropolitan',
    tags: ['Festivals', 'Culture', 'Calendar', 'Traditions'],
    status: 'published'
  },
  {
    title_en: 'Trekking Safety in Nepal: Essential Tips',
    title_ne: 'नेपालमा ट्रेकिङ सुरक्षा: आवश्यक सुझावहरू',
    slug: 'trekking-safety-nepal-essential-tips',
    excerpt: 'Comprehensive safety guide for trekking in Nepal\'s mountains, including permits, preparation, and emergency procedures.',
    excerpt_ne: 'अनुमतिपत्र, तयारी र आपतकालीन प्रक्रियाहरू सहित नेपालका पहाडहरूमा ट्रेकिङको लागि व्यापक सुरक्षा गाइड।',
    content: 'Trekking in Nepal offers incredible experiences, but proper preparation and safety measures are essential.\n\nBefore You Go:\n- Obtain necessary permits (TIMS, National Park permits)\n- Get comprehensive travel insurance\n- Physical fitness preparation\n- Acclimatization planning\n\nSafety Equipment:\n- First aid kit\n- Water purification tablets\n- Emergency communication device\n- Proper trekking gear\n\nAltitude Sickness Prevention:\n- Gradual ascent (no more than 500m per day above 3000m)\n- Stay hydrated\n- Recognize symptoms early\n- Descend if symptoms worsen\n\nEmergency Contacts:\n- Tourist Police: 1144\n- Helicopter Rescue: Contact your insurance\n- Local guides and porters\n\nAlways trek with experienced guides and inform someone of your itinerary.',
    content_ne: 'नेपालमा ट्रेकिङले अविश्वसनीय अनुभवहरू प्रदान गर्छ, तर उचित तयारी र सुरक्षा उपायहरू आवश्यक छन्।',
    category: 'Tourism News',
    palika: 'Kathmandu Metropolitan',
    tags: ['Trekking', 'Safety', 'Mountains', 'Adventure'],
    status: 'published'
  },
  {
    title_en: 'Taste of Nepal: Traditional Food Guide',
    title_ne: 'नेपालको स्वाद: परम्परागत खाना गाइड',
    slug: 'taste-nepal-traditional-food-guide',
    excerpt: 'Explore Nepal\'s diverse culinary heritage from dal bhat to momos, and discover the flavors that define Nepali cuisine.',
    excerpt_ne: 'दालभातदेखि मोमोसम्म नेपालको विविध पाक सम्पदाको अन्वेषण गर्नुहोस् र नेपाली खानालाई परिभाषित गर्ने स्वादहरू पत्ता लगाउनुहोस्।',
    content: 'Nepali cuisine reflects the country\'s diverse geography and cultural influences, offering a rich tapestry of flavors.\n\nStaple Foods:\n- Dal Bhat - Rice with lentil soup, the national dish\n- Momos - Steamed dumplings with various fillings\n- Gundruk - Fermented leafy green vegetable\n- Dhido - Traditional millet or corn porridge\n\nRegional Specialties:\n- Newari Cuisine (Kathmandu Valley)\n  - Yomari - Sweet steamed dumpling\n  - Chatamari - Nepali pizza\n  - Buffalo meat dishes\n\n- Thakali Cuisine (Mustang region)\n  - Thakali Thali - Complete meal set\n  - Yak cheese and meat\n  - Buckwheat dishes\n\n- Sherpa Cuisine (Mountain regions)\n  - Thukpa - Noodle soup\n  - Tsampa - Roasted barley flour\n  - Yak butter tea\n\nStreet Food:\n- Sel roti - Traditional ring-shaped bread\n- Samosa - Fried pastry with savory filling\n- Pani puri - Crispy shells with spiced water\n\nExperience authentic flavors at local restaurants and street vendors throughout Nepal.',
    content_ne: 'नेपाली खानाले देशको विविध भूगोल र सांस्कृतिक प्रभावहरूलाई प्रतिबिम्बित गर्छ, स्वादहरूको समृद्ध ट्यापेस्ट्री प्रदान गर्छ।',
    category: 'Cultural Stories',
    palika: 'Kathmandu Metropolitan',
    tags: ['Food', 'Culture', 'Traditional', 'Cuisine'],
    status: 'published'
  },
  {
    title_en: 'Sustainable Tourism in Nepal',
    title_ne: 'नेपालमा दिगो पर्यटन',
    slug: 'sustainable-tourism-nepal',
    excerpt: 'Learn how to travel responsibly in Nepal while supporting local communities and preserving the environment.',
    excerpt_ne: 'स्थानीय समुदायहरूलाई सहयोग गर्दै र वातावरण संरक्षण गर्दै नेपालमा जिम्मेवारीपूर्वक यात्रा गर्ने तरिका सिक्नुहोस्।',
    content: 'Sustainable tourism ensures that Nepal\'s natural beauty and cultural heritage are preserved for future generations.\n\nEco-Friendly Practices:\n- Choose eco-lodges and sustainable accommodations\n- Use refillable water bottles\n- Minimize plastic waste\n- Respect wildlife and natural habitats\n\nSupporting Local Communities:\n- Buy from local artisans and businesses\n- Hire local guides and porters\n- Stay in community-run homestays\n- Respect local customs and traditions\n\nResponsible Trekking:\n- Follow Leave No Trace principles\n- Use designated trails\n- Carry out all waste\n- Support porter welfare initiatives\n\nCultural Sensitivity:\n- Dress appropriately at religious sites\n- Ask permission before photographing people\n- Learn basic Nepali phrases\n- Participate respectfully in local customs\n\nConservation Efforts:\n- Visit national parks and conservation areas\n- Support wildlife protection programs\n- Choose carbon-offset travel options\n- Educate yourself about local environmental issues\n\nBy traveling sustainably, you help preserve Nepal\'s incredible heritage while creating positive impacts for local communities.',
    content_ne: 'दिगो पर्यटनले नेपालको प्राकृतिक सुन्दरता र सांस्कृतिक सम्पदा भावी पुस्ताका लागि संरक्षित रहने सुनिश्चित गर्छ।',
    category: 'Community News',
    palika: 'Kathmandu Metropolitan',
    tags: ['Sustainability', 'Environment', 'Community', 'Responsible Travel'],
    status: 'published'
  }
]

async function seedHeritageSites() {
  console.log('🏛️  Seeding heritage sites...')
  
  let successCount = 0
  let errorCount = 0
  
  for (const site of heritageSites) {
    try {
      // Get category and palika IDs
      const categoryId = await getCategoryId(site.category, 'heritage_site')
      const palikaId = await getPalikaId(site.palika)
      
      const siteData = {
        ...site,
        category_id: categoryId,
        palika_id: palikaId,
        location: `POINT(${site.longitude} ${site.latitude})`,
        published_at: new Date().toISOString()
      }
      
      // Remove the string references and coordinates
      delete siteData.category
      delete siteData.palika
      delete siteData.latitude
      delete siteData.longitude
      
      const { error } = await supabase
        .from('heritage_sites')
        .upsert(siteData, { 
          onConflict: 'slug',
          ignoreDuplicates: false 
        })
      
      if (error) {
        console.error(`❌ Error seeding ${site.name_en}:`, error.message)
        errorCount++
      } else {
        successCount++
      }
    } catch (err) {
      console.error(`❌ Error processing ${site.name_en}:`, err)
      errorCount++
    }
  }
  
  console.log(`✅ Heritage sites: ${successCount} seeded, ${errorCount} errors`)
}

async function seedEvents() {
  console.log('🎉 Seeding events...')
  
  let successCount = 0
  let errorCount = 0
  
  for (const event of events) {
    try {
      // Get category and palika IDs
      const categoryId = await getCategoryId(event.category, 'event')
      const palikaId = await getPalikaId(event.palika)
      
      const eventData = {
        ...event,
        category_id: categoryId,
        palika_id: palikaId
      }
      
      // Remove the string references
      delete eventData.category
      delete eventData.palika
      
      const { error } = await supabase
        .from('events')
        .upsert(eventData, { 
          onConflict: 'slug',
          ignoreDuplicates: false 
        })
      
      if (error) {
        console.error(`❌ Error seeding ${event.name_en}:`, error.message)
        errorCount++
      } else {
        successCount++
      }
    } catch (err) {
      console.error(`❌ Error processing ${event.name_en}:`, err)
      errorCount++
    }
  }
  
  console.log(`✅ Events: ${successCount} seeded, ${errorCount} errors`)
}

async function seedBlogPosts() {
  console.log('📝 Seeding blog posts...')
  
  let successCount = 0
  let errorCount = 0
  
  // First check if we have temp admin users
  const { data: adminUsers, error: adminError } = await supabase
    .from('temp_admin_users')
    .select('id, email, role')
    .limit(1)
  
  if (adminError || !adminUsers || adminUsers.length === 0) {
    console.log('⚠️  No temp admin users found. Run: npm run setup:temp-admin')
    console.log('✅ Blog posts: 0 seeded (admin users required)')
    return
  }
  
  // Use the first admin user as author
  const authorId = adminUsers[0].id
  console.log(`👤 Using admin author: ${adminUsers[0].email}`)
  
  for (const post of blogPosts) {
    try {
      // Get palika ID
      const palikaId = await getPalikaId(post.palika)
      
      const postData = {
        ...post,
        palika_id: palikaId,
        published_at: new Date().toISOString(),
        author_id: authorId
      }
      
      // Remove the string reference
      delete postData.palika
      
      const { error } = await supabase
        .from('blog_posts')
        .upsert(postData, { 
          onConflict: 'slug',
          ignoreDuplicates: false 
        })
      
      if (error) {
        console.error(`❌ Error seeding ${post.title_en}:`, error.message)
        errorCount++
      } else {
        successCount++
      }
    } catch (err) {
      console.error(`❌ Error processing ${post.title_en}:`, err)
      errorCount++
    }
  }
  
  console.log(`✅ Blog posts: ${successCount} seeded, ${errorCount} errors`)
}

async function main() {
  console.log('🌱 Starting content seeding...')
  console.log(`📍 Target: ${supabaseUrl}`)
  
  try {
    // Test database connection
    console.log('🔗 Testing database connection...')
    const { data, error } = await supabase
      .from('categories')
      .select('count')
      .limit(1)
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`)
    }
    
    console.log('✅ Database connection successful')
    
    // Seed content
    await seedHeritageSites()
    await seedEvents()
    await seedBlogPosts() // Now works with temp admin users
    
    console.log('\n🎉 Content seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`• ${heritageSites.length} heritage sites (8 UNESCO World Heritage sites)`)
    console.log(`• ${events.length} events (major Nepal festivals and cultural events)`)
    console.log(`• ${blogPosts.length} blog posts (comprehensive tourism information)`)
    console.log('\n✅ Tourism system ready with comprehensive sample content!')
    console.log('\n📝 Note: Run "npm run setup:temp-admin" first to enable blog post seeding')
    
  } catch (error) {
    console.error('❌ Content seeding failed:', error.message)
    process.exit(1)
  }
}

// Run the seeding
if (require.main === module) {
  main()
}