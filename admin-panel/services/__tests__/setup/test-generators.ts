/**
 * Property-based test data generators
 * Provides constrained generators that avoid invalid data
 */

import fc from 'fast-check'

/**
 * Generate non-empty strings (no whitespace-only strings)
 * Filters out strings that are only whitespace or special characters
 */
export const nonEmptyString = (minLength = 3, maxLength = 50) =>
  fc.string({ minLength: Math.max(minLength, 1), maxLength })
    .filter(s => {
      const trimmed = s.trim()
      // Must have at least minLength characters after trimming
      // And must be at least 80% alphanumeric to avoid special character issues
      const alphanumericCount = (trimmed.match(/[a-zA-Z0-9]/g) || []).length
      return trimmed.length >= minLength && alphanumericCount >= Math.ceil(trimmed.length * 0.8)
    })

/**
 * Generate valid site names
 */
export const siteName = () => nonEmptyString(5, 50)

/**
 * Generate valid event names
 */
export const eventName = () => nonEmptyString(5, 50)

/**
 * Generate valid business names
 */
export const businessName = () => nonEmptyString(5, 50)

/**
 * Generate valid post titles
 */
export const postTitle = () => nonEmptyString(5, 100)

/**
 * Generate valid request codes
 */
export const requestCode = () => nonEmptyString(3, 20)

/**
 * Generate valid descriptions
 */
export const description = () => nonEmptyString(10, 500)

/**
 * Generate valid role names
 */
export const roleName = () => nonEmptyString(3, 50)

/**
 * Generate valid full names
 */
export const fullName = () => nonEmptyString(5, 100)

/**
 * Generate valid email addresses
 */
export const email = () =>
  fc.tuple(
    fc.string({ minLength: 3, maxLength: 10 }).filter(s => s.trim().length > 0 && /[a-zA-Z0-9]/.test(s)),
    fc.string({ minLength: 3, maxLength: 10 }).filter(s => s.trim().length > 0 && /[a-zA-Z0-9]/.test(s))
  ).map(([local, domain]) => `${local}@${domain}.com`)

/**
 * Generate valid coordinates (GeoJSON Point)
 */
export const geoPoint = () =>
  fc.tuple(fc.float({ min: -180, max: 180 }), fc.float({ min: -90, max: 90 }))
    .map(([lon, lat]) => `POINT(${lon} ${lat})`)
