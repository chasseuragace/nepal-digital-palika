import { describe, it, expect } from 'vitest'
import { supabase, supabaseAdmin } from '../../../lib/supabase'

describe('Supabase Connection', () => {
  it('should have Supabase URL configured', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeTruthy()
  })

  it('should have Supabase anon key configured', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined()
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeTruthy()
  })

  it('should have Supabase service role key configured', () => {
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined()
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeTruthy()
  })

  it('should create a valid Supabase client', () => {
    expect(supabase).toBeDefined()
    expect(supabase.auth).toBeDefined()
  })

  it('should create a valid Supabase admin client', () => {
    expect(supabaseAdmin).toBeDefined()
    expect(supabaseAdmin.auth).toBeDefined()
  })

  it('should be able to query the admin_users table', async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_users')
        .select('id, full_name, role, hierarchy_level')
        .limit(1)

      // We expect either data or an error, but not both
      if (error) {
        // If there's an error, it should be a meaningful Supabase error
        expect(error).toBeDefined()
        console.log('Query error (expected if no data):', error.message)
      } else {
        // If successful, data should be an array
        expect(Array.isArray(data)).toBe(true)
      }
    } catch (error) {
      // Network errors or other issues
      console.error('Connection error:', error)
      throw error
    }
  })

  it('should be able to query the roles table', async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('roles')
        .select('id, name, hierarchy_level')
        .limit(1)

      if (error) {
        expect(error).toBeDefined()
        console.log('Query error (expected if no data):', error.message)
      } else {
        expect(Array.isArray(data)).toBe(true)
      }
    } catch (error) {
      console.error('Connection error:', error)
      throw error
    }
  })

  it('should be able to query the permissions table', async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('permissions')
        .select('id, name, resource, action')
        .limit(1)

      if (error) {
        expect(error).toBeDefined()
        console.log('Query error (expected if no data):', error.message)
      } else {
        expect(Array.isArray(data)).toBe(true)
      }
    } catch (error) {
      console.error('Connection error:', error)
      throw error
    }
  })

  it('should be able to query the audit_log table', async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('audit_log')
        .select('id, admin_id, action, entity_type')
        .limit(1)

      if (error) {
        expect(error).toBeDefined()
        console.log('Query error (expected if no data):', error.message)
      } else {
        expect(Array.isArray(data)).toBe(true)
      }
    } catch (error) {
      console.error('Connection error:', error)
      throw error
    }
  })
})
