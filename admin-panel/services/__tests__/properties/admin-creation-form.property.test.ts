import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fc from 'fast-check'
import { supabase } from '../setup/integration-setup'

/**
 * Validates the hierarchy configuration for admin creation
 */
function validateHierarchyConfiguration(
  hierarchyLevel: string,
  provinceId: number | null | undefined,
  districtId: number | null | undefined,
  palikaId: number | null | undefined,
  regions: Array<{ region_type: string; region_id: number }> | undefined
): { valid: boolean; error?: string } {
  // National level: no regions required
  if (hierarchyLevel === 'national') {
    if (provinceId || districtId || palikaId) {
      return { valid: false, error: 'National-level admins should not have province/district/palika assignments' }
    }
    if (regions && regions.length > 0) {
      return { valid: false, error: 'National-level admins should not have region assignments' }
    }
    return { valid: true }
  }

  // Province level: province_id required, regions with type 'province' required
  if (hierarchyLevel === 'province') {
    if (!provinceId) {
      return { valid: false, error: 'Province-level admins must have province_id' }
    }
    if (!regions || regions.length === 0) {
      return { valid: false, error: 'Province-level admins must have at least one region assignment' }
    }
    if (!regions.every(r => r.region_type === 'province')) {
      return { valid: false, error: 'Province-level admins can only be assigned to provinces' }
    }
    if (districtId || palikaId) {
      return { valid: false, error: 'Province-level admins should not have district/palika assignments' }
    }
    return { valid: true }
  }

  // District level: province_id and district_id required, regions with type 'district' required
  if (hierarchyLevel === 'district') {
    if (!provinceId || !districtId) {
      return { valid: false, error: 'District-level admins must have province_id and district_id' }
    }
    if (!regions || regions.length === 0) {
      return { valid: false, error: 'District-level admins must have at least one region assignment' }
    }
    if (!regions.every(r => r.region_type === 'district')) {
      return { valid: false, error: 'District-level admins can only be assigned to districts' }
    }
    if (palikaId) {
      return { valid: false, error: 'District-level admins should not have palika assignments' }
    }
    return { valid: true }
  }

  // Palika level: province_id, district_id, and palika_id required, regions with type 'palika' required
  if (hierarchyLevel === 'palika') {
    if (!provinceId || !districtId || !palikaId) {
      return { valid: false, error: 'Palika-level admins must have province_id, district_id, and palika_id' }
    }
    if (!regions || regions.length === 0) {
      return { valid: false, error: 'Palika-level admins must have at least one region assignment' }
    }
    if (!regions.every(r => r.region_type === 'palika')) {
      return { valid: false, error: 'Palika-level admins can only be assigned to palikas' }
    }
    return { valid: true }
  }

  return { valid: false, error: 'Invalid hierarchy_level' }
}

describe('Property 29: Admin Creation Validation', () => {
  let testProvinceId: number
  let testDistrictId: number
  let testPalikaId: number

  beforeAll(async () => {
    // Get test data
    const { data: provinces } = await supabase
      .from('provinces')
      .select('id')
      .limit(1)

    if (!provinces || provinces.length === 0) {
      throw new Error('No provinces found in database')
    }

    testProvinceId = provinces[0].id

    const { data: districts } = await supabase
      .from('districts')
      .select('id')
      .eq('province_id', testProvinceId)
      .limit(1)

    if (!districts || districts.length === 0) {
      throw new Error(`No districts found in province ${testProvinceId}`)
    }

    testDistrictId = districts[0].id

    const { data: palikas } = await supabase
      .from('palikas')
      .select('id')
      .eq('district_id', testDistrictId)
      .limit(1)

    if (!palikas || palikas.length === 0) {
      throw new Error(`No palikas found in district ${testDistrictId}`)
    }

    testPalikaId = palikas[0].id
  })

  afterEach(async () => {
    // Clean up test data
    await supabase
      .from('admin_users')
      .delete()
      .like('email', 'test-admin-form-%@example.com')
  })

  describe('Requirement 7.4: Invalid hierarchy configuration validation', () => {
    it('should reject national-level admin with province_id', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const validation = validateHierarchyConfiguration(
              'national',
              testProvinceId,
              null,
              null,
              []
            )

            expect(validation.valid).toBe(false)
            expect(validation.error).toBeDefined()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should reject national-level admin with region assignments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const validation = validateHierarchyConfiguration(
              'national',
              null,
              null,
              null,
              [{ region_type: 'province', region_id: testProvinceId }]
            )

            expect(validation.valid).toBe(false)
            expect(validation.error).toBeDefined()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should reject province-level admin without province_id', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const validation = validateHierarchyConfiguration(
              'province',
              null,
              null,
              null,
              [{ region_type: 'province', region_id: testProvinceId }]
            )

            expect(validation.valid).toBe(false)
            expect(validation.error).toBeDefined()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should reject province-level admin without region assignments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const validation = validateHierarchyConfiguration(
              'province',
              testProvinceId,
              null,
              null,
              []
            )

            expect(validation.valid).toBe(false)
            expect(validation.error).toBeDefined()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should reject province-level admin with district region assignment', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const validation = validateHierarchyConfiguration(
              'province',
              testProvinceId,
              null,
              null,
              [{ region_type: 'district', region_id: testDistrictId }]
            )

            expect(validation.valid).toBe(false)
            expect(validation.error).toBeDefined()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should reject district-level admin without province_id', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const validation = validateHierarchyConfiguration(
              'district',
              null,
              testDistrictId,
              null,
              [{ region_type: 'district', region_id: testDistrictId }]
            )

            expect(validation.valid).toBe(false)
            expect(validation.error).toBeDefined()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should reject district-level admin without district_id', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const validation = validateHierarchyConfiguration(
              'district',
              testProvinceId,
              null,
              null,
              [{ region_type: 'district', region_id: testDistrictId }]
            )

            expect(validation.valid).toBe(false)
            expect(validation.error).toBeDefined()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should reject district-level admin without region assignments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const validation = validateHierarchyConfiguration(
              'district',
              testProvinceId,
              testDistrictId,
              null,
              []
            )

            expect(validation.valid).toBe(false)
            expect(validation.error).toBeDefined()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should reject palika-level admin without province_id', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const validation = validateHierarchyConfiguration(
              'palika',
              null,
              testDistrictId,
              testPalikaId,
              [{ region_type: 'palika', region_id: testPalikaId }]
            )

            expect(validation.valid).toBe(false)
            expect(validation.error).toBeDefined()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should reject palika-level admin without district_id', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const validation = validateHierarchyConfiguration(
              'palika',
              testProvinceId,
              null,
              testPalikaId,
              [{ region_type: 'palika', region_id: testPalikaId }]
            )

            expect(validation.valid).toBe(false)
            expect(validation.error).toBeDefined()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should reject palika-level admin without palika_id', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const validation = validateHierarchyConfiguration(
              'palika',
              testProvinceId,
              testDistrictId,
              null,
              [{ region_type: 'palika', region_id: testPalikaId }]
            )

            expect(validation.valid).toBe(false)
            expect(validation.error).toBeDefined()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should reject palika-level admin without region assignments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const validation = validateHierarchyConfiguration(
              'palika',
              testProvinceId,
              testDistrictId,
              testPalikaId,
              []
            )

            expect(validation.valid).toBe(false)
            expect(validation.error).toBeDefined()
          }
        ),
        { numRuns: 20 }
      )
    })
  })
})
