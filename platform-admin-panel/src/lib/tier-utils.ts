/**
 * Tier-Based Feature Gating Utilities
 * Functions to check if features are available for a Palika based on subscription tier
 */

import { supabase } from './supabase'
import { SubscriptionTier, Feature, PalikaWithTier } from './types'

// Cache for tier features (in memory)
const tierFeatureCache = new Map<string, Set<string>>()
const cacheExpiry = new Map<string, number>()
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Get all subscription tiers
 */
export async function getSubscriptionTiers(): Promise<SubscriptionTier[]> {
  try {
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching subscription tiers:', error)
    return []
  }
}

/**
 * Get features enabled for a specific tier
 */
export async function getFeaturesForTier(tierId: string): Promise<Feature[]> {
  try {
    const { data, error } = await supabase
      .from('tier_features')
      .select('features(*)')
      .eq('tier_id', tierId)
      .eq('enabled', true)

    if (error) throw error

    // Extract features from nested structure
    const features = data?.map((tf: any) => tf.features).filter(Boolean) || []
    return features
  } catch (error) {
    console.error(`Error fetching features for tier ${tierId}:`, error)
    return []
  }
}

/**
 * Get Palika information with tier and features
 */
export async function getPalikaWithTier(palikaId: number): Promise<PalikaWithTier | null> {
  try {
    const { data, error } = await supabase
      .from('palikas')
      .select(`
        *,
        subscription_tier:subscription_tier_id(*)
      `)
      .eq('id', palikaId)
      .single()

    if (error) throw error
    if (!data) return null

    // Get features for this tier
    let features: Feature[] = []
    if (data.subscription_tier_id) {
      features = await getFeaturesForTier(data.subscription_tier_id)
    }

    return {
      ...data,
      features,
    } as PalikaWithTier
  } catch (error) {
    console.error(`Error fetching Palika ${palikaId} with tier:`, error)
    return null
  }
}

/**
 * Check if a Palika has a specific feature enabled (via RPC)
 * This calls the database function palika_has_feature()
 */
export async function palikaHasFeature(
  palikaId: number,
  featureCode: string
): Promise<boolean> {
  try {
    // Check cache first
    const cacheKey = `${palikaId}:${featureCode}`
    const cachedResult = tierFeatureCache.get(cacheKey)
    const expiryTime = cacheExpiry.get(cacheKey)

    if (cachedResult !== undefined && expiryTime && Date.now() < expiryTime) {
      return cachedResult.has(featureCode)
    }

    // Call RPC function
    const { data, error } = await supabase.rpc('palika_has_feature', {
      p_palika_id: palikaId,
      p_feature_code: featureCode,
    })

    if (error) {
      console.error(`Error checking feature ${featureCode} for palika ${palikaId}:`, error)
      return false
    }

    // Cache the result
    if (!tierFeatureCache.has(`${palikaId}:all`)) {
      tierFeatureCache.set(`${palikaId}:all`, new Set<string>())
    }
    if (data === true) {
      tierFeatureCache.get(`${palikaId}:all`)?.add(featureCode)
    }
    cacheExpiry.set(cacheKey, Date.now() + CACHE_DURATION_MS)

    return data === true
  } catch (error) {
    console.error(`Error in palikaHasFeature(${palikaId}, ${featureCode}):`, error)
    return false
  }
}

/**
 * Get all enabled features for a Palika
 */
export async function getPalikaFeatures(palikaId: number): Promise<Set<string>> {
  try {
    const { data, error } = await supabase
      .from('palikas')
      .select(
        `
        subscription_tier:subscription_tier_id(
          tier_features(features(code))
        )
      `
      )
      .eq('id', palikaId)
      .single()

    if (error) throw error
    if (!data?.subscription_tier?.tier_features) {
      return new Set()
    }

    const featureCodes = data.subscription_tier.tier_features
      .map((tf: any) => tf.features?.code)
      .filter(Boolean)

    const featureSet = new Set(featureCodes)

    // Cache the result
    tierFeatureCache.set(`${palikaId}:all`, featureSet)
    cacheExpiry.set(`${palikaId}:all`, Date.now() + CACHE_DURATION_MS)

    return featureSet
  } catch (error) {
    console.error(`Error fetching features for palika ${palikaId}:`, error)
    return new Set()
  }
}

/**
 * Get Palika's current subscription tier ID
 */
export async function getPalikaSubscriptionTierId(palikaId: number): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('palikas')
      .select('subscription_tier_id')
      .eq('id', palikaId)
      .single()

    if (error) throw error
    return data?.subscription_tier_id || null
  } catch (error) {
    console.error(`Error fetching subscription tier for palika ${palikaId}:`, error)
    return null
  }
}

/**
 * Upgrade Palika to a new subscription tier (Admin only)
 */
export async function upgradePalikaSubscriptionTier(
  palikaId: number,
  newTierId: string,
  reason?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('palikas')
      .update({ subscription_tier_id: newTierId })
      .eq('id', palikaId)

    if (error) throw error

    // Invalidate cache for this palika
    tierFeatureCache.delete(`${palikaId}:all`)
    cacheExpiry.delete(`${palikaId}:all`)

    // Note: tier_assignment_log should be created automatically via trigger in database
    return true
  } catch (error) {
    console.error(`Error upgrading palika ${palikaId} to tier ${newTierId}:`, error)
    return false
  }
}

/**
 * Get tier assignment history for a Palika
 */
export async function getPalikaSubscriptionHistory(palikaId: number) {
  try {
    const { data, error } = await supabase
      .from('tier_assignment_log')
      .select('*')
      .eq('palika_id', palikaId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error(`Error fetching tier assignment history for palika ${palikaId}:`, error)
    return []
  }
}

/**
 * Clear tier feature cache (for testing or manual refresh)
 */
export function clearTierFeatureCache(palikaId?: number): void {
  if (palikaId) {
    // Clear cache for specific palika
    tierFeatureCache.delete(`${palikaId}:all`)
    cacheExpiry.delete(`${palikaId}:all`)
  } else {
    // Clear all cache
    tierFeatureCache.clear()
    cacheExpiry.clear()
  }
}

/**
 * Predefined feature codes for easy reference
 */
export const FEATURE_CODES = {
  // Registration features
  SELF_SERVICE_REGISTRATION: 'self_service_registration',
  ADMIN_BUSINESS_CREATION: 'admin_business_creation',
  VERIFICATION_WORKFLOW: 'verification_workflow',
  CUSTOM_VERIFICATION_RULES: 'custom_verification_rules',

  // Contact features
  DIRECT_CONTACT_BUTTONS: 'direct_contact_buttons',
  IN_APP_MESSAGING: 'in_app_messaging',
  MESSAGE_ANALYTICS: 'message_analytics',
  PAYMENT_INTEGRATION: 'payment_integration',

  // QR features
  QR_DIGITAL_GENERATION: 'qr_digital_generation',
  QR_PRINT_SUPPORT: 'qr_print_support',
  QR_SCAN_ANALYTICS: 'qr_scan_analytics',

  // Content features
  HERITAGE_SITE_MANAGEMENT: 'heritage_site_management',
  EVENT_CALENDAR: 'event_calendar',
  BLOG_NARRATIVES: 'blog_narratives',
  BUSINESS_DIRECTORY: 'business_directory',

  // Emergency features
  SOS_SYSTEM: 'sos_system',
  SERVICE_DIRECTORY: 'service_directory',
  HOTLINE_INTEGRATION: 'hotline_integration',
  ADVANCED_LOCATION_SEARCH: 'advanced_location_search',

  // Analytics features
  VIEW_COUNT_TRACKING: 'view_count_tracking',
  PALIKA_LEVEL_DASHBOARD: 'palika_level_dashboard',
  NATIONAL_AGGREGATION: 'national_aggregation',
  CUSTOM_REPORTS: 'custom_reports',

  // Admin features
  STAFF_MANAGEMENT: 'staff_management',
  APPROVAL_WORKFLOWS: 'approval_workflows',
  AUDIT_LOGGING: 'audit_logging',
  RBAC: 'rbac',
} as const

export type FeatureCode = (typeof FEATURE_CODES)[keyof typeof FEATURE_CODES]
