import { Feature, SubscriptionTier } from '@/lib/types'
import {
  ITiersDatasource,
  TierWithFeatureCount,
  TierWithFeatures,
} from './tiers-datasource'

const now = new Date().toISOString()

const features: Feature[] = [
  {
    id: 'feat-self-reg',
    code: 'self_service_registration',
    display_name: 'Self-Service Registration',
    description: 'Businesses register themselves through public forms',
    category: 'registration',
    is_active: true,
    created_at: now,
  },
  {
    id: 'feat-verify',
    code: 'verification_workflow',
    display_name: 'Verification Workflow',
    description: 'Admin review and approval pipeline',
    category: 'admin',
    is_active: true,
    created_at: now,
  },
  {
    id: 'feat-contact',
    code: 'contact_directory',
    display_name: 'Contact Directory',
    description: 'Public directory of verified contacts',
    category: 'contact',
    is_active: true,
    created_at: now,
  },
  {
    id: 'feat-qr-menus',
    code: 'qr_menus',
    display_name: 'QR Menus',
    description: 'Digital menus accessible via QR code',
    category: 'qr',
    is_active: true,
    created_at: now,
  },
  {
    id: 'feat-qr-heritage',
    code: 'qr_heritage_sites',
    display_name: 'QR Heritage Sites',
    description: 'QR-tagged heritage site walkthroughs',
    category: 'qr',
    is_active: true,
    created_at: now,
  },
  {
    id: 'feat-blog',
    code: 'blog_posts',
    display_name: 'Blog Posts',
    description: 'Publish curated blog articles',
    category: 'content',
    is_active: true,
    created_at: now,
  },
  {
    id: 'feat-events',
    code: 'events_calendar',
    display_name: 'Events Calendar',
    description: 'Festival and event calendar',
    category: 'content',
    is_active: true,
    created_at: now,
  },
  {
    id: 'feat-sos',
    code: 'emergency_sos',
    display_name: 'Emergency SOS',
    description: 'Tourist emergency SOS module',
    category: 'emergency',
    is_active: true,
    created_at: now,
  },
  {
    id: 'feat-analytics-basic',
    code: 'basic_analytics',
    display_name: 'Basic Analytics',
    description: 'Visitor counts and basic KPIs',
    category: 'analytics',
    is_active: true,
    created_at: now,
  },
  {
    id: 'feat-analytics-business',
    code: 'business_analytics',
    display_name: 'Business Analytics',
    description: 'Deep business-level analytics',
    category: 'analytics',
    is_active: true,
    created_at: now,
  },
]

const tiers: SubscriptionTier[] = [
  {
    id: 'tier-basic',
    name: 'basic',
    display_name: 'Basic',
    description: 'Core directory + verification',
    cost_per_month: 0,
    cost_per_year: 0,
    sort_order: 1,
    is_active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'tier-tourism',
    name: 'tourism',
    display_name: 'Tourism',
    description: 'Tourism-ready with QR and events',
    cost_per_month: 2500,
    cost_per_year: 25000,
    sort_order: 2,
    is_active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'tier-premium',
    name: 'premium',
    display_name: 'Premium',
    description: 'Everything including analytics and SOS',
    cost_per_month: 6000,
    cost_per_year: 60000,
    sort_order: 3,
    is_active: true,
    created_at: now,
    updated_at: now,
  },
]

const tierFeatureMap: Record<string, string[]> = {
  'tier-basic': ['feat-self-reg', 'feat-verify', 'feat-contact'],
  'tier-tourism': [
    'feat-self-reg',
    'feat-verify',
    'feat-contact',
    'feat-qr-menus',
    'feat-qr-heritage',
    'feat-blog',
    'feat-events',
  ],
  'tier-premium': [
    'feat-self-reg',
    'feat-verify',
    'feat-contact',
    'feat-qr-menus',
    'feat-qr-heritage',
    'feat-blog',
    'feat-events',
    'feat-sos',
    'feat-analytics-basic',
    'feat-analytics-business',
  ],
}

function featureById(id: string): Feature {
  const f = features.find((x) => x.id === id)
  if (!f) throw new Error(`Unknown fake feature id: ${id}`)
  return f
}

export class FakeTiersDatasource implements ITiersDatasource {
  async getAllActive(): Promise<TierWithFeatureCount[]> {
    return tiers
      .filter((t) => t.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((t) => ({
        ...t,
        feature_count: tierFeatureMap[t.id]?.length ?? 0,
      }))
  }

  async getAllWithFeatures(): Promise<TierWithFeatures[]> {
    return tiers
      .slice()
      .sort((a, b) => a.cost_per_year - b.cost_per_year)
      .map((t) => ({
        ...t,
        tier_features: (tierFeatureMap[t.id] || []).map((fid) => ({
          feature_id: fid,
          features: featureById(fid),
        })),
      }))
  }
}

export const __fakeTiersData = { tiers, features, tierFeatureMap }
