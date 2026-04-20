/**
 * Supabase SOS Requests Datasource
 */

import { ISOSRequestsDatasource, SOSRequest } from './sos-requests-datasource'
import { SupabaseClient } from '@supabase/supabase-js'

export class SupabaseSOSRequestsDatasource implements ISOSRequestsDatasource {
  constructor(private db: SupabaseClient) {}

  async getAll(filters?: { status?: string; palika_id?: number }): Promise<SOSRequest[]> {
    let query = this.db.from('sos_requests').select('*')
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.palika_id) query = query.eq('palika_id', filters.palika_id)
    const { data } = await query
    return (data || []) as SOSRequest[]
  }

  async getById(id: string): Promise<SOSRequest | null> {
    const { data } = await this.db.from('sos_requests').select('*').eq('id', id).single()
    return data as SOSRequest || null
  }

  async create(input: any): Promise<SOSRequest> {
    const { data } = await this.db.from('sos_requests').insert(input).select().single()
    return data as SOSRequest
  }

  async updateStatus(id: string, status: SOSRequest['status']): Promise<void> {
    await this.db.from('sos_requests').update({ status }).eq('id', id)
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.db.from('sos_requests').delete().eq('id', id)
    return !error
  }
}
