import { Feature } from '@/lib/types'
import {
  IPalikaFeaturesDatasource,
  PalikaFeaturesResult,
} from './palika-features-datasource'

const now = new Date().toISOString()

const FEATURES: Record<string, Feature> = {
  self_service_registration: {
    id: 'feat-001',
    code: 'self_service_registration',
    display_name: 'Self-Service Registration',
    description: 'Allow businesses to self-register without admin assistance',
    category: 'registration',
    is_active: true,
    created_at: now,
  },
  verification_workflow: {
    id: 'feat-002',
    code: 'verification_workflow',
    display_name: 'Verification Workflow',
    description: 'Multi-step admin verification for new listings',
    category: 'admin',
    is_active: true,
    created_at: now,
  },
  business_analytics: {
    id: 'feat-003',
    code: 'business_analytics',
    display_name: 'Business Analytics',
    description: 'Analytics dashboards for registered businesses',
    category: 'analytics',
    is_active: true,
    created_at: now,
  },
  qr_menus: {
    id: 'feat-004',
    code: 'qr_menus',
    display_name: 'QR Menus',
    description: 'Generate QR codes for menus and contact pages',
    category: 'qr',
    is_active: true,
    created_at: now,
  },
  custom_branding: {
    id: 'feat-005',
    code: 'custom_branding',
    display_name: 'Custom Branding',
    description: 'Palika-specific branding and theming',
    category: 'content',
    is_active: true,
    created_at: now,
  },
  priority_support: {
    id: 'feat-006',
    code: 'priority_support',
    display_name: 'Priority Support',
    description: 'Priority support channel for palika admins',
    category: 'admin',
    is_active: true,
    created_at: now,
  },
  sms_notifications: {
    id: 'feat-007',
    code: 'sms_notifications',
    display_name: 'SMS Notifications',
    description: 'SMS alerts for approvals and status changes',
    category: 'contact',
    is_active: true,
    created_at: now,
  },
  content_moderation: {
    id: 'feat-008',
    code: 'content_moderation',
    display_name: 'Content Moderation',
    description: 'Advanced content moderation tooling',
    category: 'content',
    is_active: true,
    created_at: now,
  },
}

const TIERS: Record<string, { id: string; codes: string[] }> = {
  basic: {
    id: 'tier-basic',
    codes: ['self_service_registration', 'verification_workflow', 'qr_menus'],
  },
  tourism: {
    id: 'tier-tourism',
    codes: [
      'self_service_registration',
      'verification_workflow',
      'qr_menus',
      'business_analytics',
      'sms_notifications',
    ],
  },
  premium: {
    id: 'tier-premium',
    codes: [
      'self_service_registration',
      'verification_workflow',
      'qr_menus',
      'business_analytics',
      'sms_notifications',
      'custom_branding',
      'priority_support',
      'content_moderation',
    ],
  },
}

// Palika 1 -> basic, 2/3/5 -> tourism, 4/10 -> premium, 6 -> no tier, others -> basic.
const PALIKA_TIER: Record<number, keyof typeof TIERS | null> = {
  1: 'basic',
  2: 'tourism',
  3: 'tourism',
  4: 'premium',
  5: 'tourism',
  6: null,
  7: 'basic',
  8: 'basic',
  9: 'basic',
  10: 'premium',
}

export class FakePalikaFeaturesDatasource implements IPalikaFeaturesDatasource {
  async getFeaturesForPalika(palikaId: number): Promise<PalikaFeaturesResult> {
    if (!(palikaId in PALIKA_TIER)) {
      throw new Error('Palika not found')
    }

    const tierName = PALIKA_TIER[palikaId]
    if (!tierName) {
      return {
        palika_id: palikaId,
        tier_id: null,
        features: [],
        feature_codes: [],
      }
    }

    const tier = TIERS[tierName]
    const features = tier.codes.map((code) => FEATURES[code])
    return {
      palika_id: palikaId,
      tier_id: tier.id,
      features,
      feature_codes: tier.codes,
    }
  }
}
