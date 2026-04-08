/**
 * Notification Use Cases — Grounded in Nepal Palika Governance Reality
 *
 * CONTEXT:
 * Palikas (गाउँपालिका / नगरपालिका) are Nepal's local government units.
 * Their communication needs span far beyond tourism: tax collection, vital
 * registration, tenders, disaster alerts, social welfare, public hearings, etc.
 *
 * This file defines the full taxonomy of notification types a palika admin
 * would realistically send. Each use case maps to a DB-compatible category
 * value (VARCHAR(100), no CHECK constraint — freely extensible).
 *
 * TERMINOLOGY:
 * - सूचना (Suchana): Notice/Information — the universal term
 * - विज्ञप्ति (Bigyapti): Formal communiqué/press notice
 * - घोषणा (Ghoshana): Declaration/announcement
 * - चेतावनी (Chetawani): Warning/alert
 * - आपतकालीन सूचना (Apatkalin Suchana): Emergency notice
 * - जानकारी (Jaankari): Informational/FYI
 * - अनुरोध (Anurodh): Appeal/request to citizens
 * - बधाई (Badhai): Greetings/congratulations (festivals, new year)
 *
 * FORMALITY HIERARCHY (most to least formal):
 * आदेश (order) > विज्ञप्ति (communiqué) > घोषणा (declaration) >
 * सूचना (notice) > जानकारी (information) > अनुरोध (appeal) > बधाई (greetings)
 */

// ─── Priority levels ───

export type NotificationPriority = 'critical' | 'important' | 'normal' | 'informational'

export const PRIORITIES: { value: NotificationPriority; label_en: string; label_ne: string; color: string }[] = [
  { value: 'critical',      label_en: 'Critical / Urgent',  label_ne: 'अत्यावश्यक',    color: '#dc2626' },
  { value: 'important',     label_en: 'Important',          label_ne: 'महत्त्वपूर्ण',    color: '#f59e0b' },
  { value: 'normal',        label_en: 'Normal',             label_ne: 'सामान्य',        color: '#3b82f6' },
  { value: 'informational', label_en: 'Informational',      label_ne: 'जानकारीमूलक',   color: '#6b7280' },
]

// ─── Audience scope ───

export type AudienceScope = 'palika_wide' | 'ward_level' | 'targeted_group'

export const AUDIENCE_SCOPES: { value: AudienceScope; label_en: string; label_ne: string }[] = [
  { value: 'palika_wide',    label_en: 'Municipality-wide',  label_ne: 'पालिकाव्यापी' },
  { value: 'ward_level',     label_en: 'Ward-level',         label_ne: 'वडास्तरीय' },
  { value: 'targeted_group', label_en: 'Targeted Group',     label_ne: 'लक्षित समूह' },
]

// ─── Category definitions ───
//
// These are the actual values stored in notifications.category (VARCHAR(100)).
// The 5 original categories (event, heritage, business, system, announcement)
// are preserved for backward compat with m-place frontend types.
// New governance categories are added alongside them.

export interface NotificationCategoryDef {
  value: string              // DB value stored in notifications.category
  label_en: string
  label_ne: string
  description_en: string
  icon: string               // lucide-react icon name
  color: { bg: string; text: string }
  default_priority: NotificationPriority
  default_type: 'general' | 'personal'
}

export const NOTIFICATION_CATEGORIES: NotificationCategoryDef[] = [
  // ─── Disaster & Emergency (विपद् तथा आपतकालीन) ───
  // FIRST because it's the highest-stakes category. Admins reach for this in crisis.
  {
    value: 'disaster_emergency',
    label_en: 'Disaster & Emergency',
    label_ne: 'विपद् तथा आपतकालीन',
    description_en: 'Flood, landslide, earthquake, evacuation, relief distribution',
    icon: 'AlertTriangle',
    color: { bg: '#fef2f2', text: '#991b1b' },
    default_priority: 'critical',
    default_type: 'general',
  },

  // ─── Governance & Administrative (प्रशासनिक) ───
  {
    value: 'announcement',
    label_en: 'Government Notice',
    label_ne: 'सरकारी सूचना / विज्ञप्ति',
    description_en: 'Policy changes, office hours, public holidays, bylaws, formal notices',
    icon: 'Scroll',
    color: { bg: '#fce7f3', text: '#9d174d' },
    default_priority: 'normal',
    default_type: 'general',
  },

  // ─── Revenue & Finance (राजस्व तथा आर्थिक) ───
  {
    value: 'financial',
    label_en: 'Revenue & Finance',
    label_ne: 'राजस्व तथा आर्थिक',
    description_en: 'Property tax, business tax, budget publication, social security payments',
    icon: 'Banknote',
    color: { bg: '#ecfdf5', text: '#065f46' },
    default_priority: 'important',
    default_type: 'general',
  },

  // ─── Vital Registration (व्यक्तिगत घटना दर्ता) ───
  {
    value: 'vital_registration',
    label_en: 'Vital Registration',
    label_ne: 'व्यक्तिगत घटना दर्ता',
    description_en: 'Birth, death, marriage, migration registration drives and reminders',
    icon: 'ClipboardList',
    color: { bg: '#f0fdf4', text: '#166534' },
    default_priority: 'normal',
    default_type: 'general',
  },

  // ─── Procurement & Tenders (खरिद तथा बोलपत्र) ───
  {
    value: 'procurement',
    label_en: 'Procurement & Tenders',
    label_ne: 'खरिद तथा बोलपत्र',
    description_en: 'Open tenders, sealed quotations, EOI, auction, contract awards',
    icon: 'FileSignature',
    color: { bg: '#eff6ff', text: '#1e40af' },
    default_priority: 'normal',
    default_type: 'general',
  },

  // ─── Development & Planning (विकास तथा योजना) ───
  {
    value: 'development',
    label_en: 'Development & Planning',
    label_ne: 'विकास तथा योजना',
    description_en: 'Public hearings, project updates, ward planning, user committee formation',
    icon: 'Building',
    color: { bg: '#fefce8', text: '#854d0e' },
    default_priority: 'normal',
    default_type: 'general',
  },

  // ─── Social Welfare (सामाजिक सुरक्षा) ───
  {
    value: 'social_welfare',
    label_en: 'Social Security & Welfare',
    label_ne: 'सामाजिक सुरक्षा',
    description_en: 'Senior/disability/single women allowance, scholarships, poverty ID',
    icon: 'Heart',
    color: { bg: '#fdf2f8', text: '#be185d' },
    default_priority: 'important',
    default_type: 'general',
  },

  // ─── Health (स्वास्थ्य) ───
  {
    value: 'health',
    label_en: 'Health',
    label_ne: 'स्वास्थ्य',
    description_en: 'Vaccination campaigns, disease outbreak alerts, health camps, water quality',
    icon: 'Stethoscope',
    color: { bg: '#f0fdfa', text: '#115e59' },
    default_priority: 'important',
    default_type: 'general',
  },

  // ─── Event / Festival (चाडपर्व तथा कार्यक्रम) ───
  // Preserved from original 5 categories
  {
    value: 'event',
    label_en: 'Events & Festivals',
    label_ne: 'चाडपर्व तथा कार्यक्रम',
    description_en: 'Festivals, cultural programs, community events, cancellations',
    icon: 'Calendar',
    color: { bg: '#dbeafe', text: '#1e40af' },
    default_priority: 'normal',
    default_type: 'general',
  },

  // ─── Heritage (सम्पदा) ───
  // Preserved from original 5 categories
  {
    value: 'heritage',
    label_en: 'Heritage Sites',
    label_ne: 'सम्पदा स्थल',
    description_en: 'Heritage site updates, closures, renovation notices, access restrictions',
    icon: 'Landmark',
    color: { bg: '#fef3c7', text: '#92400e' },
    default_priority: 'normal',
    default_type: 'general',
  },

  // ─── Business / Marketplace (व्यवसाय) ───
  // Preserved from original 5 categories
  {
    value: 'business',
    label_en: 'Business & Marketplace',
    label_ne: 'व्यवसाय तथा बजार',
    description_en: 'Business approvals, marketplace updates, trade license renewals',
    icon: 'Store',
    color: { bg: '#d1fae5', text: '#065f46' },
    default_priority: 'normal',
    default_type: 'personal',
  },

  // ─── Education (शिक्षा) ───
  {
    value: 'education',
    label_en: 'Education',
    label_ne: 'शिक्षा',
    description_en: 'School admissions, scholarships, exam schedules, teacher recruitment',
    icon: 'GraduationCap',
    color: { bg: '#e0e7ff', text: '#3730a3' },
    default_priority: 'normal',
    default_type: 'general',
  },

  // ─── Land & Infrastructure (भूमि तथा पूर्वाधार) ───
  {
    value: 'land_infrastructure',
    label_en: 'Land & Infrastructure',
    label_ne: 'भूमि तथा पूर्वाधार',
    description_en: 'Building permits, road construction, land revenue, utility disruptions',
    icon: 'Map',
    color: { bg: '#fef9c3', text: '#713f12' },
    default_priority: 'normal',
    default_type: 'general',
  },

  // ─── System (प्रणाली) ───
  // Preserved from original 5 categories
  {
    value: 'system',
    label_en: 'System & App Updates',
    label_ne: 'प्रणाली अपडेट',
    description_en: 'App updates, new features, maintenance, platform announcements',
    icon: 'Settings',
    color: { bg: '#e0e7ff', text: '#3730a3' },
    default_priority: 'informational',
    default_type: 'general',
  },

  // ─── Greetings (शुभकामना / बधाई) ───
  {
    value: 'greetings',
    label_en: 'Greetings & Wishes',
    label_ne: 'शुभकामना / बधाई',
    description_en: 'New Year (नयाँ वर्ष), Dashain, Tihar, national days, congratulations',
    icon: 'PartyPopper',
    color: { bg: '#fef3c7', text: '#b45309' },
    default_priority: 'informational',
    default_type: 'general',
  },
]

// ─── Quick-start templates ───
//
// These are pre-filled notification templates for common governance scenarios.
// Admins pick a template → fields auto-fill → they customize and send.
// Grounded in actual palika communication patterns.

export interface NotificationTemplate {
  id: string
  category: string              // matches NOTIFICATION_CATEGORIES.value
  label_en: string
  label_ne: string
  title_template: string        // Pre-filled title (admin can edit)
  body_template: string         // Pre-filled body
  body_full_template?: string   // Pre-filled detail content
  default_priority: NotificationPriority
  default_type: 'general' | 'personal'
  typical_attachments?: string  // Description of what's usually attached
}

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  // ─── Emergency / Disaster ───
  {
    id: 'flood_warning',
    category: 'disaster_emergency',
    label_en: 'Flood Warning',
    label_ne: 'बाढी चेतावनी',
    title_template: 'बाढी चेतावनी — Flood Warning',
    body_template: 'नदीको जलस्तर खतराको तहमाथि पुगेको छ। तटीय क्षेत्रका बासिन्दाहरू तुरुन्त सुरक्षित स्थानमा जानुहोस्।',
    body_full_template: `बाढी चेतावनी सूचना

प्रभावित क्षेत्र: वडा नं. ___, ___
अवस्था: नदीको जलस्तह खतराको तहभन्दा माथि

सुरक्षा निर्देशन:
• तटीय क्षेत्र तुरुन्त छोड्नुहोस्
• नजिकको आश्रय स्थलमा जानुहोस्
• आश्रय स्थल: ___ (वडा ___)
• आपतकालीन सम्पर्क: १०० वा ___

अपडेट हरेक २ घण्टामा दिइनेछ।

---
Emergency Contact: 100
Shelter locations: ___`,
    default_priority: 'critical',
    default_type: 'general',
    typical_attachments: 'Evacuation route map (image), emergency contacts list (PDF)',
  },
  {
    id: 'earthquake_advisory',
    category: 'disaster_emergency',
    label_en: 'Earthquake Advisory',
    label_ne: 'भूकम्प सम्बन्धी सूचना',
    title_template: 'भूकम्प सम्बन्धी सूचना — Earthquake Advisory',
    body_template: 'भूकम्पको धक्का महसुस भएको छ। कृपया खुला ठाउँमा जानुहोस् र पश्चात्धक्काको सम्भावनाप्रति सचेत रहनुहोस्।',
    body_full_template: `भूकम्प सम्बन्धी आपतकालीन सूचना

• खुला ठाउँमा जानुहोस्
• भवन भित्र नजानुहोस्
• ग्यास र बिजुली बन्द गर्नुहोस्
• पश्चात्धक्काको सम्भावना छ — सतर्क रहनुहोस्
• क्षति भएमा वडा कार्यालयमा जानकारी दिनुहोस्

आपतकालीन नम्बर: १०० (प्रहरी), १०१ (अग्नि नियन्त्रण), १०२ (एम्बुलेन्स)`,
    default_priority: 'critical',
    default_type: 'general',
  },

  // ─── Financial / Revenue ───
  {
    id: 'property_tax',
    category: 'financial',
    label_en: 'Property Tax Collection Notice',
    label_ne: 'सम्पत्ति कर संकलन सूचना',
    title_template: 'सम्पत्ति कर बुझाउने सम्बन्धी सूचना',
    body_template: 'आर्थिक वर्ष ०८१/८२ को सम्पत्ति कर बुझाउने अन्तिम मिति ___ गते सम्म रहेको व्यहोरा जानकारी गराइन्छ।',
    body_full_template: `सम्पत्ति कर संकलन सम्बन्धी सूचना

यस पालिकामा सम्पत्ति कर बुझाउने सम्बन्धमा सम्पूर्ण करदातालाई जानकारी गराइन्छ:

• अन्तिम मिति: ___ गते
• भुक्तानी स्थान: पालिका कार्यालय राजस्व शाखा वा वडा कार्यालय
• म्याद भित्र बुझाउनेलाई छुट: ___%
• म्याद नाघेमा जरिवाना: ___% प्रति महिना

आवश्यक कागजात:
• सम्पत्ति कर रसिद (अघिल्लो वर्षको)
• नागरिकता प्रमाणपत्रको प्रतिलिपि
• जग्गाधनी प्रमाणपत्रको प्रतिलिपि`,
    default_priority: 'important',
    default_type: 'general',
    typical_attachments: 'Tax rate schedule (PDF)',
  },
  {
    id: 'social_security_payment',
    category: 'social_welfare',
    label_en: 'Social Security Allowance Distribution',
    label_ne: 'सामाजिक सुरक्षा भत्ता वितरण सूचना',
    title_template: 'सामाजिक सुरक्षा भत्ता वितरण हुने सूचना',
    body_template: 'जेष्ठ नागरिक, एकल महिला, अपाङ्गता तथा दलित समुदायको भत्ता ___ गते वितरण हुने भएकाले सम्बन्धित सबैलाई जानकारी गराइन्छ।',
    body_full_template: `सामाजिक सुरक्षा भत्ता वितरण सूचना

वितरण मिति: ___ गते
स्थान: सम्बन्धित वडा कार्यालय

भत्ता प्रकार:
• जेष्ठ नागरिक (७० वर्ष माथि): रु. ___
• एकल महिला: रु. ___
• पूर्ण अपाङ्गता: रु. ___
• आंशिक अपाङ्गता: रु. ___
• दलित ज्येष्ठ नागरिक (६० वर्ष माथि): रु. ___

ल्याउनुपर्ने कागजात:
• परिचयपत्र (सामाजिक सुरक्षा)
• नागरिकता प्रमाणपत्र`,
    default_priority: 'important',
    default_type: 'general',
  },

  // ─── Vital Registration ───
  {
    id: 'birth_registration',
    category: 'vital_registration',
    label_en: 'Birth Registration Reminder',
    label_ne: 'जन्म दर्ता सम्झना',
    title_template: 'जन्म दर्ता समयमै गराउनुहोस् — ३५ दिनभित्र निःशुल्क',
    body_template: 'नवजात शिशुको जन्म दर्ता ३५ दिनभित्र गराउनुहोस्। निःशुल्क सेवा। वडा कार्यालयमा सम्पर्क गर्नुहोस्।',
    default_priority: 'normal',
    default_type: 'general',
  },

  // ─── Procurement ───
  {
    id: 'open_tender',
    category: 'procurement',
    label_en: 'Open Tender Notice',
    label_ne: 'खुला बोलपत्र आव्हान सूचना',
    title_template: 'खुला बोलपत्र आव्हान — ___',
    body_template: 'यस पालिकाको ___ निर्माण / आपूर्ति कार्यको लागि योग्य फर्म / कम्पनीहरूबाट शिलबन्दी बोलपत्र आव्हान गरिएको छ।',
    body_full_template: `खुला बोलपत्र आव्हान सूचना
(प्रथम पटक प्रकाशित मिति: ___)

कार्यको विवरण: ___
अनुमानित लागत: रु. ___
बोलपत्र दाखिला अन्तिम मिति: ___
बोलपत्र खोल्ने मिति: ___

बोलपत्र फारम उपलब्ध स्थान: पालिका कार्यालय, ___
बोलपत्र फारम शुल्क: रु. ___

शर्तहरू: बोलपत्र सूचनासँगै संलग्न`,
    default_priority: 'normal',
    default_type: 'general',
    typical_attachments: 'Tender document (PDF), BOQ spreadsheet',
  },

  // ─── Public Hearing ───
  {
    id: 'public_hearing',
    category: 'development',
    label_en: 'Public Hearing Notice',
    label_ne: 'सार्वजनिक सुनुवाई सूचना',
    title_template: 'सार्वजनिक सुनुवाई — ___',
    body_template: 'यस पालिकाको वार्षिक समीक्षा / योजना छनौट सम्बन्धी सार्वजनिक सुनुवाई ___ गते हुने भएकाले सर्वसाधारणको उपस्थिति अनुरोध गरिन्छ।',
    default_priority: 'important',
    default_type: 'general',
  },

  // ─── Health ───
  {
    id: 'vaccination_campaign',
    category: 'health',
    label_en: 'Vaccination Campaign',
    label_ne: 'खोप अभियान सूचना',
    title_template: 'खोप अभियान — ___',
    body_template: '___ खोप अभियान ___ गतेदेखि ___ गतेसम्म सञ्चालन हुने भएकाले सबै स्वास्थ्य संस्थामा खोप लगाउन आउनुहोस्।',
    default_priority: 'important',
    default_type: 'general',
  },
  {
    id: 'disease_outbreak',
    category: 'health',
    label_en: 'Disease Outbreak Alert',
    label_ne: 'रोग प्रकोप चेतावनी',
    title_template: 'रोग प्रकोप चेतावनी — ___',
    body_template: '___ रोगको प्रकोप देखिएको छ। सतर्कता अपनाउनुहोस् र लक्षण देखिएमा नजिकको स्वास्थ्य संस्थामा जानुहोस्।',
    default_priority: 'critical',
    default_type: 'general',
  },

  // ─── Events & Festivals ───
  {
    id: 'festival_event',
    category: 'event',
    label_en: 'Festival / Cultural Event',
    label_ne: 'चाडपर्व / सांस्कृतिक कार्यक्रम',
    title_template: '___ पर्व / कार्यक्रम सम्बन्धी सूचना',
    body_template: '___ उपलक्ष्यमा ___ गते ___ स्थानमा कार्यक्रम हुने भएकाले सबैमा निमन्त्रणा गरिन्छ।',
    default_priority: 'normal',
    default_type: 'general',
  },
  {
    id: 'community_event',
    category: 'event',
    label_en: 'Community Event / Drive',
    label_ne: 'सामुदायिक कार्यक्रम / अभियान',
    title_template: '___ अभियान — सहभागिता अनुरोध',
    body_template: '___ अभियान ___ गते सञ्चालन हुने भएकाले सबैको सहभागिता अनुरोध गरिन्छ।',
    default_priority: 'normal',
    default_type: 'general',
  },

  // ─── Heritage ───
  {
    id: 'heritage_update',
    category: 'heritage',
    label_en: 'Heritage Site Update',
    label_ne: 'सम्पदा स्थल सम्बन्धी सूचना',
    title_template: '___ — सम्पदा स्थल सूचना',
    body_template: '___ सम्पदा स्थलमा ___ भएकाले भ्रमणार्थीहरूलाई जानकारी गराइन्छ।',
    default_priority: 'normal',
    default_type: 'general',
  },

  // ─── Business ───
  {
    id: 'business_approval',
    category: 'business',
    label_en: 'Business Registration Approved',
    label_ne: 'व्यवसाय दर्ता स्वीकृत',
    title_template: 'तपाईंको व्यवसाय "___ " स्वीकृत भएको छ',
    body_template: 'बधाई छ! तपाईंको व्यवसाय Digital Palika Marketplace मा स्वीकृत भई प्रकाशित भएको छ।',
    default_priority: 'normal',
    default_type: 'personal',
  },
  {
    id: 'business_tax_renewal',
    category: 'business',
    label_en: 'Business Tax / License Renewal',
    label_ne: 'व्यवसाय कर / नवीकरण सूचना',
    title_template: 'व्यवसाय दर्ता नवीकरण सम्बन्धी सूचना',
    body_template: 'व्यवसाय दर्ता नवीकरण ___ मसान्तभित्र गर्नुपर्ने व्यहोरा जानकारी गराइन्छ।',
    default_priority: 'important',
    default_type: 'general',
  },

  // ─── Education ───
  {
    id: 'school_admission',
    category: 'education',
    label_en: 'School Admission Notice',
    label_ne: 'विद्यालय भर्ना सूचना',
    title_template: 'विद्यालय भर्ना सम्बन्धी सूचना',
    body_template: 'सामुदायिक विद्यालयमा ___ कक्षामा भर्ना खुलेको छ। अन्तिम मिति: ___',
    default_priority: 'normal',
    default_type: 'general',
  },
  {
    id: 'scholarship_notice',
    category: 'education',
    label_en: 'Scholarship Application Open',
    label_ne: 'छात्रवृत्ति सूचना',
    title_template: 'छात्रवृत्ति आवेदन खुलेको सूचना',
    body_template: 'पालिका छात्रवृत्तिको लागि आवेदन ___ गतेसम्म खुला छ। योग्य विद्यार्थीहरूले आवेदन दिनुहोस्।',
    default_priority: 'normal',
    default_type: 'general',
    typical_attachments: 'Application form (PDF)',
  },

  // ─── Land & Infrastructure ───
  {
    id: 'road_construction',
    category: 'land_infrastructure',
    label_en: 'Road Construction / Traffic Notice',
    label_ne: 'सडक निर्माण / यातायात सूचना',
    title_template: '___ सडक निर्माण सम्बन्धी सूचना',
    body_template: '___ सडकमा निर्माण कार्य भइरहेकाले वैकल्पिक बाटो प्रयोग गर्नुहोस्।',
    default_priority: 'normal',
    default_type: 'general',
  },

  // ─── Greetings ───
  {
    id: 'new_year',
    category: 'greetings',
    label_en: 'New Year Greetings',
    label_ne: 'नयाँ वर्षको शुभकामना',
    title_template: 'नयाँ वर्ष ___  को हार्दिक मंगलमय शुभकामना!',
    body_template: 'नयाँ वर्षको शुभ अवसरमा पालिकाका सम्पूर्ण नागरिकमा सुख, शान्ति र समृद्धिको कामना गर्दछौं।',
    default_priority: 'informational',
    default_type: 'general',
  },
  {
    id: 'dashain_greetings',
    category: 'greetings',
    label_en: 'Dashain Greetings',
    label_ne: 'दशैंको शुभकामना',
    title_template: 'बडादशैंको हार्दिक मंगलमय शुभकामना!',
    body_template: 'विजयादशमीको शुभ अवसरमा सबैमा सुख, शान्ति र दीर्घायुको कामना गर्दछौं।',
    default_priority: 'informational',
    default_type: 'general',
  },

  // ─── System ───
  {
    id: 'app_update',
    category: 'system',
    label_en: 'App Update / New Feature',
    label_ne: 'एप अपडेट / नयाँ सुविधा',
    title_template: 'नयाँ सुविधा — ___',
    body_template: 'Digital Palika मा नयाँ सुविधा थपिएको छ। अपडेट गरेर प्रयोग गर्नुहोस्।',
    default_priority: 'informational',
    default_type: 'general',
  },
]

// ─── Helpers ───

export function getCategoryByValue(value: string): NotificationCategoryDef | undefined {
  return NOTIFICATION_CATEGORIES.find(c => c.value === value)
}

export function getTemplatesByCategory(categoryValue: string): NotificationTemplate[] {
  return NOTIFICATION_TEMPLATES.filter(t => t.category === categoryValue)
}

export function getCategoryColor(value: string): { bg: string; text: string } {
  return getCategoryByValue(value)?.color || { bg: '#f1f5f9', text: '#475569' }
}
