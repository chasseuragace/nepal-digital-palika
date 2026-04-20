/**
 * Supabase Auth Datasource
 */

import { IAuthDatasource, AdminUser } from './auth-datasource'
import { SupabaseClient } from '@supabase/supabase-js'

export class SupabaseAuthDatasource implements IAuthDatasource {
  constructor(private db: SupabaseClient) {}

  async signIn(email: string, password: string): Promise<AdminUser | null> {
    const { data, error } = await this.db.auth.signInWithPassword({ email, password })
    if (error) return null

    const { data: admin } = await this.db.from('admin_users').select('*').eq('id', data.user?.id).single()
    return admin as AdminUser || null
  }

  async signOut(): Promise<void> {
    await this.db.auth.signOut()
  }

  async getAdminProfile(adminId: string): Promise<AdminUser | null> {
    const { data } = await this.db.from('admin_users').select('*').eq('id', adminId).single()
    return data as AdminUser || null
  }
}
